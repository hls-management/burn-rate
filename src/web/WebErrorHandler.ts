import { GameState } from '../models/GameState.js';

/**
 * Error types specific to web environment
 */
export enum WebErrorType {
  DOM_ERROR = 'DOM_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  GAME_STATE_ERROR = 'GAME_STATE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  BROWSER_COMPATIBILITY = 'BROWSER_COMPATIBILITY',
  PERFORMANCE_ERROR = 'PERFORMANCE_ERROR',
  USER_INPUT_ERROR = 'USER_INPUT_ERROR'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error information structure
 */
export interface WebError {
  type: WebErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: any;
  timestamp: number;
  userAgent?: string;
  url?: string;
  stackTrace?: string;
}

/**
 * Recovery action that can be taken for an error
 */
export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  description?: string;
}

/**
 * Error handling configuration
 */
export interface ErrorHandlerConfig {
  enableLogging?: boolean;
  enableUserNotifications?: boolean;
  enableRecoveryActions?: boolean;
  maxLogEntries?: number;
  containerId?: string;
}

/**
 * Comprehensive error handler for browser-specific scenarios
 */
export class WebErrorHandler {
  private static instance: WebErrorHandler | null = null;
  private config: ErrorHandlerConfig;
  private errorLog: WebError[] = [];
  private container: HTMLElement | null = null;
  private notificationContainer: HTMLElement | null = null;

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      enableLogging: true,
      enableUserNotifications: true,
      enableRecoveryActions: true,
      maxLogEntries: 100,
      ...config
    };

    if (this.config.containerId) {
      this.container = document.getElementById(this.config.containerId);
    }

    this.setupGlobalErrorHandling();
    this.createNotificationContainer();
  }

  /**
   * Gets singleton instance of WebErrorHandler
   */
  public static getInstance(config?: ErrorHandlerConfig): WebErrorHandler {
    if (!WebErrorHandler.instance) {
      WebErrorHandler.instance = new WebErrorHandler(config);
    }
    return WebErrorHandler.instance;
  }

  /**
   * Handles DOM manipulation errors gracefully
   */
  public static handleDOMError(error: Error, elementSelector: string, context?: any): void {
    const handler = WebErrorHandler.getInstance();
    
    const webError: WebError = {
      type: WebErrorType.DOM_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: `DOM operation failed for element '${elementSelector}': ${error.message}`,
      originalError: error,
      context: { elementSelector, ...context },
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: error.stack
    };

    handler.logError(webError);
    
    // Attempt recovery
    const recoveryActions: RecoveryAction[] = [
      {
        label: 'Retry Operation',
        action: () => handler.retryDOMOperation(elementSelector, context),
        description: 'Attempt the DOM operation again'
      },
      {
        label: 'Refresh Interface',
        action: () => handler.refreshInterface(),
        description: 'Reload the game interface'
      }
    ];

    handler.displayUserFriendlyError(
      'Interface Update Failed',
      'There was a problem updating the game display. You can try refreshing the interface.',
      recoveryActions
    );
  }

  /**
   * Handles localStorage and other storage failures
   */
  public static handleStorageError(error: Error, operation?: string): void {
    const handler = WebErrorHandler.getInstance();
    
    const webError: WebError = {
      type: WebErrorType.STORAGE_ERROR,
      severity: ErrorSeverity.HIGH,
      message: `Storage operation failed${operation ? ` (${operation})` : ''}: ${error.message}`,
      originalError: error,
      context: { operation, storageAvailable: handler.checkStorageAvailability() },
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: error.stack
    };

    handler.logError(webError);

    // Determine recovery actions based on storage availability
    const recoveryActions: RecoveryAction[] = [];
    
    if (handler.checkStorageAvailability()) {
      recoveryActions.push({
        label: 'Clear Storage',
        action: () => handler.clearCorruptedStorage(),
        description: 'Clear corrupted storage data and continue without save'
      });
    }

    recoveryActions.push({
      label: 'Continue Without Save',
      action: () => handler.disableAutoSave(),
      description: 'Continue playing without automatic save functionality'
    });

    handler.displayUserFriendlyError(
      'Save System Error',
      'There was a problem with the game save system. Your progress may not be saved automatically.',
      recoveryActions
    );
  }

  /**
   * Handles game state corruption or validation errors
   */
  public static handleGameStateError(error: Error, gameState?: GameState): void {
    const handler = WebErrorHandler.getInstance();
    
    const webError: WebError = {
      type: WebErrorType.GAME_STATE_ERROR,
      severity: ErrorSeverity.CRITICAL,
      message: `Game state error: ${error.message}`,
      originalError: error,
      context: { 
        gameState: gameState ? handler.sanitizeGameStateForLogging(gameState) : null,
        hasBackup: handler.hasGameStateBackup()
      },
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: error.stack
    };

    handler.logError(webError);

    const recoveryActions: RecoveryAction[] = [];

    if (handler.hasGameStateBackup()) {
      recoveryActions.push({
        label: 'Restore Backup',
        action: () => handler.restoreGameStateBackup(),
        description: 'Restore from the most recent backup'
      });
    }

    recoveryActions.push({
      label: 'Start New Game',
      action: () => handler.startNewGame(),
      description: 'Start a fresh game (current progress will be lost)'
    });

    handler.displayUserFriendlyError(
      'Game State Corrupted',
      'The game state has become corrupted. You can try restoring from a backup or starting a new game.',
      recoveryActions
    );
  }

  /**
   * Handles browser compatibility issues
   */
  public static handleCompatibilityError(feature: string, error?: Error): void {
    const handler = WebErrorHandler.getInstance();
    
    const webError: WebError = {
      type: WebErrorType.BROWSER_COMPATIBILITY,
      severity: ErrorSeverity.HIGH,
      message: `Browser compatibility issue with feature '${feature}'${error ? `: ${error.message}` : ''}`,
      originalError: error,
      context: { 
        feature,
        browserInfo: handler.getBrowserInfo(),
        supportedFeatures: handler.checkFeatureSupport()
      },
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: error?.stack
    };

    handler.logError(webError);

    const recoveryActions: RecoveryAction[] = [
      {
        label: 'Enable Compatibility Mode',
        action: () => handler.enableCompatibilityMode(),
        description: 'Use simplified interface for better compatibility'
      },
      {
        label: 'Continue Anyway',
        action: () => handler.dismissError(),
        description: 'Continue with reduced functionality'
      }
    ];

    handler.displayUserFriendlyError(
      'Browser Compatibility Issue',
      `Your browser may not fully support the feature '${feature}'. You can enable compatibility mode for better experience.`,
      recoveryActions
    );
  }

  /**
   * Displays user-friendly error messages with recovery options
   */
  public displayUserFriendlyError(
    title: string, 
    message: string, 
    recoveryActions: RecoveryAction[] = []
  ): void {
    if (!this.config.enableUserNotifications) return;

    const errorModal = this.createErrorModal(title, message, recoveryActions);
    document.body.appendChild(errorModal);

    // Auto-remove after 30 seconds if no action taken
    setTimeout(() => {
      if (errorModal.parentNode) {
        errorModal.remove();
      }
    }, 30000);
  }

  /**
   * Logs error for debugging and analysis
   */
  private logError(error: WebError): void {
    if (!this.config.enableLogging) return;

    // Add to internal log
    this.errorLog.push(error);

    // Maintain log size limit
    if (this.errorLog.length > (this.config.maxLogEntries || 100)) {
      this.errorLog = this.errorLog.slice(-50); // Keep last 50 entries
    }

    // Console logging for development
    console.error('WebErrorHandler:', error);

    // Store in localStorage for persistence
    try {
      localStorage.setItem('burn-rate-error-log', JSON.stringify(this.errorLog.slice(-10)));
    } catch (e) {
      // Ignore storage errors when logging errors
    }
  }

  /**
   * Sets up global error handling for unhandled errors
   */
  private setupGlobalErrorHandling(): void {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      const webError: WebError = {
        type: WebErrorType.DOM_ERROR,
        severity: ErrorSeverity.HIGH,
        message: `Unhandled error: ${event.message}`,
        originalError: event.error,
        context: { 
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        stackTrace: event.error?.stack
      };

      this.logError(webError);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const webError: WebError = {
        type: WebErrorType.GAME_STATE_ERROR,
        severity: ErrorSeverity.HIGH,
        message: `Unhandled promise rejection: ${event.reason}`,
        originalError: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        context: { promiseRejection: true },
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      this.logError(webError);
    });
  }

  /**
   * Creates notification container for error messages
   */
  private createNotificationContainer(): void {
    if (!this.config.enableUserNotifications) return;

    this.notificationContainer = document.createElement('div');
    this.notificationContainer.id = 'web-error-notifications';
    this.notificationContainer.className = 'error-notifications-container';
    this.notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
      pointer-events: none;
    `;

    document.body.appendChild(this.notificationContainer);
  }

  /**
   * Creates error modal with recovery actions
   */
  private createErrorModal(title: string, message: string, recoveryActions: RecoveryAction[]): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'error-modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      pointer-events: auto;
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'error-modal-content';
    modalContent.style.cssText = `
      background: #fff;
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      margin: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    const actionsHtml = recoveryActions.length > 0 ? `
      <div class="error-actions" style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
        ${recoveryActions.map((action, index) => `
          <button 
            class="recovery-action-btn" 
            data-action-index="${index}"
            style="
              padding: 8px 16px;
              border: 1px solid #ddd;
              border-radius: 4px;
              background: #f5f5f5;
              cursor: pointer;
              font-size: 14px;
            "
            title="${action.description || ''}"
          >
            ${action.label}
          </button>
        `).join('')}
        <button 
          class="dismiss-error-btn"
          style="
            padding: 8px 16px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background: #e9e9e9;
            cursor: pointer;
            font-size: 14px;
            margin-left: auto;
          "
        >
          Dismiss
        </button>
      </div>
    ` : `
      <div class="error-actions" style="margin-top: 20px; text-align: right;">
        <button 
          class="dismiss-error-btn"
          style="
            padding: 8px 16px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background: #e9e9e9;
            cursor: pointer;
            font-size: 14px;
          "
        >
          OK
        </button>
      </div>
    `;

    modalContent.innerHTML = `
      <div class="error-header" style="display: flex; align-items: center; margin-bottom: 16px;">
        <span style="font-size: 24px; margin-right: 12px;">⚠️</span>
        <h3 style="margin: 0; color: #d32f2f;">${title}</h3>
      </div>
      <div class="error-message" style="margin-bottom: 16px; line-height: 1.5;">
        ${message}
      </div>
      ${actionsHtml}
    `;

    // Add event listeners
    modalContent.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      if (target.classList.contains('recovery-action-btn')) {
        const actionIndex = parseInt(target.dataset.actionIndex || '0');
        const action = recoveryActions[actionIndex];
        if (action) {
          Promise.resolve(action.action()).catch(console.error);
          modal.remove();
        }
      } else if (target.classList.contains('dismiss-error-btn')) {
        modal.remove();
      }
    });

    modal.appendChild(modalContent);
    return modal;
  }

  // Recovery action implementations
  private retryDOMOperation(elementSelector: string, context?: any): void {
    // Implementation would depend on the specific operation
    console.log('Retrying DOM operation for:', elementSelector);
  }

  private refreshInterface(): void {
    window.location.reload();
  }

  private checkStorageAvailability(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  private clearCorruptedStorage(): void {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
  }

  private disableAutoSave(): void {
    // This would need to be integrated with the game's auto-save system
    console.log('Auto-save disabled due to storage error');
  }

  private hasGameStateBackup(): boolean {
    try {
      return localStorage.getItem('burn-rate-game-state-backup') !== null;
    } catch (e) {
      return false;
    }
  }

  private restoreGameStateBackup(): void {
    // Implementation would restore from backup
    console.log('Restoring game state backup');
  }

  private startNewGame(): void {
    // This would need to be integrated with the game initialization
    if (confirm('Are you sure you want to start a new game? Current progress will be lost.')) {
      window.location.reload();
    }
  }

  private getBrowserInfo(): any {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  private checkFeatureSupport(): any {
    return {
      localStorage: typeof Storage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      webGL: !!window.WebGLRenderingContext,
      canvas: !!document.createElement('canvas').getContext,
      webWorkers: typeof Worker !== 'undefined',
      fetch: typeof fetch !== 'undefined'
    };
  }

  private enableCompatibilityMode(): void {
    // Enable simplified interface
    document.body.classList.add('compatibility-mode');
  }

  private dismissError(): void {
    // Simply dismiss the error
  }

  private sanitizeGameStateForLogging(gameState: GameState): any {
    // Return a sanitized version of game state for logging
    return {
      turn: gameState.turn,
      gamePhase: gameState.gamePhase,
      isGameOver: gameState.isGameOver,
      playerResourcesCount: Object.keys(gameState.player.resources).length,
      aiResourcesCount: Object.keys(gameState.ai.resources).length
    };
  }

  /**
   * Gets error statistics for debugging
   */
  public getErrorStatistics(): any {
    const stats = {
      totalErrors: this.errorLog.length,
      errorsByType: {} as Record<string, number>,
      errorsBySeverity: {} as Record<string, number>,
      recentErrors: this.errorLog.slice(-5)
    };

    this.errorLog.forEach(error => {
      stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
      stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clears error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
    try {
      localStorage.removeItem('burn-rate-error-log');
    } catch (e) {
      // Ignore
    }
  }
}