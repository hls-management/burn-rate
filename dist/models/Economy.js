export const STRUCTURE_STATS = {
    reactor: {
        buildCost: { metal: 900, energy: 1200 },
        buildTime: 1,
        incomeBonus: { metal: 0, energy: 500 }
    },
    mine: {
        buildCost: { metal: 1500, energy: 600 },
        buildTime: 1,
        incomeBonus: { metal: 500, energy: 0 }
    }
};
export const BASE_INCOME = {
    metal: 10000,
    energy: 10000
};
/**
 * Validates a build order for correctness
 */
export function validateBuildOrder(buildOrder) {
    const errors = [];
    if (buildOrder.quantity <= 0) {
        errors.push('Build order quantity must be positive');
    }
    if (buildOrder.turnsRemaining < 0) {
        errors.push('Turns remaining cannot be negative');
    }
    if (buildOrder.resourceDrainPerTurn.metal < 0) {
        errors.push('Metal drain per turn cannot be negative');
    }
    if (buildOrder.resourceDrainPerTurn.energy < 0) {
        errors.push('Energy drain per turn cannot be negative');
    }
    const validTypes = ['frigate', 'cruiser', 'battleship', 'reactor', 'mine'];
    if (!validTypes.includes(buildOrder.unitType)) {
        errors.push(`Invalid unit type: ${buildOrder.unitType}`);
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Validates an entire construction queue
 */
export function validateConstructionQueue(queue) {
    const errors = [];
    for (let i = 0; i < queue.length; i++) {
        const validation = validateBuildOrder(queue[i]);
        if (!validation.isValid) {
            errors.push(...validation.errors.map(err => `Build order ${i + 1}: ${err}`));
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Calculates the exponential cost for building additional structures
 * Formula: Cost = Base Cost × (1 + 0.5 × Structure Count)^1.2
 */
export function calculateStructureCost(structureType, currentCount) {
    const baseCost = STRUCTURE_STATS[structureType].buildCost;
    const multiplier = Math.pow(1 + 0.5 * currentCount, 1.2);
    return {
        metal: Math.ceil(baseCost.metal * multiplier),
        energy: Math.ceil(baseCost.energy * multiplier)
    };
}
/**
 * Calculates the total income from economic structures
 */
export function calculateStructureIncome(reactors, mines) {
    return {
        metal: BASE_INCOME.metal + (mines * STRUCTURE_STATS.mine.incomeBonus.metal),
        energy: BASE_INCOME.energy + (reactors * STRUCTURE_STATS.reactor.incomeBonus.energy)
    };
}
/**
 * Calculates the total resource drain from all active build orders
 */
export function calculateConstructionDrain(constructionQueue) {
    let totalMetalDrain = 0;
    let totalEnergyDrain = 0;
    for (const buildOrder of constructionQueue) {
        totalMetalDrain += buildOrder.resourceDrainPerTurn.metal;
        totalEnergyDrain += buildOrder.resourceDrainPerTurn.energy;
    }
    return {
        metal: totalMetalDrain,
        energy: totalEnergyDrain
    };
}
/**
 * Calculates net income after construction drain
 */
export function calculateNetIncome(structureIncome, constructionDrain) {
    return {
        metal: structureIncome.metal - constructionDrain.metal,
        energy: structureIncome.energy - constructionDrain.energy
    };
}
/**
 * Creates a build order for a structure
 */
export function createStructureBuildOrder(structureType, quantity, currentCount) {
    const cost = calculateStructureCost(structureType, currentCount);
    const buildTime = STRUCTURE_STATS[structureType].buildTime;
    return {
        unitType: structureType,
        quantity,
        turnsRemaining: buildTime,
        resourceDrainPerTurn: {
            metal: cost.metal * quantity,
            energy: cost.energy * quantity
        }
    };
}
/**
 * Creates a build order for units (from Fleet.ts unit stats)
 */
export function createUnitBuildOrder(unitType, quantity, unitStats) {
    return {
        unitType,
        quantity,
        turnsRemaining: unitStats.buildTime,
        resourceDrainPerTurn: {
            metal: unitStats.buildCost.metal * quantity,
            energy: unitStats.buildCost.energy * quantity
        }
    };
}
/**
 * Processes construction queue for one turn, completing finished orders
 */
export function processConstructionQueue(queue) {
    const completedOrders = [];
    const remainingQueue = [];
    for (const order of queue) {
        const updatedOrder = { ...order, turnsRemaining: order.turnsRemaining - 1 };
        if (updatedOrder.turnsRemaining <= 0) {
            completedOrders.push(updatedOrder);
        }
        else {
            remainingQueue.push(updatedOrder);
        }
    }
    return { completedOrders, remainingQueue };
}
/**
 * Checks if resources are sufficient to start a build order
 */
export function canAffordBuildOrder(resources, buildOrder) {
    const totalMetalCost = buildOrder.resourceDrainPerTurn.metal * buildOrder.turnsRemaining;
    const totalEnergyCost = buildOrder.resourceDrainPerTurn.energy * buildOrder.turnsRemaining;
    return resources.metal >= totalMetalCost && resources.energy >= totalEnergyCost;
}
/**
 * Checks if income can sustain a build order's drain
 */
export function canSustainBuildOrder(netIncome, buildOrder) {
    return netIncome.metal >= buildOrder.resourceDrainPerTurn.metal &&
        netIncome.energy >= buildOrder.resourceDrainPerTurn.energy;
}
/**
 * Calculates payback time for a structure investment
 */
export function calculateStructurePaybackTime(structureType, currentCount) {
    const cost = calculateStructureCost(structureType, currentCount);
    const incomeBonus = STRUCTURE_STATS[structureType].incomeBonus;
    // Calculate turns needed to pay back the investment for the resource the structure produces
    if (structureType === 'reactor') {
        // Reactors produce energy, so calculate payback based on energy cost and energy income
        return cost.energy / incomeBonus.energy;
    }
    else if (structureType === 'mine') {
        // Mines produce metal, so calculate payback based on metal cost and metal income
        return cost.metal / incomeBonus.metal;
    }
    return Infinity;
}
/**
 * Determines if building a structure is economically viable
 */
export function isStructureViable(structureType, currentCount, maxPaybackTurns = 10) {
    const paybackTime = calculateStructurePaybackTime(structureType, currentCount);
    return paybackTime <= maxPaybackTurns;
}
/**
 * Creates an empty economy state
 */
export function createEmptyEconomy() {
    return {
        reactors: 0,
        mines: 0,
        constructionQueue: []
    };
}
/**
 * Calculates total economic structures
 */
export function getTotalStructures(economy) {
    return economy.reactors + economy.mines;
}
//# sourceMappingURL=Economy.js.map