import { GameEngine } from '../engine/GameEngine.js';
import { GameController, CommandExecutionResult } from '../ui/GameController.js';
export interface WebConfig {
    containerId: string;
    showDebugInfo?: boolean;
    autoSave?: boolean;
    theme?: 'dark' | 'light';
}
export interface UserAction {
    type: 'build' | 'attack' | 'scan' | 'endTurn' | 'newGame' | 'status' | 'help';
    data?: any;
    timestamp: number;
}
export declare class WebInterface {
    private gameEngine;
    private gameController;
    private config;
    private isRunning;
    private container;
    constructor(gameEngine: GameEngine, config: WebConfig);
    /**
     * Starts the web interface and initializes the game
     */
    start(): Promise<void>;
    /**
     * Stops the web interface
     */
    stop(): void;
    /**
     * Handles user actions from the web interface
     */
    handleUserAction(action: UserAction): Promise<CommandExecutionResult>;
    /**
     * Updates the display to reflect current game state
     */
    updateDisplay(): void;
    /**
     * Gets the game engine instance
     */
    getGameEngine(): GameEngine;
    /**
     * Gets the game controller instance
     */
    getGameController(): GameController;
    /**
     * Gets the current configuration
     */
    getConfig(): WebConfig;
    /**
     * Updates the configuration
     */
    updateConfig(newConfig: Partial<WebConfig>): void;
    /**
     * Checks if the interface is running
     */
    isInterfaceRunning(): boolean;
    /**
     * Sets up DOM event listeners
     */
    private setupEventListeners;
    /**
     * Removes DOM event listeners
     */
    private removeEventListeners;
    /**
     * Handles form submissions
     */
    private handleFormSubmit;
    /**
     * Handles button clicks
     */
    private handleButtonClick;
    /**
     * Handles keyboard shortcuts
     */
    private handleKeydown;
    /**
     * Handles page visibility changes
     */
    private handleVisibilityChange;
    /**
     * Converts user action to game command
     */
    private convertActionToCommand;
    /**
     * Processes a game turn
     */
    private processTurn;
    /**
     * Handles game over state
     */
    private handleGameOver;
    /**
     * Displays action result to user
     */
    private displayActionResult;
    /**
     * Displays error message to user
     */
    private displayError;
    /**
     * Updates debug information display
     */
    private updateDebugInfo;
    /**
     * Applies theme to the interface
     */
    private applyTheme;
    /**
     * Saves current game state (if auto-save is enabled)
     */
    private saveGameState;
    /**
     * Loads game state from storage
     */
    loadGameState(): boolean;
    /**
     * Clears saved game state
     */
    clearSavedState(): void;
}
//# sourceMappingURL=WebInterface.d.ts.map