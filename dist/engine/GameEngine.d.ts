import { GameState, GamePhase, CombatEvent } from '../models/GameState.js';
import { AIArchetype } from '../models/AI.js';
export interface GameEngineConfig {
    aiArchetype?: AIArchetype;
    startingResources?: {
        metal: number;
        energy: number;
    };
}
export interface TurnResult {
    success: boolean;
    combatEvents: CombatEvent[];
    gameEnded: boolean;
    winner?: 'player' | 'ai';
    victoryType?: 'military' | 'economic';
    errors: string[];
}
export declare class GameEngine {
    private gameState;
    private economyEngine;
    private aiEngine;
    private intelligenceEngine;
    constructor(config?: GameEngineConfig);
    /**
     * Initializes a new game state with default values
     */
    private initializeGameState;
    /**
     * Processes a complete game turn following the turn sequence:
     * Start → Income → Actions → AI → Combat → Victory → Next
     */
    processTurn(playerActions?: any[]): TurnResult;
    /**
     * Updates the game phase based on turn number and game state
     */
    private updateGamePhase;
    /**
     * Processes the income phase for both player and AI
     */
    private processIncomePhase;
    /**
     * Processes AI decision making and actions
     */
    private processAIPhase;
    /**
     * Applies AI decision to the game state
     */
    private applyAIDecision;
    /**
     * Applies AI build decision
     */
    private applyAIBuildDecision;
    /**
     * Applies AI attack decision
     */
    private applyAIAttackDecision;
    /**
     * Applies AI scan decision
     */
    private applyAIScanDecision;
    /**
     * Creates a structure build order with exponential cost scaling
     */
    private createStructureBuildOrderInternal;
    /**
     * Creates a unit build order
     */
    private createUnitBuildOrderInternal;
    /**
     * Processes combat phase - resolves all fleet movements and combat
     */
    private processCombatPhase;
    /**
     * Processes player fleet movements and combat
     */
    private processPlayerFleetMovements;
    /**
     * Processes AI fleet movements and combat
     */
    private processAIFleetMovements;
    /**
     * Checks victory conditions and updates game state
     */
    private checkVictoryConditions;
    /**
     * Determines if a player is economically eliminated
     * A player is economically eliminated if:
     * 1. Their economy is stalled (income <= 0)
     * 2. They have no resources left
     * 3. They cannot recover (no way to generate positive income)
     */
    private isPlayerEconomicallyEliminated;
    /**
     * Determines if a player is militarily eliminated
     * A player is militarily eliminated if:
     * 1. They have no fleets (home or in transit)
     * 2. They have been attacked (victory condition requirement)
     */
    private isPlayerMilitarilyEliminated;
    /**
     * Returns operational costs to player when ships are destroyed
     * This helps the economy recover from losses
     */
    private returnOperationalCosts;
    /**
     * Prepares for the next turn
     */
    private prepareNextTurn;
    /**
     * Gets the current game state (read-only copy)
     */
    getGameState(): Readonly<GameState>;
    /**
     * Gets the current turn number
     */
    getCurrentTurn(): number;
    /**
     * Gets the current game phase
     */
    getGamePhase(): GamePhase;
    /**
     * Checks if the game is over
     */
    isGameOver(): boolean;
    /**
     * Gets the winner if the game is over
     */
    getWinner(): 'player' | 'ai' | undefined;
    /**
     * Gets the victory type if the game is over
     */
    getVictoryType(): 'military' | 'economic' | undefined;
    /**
     * Gets the combat log
     */
    getCombatLog(): CombatEvent[];
    /**
     * Resets the game to initial state
     */
    resetGame(config?: GameEngineConfig): void;
    /**
     * Validates the current game state for consistency
     */
    validateGameState(): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Gets detailed game statistics
     */
    getGameStatistics(): {
        turn: number;
        gamePhase: GamePhase;
        playerStats: {
            totalFleetSize: number;
            netIncome: {
                metal: number;
                energy: number;
            };
            economicStructures: number;
        };
        aiStats: {
            totalFleetSize: number;
            netIncome: {
                metal: number;
                energy: number;
            };
            economicStructures: number;
        };
        combatEvents: number;
    };
}
//# sourceMappingURL=GameEngine.d.ts.map