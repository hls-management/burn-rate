import { GameEngine } from '../engine/GameEngine.js';
import { Command } from './InputHandler.js';
export interface CommandExecutionResult {
    success: boolean;
    message: string;
    gameStateChanged: boolean;
}
export declare class GameController {
    private gameEngine;
    private pendingPlayerActions;
    constructor(gameEngine: GameEngine);
    /**
     * Executes a player command and returns the result
     */
    executeCommand(command: Command): CommandExecutionResult;
    /**
     * Executes a build command
     */
    private executeBuildCommand;
    /**
     * Executes an attack command
     */
    private executeAttackCommand;
    /**
     * Executes a scan command
     */
    private executeScanCommand;
    /**
     * Executes end turn command
     */
    private executeEndTurn;
    /**
     * Performs a scan and returns the result
     */
    private performScan;
    /**
     * Determines AI strategic intent for advanced scans
     */
    private determineAIIntent;
    /**
     * Formats scan results for display
     */
    private formatScanResult;
    /**
     * Gets build costs for different unit/structure types
     */
    private getBuildCosts;
    /**
     * Gets pending player actions (for debugging)
     */
    getPendingActions(): Command[];
    /**
     * Clears pending actions (for testing)
     */
    clearPendingActions(): void;
    /**
     * Gets the game engine instance
     */
    getGameEngine(): GameEngine;
}
//# sourceMappingURL=GameController.d.ts.map