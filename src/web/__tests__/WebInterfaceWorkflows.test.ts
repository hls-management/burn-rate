import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WebInterface, WebConfig, UserAction } from '../WebInterface.js';
import { WebDisplay } from '../WebDisplay.js';
import { WebInputHandler } from '../WebInputHandler.js';
import { GameStateManager } from '../GameStateManager.js';
import { GameEngine } from '../../engine/GameEngine.js';
import { GameController } from '../../ui/GameController.js';
import { InputHandler } from '../../ui/InputHandler.js';
import { GameState } from '../../models/GameState.js';
import { PlayerState } from '../../models/PlayerState.js';

// Mock DOM environment for integration tests
const createMockElement = (id?: string) => ({
  id: id || '',
  innerHTML: '',
  textContent: '',
  className: '',
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    toggle: vi.fn(),
    contains: vi.fn()
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  dispatchEvent: vi.fn(),
  scrollIntoView: vi.fn(),
  dataset: {},
  style: {},
  children: [],
  parentNode: null
});

const mockContainer = createMockElement('game-container');
const mockBuildPanel = createMockElement('build-panel');
const mockAttackPanel = createMockElement('attack-panel');
const mockScanPanel = createMockElement('scan-panel');
const mockResourcesDisplay = createMockElement('resources-display');
const mockFleetDisplay = createMockElement('fleet-display');
const mockCombatLog = createMockElement('combat-log');
const mockSystemLog = createMockElement('system-log');

// Set up DOM queries
mockContainer.querySelector.mockImplementation((selector: string) => {
  switch (selector) {
    case '#build-panel': return mockBuildPanel;
    case '#attack-panel': return mockAttackPanel;
    case '#scan-panel': return mockScanPanel;
    case '.resources-display': return mockResourcesDisplay;
    case '.fleet-display': return mockFleetDisplay;
    case '.combat-log': return mockCombatLog;
    case '.system-log': return mockSystemLog;
    default: return createMockElement();
  }
});

mockContainer.querySelectorAll.mockImplementation((selector: string) => {
  if (selector.includes('tab-button')) {
    return [
      { ...createMockElement(), dataset: { tab: 'build' } },
      { ...createMockElement(), dataset: { tab: 'attack' } },
      { ...createMockElement(), dataset: { tab: 'scan' } }
    ];
  }
  return [];
});

// Mock global objects
global.document = {
  getElementById: vi.fn(() => mockContainer),
  createElement: vi.fn(() => createMockElement()),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  hidden: false,
  body: createMockElement('body')
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

// Mock components
vi.mock('../WebErrorHandler.js', () => ({
  WebErrorHandler: {
    getInstance: vi.fn(() => ({})),
    handleDOMError: vi.fn(),
    handleGameStateError: vi.fn(),
    handleStorageError: vi.fn()
  }
}));

vi.mock('../HelpSystem.js', () => ({
  HelpSystem: vi.fn().mockImplementation(() => ({
    showHelpModal: vi.fn(),
    cleanup: vi.fn()
  }))
}));

describe('Web Interface Integration Tests', () => {
  let webInterface: WebInterface;
  let webDisplay: WebDisplay;
  let webInputHandler: WebInputHandler;
  let gameStateManager: GameStateManager;
  let mockGameEngine: any;
  let mockGameController: any;
  let mockInputHandler: any;
  let mockGameState: GameState;
  let config: WebConfig;

  beforeEach(() => {
    // Create mock game state
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

    // Create mocks
    mockGameEngine = {
      getGameState: vi.fn(() => mockGameState),
      isGameOver: vi.fn(() => false),
      getWinner: vi.fn(() => null),
      getVictoryType: vi.fn(() => null),
      processTurn: vi.fn(() => ({ success: true, events: [] }))
    };

    mockGameController = {
      executeCommand: vi.fn(() => ({
        success: true,
        message: 'Command executed successfully',
        gameStateChanged: true
      })),
      getPendingActions: vi.fn(() => [])
    };

    mockInputHandler = {
      processCommand: vi.fn(() => ({
        success: true,
        command: { type: 'build', buildType: 'frigate', quantity: 10 }
      }))
    };

    config = {
      containerId: 'game-container',
      showDebugInfo: false,
      autoSave: true,
      theme: 'dark'
    };

    // Reset all mocks
    vi.clearAllMocks();

    // Create instances
    webInterface = new WebInterface(mockGameEngine, config);
    webDisplay = new WebDisplay({ containerId: 'game-container' });
    webInputHandler = new WebInputHandler(mockInputHandler);
    gameStateManager = new GameStateManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Game Initialization Workflow', () => {
    it('should initialize game from start to first turn', async () => {
      // Start the interface
      await webInterface.start();

      // Verify interface is running
      expect(webInterface.isInterfaceRunning()).toBe(true);

      // Verify initial display update
      expect(mockContainer.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'gameStateUpdate'
        })
      );

      // Verify event listeners are set up
      expect(mockContainer.addEventListener).toHaveBeenCalledWith('submit', expect.any(Function));
      expect(mockContainer.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should handle game over scenario', async () => {
      await webInterface.start();

      // Mock game over state
      mockGameEngine.isGameOver.mockReturnValue(true);
      mockGameEngine.getWinner.mockReturnValue('player');
      mockGameEngine.getVictoryType.mockReturnValue('economic');

      // Trigger end turn that leads to game over
      const endTurnAction: UserAction = {
        type: 'endTurn',
        timestamp: Date.now()
      };

      await webInterface.handleUserAction(endTurnAction);

      // Verify game over event is dispatched
      expect(mockContainer.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'gameOver',
          detail: { winner: 'player', victoryType: 'economic' }
        })
      );
    });
  });

  describe('Build → Attack → Scan → End Turn Workflow', () => {
    beforeEach(async () => {
      await webInterface.start();
    });

    it('should execute complete turn workflow successfully', async () => {
      // Step 1: Build units
      const buildAction: UserAction = {
        type: 'build',
        data: { buildType: 'frigate', quantity: '10' },
        timestamp: Date.now()
      };

      const buildResult = await webInterface.handleUserAction(buildAction);
      expect(buildResult.success).toBe(true);
      expect(mockGameController.executeCommand).toHaveBeenCalledWith({
        type: 'build',
        buildType: 'frigate',
        quantity: 10
      });

      // Step 2: Perform scan
      const scanAction: UserAction = {
        type: 'scan',
        data: { scanType: 'basic' },
        timestamp: Date.now()
      };

      const scanResult = await webInterface.handleUserAction(scanAction);
      expect(scanResult.success).toBe(true);
      expect(mockGameController.executeCommand).toHaveBeenCalledWith({
        type: 'scan',
        scanType: 'basic'
      });

      // Step 3: Launch attack
      const attackAction: UserAction = {
        type: 'attack',
        data: { frigates: '50', cruisers: '25', battleships: '10', target: 'enemy' },
        timestamp: Date.now()
      };

      const attackResult = await webInterface.handleUserAction(attackAction);
      expect(attackResult.success).toBe(true);
      expect(mockGameController.executeCommand).toHaveBeenCalledWith({
        type: 'attack',
        attackFleet: { frigates: 50, cruisers: 25, battleships: 10 },
        target: 'enemy'
      });

      // Step 4: End turn
      const endTurnAction: UserAction = {
        type: 'endTurn',
        timestamp: Date.now()
      };

      const endTurnResult = await webInterface.handleUserAction(endTurnAction);
      expect(endTurnResult.success).toBe(true);
      expect(mockGameController.executeCommand).toHaveBeenCalledWith({
        type: 'end_turn'
      });

      // Verify all commands were executed in order
      expect(mockGameController.executeCommand).toHaveBeenCalledTimes(4);
    });

    it('should handle workflow with validation errors', async () => {
      // Mock validation failure
      mockGameController.executeCommand.mockReturnValueOnce({
        success: false,
        message: 'Insufficient resources',
        gameStateChanged: false
      });

      const buildAction: UserAction = {
        type: 'build',
        data: { buildType: 'battleship', quantity: '1000' }, // Too expensive
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(buildAction);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Insufficient resources');

      // Verify error event is dispatched
      expect(mockContainer.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'actionResult',
          detail: expect.objectContaining({
            success: false,
            message: 'Insufficient resources'
          })
        })
      );
    });
  });

  describe('Form Input Validation Workflow', () => {
    beforeEach(async () => {
      await webInterface.start();
    });

    it('should validate build form inputs', () => {
      const formData = new FormData();
      formData.append('buildType', 'frigate');
      formData.append('quantity', '10');

      const result = webInputHandler.handleBuildForm(formData, mockGameState);

      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('build');
      expect(result.command?.buildType).toBe('frigate');
      expect(result.command?.quantity).toBe(10);
    });

    it('should validate attack form inputs', () => {
      const formData = new FormData();
      formData.append('frigates', '50');
      formData.append('cruisers', '25');
      formData.append('battleships', '10');
      formData.append('target', 'enemy');

      const result = webInputHandler.handleAttackForm(formData, mockGameState);

      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('attack');
      expect(result.command?.attackFleet).toEqual({
        frigates: 50,
        cruisers: 25,
        battleships: 10
      });
    });

    it('should validate scan form inputs', () => {
      const formData = new FormData();
      formData.append('scanType', 'deep');

      const result = webInputHandler.handleScanForm(formData, mockGameState);

      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('scan');
      expect(result.command?.scanType).toBe('deep');
    });

    it('should reject invalid form inputs', () => {
      const formData = new FormData();
      formData.append('buildType', 'invalid');
      formData.append('quantity', 'not-a-number');

      const result = webInputHandler.handleBuildForm(formData, mockGameState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid build type');
    });
  });

  describe('Game State Management Workflow', () => {
    beforeEach(async () => {
      await webInterface.start();
    });

    it('should save and load game state', () => {
      // Save game state
      const saveResult = gameStateManager.saveGameState(mockGameState);
      expect(saveResult.success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();

      // Mock saved data
      const savedData = {
        gameState: mockGameState,
        metadata: {
          timestamp: Date.now(),
          turn: mockGameState.turn,
          version: '1.0.0'
        }
      };
      (localStorage.getItem as any).mockReturnValue(JSON.stringify(savedData));

      // Load game state
      const loadResult = gameStateManager.loadGameState();
      expect(loadResult.success).toBe(true);
      expect(loadResult.gameState).toEqual(mockGameState);
    });

    it('should handle auto-save on page visibility change', async () => {
      // Enable auto-save
      webInterface.updateConfig({ autoSave: true });

      // Simulate page becoming hidden
      (document as any).hidden = true;
      
      // Trigger visibility change event
      const visibilityHandler = (document.addEventListener as any).mock.calls
        .find(call => call[0] === 'visibilitychange')[1];
      
      visibilityHandler();

      // Verify auto-save was triggered
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'burnrate_gamestate',
        expect.any(String)
      );
    });
  });

  describe('Display Update Workflow', () => {
    beforeEach(async () => {
      await webInterface.start();
    });

    it('should update display after game state changes', () => {
      // Update game state
      const updatedState = {
        ...mockGameState,
        turn: 2,
        player: {
          ...mockGameState.player,
          resources: {
            ...mockGameState.player.resources,
            metal: 15000
          }
        }
      };

      mockGameEngine.getGameState.mockReturnValue(updatedState);

      // Trigger display update
      webInterface.updateDisplay();

      // Verify display update event
      expect(mockContainer.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'gameStateUpdate',
          detail: { gameState: updatedState }
        })
      );
    });

    it('should display combat results', () => {
      const combatEvents = [{
        turn: 2,
        attacker: 'player',
        attackerFleet: { frigates: 50, cruisers: 25, battleships: 10 },
        defenderFleet: { frigates: 30, cruisers: 15, battleships: 5 },
        outcome: 'decisive_attacker',
        casualties: {
          attacker: { frigates: 5, cruisers: 2, battleships: 0 },
          defender: { frigates: 25, cruisers: 10, battleships: 3 }
        },
        survivors: {
          attacker: { frigates: 45, cruisers: 23, battleships: 10 },
          defender: { frigates: 5, cruisers: 5, battleships: 2 }
        }
      }];

      expect(() => {
        webDisplay.displayCombatResults(combatEvents);
      }).not.toThrow();

      expect(mockCombatLog.appendChild).toHaveBeenCalled();
    });

    it('should display error and success messages', () => {
      expect(() => {
        webDisplay.displayError('Test error message');
      }).not.toThrow();

      expect(() => {
        webDisplay.displaySuccess('Test success message');
      }).not.toThrow();

      expect(mockSystemLog.appendChild).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling and Recovery Workflow', () => {
    beforeEach(async () => {
      await webInterface.start();
    });

    it('should handle DOM errors gracefully', async () => {
      // Mock DOM error
      mockContainer.dispatchEvent.mockImplementation(() => {
        throw new Error('DOM manipulation failed');
      });

      // This should not crash the interface
      expect(() => {
        webInterface.updateDisplay();
      }).not.toThrow();
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage error
      (localStorage.setItem as any).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = gameStateManager.saveGameState(mockGameState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage quota exceeded');
    });

    it('should handle game engine errors gracefully', async () => {
      // Mock game engine error
      mockGameController.executeCommand.mockImplementation(() => {
        throw new Error('Game engine error');
      });

      const action: UserAction = {
        type: 'build',
        data: { buildType: 'frigate', quantity: '10' },
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(action);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Action failed: Game engine error');
    });

    it('should recover from corrupted save data', () => {
      // Mock corrupted save data
      (localStorage.getItem as any).mockReturnValue('invalid json data');

      const result = gameStateManager.loadGameState();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse saved game state');
    });
  });

  describe('Keyboard Shortcuts Workflow', () => {
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

      // Test 'h' for help
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

      // Should not trigger help action when typing in input
      expect(mockGameController.executeCommand).not.toHaveBeenCalled();
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should handle missing localStorage gracefully', () => {
      // Mock localStorage not available
      delete (global as any).localStorage;

      const manager = new GameStateManager();
      const result = manager.saveGameState(mockGameState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('localStorage not available');

      // Restore localStorage
      global.localStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      } as any;
    });

    it('should handle missing CustomEvent constructor', async () => {
      // Mock missing CustomEvent
      const originalCustomEvent = global.CustomEvent;
      delete (global as any).CustomEvent;

      await webInterface.start();

      // Should not crash when CustomEvent is not available
      expect(() => {
        webInterface.updateDisplay();
      }).not.toThrow();

      // Restore CustomEvent
      global.CustomEvent = originalCustomEvent;
    });

    it('should handle missing container element', async () => {
      // Mock container not found
      (document.getElementById as any).mockReturnValue(null);

      await expect(webInterface.start()).rejects.toThrow(
        "Container element with id 'game-container' not found"
      );
    });
  });

  describe('Performance and Memory Management', () => {
    beforeEach(async () => {
      await webInterface.start();
    });

    it('should clean up resources on stop', () => {
      const helpSystem = webInterface.getHelpSystem();
      const cleanupSpy = vi.spyOn(helpSystem!, 'cleanup');

      webInterface.stop();

      expect(webInterface.isInterfaceRunning()).toBe(false);
      expect(mockContainer.removeEventListener).toHaveBeenCalled();
      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should throttle rapid display updates', () => {
      // Rapid display updates should not cause issues
      for (let i = 0; i < 100; i++) {
        webInterface.updateDisplay();
      }

      // Should handle rapid updates gracefully
      expect(mockGameEngine.getGameState).toHaveBeenCalled();
    });

    it('should handle large game states efficiently', () => {
      const largeGameState = {
        ...mockGameState,
        // Add large data structure
        combatHistory: new Array(1000).fill({
          turn: 1,
          events: new Array(100).fill({ type: 'attack', data: {} })
        })
      };

      mockGameEngine.getGameState.mockReturnValue(largeGameState);

      expect(() => {
        webInterface.updateDisplay();
      }).not.toThrow();
    });
  });
});