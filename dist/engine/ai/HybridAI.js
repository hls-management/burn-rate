import { BaseAIArchetype } from '../../models/AI.js';
export class HybridAI extends BaseAIArchetype {
    currentStrategy;
    strategyChangeTimer = 0;
    strategyDuration = 3; // Turns to stick with a strategy
    constructor() {
        super('hybrid', {
            militaryFocus: 0.6,
            economicFocus: 0.6,
            aggressionLevel: 0.5,
            deceptionChance: 0.2,
            adaptiveVariation: 0.4
        });
        this.currentStrategy = this.selectInitialStrategy();
    }
    makeDecision(gameState, aiState) {
        // Update threat assessment
        aiState.threatLevel = this.calculateThreatLevel(gameState, aiState);
        aiState.economicAdvantage = this.calculateEconomicAdvantage(gameState, aiState);
        // 40% chance to deviate from balanced approach each turn
        if (this.shouldAdaptBehavior()) {
            this.adaptStrategy(gameState, aiState);
        }
        // Check if it's time to change strategy
        this.strategyChangeTimer++;
        if (this.strategyChangeTimer >= this.strategyDuration) {
            this.currentStrategy = this.selectNewStrategy(gameState, aiState);
            this.strategyChangeTimer = 0;
            this.strategyDuration = Math.floor(Math.random() * 3) + 2; // 2-4 turns
        }
        // Execute decision based on current strategy
        return this.executeStrategy(gameState, aiState);
    }
    selectInitialStrategy() {
        const strategies = ['aggressive', 'economic', 'defensive', 'opportunistic'];
        return strategies[Math.floor(Math.random() * strategies.length)];
    }
    selectNewStrategy(gameState, aiState) {
        // Choose strategy based on game state
        if (aiState.threatLevel > 0.7) {
            return Math.random() < 0.7 ? 'defensive' : 'aggressive';
        }
        if (aiState.economicAdvantage < -0.3) {
            return Math.random() < 0.6 ? 'economic' : 'opportunistic';
        }
        if (aiState.economicAdvantage > 0.3) {
            return Math.random() < 0.6 ? 'aggressive' : 'opportunistic';
        }
        // Balanced situation - random choice
        const strategies = ['aggressive', 'economic', 'defensive', 'opportunistic'];
        return strategies[Math.floor(Math.random() * strategies.length)];
    }
    adaptStrategy(gameState, aiState) {
        // Reactive adaptation based on player actions
        const playerFleet = gameState.player.fleet.homeSystem;
        const playerTotalUnits = playerFleet.frigates + playerFleet.cruisers + playerFleet.battleships;
        // If player is building military, adapt accordingly
        if (playerTotalUnits > 5 && aiState.threatLevel > 0.5) {
            this.currentStrategy = Math.random() < 0.6 ? 'defensive' : 'aggressive';
        }
        // If player is focusing on economy, exploit or match
        const playerIncome = gameState.player.resources.metalIncome + gameState.player.resources.energyIncome;
        if (playerIncome > 20000 && aiState.economicAdvantage < 0) {
            this.currentStrategy = Math.random() < 0.5 ? 'economic' : 'aggressive';
        }
    }
    executeStrategy(gameState, aiState) {
        switch (this.currentStrategy) {
            case 'aggressive':
                return this.makeAggressiveDecision(gameState, aiState);
            case 'economic':
                return this.makeEconomicDecision(gameState, aiState);
            case 'defensive':
                return this.makeDefensiveDecision(gameState, aiState);
            case 'opportunistic':
                return this.makeOpportunisticDecision(gameState, aiState);
        }
    }
    makeAggressiveDecision(gameState, aiState) {
        const currentFleet = aiState.fleet.homeSystem;
        const totalUnits = currentFleet.frigates + currentFleet.cruisers + currentFleet.battleships;
        // Attack if we have sufficient force
        if (totalUnits >= 4) {
            const playerFleet = gameState.player.fleet.homeSystem;
            const attackFleet = this.planAggressiveAttack(currentFleet, playerFleet);
            if (attackFleet && this.hasAvailableFleet(aiState, attackFleet)) {
                return {
                    type: 'attack',
                    attackTarget: 'player_home',
                    attackFleet
                };
            }
        }
        // Build fast, aggressive units
        if (this.canAffordBuild(aiState.resources, 'frigate', 2)) {
            return {
                type: 'build',
                buildType: 'frigate',
                buildQuantity: Math.floor(Math.random() * 3) + 1
            };
        }
        if (this.canAffordBuild(aiState.resources, 'cruiser')) {
            return {
                type: 'build',
                buildType: 'cruiser',
                buildQuantity: 1
            };
        }
        return { type: 'wait' };
    }
    makeEconomicDecision(gameState, aiState) {
        const targetIncome = 20000;
        const currentIncome = aiState.resources.metalIncome + aiState.resources.energyIncome;
        if (currentIncome < targetIncome) {
            // Balance metal and energy income
            if (aiState.resources.metalIncome <= aiState.resources.energyIncome) {
                if (this.canAffordBuild(aiState.resources, 'mine')) {
                    return {
                        type: 'build',
                        buildType: 'mine',
                        buildQuantity: 1
                    };
                }
            }
            else {
                if (this.canAffordBuild(aiState.resources, 'reactor')) {
                    return {
                        type: 'build',
                        buildType: 'reactor',
                        buildQuantity: 1
                    };
                }
            }
        }
        // Build minimal defense
        const currentFleet = aiState.fleet.homeSystem;
        const totalUnits = currentFleet.frigates + currentFleet.cruisers + currentFleet.battleships;
        if (totalUnits < 3) {
            if (this.canAffordBuild(aiState.resources, 'cruiser')) {
                return {
                    type: 'build',
                    buildType: 'cruiser',
                    buildQuantity: 1
                };
            }
        }
        return { type: 'wait' };
    }
    makeDefensiveDecision(gameState, aiState) {
        const currentFleet = aiState.fleet.homeSystem;
        const totalUnits = currentFleet.frigates + currentFleet.cruisers + currentFleet.battleships;
        const targetDefense = 8;
        if (totalUnits < targetDefense) {
            // Build defensive units based on threat
            const playerFleet = gameState.player.fleet.homeSystem;
            const counterUnit = this.getDefensiveCounter(playerFleet);
            if (this.canAffordBuild(aiState.resources, counterUnit)) {
                return {
                    type: 'build',
                    buildType: counterUnit,
                    buildQuantity: 1
                };
            }
        }
        // Scan for intelligence when defensive
        if (aiState.resources.energy >= 2500 && Math.random() < 0.4) {
            return {
                type: 'scan',
                scanType: 'deep'
            };
        }
        return { type: 'wait' };
    }
    makeOpportunisticDecision(gameState, aiState) {
        // Look for opportunities based on game state
        const playerFleet = gameState.player.fleet.homeSystem;
        const playerTotalUnits = playerFleet.frigates + playerFleet.cruisers + playerFleet.battleships;
        // If player fleet is weak, attack
        if (playerTotalUnits <= 2 && aiState.fleet.homeSystem.frigates + aiState.fleet.homeSystem.cruisers + aiState.fleet.homeSystem.battleships >= 3) {
            const attackFleet = {
                frigates: Math.floor(aiState.fleet.homeSystem.frigates * 0.8),
                cruisers: Math.floor(aiState.fleet.homeSystem.cruisers * 0.8),
                battleships: Math.floor(aiState.fleet.homeSystem.battleships * 0.8)
            };
            if (this.hasAvailableFleet(aiState, attackFleet)) {
                return {
                    type: 'attack',
                    attackTarget: 'player_home',
                    attackFleet
                };
            }
        }
        // If player is building economy, match or counter
        const playerIncome = gameState.player.resources.metalIncome + gameState.player.resources.energyIncome;
        if (playerIncome > aiState.resources.metalIncome + aiState.resources.energyIncome) {
            return this.makeEconomicDecision(gameState, aiState);
        }
        // Default to balanced military build
        if (this.canAffordBuild(aiState.resources, 'cruiser')) {
            return {
                type: 'build',
                buildType: 'cruiser',
                buildQuantity: 1
            };
        }
        if (this.canAffordBuild(aiState.resources, 'frigate')) {
            return {
                type: 'build',
                buildType: 'frigate',
                buildQuantity: 2
            };
        }
        return { type: 'wait' };
    }
    planAggressiveAttack(availableFleet, enemyFleet) {
        const totalAvailable = availableFleet.frigates + availableFleet.cruisers + availableFleet.battleships;
        if (totalAvailable < 2)
            return null;
        // Use 70-90% of available fleet for aggressive attack
        const attackRatio = 0.7 + Math.random() * 0.2;
        return {
            frigates: Math.floor(availableFleet.frigates * attackRatio),
            cruisers: Math.floor(availableFleet.cruisers * attackRatio),
            battleships: Math.floor(availableFleet.battleships * attackRatio)
        };
    }
    getDefensiveCounter(enemyFleet) {
        const dominantUnit = this.getDominantUnitType(enemyFleet);
        // Build counters
        switch (dominantUnit) {
            case 'frigate':
                return 'battleship';
            case 'cruiser':
                return 'frigate';
            case 'battleship':
                return 'cruiser';
        }
    }
}
//# sourceMappingURL=HybridAI.js.map