export interface GameError {
    type: 'validation' | 'runtime' | 'user_input' | 'system' | 'game_logic';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    context?: any;
    timestamp: Date;
    recoverable: boolean;
}
export declare class ErrorHandler {
    private static errors;
    private static maxErrorHistory;
    /**
     * Logs an error and determines if the game can continue
     */
    static handleError(type: GameError['type'], severity: GameError['severity'], message: string, context?: any): {
        canContinue: boolean;
        userMessage: string;
        shouldRestart: boolean;
    };
    /**
     * Determines if an error type/severity combination is recoverable
     */
    private static isRecoverable;
    /**
     * Handles common game state validation errors
     */
    static handleGameStateError(validationErrors: string[]): {
        canContinue: boolean;
        userMessage: string;
        shouldRestart: boolean;
    };
    /**
     * Handles turn processing errors
     */
    static handleTurnProcessingError(turnErrors: string[]): {
        canContinue: boolean;
        userMessage: string;
        shouldRestart: boolean;
    };
    /**
     * Handles user input errors
     */
    static handleUserInputError(inputError: string): {
        canContinue: boolean;
        userMessage: string;
        shouldRestart: boolean;
    };
    /**
     * Handles system-level errors (file I/O, memory, etc.)
     */
    static handleSystemError(error: Error): {
        canContinue: boolean;
        userMessage: string;
        shouldRestart: boolean;
    };
    /**
     * Gets recent error history
     */
    static getRecentErrors(count?: number): GameError[];
    /**
     * Gets error statistics
     */
    static getErrorStatistics(): {
        total: number;
        byType: Record<GameError['type'], number>;
        bySeverity: Record<GameError['severity'], number>;
        recentCritical: number;
    };
    /**
     * Clears error history
     */
    static clearErrorHistory(): void;
    /**
     * Checks if the system is in a healthy state
     */
    static isSystemHealthy(): {
        healthy: boolean;
        issues: string[];
    };
    /**
     * Provides recovery suggestions based on error patterns
     */
    static getRecoverySuggestions(): string[];
}
//# sourceMappingURL=ErrorHandler.d.ts.map