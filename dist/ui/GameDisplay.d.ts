import { GameState } from '../models/GameState.js';
import { TurnResult } from '../engine/GameEngine.js';
import { CLIConfig } from './CLIInterface.js';
export declare class GameDisplay {
    private config;
    private colorManager;
    private tacticalAnalyzer;
    constructor(config?: CLIConfig);
    /**
     * Displays the main game state information
     */
    displayGameState(gameState: GameState): void;
    /**
     * Displays player resources and income
     */
    private displayPlayerResources;
    /**
     * Displays fleet status including home and in-transit fleets
     */
    private displayFleetStatus;
    /**
     * Displays construction queue
     */
    private displayConstructionQueue;
    /**
     * Displays intelligence information
     */
    private displayIntelligence;
    /**
     * Displays detailed game status
     */
    displayDetailedStatus(gameState: GameState, stats: any): void;
    /**
     * Displays help information
     */
    displayHelp(): void;
    /**
     * Displays turn result including combat events
     */
    displayTurnResult(turnResult: TurnResult): void;
    /**
     * Displays a single combat event with enhanced formatting and tactical analysis
     */
    private displayCombatEvent;
    /**
     * Displays detailed fleet composition with color coding
     */
    private displayDetailedFleetComposition;
    /**
     * Displays battle explanation based on outcome and effectiveness ratios
     */
    private displayBattleExplanation;
    /**
     * Displays enhanced casualty information with percentages and color coding
     */
    private displayEnhancedCasualties;
    /**
     * Displays enhanced survivor information with color coding
     */
    private displayEnhancedSurvivors;
    /**
     * Formats casualty breakdown by unit type
     */
    private formatCasualtyBreakdown;
    /**
     * Displays game over screen
     */
    displayGameOver(gameState: GameState): void;
    /**
     * Displays error messages
     */
    displayError(message: string): void;
    /**
     * Helper methods for formatting
     */
    private formatNumber;
    private formatIncome;
    private padNumber;
    private getFleetMovementStatus;
    private getConstructionProgress;
    private formatBattleOutcome;
}
//# sourceMappingURL=GameDisplay.d.ts.map