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
     * Displays turn result including combat events with enhanced formatting
     */
    displayTurnResult(turnResult: TurnResult): void;
    /**
     * Displays basic combat event information without enhanced formatting
     */
    private displayBasicCombatEvent;
    /**
     * Displays turn summary information
     */
    private displayTurnSummary;
    /**
     * Validates combat event data before display
     */
    private validateCombatEvent;
    /**
     * Validates fleet composition data
     */
    private validateFleetComposition;
    /**
     * Creates a safe fallback combat event for display when validation fails
     */
    private createFallbackCombatEvent;
    /**
     * Creates a safe fleet composition with validated values
     */
    private createSafeFleetComposition;
    /**
     * Validates and sanitizes ship count values
     */
    private validateShipCount;
    /**
     * Displays a single combat event with enhanced formatting and tactical analysis
     */
    private displayCombatEvent;
    /**
     * Displays minimal combat information when all other display methods fail
     */
    private displayBasicCombatEventFallback;
    /**
     * Safely calculates total fleet size with error handling
     */
    private calculateFleetTotal;
    /**
     * Safely formats battle outcome with error handling
     */
    private formatBattleOutcome;
    /**
     * Displays detailed fleet composition with color coding
     */
    private displayDetailedFleetComposition;
    /**
     * Displays a single battle phase with appropriate formatting and colors
     */
    private displayBattlePhase;
    /**
     * Formats phase advantage with appropriate colors
     */
    private formatPhaseAdvantage;
    /**
     * Formats strength ratio with contextual information
     */
    private formatStrengthRatio;
    /**
     * Displays battle explanation based on outcome and effectiveness ratios
     */
    private displayBattleExplanation;
    /**
     * Displays basic casualty information without detailed analysis
     */
    private displayBasicCasualties;
    /**
     * Displays enhanced casualty information with percentages and color coding
     */
    private displayEnhancedCasualties;
    /**
     * Displays enhanced survivor information with tactical context and color coding
     */
    private displayEnhancedSurvivors;
    /**
     * Formats casualty breakdown by unit type
     */
    private formatCasualtyBreakdown;
    /**
     * Gets casualty severity description based on loss rate
     */
    private getCasualtySeverity;
    /**
     * Gets color for casualty severity
     */
    private getCasualtySeverityColor;
    /**
     * Gets tactical context for casualties based on unit types lost
     */
    private getCasualtyTacticalContext;
    /**
     * Displays comparative loss analysis between attacker and defender
     */
    private displayComparativeLossAnalysis;
    /**
     * Gets color for survival rate display
     */
    private getSurvivalRateColor;
    /**
     * Gets tactical context for survivors
     */
    private getSurvivorTacticalContext;
    /**
     * Assesses defensive strength of surviving fleet
     */
    private assessDefensiveStrength;
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
}
//# sourceMappingURL=GameDisplay.d.ts.map