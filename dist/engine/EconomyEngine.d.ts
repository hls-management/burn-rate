import { PlayerState } from '../models/PlayerState.js';
import { BuildOrder } from '../models/Economy.js';
export declare class EconomyEngine {
    /**
     * Calculates and updates the player's resource income based on:
     * - Base income (+10,000 Metal/Energy per turn)
     * - Economic structure bonuses (+500 per structure)
     * - Construction drain (resources consumed during building)
     * - Unit upkeep costs (permanent drain from completed units)
     */
    calculateIncome(player: PlayerState): void;
    /**
     * Gets the current net income without applying it to resources
     * Useful for checking economic viability before making decisions
     */
    getNetIncome(player: PlayerState): {
        metal: number;
        energy: number;
    };
    /**
     * Checks if the player's economy is in a stall condition
     * (income ≤ 0, preventing new production)
     */
    isEconomyStalled(player: PlayerState): boolean;
    /**
     * Gets detailed income breakdown for display/debugging
     */
    getIncomeBreakdown(player: PlayerState): {
        baseIncome: {
            metal: number;
            energy: number;
        };
        structureBonus: {
            metal: number;
            energy: number;
        };
        constructionDrain: {
            metal: number;
            energy: number;
        };
        fleetUpkeep: {
            metal: number;
            energy: number;
        };
        netIncome: {
            metal: number;
            energy: number;
        };
    };
    /**
     * Processes construction queue for one turn:
     * - Advances all build orders by 1 turn
     * - Completes finished orders and adds units/structures to player
     * - Validates resource availability before processing
     * - Halts production if economy is stalled
     */
    processConstruction(player: PlayerState): void;
    /**
     * Advances existing construction orders by one turn and completes finished ones
     */
    private advanceExistingConstruction;
    /**
     * Applies a completed build order to the player state
     */
    private applyCompletedOrder;
    /**
     * Validates if a build order can be afforded and sustained
     */
    canAffordAndSustainBuildOrder(player: PlayerState, buildOrder: BuildOrder): {
        canAfford: boolean;
        canSustain: boolean;
        errors: string[];
    };
    /**
     * Adds a build order to the construction queue if valid
     */
    addBuildOrder(player: PlayerState, buildOrder: BuildOrder): {
        success: boolean;
        errors: string[];
    };
    /**
     * Removes a build order from the construction queue by index
     */
    cancelBuildOrder(player: PlayerState, index: number): {
        success: boolean;
        errors: string[];
    };
    /**
     * Gets the total construction drain from all active build orders
     */
    getTotalConstructionDrain(player: PlayerState): {
        metal: number;
        energy: number;
    };
    /**
     * Checks if any construction is currently active
     */
    hasActiveConstruction(player: PlayerState): boolean;
    /**
     * Gets estimated completion times for all build orders
     */
    getConstructionStatus(player: PlayerState): Array<{
        order: BuildOrder;
        index: number;
        completionTurn: number;
    }>;
    /**
     * Applies upkeep costs for completed units and validates economic balance
     * This method is called as part of the income calculation process
     * Note: Upkeep is already handled in calculateIncome(), this provides additional validation
     */
    applyUpkeep(player: PlayerState): void;
    /**
     * Validates the overall economic state and provides warnings for potential issues
     */
    validateEconomicState(player: PlayerState): {
        isValid: boolean;
        warnings: string[];
        recommendations: string[];
    };
    /**
     * Validates that economic structures are still viable investments
     */
    private validateStructureViability;
    /**
     * Calculates the economic efficiency of the current setup
     */
    getEconomicEfficiency(player: PlayerState): {
        overallEfficiency: number;
        metalEfficiency: number;
        energyEfficiency: number;
        structureEfficiency: number;
        fleetEfficiency: number;
    };
    /**
     * Provides economic recommendations based on current state
     */
    getEconomicRecommendations(player: PlayerState): {
        priority: 'high' | 'medium' | 'low';
        action: string;
        reason: string;
    }[];
}
//# sourceMappingURL=EconomyEngine.d.ts.map