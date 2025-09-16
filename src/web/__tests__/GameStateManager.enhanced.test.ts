import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameStateManager, GameStateManagerConfig } from '../GameStateManager.js';
import { GameState } from '../../models/GameState.js';
import { PlayerState } from '../../models/PlayerState.js';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

global.localStorage = mockLocalStorage as any;

// Mock console methods
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
};

describe('GameStateManager', () => {
  let gameStateManager: GameStateManager;
  let config: GameStateManagerConfig;
  let mockGameState: GameState;

  beforeEach(() => {
    config = {
      storageKey: 'test_gamestate',
      enableCompression: true,
      maxSavedStates: 5,
      autoSaveInterval: 30000
    };

    mockGameState = {
      turn: 10,
      gamePhase: 'mid',
      isGameOver: false,
      player: {
        resources: {
          metal: 15000,
          energy: 12000,
          metalIncome: 1500,
          energyIncome: 1200
        },
        fleet: {
          homeSystem: {
            frigates: 150,
            cruisers: 75,
            battleships: 30
          },
          inTransit: {
            outbound: []
          }
        },
        economy: {
          constructionQueue: [],
          reactors: 3,
          mines: 4
        },
        intelligence: {
          lastScanTurn: 8,
          knownEnemyFleet: {
            frigates: 100,
            cruisers: 50,
            battleships: 20
          }
        }
      } as PlayerState,
      ai: {
        resources: {
          metal: 8000,
          energy: 6000,
          metalIncome: 800,
          energyIncome: 600
        },
        fleet: {
          homeSystem: {
            frigates: 80,
            cruisers: 40,
            battleships: 15
          }
        },
        economy: {
          reactors: 2,
          mines: 2
        }
      }
    } as GameState;

    // Reset all mocks
    vi.clearAllMocks();
    gameStateManager = new GameStateManager(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create GameStateManager with default config', () => {
      const manager = new GameStateManager();
      expect(manager).toBeInstanceOf(GameStateManager);
    });

    it('should create GameStateManager with custom config', () => {
      expect(gameStateManager).toBeInstanceOf(GameStateManager);
      expect(gameStateManager.getConfig()).toEqual(config);
    });
  });

  describe('saveGameState()', () => {
    it('should save game state successfully', () => {
      const result = gameStateManager.saveGameState(mockGameState);

      expect(result.success).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'test_gamestate',
        expect.any(String)
      );
    });

    it('should save game state with metadata', () => {
      gameStateManager.saveGameState(mockGameState);

      const savedData = JSON.parse((mockLocalStorage.setItem as any).mock.calls[0][1]);
      expect(savedData).toHaveProperty('gameState');
      expect(savedData).toHaveProperty('metadata');
      expect(savedData.metadata).toHaveProperty('timestamp');
      expect(savedData.metadata).toHaveProperty('turn');
      expect(savedData.metadata).toHaveProperty('version');
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = gameStateManager.saveGameState(mockGameState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage quota exceeded');
    });

    it('should compress data when enabled', () => {
      const compressedManager = new GameStateManager({
        ...config,
        enableCompression: true
      });

      compressedManager.saveGameState(mockGameState);

      const savedData = JSON.parse((mockLocalStorage.setItem as any).mock.calls[0][1]);
      expect(savedData.metadata.compressed).toBe(true);
    });
  });

  describe('loadGameState()', () => {
    it('should load valid game state', () => {
      const savedData = {
        gameState: mockGameState,
        metadata: {
          timestamp: Date.now(),
          turn: mockGameState.turn,
          version: '1.0.0',
          compressed: false
        }
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      const result = gameStateManager.loadGameState();

      expect(result.success).toBe(true);
      expect(result.gameState).toEqual(mockGameState);
    });

    it('should return null when no saved state exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = gameStateManager.loadGameState();

      expect(result.success).toBe(false);
      expect(result.gameState).toBeNull();
      expect(result.error).toBe('No saved game state found');
    });

    it('should handle corrupted save data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const result = gameStateManager.loadGameState();

      expect(result.success).toBe(false);
      expect(result.gameState).toBeNull();
      expect(result.error).toContain('Failed to parse saved game state');
    });

    it('should validate loaded game state structure', () => {
      const invalidData = {
        gameState: { invalid: 'structure' },
        metadata: {
          timestamp: Date.now(),
          version: '1.0.0'
        }
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(invalidData));

      const result = gameStateManager.loadGameState();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid game state structure');
    });

    it('should handle version compatibility', () => {
      const oldVersionData = {
        gameState: mockGameState,
        metadata: {
          timestamp: Date.now(),
          turn: mockGameState.turn,
          version: '0.5.0',
          compressed: false
        }
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldVersionData));

      const result = gameStateManager.loadGameState();

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Loading game state from older version');
    });
  });

  describe('hasValidSavedState()', () => {
    it('should return true for valid saved state', () => {
      const savedData = {
        gameState: mockGameState,
        metadata: {
          timestamp: Date.now(),
          turn: mockGameState.turn,
          version: '1.0.0'
        }
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      expect(gameStateManager.hasValidSavedState()).toBe(true);
    });

    it('should return false for no saved state', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      expect(gameStateManager.hasValidSavedState()).toBe(false);
    });

    it('should return false for corrupted saved state', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      expect(gameStateManager.hasValidSavedState()).toBe(false);
    });
  });

  describe('clearSavedState()', () => {
    it('should clear saved state successfully', () => {
      const result = gameStateManager.clearSavedState();

      expect(result.success).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_gamestate');
    });

    it('should handle storage errors when clearing', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = gameStateManager.clearSavedState();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage error');
    });
  });

  describe('Multiple Save Slots', () => {
    it('should save to specific slot', () => {
      const result = gameStateManager.saveGameState(mockGameState, 'slot1');

      expect(result.success).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'test_gamestate_slot1',
        expect.any(String)
      );
    });

    it('should load from specific slot', () => {
      const savedData = {
        gameState: mockGameState,
        metadata: {
          timestamp: Date.now(),
          turn: mockGameState.turn,
          version: '1.0.0'
        }
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      const result = gameStateManager.loadGameState('slot1');

      expect(result.success).toBe(true);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test_gamestate_slot1');
    });

    it('should list available save slots', () => {
      // Mock multiple saved states
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify({ metadata: { timestamp: Date.now() - 1000 } }))
        .mockReturnValueOnce(JSON.stringify({ metadata: { timestamp: Date.now() - 2000 } }))
        .mockReturnValueOnce(null);

      const slots = gameStateManager.listSaveSlots();

      expect(slots).toHaveLength(2);
      expect(slots[0].slotId).toBe('slot1');
      expect(slots[1].slotId).toBe('slot2');
    });
  });

  describe('Auto-save Functionality', () => {
    it('should start auto-save when enabled', () => {
      const autoSaveManager = new GameStateManager({
        ...config,
        enableAutoSave: true,
        autoSaveInterval: 1000
      });

      const startSpy = vi.spyOn(autoSaveManager, 'startAutoSave');
      autoSaveManager.startAutoSave(mockGameState);

      expect(startSpy).toHaveBeenCalled();
    });

    it('should stop auto-save', () => {
      const autoSaveManager = new GameStateManager({
        ...config,
        enableAutoSave: true
      });

      autoSaveManager.startAutoSave(mockGameState);
      autoSaveManager.stopAutoSave();

      expect(autoSaveManager.isAutoSaveActive()).toBe(false);
    });

    it('should perform auto-save at intervals', async () => {
      vi.useFakeTimers();

      const autoSaveManager = new GameStateManager({
        ...config,
        enableAutoSave: true,
        autoSaveInterval: 1000
      });

      const saveSpy = vi.spyOn(autoSaveManager, 'saveGameState');
      autoSaveManager.startAutoSave(mockGameState);

      // Fast-forward time
      vi.advanceTimersByTime(1000);

      expect(saveSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('State Validation', () => {
    it('should validate complete game state', () => {
      const isValid = gameStateManager.validateGameState(mockGameState);
      expect(isValid).toBe(true);
    });

    it('should reject incomplete game state', () => {
      const incompleteState = {
        turn: 1,
        // Missing required fields
      } as any;

      const isValid = gameStateManager.validateGameState(incompleteState);
      expect(isValid).toBe(false);
    });

    it('should validate player state structure', () => {
      const invalidPlayerState = {
        ...mockGameState,
        player: {
          resources: {
            // Missing energy field
            metal: 1000
          }
        }
      } as any;

      const isValid = gameStateManager.validateGameState(invalidPlayerState);
      expect(isValid).toBe(false);
    });
  });

  describe('Export/Import Functionality', () => {
    it('should export game state as JSON', () => {
      const exported = gameStateManager.exportGameState(mockGameState);

      expect(exported.success).toBe(true);
      expect(exported.data).toBeDefined();
      expect(typeof exported.data).toBe('string');

      const parsed = JSON.parse(exported.data!);
      expect(parsed.gameState).toEqual(mockGameState);
    });

    it('should import game state from JSON', () => {
      const exportResult = gameStateManager.exportGameState(mockGameState);
      const importResult = gameStateManager.importGameState(exportResult.data!);

      expect(importResult.success).toBe(true);
      expect(importResult.gameState).toEqual(mockGameState);
    });

    it('should handle invalid import data', () => {
      const result = gameStateManager.importGameState('invalid json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid import data');
    });
  });

  describe('Storage Quota Management', () => {
    it('should check available storage space', () => {
      const quota = gameStateManager.getStorageQuota();

      expect(quota).toHaveProperty('used');
      expect(quota).toHaveProperty('available');
      expect(quota).toHaveProperty('total');
    });

    it('should clean up old saves when quota exceeded', () => {
      // Mock storage quota exceeded
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const cleanupSpy = vi.spyOn(gameStateManager as any, 'cleanupOldSaves');
      gameStateManager.saveGameState(mockGameState);

      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should maintain maximum number of saved states', () => {
      const manager = new GameStateManager({
        ...config,
        maxSavedStates: 2
      });

      // Save multiple states
      for (let i = 0; i < 5; i++) {
        const state = { ...mockGameState, turn: i + 1 };
        manager.saveGameState(state, `slot${i}`);
      }

      const slots = manager.listSaveSlots();
      expect(slots.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from corrupted auto-save', () => {
      mockLocalStorage.getItem.mockReturnValue('corrupted data');

      const result = gameStateManager.loadGameState();

      expect(result.success).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('should provide fallback when localStorage unavailable', () => {
      // Mock localStorage being unavailable
      delete (global as any).localStorage;

      const manager = new GameStateManager(config);
      const result = manager.saveGameState(mockGameState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('localStorage not available');

      // Restore localStorage
      global.localStorage = mockLocalStorage as any;
    });
  });

  describe('Performance Optimization', () => {
    it('should compress large game states', () => {
      const largeState = {
        ...mockGameState,
        // Add large data structure
        combatHistory: new Array(1000).fill({
          turn: 1,
          events: new Array(100).fill({ type: 'attack', data: {} })
        })
      };

      const manager = new GameStateManager({
        ...config,
        enableCompression: true
      });

      const result = manager.saveGameState(largeState);

      expect(result.success).toBe(true);
      expect(result.compressed).toBe(true);
    });

    it('should throttle rapid save operations', async () => {
      vi.useFakeTimers();

      const manager = new GameStateManager({
        ...config,
        saveThrottleMs: 1000
      });

      // Rapid saves
      manager.saveGameState(mockGameState);
      manager.saveGameState(mockGameState);
      manager.saveGameState(mockGameState);

      // Only first save should execute immediately
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);

      // Fast-forward past throttle period
      vi.advanceTimersByTime(1000);

      // Last save should now execute
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        maxSavedStates: 10,
        enableCompression: false
      };

      gameStateManager.updateConfig(newConfig);

      const updatedConfig = gameStateManager.getConfig();
      expect(updatedConfig.maxSavedStates).toBe(10);
      expect(updatedConfig.enableCompression).toBe(false);
    });

    it('should validate configuration changes', () => {
      const invalidConfig = {
        maxSavedStates: -1, // Invalid
        autoSaveInterval: 0 // Invalid
      };

      expect(() => {
        gameStateManager.updateConfig(invalidConfig);
      }).toThrow('Invalid configuration');
    });
  });
});