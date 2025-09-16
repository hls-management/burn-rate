import { calculateStructureIncome, calculateConstructionDrain, calculateNetIncome, BASE_INCOME, processConstructionQueue, validateBuildOrder, canAffordBuildOrder, canSustainBuildOrder, isStructureViable } from '../models/Economy.js';
import { calculateFleetUpkeep, getTotalFleetSize } from '../models/Fleet.js';
export class EconomyEngine {
    /**
     * Calculates and updates the player's resource income based on:
     * - Base income (+10,000 Metal/Energy per turn)
     * - Economic structure bonuses (+500 per structure)
     * - Construction drain (resources consumed during building)
     * - Unit upkeep costs (permanent drain from completed units)
     */
    calculateIncome(player) {
        // Calculate base income from economic structures
        const structureIncome = calculateStructureIncome(player.economy.reactors, player.economy.mines);
        // Calculate construction drain from active build orders
        const constructionDrain = calculateConstructionDrain(player.economy.constructionQueue);
        // Calculate upkeep costs from existing fleet
        const fleetUpkeep = calculateFleetUpkeep(player.fleet.homeSystem);
        // Calculate net income after all drains
        const grossIncome = calculateNetIncome(structureIncome, constructionDrain);
        const netIncome = calculateNetIncome(grossIncome, fleetUpkeep);
        // Update player's income rates
        player.resources.metalIncome = netIncome.metal;
        player.resources.energyIncome = netIncome.energy;
        // Apply income to current resources
        player.resources.metal += netIncome.metal;
        player.resources.energy += netIncome.energy;
        // Prevent negative resources (can't go below 0)
        player.resources.metal = Math.max(0, player.resources.metal);
        player.resources.energy = Math.max(0, player.resources.energy);
    }
    /**
     * Gets the current net income without applying it to resources
     * Useful for checking economic viability before making decisions
     */
    getNetIncome(player) {
        const structureIncome = calculateStructureIncome(player.economy.reactors, player.economy.mines);
        const constructionDrain = calculateConstructionDrain(player.economy.constructionQueue);
        const fleetUpkeep = calculateFleetUpkeep(player.fleet.homeSystem);
        const grossIncome = calculateNetIncome(structureIncome, constructionDrain);
        return calculateNetIncome(grossIncome, fleetUpkeep);
    }
    /**
     * Checks if the player's economy is in a stall condition
     * (income ≤ 0, preventing new production)
     */
    isEconomyStalled(player) {
        const netIncome = this.getNetIncome(player);
        return netIncome.metal <= 0 || netIncome.energy <= 0;
    }
    /**
     * Gets detailed income breakdown for display/debugging
     */
    getIncomeBreakdown(player) {
        const baseIncome = { ...BASE_INCOME };
        const structureIncome = calculateStructureIncome(player.economy.reactors, player.economy.mines);
        const structureBonus = {
            metal: structureIncome.metal - BASE_INCOME.metal,
            energy: structureIncome.energy - BASE_INCOME.energy
        };
        const constructionDrain = calculateConstructionDrain(player.economy.constructionQueue);
        const fleetUpkeep = calculateFleetUpkeep(player.fleet.homeSystem);
        const netIncome = this.getNetIncome(player);
        return {
            baseIncome,
            structureBonus,
            constructionDrain,
            fleetUpkeep,
            netIncome
        };
    }
    /**
     * Processes construction queue for one turn:
     * - Advances all build orders by 1 turn
     * - Completes finished orders and adds units/structures to player
     * - Validates resource availability before processing
     * - Halts production if economy is stalled
     */
    processConstruction(player) {
        // Check if economy is stalled - halt all new production
        if (this.isEconomyStalled(player)) {
            // Don't start new construction, but continue existing orders
            this.advanceExistingConstruction(player);
            return;
        }
        // Process existing construction queue
        this.advanceExistingConstruction(player);
    }
    /**
     * Advances existing construction orders by one turn and completes finished ones
     */
    advanceExistingConstruction(player) {
        const { completedOrders, remainingQueue } = processConstructionQueue(player.economy.constructionQueue);
        // Update construction queue
        player.economy.constructionQueue = remainingQueue;
        // Apply completed orders to player state
        for (const completedOrder of completedOrders) {
            this.applyCompletedOrder(player, completedOrder);
        }
    }
    /**
     * Applies a completed build order to the player state
     */
    applyCompletedOrder(player, order) {
        switch (order.unitType) {
            case 'frigate':
                player.fleet.homeSystem.frigates += order.quantity;
                break;
            case 'cruiser':
                player.fleet.homeSystem.cruisers += order.quantity;
                break;
            case 'battleship':
                player.fleet.homeSystem.battleships += order.quantity;
                break;
            case 'reactor':
                player.economy.reactors += order.quantity;
                break;
            case 'mine':
                player.economy.mines += order.quantity;
                break;
        }
    }
    /**
     * Validates if a build order can be afforded and sustained
     */
    canAffordAndSustainBuildOrder(player, buildOrder) {
        const errors = [];
        // Check if player has enough resources for the total cost
        const canAfford = canAffordBuildOrder(player.resources, buildOrder);
        if (!canAfford) {
            const totalMetalCost = buildOrder.resourceDrainPerTurn.metal * buildOrder.turnsRemaining;
            const totalEnergyCost = buildOrder.resourceDrainPerTurn.energy * buildOrder.turnsRemaining;
            errors.push(`Insufficient resources: need ${totalMetalCost} metal, ${totalEnergyCost} energy`);
        }
        // Check if income can sustain the drain
        const netIncome = this.getNetIncome(player);
        const canSustain = canSustainBuildOrder(netIncome, buildOrder);
        if (!canSustain) {
            errors.push(`Insufficient income to sustain construction drain: ${buildOrder.resourceDrainPerTurn.metal} metal/turn, ${buildOrder.resourceDrainPerTurn.energy} energy/turn`);
        }
        return { canAfford, canSustain, errors };
    }
    /**
     * Adds a build order to the construction queue if valid
     */
    addBuildOrder(player, buildOrder) {
        // Validate build order structure
        const validation = validateBuildOrder(buildOrder);
        if (!validation.isValid) {
            return { success: false, errors: validation.errors };
        }
        // Check affordability and sustainability
        const affordability = this.canAffordAndSustainBuildOrder(player, buildOrder);
        if (!affordability.canAfford) {
            return { success: false, errors: affordability.errors };
        }
        // Check if economy would stall with this order
        const projectedQueue = [...player.economy.constructionQueue, buildOrder];
        const projectedDrain = calculateConstructionDrain(projectedQueue);
        const structureIncome = calculateStructureIncome(player.economy.reactors, player.economy.mines);
        const fleetUpkeep = calculateFleetUpkeep(player.fleet.homeSystem);
        const projectedNetIncome = calculateNetIncome(calculateNetIncome(structureIncome, projectedDrain), fleetUpkeep);
        if (projectedNetIncome.metal <= 0 || projectedNetIncome.energy <= 0) {
            return {
                success: false,
                errors: ['Adding this build order would stall the economy (income ≤ 0)']
            };
        }
        // Add to queue
        player.economy.constructionQueue.push(buildOrder);
        return { success: true, errors: [] };
    }
    /**
     * Removes a build order from the construction queue by index
     */
    cancelBuildOrder(player, index) {
        if (index < 0 || index >= player.economy.constructionQueue.length) {
            return { success: false, errors: ['Invalid build order index'] };
        }
        player.economy.constructionQueue.splice(index, 1);
        return { success: true, errors: [] };
    }
    /**
     * Gets the total construction drain from all active build orders
     */
    getTotalConstructionDrain(player) {
        return calculateConstructionDrain(player.economy.constructionQueue);
    }
    /**
     * Checks if any construction is currently active
     */
    hasActiveConstruction(player) {
        return player.economy.constructionQueue.length > 0;
    }
    /**
     * Gets estimated completion times for all build orders
     */
    getConstructionStatus(player) {
        return player.economy.constructionQueue.map((order, index) => ({
            order,
            index,
            completionTurn: order.turnsRemaining
        }));
    }
    /**
     * Applies upkeep costs for completed units and validates economic balance
     * This method is called as part of the income calculation process
     * Note: Upkeep is already handled in calculateIncome(), this provides additional validation
     */
    applyUpkeep(player) {
        // Upkeep is automatically applied in calculateIncome()
        // This method provides additional economic validation and balance checks
        const validation = this.validateEconomicState(player);
        if (!validation.isValid) {
            // Log warnings for economic issues (in a real game, this might trigger UI warnings)
            console.warn('Economic validation warnings:', validation.warnings);
        }
    }
    /**
     * Validates the overall economic state and provides warnings for potential issues
     */
    validateEconomicState(player) {
        const warnings = [];
        const recommendations = [];
        const breakdown = this.getIncomeBreakdown(player);
        const netIncome = breakdown.netIncome;
        // Check for economic stall
        if (netIncome.metal <= 0) {
            warnings.push('Metal income is zero or negative - economy stalled');
            recommendations.push('Reduce fleet size or build more mines');
        }
        if (netIncome.energy <= 0) {
            warnings.push('Energy income is zero or negative - economy stalled');
            recommendations.push('Reduce fleet size or build more reactors');
        }
        // Check for low income warnings (less than 1000 per turn)
        if (netIncome.metal > 0 && netIncome.metal < 1000) {
            warnings.push('Metal income is critically low');
            recommendations.push('Consider building mines or reducing military spending');
        }
        if (netIncome.energy > 0 && netIncome.energy < 1000) {
            warnings.push('Energy income is critically low');
            recommendations.push('Consider building reactors or reducing military spending');
        }
        // Check for excessive construction drain (more than 80% of base income)
        const constructionDrainRatio = {
            metal: breakdown.constructionDrain.metal / breakdown.baseIncome.metal,
            energy: breakdown.constructionDrain.energy / breakdown.baseIncome.energy
        };
        if (constructionDrainRatio.metal > 0.8) {
            warnings.push('Construction is consuming excessive metal resources');
            recommendations.push('Consider reducing construction queue or building more mines');
        }
        if (constructionDrainRatio.energy > 0.8) {
            warnings.push('Construction is consuming excessive energy resources');
            recommendations.push('Consider reducing construction queue or building more reactors');
        }
        // Check for excessive fleet upkeep (more than 70% of base income)
        const upkeepRatio = {
            metal: breakdown.fleetUpkeep.metal / breakdown.baseIncome.metal,
            energy: breakdown.fleetUpkeep.energy / breakdown.baseIncome.energy
        };
        if (upkeepRatio.metal > 0.7) {
            warnings.push('Fleet upkeep is consuming excessive metal');
            recommendations.push('Consider reducing fleet size or building more mines');
        }
        if (upkeepRatio.energy > 0.7) {
            warnings.push('Fleet upkeep is consuming excessive energy');
            recommendations.push('Consider reducing fleet size or building more reactors');
        }
        // Check for resource hoarding (more than 50,000 of either resource with positive income)
        if (player.resources.metal > 50000 && netIncome.metal > 2000) {
            recommendations.push('Consider investing excess metal in fleet or economic expansion');
        }
        if (player.resources.energy > 50000 && netIncome.energy > 2000) {
            recommendations.push('Consider investing excess energy in fleet or economic expansion');
        }
        // Check structure viability
        const structureWarnings = this.validateStructureViability(player);
        warnings.push(...structureWarnings);
        return {
            isValid: warnings.length === 0,
            warnings,
            recommendations
        };
    }
    /**
     * Validates that economic structures are still viable investments
     */
    validateStructureViability(player) {
        const warnings = [];
        // Check if additional reactors would be viable
        if (player.economy.reactors > 0) {
            const nextReactorViable = isStructureViable('reactor', player.economy.reactors, 15);
            if (!nextReactorViable) {
                warnings.push('Additional reactors may not be cost-effective (payback > 15 turns)');
            }
        }
        // Check if additional mines would be viable
        if (player.economy.mines > 0) {
            const nextMineViable = isStructureViable('mine', player.economy.mines, 15);
            if (!nextMineViable) {
                warnings.push('Additional mines may not be cost-effective (payback > 15 turns)');
            }
        }
        return warnings;
    }
    /**
     * Calculates the economic efficiency of the current setup
     */
    getEconomicEfficiency(player) {
        const breakdown = this.getIncomeBreakdown(player);
        const totalFleetSize = getTotalFleetSize(player.fleet.homeSystem);
        // Calculate efficiency ratios (0-1 scale)
        const metalEfficiency = Math.max(0, Math.min(1, breakdown.netIncome.metal / breakdown.baseIncome.metal));
        const energyEfficiency = Math.max(0, Math.min(1, breakdown.netIncome.energy / breakdown.baseIncome.energy));
        // Structure efficiency: income bonus vs base income
        const structureEfficiency = (breakdown.structureBonus.metal + breakdown.structureBonus.energy) /
            (breakdown.baseIncome.metal + breakdown.baseIncome.energy);
        // Fleet efficiency: fleet size vs upkeep cost (higher is better)
        const fleetEfficiency = totalFleetSize > 0 ?
            totalFleetSize / (breakdown.fleetUpkeep.metal + breakdown.fleetUpkeep.energy) : 0;
        const overallEfficiency = (metalEfficiency + energyEfficiency +
            Math.min(1, structureEfficiency) +
            Math.min(1, fleetEfficiency * 0.1)) / 4;
        return {
            overallEfficiency,
            metalEfficiency,
            energyEfficiency,
            structureEfficiency,
            fleetEfficiency
        };
    }
    /**
     * Provides economic recommendations based on current state
     */
    getEconomicRecommendations(player) {
        const recommendations = [];
        const breakdown = this.getIncomeBreakdown(player);
        const netIncome = breakdown.netIncome;
        // High priority: Fix stalled economy
        if (netIncome.metal <= 0) {
            recommendations.push({
                priority: 'high',
                action: 'Reduce fleet size or build mines immediately',
                reason: 'Metal income is zero or negative'
            });
        }
        if (netIncome.energy <= 0) {
            recommendations.push({
                priority: 'high',
                action: 'Reduce fleet size or build reactors immediately',
                reason: 'Energy income is zero or negative'
            });
        }
        // Medium priority: Improve efficiency
        if (netIncome.metal > 0 && netIncome.metal < 2000) {
            recommendations.push({
                priority: 'medium',
                action: 'Build additional mines',
                reason: 'Metal income is low but positive'
            });
        }
        if (netIncome.energy > 0 && netIncome.energy < 2000) {
            recommendations.push({
                priority: 'medium',
                action: 'Build additional reactors',
                reason: 'Energy income is low but positive'
            });
        }
        // Low priority: Optimization
        if (player.resources.metal > 30000 && netIncome.metal > 5000) {
            recommendations.push({
                priority: 'low',
                action: 'Invest in fleet expansion',
                reason: 'Excess metal resources available'
            });
        }
        if (player.resources.energy > 30000 && netIncome.energy > 5000) {
            recommendations.push({
                priority: 'low',
                action: 'Invest in fleet expansion or scanning',
                reason: 'Excess energy resources available'
            });
        }
        return recommendations;
    }
}
//# sourceMappingURL=EconomyEngine.js.map