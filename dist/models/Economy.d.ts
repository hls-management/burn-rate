export type StructureType = 'reactor' | 'mine';
export type BuildableType = 'frigate' | 'cruiser' | 'battleship' | 'reactor' | 'mine';
export interface Resources {
    metal: number;
    energy: number;
    metalIncome: number;
    energyIncome: number;
}
export interface BuildOrder {
    unitType: BuildableType;
    quantity: number;
    turnsRemaining: number;
    resourceDrainPerTurn: {
        metal: number;
        energy: number;
    };
}
export interface Economy {
    reactors: number;
    mines: number;
    constructionQueue: BuildOrder[];
}
export interface StructureStats {
    buildCost: {
        metal: number;
        energy: number;
    };
    buildTime: number;
    incomeBonus: {
        metal: number;
        energy: number;
    };
}
export declare const STRUCTURE_STATS: Record<StructureType, StructureStats>;
export declare const BASE_INCOME: {
    metal: number;
    energy: number;
};
/**
 * Economic structure management and build order functions
 */
export interface EconomyValidationResult {
    isValid: boolean;
    errors: string[];
}
/**
 * Validates a build order for correctness
 */
export declare function validateBuildOrder(buildOrder: BuildOrder): EconomyValidationResult;
/**
 * Validates an entire construction queue
 */
export declare function validateConstructionQueue(queue: BuildOrder[]): EconomyValidationResult;
/**
 * Calculates the exponential cost for building additional structures
 * Formula: Cost = Base Cost × (1 + 0.5 × Structure Count)^1.2
 */
export declare function calculateStructureCost(structureType: StructureType, currentCount: number): {
    metal: number;
    energy: number;
};
/**
 * Calculates the total income from economic structures
 */
export declare function calculateStructureIncome(reactors: number, mines: number): {
    metal: number;
    energy: number;
};
/**
 * Calculates the total resource drain from all active build orders
 */
export declare function calculateConstructionDrain(constructionQueue: BuildOrder[]): {
    metal: number;
    energy: number;
};
/**
 * Calculates net income after construction drain
 */
export declare function calculateNetIncome(structureIncome: {
    metal: number;
    energy: number;
}, constructionDrain: {
    metal: number;
    energy: number;
}): {
    metal: number;
    energy: number;
};
/**
 * Creates a build order for a structure
 */
export declare function createStructureBuildOrder(structureType: StructureType, quantity: number, currentCount: number): BuildOrder;
/**
 * Creates a build order for units (from Fleet.ts unit stats)
 */
export declare function createUnitBuildOrder(unitType: 'frigate' | 'cruiser' | 'battleship', quantity: number, unitStats: {
    buildTime: number;
    buildCost: {
        metal: number;
        energy: number;
    };
}): BuildOrder;
/**
 * Processes construction queue for one turn, completing finished orders
 */
export declare function processConstructionQueue(queue: BuildOrder[]): {
    completedOrders: BuildOrder[];
    remainingQueue: BuildOrder[];
};
/**
 * Checks if resources are sufficient to start a build order
 */
export declare function canAffordBuildOrder(resources: Resources, buildOrder: BuildOrder): boolean;
/**
 * Checks if income can sustain a build order's drain
 */
export declare function canSustainBuildOrder(netIncome: {
    metal: number;
    energy: number;
}, buildOrder: BuildOrder): boolean;
/**
 * Calculates payback time for a structure investment
 */
export declare function calculateStructurePaybackTime(structureType: StructureType, currentCount: number): number;
/**
 * Determines if building a structure is economically viable
 */
export declare function isStructureViable(structureType: StructureType, currentCount: number, maxPaybackTurns?: number): boolean;
/**
 * Creates an empty economy state
 */
export declare function createEmptyEconomy(): Economy;
/**
 * Calculates total economic structures
 */
export declare function getTotalStructures(economy: Economy): number;
//# sourceMappingURL=Economy.d.ts.map