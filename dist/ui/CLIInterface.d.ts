import { GameEngine } from '../engine/GameEngine.js';
export interface CLIConfig {
    showDebugInfo?: boolean;
    autoAdvanceTurn?: boolean;
    useColors?: boolean;
}
export declare class CLIInterface {
    private gameEngine;
    private gameController;
    private gameDisplay;
    private inputHandler;
    private config;
    private isRunning;
    constructor(gameEngine: GameEngine, config?: CLIConfig);
    /**
     * Starts the CLI game loop
     */
    start(): Promise<void>;
    /**
     * Stops the CLI interface
     */
    stop(): void;
    /**
     * Displays the welcome message and game instructions
     */
    private displayWelcome;
    /**
     * Processes a single player turn
     */
    private processPlayerTurn;
    /**
     * Gets input from the player
     */
    private getPlayerInput;
    /**
     * Displays the current game state
     */
    private displayGameState;
    /**
     * Displays detailed game status
     */
    private displayDetailedStatus;
    /**
     * Displays help information
     */
    private displayHelp;
    /**
     * Displays turn result including combat events
     */
    private displayTurnResult;
    /**
     * Displays game over message
     */
    private displayGameOver;
    /**
     * Gets the current game engine instance
     */
    getGameEngine(): GameEngine;
    /**
     * Processes a command with comprehensive error handling
     */
    private processCommandSafely;
    /**
     * Performs a system health check
     */
    performHealthCheck(): {
        healthy: boolean;
        issues: string[];
        suggestions: string[];
    };
    /**
     * Displays system health information
     */
    displayHealthCheck(): void;
    /**
     * Resets the game with new configuration
     */
    resetGame(config?: any): void;
    /**
     * Gracefully shuts down the CLI interface
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=CLIInterface.d.ts.map