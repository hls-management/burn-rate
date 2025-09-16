import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WebInterface, WebConfig, UserAction } from '../WebInterface.js';
import { GameEngine } from '../../engine/GameEngine.js';
import { GameController } from '../../ui/GameController.js';
import { GameState } from '../../models/GameState.js';
import { PlayerState } from '../../models/PlayerState.js';

// Mock DOM environment
const mockContainer = {
  id: 'test-container',
  classList: {
    remove: vi.fn(),
    add: vi.fn()
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn()
};

const mockElement = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dataset: {},
  innerHTML: '',
  textContent: ''
};

// Mock global objects
global.document = {
  getElementById: vi.fn(),
  createElement: vi.fn(() => mockElement),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  hidden: false
} as any;

global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
} as any;

global.CustomEvent = vi.fn().mockImplementation((type, options) => ({
  type,
  detail: options?.detail
}));

// Mock GameEngine
const mockGameEngine = {
  getGameState: vi.fn(),
  isGameOver: vi.fn(() => false),
  getWinner: vi.fn(() => null),
  getVictoryType: vi.fn(() => null)
} as any;

// Mock GameController
const mockGameController = {
  executeCommand: vi.fn(),
  getPendingActions: vi.fn(() => [])
} as any;

// Mock WebErrorHandler
vi.mock('../WebErrorHandler.js', () => ({
  WebErrorHandler: {
    getInstance: vi.fn(() => ({})),
    handleDOMError: vi.fn(),
    handleGameStateError: vi.fn(),
    handleStorageError: vi.fn()
  }
}));

// Mock HelpSystem
vi.mock('../HelpSystem.js', () => ({
  HelpSystem: vi.fn().mockImplementation(() => ({
    showHelpModal: vi.fn(),
    cleanup: vi.fn()
  }))
}));

describe('WebInterface', () => {
  let webInterface: WebInterface;
  let config: WebConfig;
  let mockGameState: GameState;

  beforeEach(() => {
    config = {
      containerId: 'test-container',
      showDebugInfo: true,
      autoSave: true,
      theme: 'dark'
    };

    mockGameState = {
      turn: 1,
      gamePhase: 'early',
      isGameOver: false,
      player: {
        resources: {
          metal: 10000,
          energy: 8000,
          metalIncome: 1000,
          energyIncome: 800
        },
        fleet: {
          homeSystem: {
            frigates: 100,
            cruisers: 50,
            battleships: 20
          },
          inTransit: {
            outbound: []
          }
        },
        economy: {
          constructionQueue: [],
          reactors: 2,
          mines: 3
        },
        intelligence: {
          lastScanTurn: 0,
          knownEnemyFleet: {
            frigates: 0,
            cruisers: 0,
            battleships: 0
          }
        }
      } as PlayerState,
      ai: {
        resources: {
          metal: 5000,
          energy: 4000,
          metalIncome: 500,
          energyIncome: 400
        },
        fleet: {
          homeSystem: {
            frigates: 50,
            cruisers: 25,
            battleships: 10
          }
        },
        economy: {
          reactors: 1,
          mines: 1
        }
      }
    } as GameState;

    // Reset all mocks
    vi.clearAllMocks();
    
    // Set up DOM mock to return container by default
    (document.getElementById as any).mockReturnValue(mockContainer);
    
    mockGameEngine.getGameState.mockReturnValue(mockGameState);
    mockGameController.executeCommand.mockReturnValue({
      success: true,
      message: 'Command executed',
      gameStateChanged: true
    });

    webInterface = new WebInterface(mockGameEngine, config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create WebInterface instance with valid configuration', () => {
      expect(webInterface).toBeInstanceOf(WebInterface);
      expect(webInterface.getConfig()).toEqual(config);
    });

    it('should initialize with GameEngine and GameController', () => {
      expect(webInterface.getGameEngine()).toBe(mockGameEngine);
      expect(webInterface.getGameController()).toBeDefined();
    });
  });

  describe('start()', () => {
    it('should start interface successfully with valid container', async () => {
      await webInterface.start();

      expect(webInterface.isInterfaceRunning()).toBe(true);
      expect(document.getElementById).toHaveBeenCalledWith('test-container');
      expect(mockContainer.addEventListener).toHaveBeenCalled();
    });

    it('should throw error if container not found', async () => {
      (document.getElementById as any).mockReturnValue(null);

      await expect(webInterface.start()).rejects.toThrow(
        "Container element with id 'test-container' not found"
      );
    });

    it('should set up event listeners on start', async () => {
      await webInterface.start();

      expect(mockContainer.addEventListener).toHaveBeenCalledWith('submit', expect.any(Function));
      expect(mockContainer.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(document.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });
  });

  describe('stop()', () => {
    it('should stop interface and clean up resources', async () => {
      await webInterface.start();
      webInterface.stop();

      expect(webInterface.isInterfaceRunning()).toBe(false);
      expect(mockContainer.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('handleUserAction()', () => {
    beforeEach(async () => {
      await webInterface.start();
    });

    it('should handle build action successfully', async () => {
      const action: UserAction = {
        type: 'build',
        data: { buildType: 'frigate', quantity: '10' },
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(action);

      expect(result.success).toBe(true);
      expect(mockGameController.executeCommand).toHaveBeenCalledWith({
        type: 'build',
        buildType: 'frigate',
        quantity: 10
      });
    });

    it('should handle attack action successfully', async () => {
      const action: UserAction = {
        type: 'attack',
        data: { frigates: '50', cruisers: '25', battleships: '10', target: 'enemy' },
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(action);

      expect(result.success).toBe(true);
      expect(mockGameController.executeCommand).toHaveBeenCalledWith({
        type: 'attack',
        attackFleet: { frigates: 50, cruisers: 25, battleships: 10 },
        target: 'enemy'
      });
    });

    it('should handle scan action successfully', async () => {
      const action: UserAction = {
        type: 'scan',
        data: { scanType: 'basic' },
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(action);

      expect(result.success).toBe(true);
      expect(mockGameController.executeCommand).toHaveBeenCalledWith({
        type: 'scan',
        scanType: 'basic'
      });
    });

    it('should handle end turn action and process turn', async () => {
      const action: UserAction = {
        type: 'endTurn',
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(action);

      expect(result.success).toBe(true);
      expect(mockGameController.executeCommand).toHaveBeenCalledWith({
        type: 'end_turn'
      });
    });

    it('should handle help action through help system', async () => {
      const action: UserAction = {
        type: 'help',
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(action);

      expect(result.success).toBe(false); // Help doesn't return a command
      expect(result.message).toBe('Invalid action type');
    });

    it('should reject invalid action type', async () => {
      const action: UserAction = {
        type: 'invalid' as any,
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(action);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid action type');
    });

    it('should return error when interface not running', async () => {
      webInterface.stop();

      const action: UserAction = {
        type: 'build',
        data: { buildType: 'frigate', quantity: '10' },
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(action);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Interface is not running');
    });
  });

  describe('updateDisplay()', () => {
    beforeEach(async () => {
      await webInterface.start();
    });

    it('should update display and dispatch events', () => {
      webInterface.updateDisplay();

      expect(mockGameEngine.getGameState).toHaveBeenCalled();
      expect(mockContainer.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'gameStateUpdate',
          detail: { gameState: mockGameState }
        })
      );
    });

    it('should update debug info when enabled', () => {
      webInterface.updateDisplay();

      expect(mockContainer.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'debugUpdate'
        })
      );
    });

    it('should not update when interface not running', () => {
      webInterface.stop();
      webInterface.updateDisplay();

      expect(mockGameEngine.getGameState).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = { theme: 'light' as const };
      webInterface.updateConfig(newConfig);

      const updatedConfig = webInterface.getConfig();
      expect(updatedConfig.theme).toBe('light');
    });

    it('should apply theme changes', async () => {
      await webInterface.start();
      webInterface.updateConfig({ theme: 'light' });

      expect(mockContainer.classList.remove).toHaveBeenCalledWith('theme-dark', 'theme-light');
      expect(mockContainer.classList.add).toHaveBeenCalledWith('theme-light');
    });
  });

  describe('Game State Persistence', () => {
    beforeEach(async () => {
      await webInterface.start();
    });

    it('should save game state when auto-save enabled', () => {
      const saveStateSpy = vi.spyOn(webInterface as any, 'saveGameState');
      
      // Trigger auto-save through visibility change
      const visibilityHandler = (document.addEventListener as any).mock.calls
        .find(call => call[0] === 'visibilitychange')[1];
      
      (document as any).hidden = true;
      visibilityHandler();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'burnrate_gamestate',
        expect.any(String)
      );
    });

    it('should load saved game state', () => {
      const savedState = JSON.stringify(mockGameState);
      (localStorage.getItem as any).mockReturnValue(savedState);

      const result = webInterface.loadGameState();

      expect(result).toBe(true);
      expect(localStorage.getItem).toHaveBeenCalledWith('burnrate_gamestate');
    });

    it('should clear saved state', () => {
      webInterface.clearSavedState();

      expect(localStorage.removeItem).toHaveBeenCalledWith('burnrate_gamestate');
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await webInterface.start();
    });

    it('should handle keyboard shortcuts', async () => {
      const keydownHandler = (document.addEventListener as any).mock.calls
        .find(call => call[0] === 'keydown')[1];

      // Test Ctrl+Enter for end turn
      const ctrlEnterEvent = {
        key: 'Enter',
        ctrlKey: true,
        preventDefault: vi.fn(),
        target: document.body
      };

      await keydownHandler(ctrlEnterEvent);

      expect(ctrlEnterEvent.preventDefault).toHaveBeenCalled();
      expect(mockGameController.executeCommand).toHaveBeenCalledWith({
        type: 'end_turn'
      });
    });

    it('should handle help shortcut', async () => {
      const keydownHandler = (document.addEventListener as any).mock.calls
        .find(call => call[0] === 'keydown')[1];

      const helpEvent = {
        key: 'h',
        ctrlKey: false,
        preventDefault: vi.fn(),
        target: document.body
      };

      await keydownHandler(helpEvent);

      expect(helpEvent.preventDefault).toHaveBeenCalled();
    });

    it('should ignore shortcuts when typing in input fields', async () => {
      const keydownHandler = (document.addEventListener as any).mock.calls
        .find(call => call[0] === 'keydown')[1];

      const inputEvent = {
        key: 'h',
        target: { tagName: 'INPUT' }
      };

      await keydownHandler(inputEvent);

      // Should not trigger help action
      expect(mockGameController.executeCommand).not.toHaveBeenCalled();
    });
  });

  describe('Game Over Handling', () => {
    beforeEach(async () => {
      await webInterface.start();
    });

    it('should handle game over state', async () => {
      mockGameEngine.isGameOver.mockReturnValue(true);
      mockGameEngine.getWinner.mockReturnValue('player');
      mockGameEngine.getVictoryType.mockReturnValue('economic');

      const action: UserAction = {
        type: 'endTurn',
        timestamp: Date.now()
      };

      await webInterface.handleUserAction(action);

      expect(mockContainer.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'gameOver',
          detail: { winner: 'player', victoryType: 'economic' }
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in user actions gracefully', async () => {
      await webInterface.start();
      
      mockGameController.executeCommand.mockImplementation(() => {
        throw new Error('Test error');
      });

      const action: UserAction = {
        type: 'build',
        data: { buildType: 'frigate', quantity: '10' },
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(action);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Action failed: Test error');
    });

    it('should handle display update errors gracefully', async () => {
      await webInterface.start();
      
      mockGameEngine.getGameState.mockImplementation(() => {
        throw new Error('Game state error');
      });

      expect(() => {
        webInterface.updateDisplay();
      }).not.toThrow();
    });
  });

  describe('Help System Integration', () => {
    beforeEach(async () => {
      await webInterface.start();
    });

    it('should initialize help system', () => {
      const helpSystem = webInterface.getHelpSystem();
      expect(helpSystem).toBeDefined();
    });

    it('should clean up help system on stop', () => {
      const helpSystem = webInterface.getHelpSystem();
      const cleanupSpy = vi.spyOn(helpSystem!, 'cleanup');

      webInterface.stop();

      expect(cleanupSpy).toHaveBeenCalled();
    });
  });
});