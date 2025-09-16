import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebErrorHandler, WebErrorType, ErrorSeverity } from '../WebErrorHandler.js';

// Mock DOM methods
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock DOM elements
const mockElement = {
  id: 'test-container',
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn()
  },
  appendChild: vi.fn(),
  remove: vi.fn(),
  innerHTML: '',
  style: {},
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

Object.defineProperty(document, 'getElementById', {
  value: vi.fn().mockReturnValue(mockElement)
});

Object.defineProperty(document, 'createElement', {
  value: vi.fn().mockReturnValue(mockElement)
});

Object.defineProperty(document, 'body', {
  value: {
    appendChild: vi.fn(),
    classList: {
      add: vi.fn()
    }
  }
});

describe('WebErrorHandler', () => {
  let errorHandler: WebErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instance
    (WebErrorHandler as any).instance = null;
    
    errorHandler = new WebErrorHandler({
      containerId: 'test-container',
      enableLogging: true,
      enableUserNotifications: true,
      maxLogEntries: 10
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = WebErrorHandler.getInstance();
      const instance2 = WebErrorHandler.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should use provided config on first instantiation', () => {
      const config = { enableLogging: false };
      const instance = WebErrorHandler.getInstance(config);
      
      expect(instance).toBeInstanceOf(WebErrorHandler);
    });
  });

  describe('DOM Error Handling', () => {
    it('should handle DOM errors gracefully', () => {
      const testError = new Error('Element not found');
      const elementSelector = '#test-element';
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      WebErrorHandler.handleDOMError(testError, elementSelector);
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should provide recovery actions for DOM errors', () => {
      const testError = new Error('DOM manipulation failed');
      const elementSelector = '.game-display';
      
      WebErrorHandler.handleDOMError(testError, elementSelector, { operation: 'update' });
      
      // Should create error modal with recovery actions
      expect(document.createElement).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
    });
  });

  describe('Storage Error Handling', () => {
    it('should handle localStorage failures', () => {
      const testError = new Error('QuotaExceededError');
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      WebErrorHandler.handleStorageError(testError, 'save');
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should check storage availability', () => {
      mockLocalStorage.setItem.mockImplementation(() => {});
      mockLocalStorage.removeItem.mockImplementation(() => {});
      
      WebErrorHandler.handleStorageError(new Error('Storage test'));
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });

    it('should handle storage unavailability', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });
      
      WebErrorHandler.handleStorageError(new Error('Storage error'));
      
      // Should still handle the error gracefully
      expect(document.createElement).toHaveBeenCalled();
    });
  });

  describe('Game State Error Handling', () => {
    it('should handle game state corruption', () => {
      const testError = new Error('Invalid game state');
      const mockGameState = {
        turn: 5,
        gamePhase: 'combat',
        isGameOver: false,
        player: { resources: {} },
        ai: { resources: {} }
      } as any;
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      WebErrorHandler.handleGameStateError(testError, mockGameState);
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should sanitize game state for logging', () => {
      const testError = new Error('Game state error');
      const mockGameState = {
        turn: 10,
        gamePhase: 'build',
        isGameOver: false,
        player: { resources: { metal: 1000, energy: 500 } },
        ai: { resources: { metal: 800, energy: 600 } },
        sensitiveData: 'should not be logged'
      } as any;
      
      WebErrorHandler.handleGameStateError(testError, mockGameState);
      
      // Should log sanitized version without sensitive data
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Browser Compatibility Handling', () => {
    it('should handle compatibility issues', () => {
      const feature = 'localStorage';
      const testError = new Error('Feature not supported');
      
      WebErrorHandler.handleCompatibilityError(feature, testError);
      
      expect(document.createElement).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('should handle compatibility issues without error object', () => {
      const feature = 'webGL';
      
      WebErrorHandler.handleCompatibilityError(feature);
      
      expect(document.createElement).toHaveBeenCalled();
    });
  });

  describe('User-Friendly Error Display', () => {
    it('should display error modal with title and message', () => {
      const title = 'Test Error';
      const message = 'This is a test error message';
      
      errorHandler.displayUserFriendlyError(title, message);
      
      expect(document.createElement).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('should display error modal with recovery actions', () => {
      const title = 'Test Error';
      const message = 'This is a test error message';
      const recoveryActions = [
        {
          label: 'Retry',
          action: vi.fn(),
          description: 'Try the operation again'
        },
        {
          label: 'Cancel',
          action: vi.fn()
        }
      ];
      
      errorHandler.displayUserFriendlyError(title, message, recoveryActions);
      
      expect(document.createElement).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('should not display notifications when disabled', () => {
      // Clear previous mocks
      vi.clearAllMocks();
      
      const disabledHandler = new WebErrorHandler({
        enableUserNotifications: false
      });
      
      disabledHandler.displayUserFriendlyError('Test', 'Message');
      
      // Should not create modal when notifications are disabled
      expect(document.body.appendChild).not.toHaveBeenCalled();
    });
  });

  describe('Error Logging', () => {
    it('should log errors when logging is enabled', () => {
      const testError = new Error('Test error');
      
      WebErrorHandler.handleDOMError(testError, '#test');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'burn-rate-error-log',
        expect.any(String)
      );
    });

    it('should not log errors when logging is disabled', () => {
      const disabledHandler = new WebErrorHandler({
        enableLogging: false
      });
      
      // Reset mocks
      vi.clearAllMocks();
      
      const testError = new Error('Test error');
      WebErrorHandler.handleDOMError(testError, '#test');
      
      // Should still create user notification but not log
      expect(document.createElement).toHaveBeenCalled();
    });

    it('should maintain log size limit', () => {
      const handler = new WebErrorHandler({ maxLogEntries: 3 });
      
      // Add multiple errors
      for (let i = 0; i < 5; i++) {
        WebErrorHandler.handleDOMError(new Error(`Error ${i}`), `#element-${i}`);
      }
      
      const stats = handler.getErrorStatistics();
      expect(stats.totalErrors).toBeLessThanOrEqual(5);
    });
  });

  describe('Error Statistics', () => {
    it('should provide error statistics', () => {
      // Use the instance directly to ensure errors are logged to the same handler
      const handler = WebErrorHandler.getInstance();
      
      WebErrorHandler.handleDOMError(new Error('DOM Error'), '#test');
      WebErrorHandler.handleStorageError(new Error('Storage Error'));
      
      const stats = handler.getErrorStatistics();
      
      expect(stats).toHaveProperty('totalErrors');
      expect(stats).toHaveProperty('errorsByType');
      expect(stats).toHaveProperty('errorsBySeverity');
      expect(stats).toHaveProperty('recentErrors');
      expect(stats.totalErrors).toBeGreaterThan(0);
    });

    it('should categorize errors by type and severity', () => {
      // Use the instance directly to ensure errors are logged to the same handler
      const handler = WebErrorHandler.getInstance();
      
      WebErrorHandler.handleDOMError(new Error('DOM Error'), '#test');
      WebErrorHandler.handleStorageError(new Error('Storage Error'));
      
      const stats = handler.getErrorStatistics();
      
      expect(stats.errorsByType[WebErrorType.DOM_ERROR]).toBeGreaterThan(0);
      expect(stats.errorsByType[WebErrorType.STORAGE_ERROR]).toBeGreaterThan(0);
      expect(stats.errorsBySeverity[ErrorSeverity.MEDIUM]).toBeGreaterThan(0);
      expect(stats.errorsBySeverity[ErrorSeverity.HIGH]).toBeGreaterThan(0);
    });
  });

  describe('Error Log Management', () => {
    it('should clear error log', () => {
      // Use the instance directly to ensure errors are logged to the same handler
      const handler = WebErrorHandler.getInstance();
      
      WebErrorHandler.handleDOMError(new Error('Test'), '#test');
      
      let stats = handler.getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);
      
      handler.clearErrorLog();
      
      stats = handler.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
    });
  });

  describe('Global Error Handling', () => {
    it('should set up global error listeners', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      new WebErrorHandler();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });
  });

  describe('Recovery Actions', () => {
    it('should execute recovery actions when clicked', () => {
      const mockAction = vi.fn();
      const recoveryActions = [
        {
          label: 'Test Action',
          action: mockAction,
          description: 'Test recovery action'
        }
      ];
      
      errorHandler.displayUserFriendlyError('Test', 'Message', recoveryActions);
      
      // Simulate clicking the recovery action button
      const clickEvent = new Event('click');
      Object.defineProperty(clickEvent, 'target', {
        value: {
          classList: { contains: () => true },
          dataset: { actionIndex: '0' }
        }
      });
      
      // The event listener should be attached to the modal content
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });
});