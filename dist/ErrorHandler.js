export class ErrorHandler {
    static errors = [];
    static maxErrorHistory = 100;
    /**
     * Logs an error and determines if the game can continue
     */
    static handleError(type, severity, message, context) {
        const error = {
            type,
            severity,
            message,
            context,
            timestamp: new Date(),
            recoverable: this.isRecoverable(type, severity)
        };
        // Add to error history
        this.errors.push(error);
        if (this.errors.length > this.maxErrorHistory) {
            this.errors.shift();
        }
        // Log to console in development
        if (process.env.NODE_ENV !== 'production') {
            console.error(`[${severity.toUpperCase()}] ${type}: ${message}`, context);
        }
        // Determine response based on severity
        switch (severity) {
            case 'critical':
                return {
                    canContinue: false,
                    userMessage: `Critical error: ${message}. The game must restart.`,
                    shouldRestart: true
                };
            case 'high':
                return {
                    canContinue: error.recoverable,
                    userMessage: `Serious error: ${message}. ${error.recoverable ? 'Attempting to continue...' : 'Game may be unstable.'}`,
                    shouldRestart: !error.recoverable
                };
            case 'medium':
                return {
                    canContinue: true,
                    userMessage: `Error: ${message}. Game will continue.`,
                    shouldRestart: false
                };
            case 'low':
                return {
                    canContinue: true,
                    userMessage: `Warning: ${message}`,
                    shouldRestart: false
                };
            default:
                return {
                    canContinue: true,
                    userMessage: message,
                    shouldRestart: false
                };
        }
    }
    /**
     * Determines if an error type/severity combination is recoverable
     */
    static isRecoverable(type, severity) {
        // Critical errors are never recoverable
        if (severity === 'critical') {
            return false;
        }
        // Type-specific recoverability
        switch (type) {
            case 'validation':
                return severity !== 'high'; // High validation errors usually indicate corrupted state
            case 'runtime':
                return severity === 'low' || severity === 'medium';
            case 'user_input':
                return true; // User input errors are always recoverable
            case 'system':
                return severity === 'low'; // System errors are usually not recoverable
            case 'game_logic':
                return severity !== 'high'; // High game logic errors indicate serious bugs
            default:
                return false;
        }
    }
    /**
     * Handles common game state validation errors
     */
    static handleGameStateError(validationErrors) {
        if (validationErrors.length === 0) {
            return { canContinue: true, userMessage: '', shouldRestart: false };
        }
        // Categorize validation errors by severity
        const criticalErrors = validationErrors.filter(error => error.includes('negative') ||
            error.includes('null') ||
            error.includes('undefined') ||
            error.includes('missing'));
        const highErrors = validationErrors.filter(error => error.includes('inconsistent') ||
            error.includes('invalid state') ||
            error.includes('corrupted'));
        if (criticalErrors.length > 0) {
            return this.handleError('validation', 'critical', `Game state validation failed: ${criticalErrors.join(', ')}`, { allErrors: validationErrors });
        }
        else if (highErrors.length > 0) {
            return this.handleError('validation', 'high', `Game state issues detected: ${highErrors.join(', ')}`, { allErrors: validationErrors });
        }
        else {
            return this.handleError('validation', 'medium', `Minor game state issues: ${validationErrors.join(', ')}`, { allErrors: validationErrors });
        }
    }
    /**
     * Handles turn processing errors
     */
    static handleTurnProcessingError(turnErrors) {
        if (turnErrors.length === 0) {
            return { canContinue: true, userMessage: '', shouldRestart: false };
        }
        // Check for critical turn processing errors
        const hasCriticalError = turnErrors.some(error => error.includes('failed to process') ||
            error.includes('engine failure') ||
            error.includes('system crash'));
        if (hasCriticalError) {
            return this.handleError('game_logic', 'critical', `Turn processing failed: ${turnErrors.join(', ')}`, { turnErrors });
        }
        else {
            return this.handleError('game_logic', 'medium', `Turn processing issues: ${turnErrors.join(', ')}`, { turnErrors });
        }
    }
    /**
     * Handles user input errors
     */
    static handleUserInputError(inputError) {
        return this.handleError('user_input', 'low', inputError);
    }
    /**
     * Handles system-level errors (file I/O, memory, etc.)
     */
    static handleSystemError(error) {
        // Categorize system errors
        const isMemoryError = error.message.includes('memory') || error.message.includes('heap');
        const isFileError = error.message.includes('file') || error.message.includes('ENOENT');
        const isNetworkError = error.message.includes('network') || error.message.includes('connection');
        if (isMemoryError) {
            return this.handleError('system', 'critical', `Memory error: ${error.message}`, { error });
        }
        else if (isFileError) {
            return this.handleError('system', 'high', `File system error: ${error.message}`, { error });
        }
        else if (isNetworkError) {
            return this.handleError('system', 'medium', `Network error: ${error.message}`, { error });
        }
        else {
            return this.handleError('system', 'high', `System error: ${error.message}`, { error });
        }
    }
    /**
     * Gets recent error history
     */
    static getRecentErrors(count = 10) {
        return this.errors.slice(-count);
    }
    /**
     * Gets error statistics
     */
    static getErrorStatistics() {
        const byType = {
            validation: 0,
            runtime: 0,
            user_input: 0,
            system: 0,
            game_logic: 0
        };
        const bySeverity = {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
        };
        let recentCritical = 0;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        this.errors.forEach(error => {
            byType[error.type]++;
            bySeverity[error.severity]++;
            if (error.severity === 'critical' && error.timestamp > oneHourAgo) {
                recentCritical++;
            }
        });
        return {
            total: this.errors.length,
            byType,
            bySeverity,
            recentCritical
        };
    }
    /**
     * Clears error history
     */
    static clearErrorHistory() {
        this.errors = [];
    }
    /**
     * Checks if the system is in a healthy state
     */
    static isSystemHealthy() {
        const issues = [];
        const stats = this.getErrorStatistics();
        // Check for too many recent critical errors
        if (stats.recentCritical > 3) {
            issues.push(`Too many critical errors in the last hour: ${stats.recentCritical}`);
        }
        // Check for high error rate
        if (stats.total > 50) {
            issues.push(`High total error count: ${stats.total}`);
        }
        // Check for system errors
        if (stats.byType.system > 5) {
            issues.push(`Multiple system errors detected: ${stats.byType.system}`);
        }
        return {
            healthy: issues.length === 0,
            issues
        };
    }
    /**
     * Provides recovery suggestions based on error patterns
     */
    static getRecoverySuggestions() {
        const suggestions = [];
        const stats = this.getErrorStatistics();
        if (stats.byType.validation > 5) {
            suggestions.push('Consider restarting the game to reset the game state');
        }
        if (stats.byType.system > 3) {
            suggestions.push('Check system resources (memory, disk space)');
        }
        if (stats.byType.user_input > 10) {
            suggestions.push('Review command syntax - type "help" for available commands');
        }
        if (stats.recentCritical > 0) {
            suggestions.push('Recent critical errors detected - restart recommended');
        }
        if (suggestions.length === 0) {
            suggestions.push('System appears stable');
        }
        return suggestions;
    }
}
//# sourceMappingURL=ErrorHandler.js.map