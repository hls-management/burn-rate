import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameStateManager } from '../GameStateManager.js';
import { GameState } from '../../models/GameState.js';
import { createInitialGameState } from '../../models/validation.js';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

// Mock global localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('GameStateManager', () => {
  let gameStateManager: GameStateManager;
  let mockGameState: GameState;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    
    // Restore all mocks
    vi.restoreAllMocks();
    
    gameStateManager = new GameStateManager();
    
    // Create a valid mock game state
    mockGameState = {
      turn: 5,
      player: {
        resources: { metal: 100, energy: 50, metalIncome: 10, energyIncome: 5 },
        fleet: {
          homeSystem: { frigates: 3, cruisers: 1, battleships: 0 },
          inTransit: { outbound: [] }
        },
        economy: {
          reactors: 2,
          mines: 3,
          constructionQueue: []
        },
        intelligence: {
          lastScanTurn: 3,
          scanAccuracy: 0.8,
          knownEnemyFleet: { frigates: 2, cruisers: 1, battleships: 0 }
        }
      },
      ai: {
        resources: { metal: 80, energy: 40, metalIncome: 8, energyIncome: 4 },
        fleet: {
          homeSystem: { frigates: 2, cruisers: 1, battleships: 0 },
          inTransit: { outbound: [] }
        },
        economy: {
          reactors: 1,
          mines: 2,
          constructionQueue: []
        },
        intelligence: {
          lastScanTurn: 2,
          scanAccuracy: 0.7,
          knownEnemyFleet: { frigates: 3, cruisers: 1, battleships: 0 }
        }
      },
      combatLog: [],
      gamePhase: 'early',
      isGameOver: false
    };
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('saveGameState', () => {
    it('should save valid game state successfully', () => {
      const result = gameStateManager.saveGameState(mockGameState);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      
      // Verify data was actually saved
      const savedData = localStorageMock.getItem('burn-rate-game-state');
      expect(savedData).toBeTruthy();
      
      const parsedData = JSON.parse(savedData!);
      expect(parsedData.gameState).toEqual(mockGameState);
      expect(parsedData.timestamp).toBeTypeOf('number');
      expect(parsedData.version).toBe('1.0.0');
      expect(parsedData.turn).toBe(5);
    });

    it('should reject invalid game state', () => {
      const invalidGameState = { ...mockGameState, turn: -1 };
      
      const result = gameStateManager.saveGameState(invalidGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid game state');
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = gameStateManager.saveGameState(mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to save game state');
    });
  });

  describe('loadGameState', () => {
    it('should load valid saved game state', () => {
      // First save a game state
      gameStateManager.saveGameState(mockGameState);
      
      // Then load it
      const result = gameStateManager.loadGameState();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGameState);
    });

    it('should return error when no saved state exists', () => {
      const result = gameStateManager.loadGameState();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No saved game state found');
    });

    it('should handle corrupted save data', () => {
      // Save invalid JSON
      localStorageMock.setItem('burn-rate-game-state', 'invalid-json');
      
      const result = gameStateManager.loadGameState();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load game state');
    });

    it('should validate loaded game state', () => {
      // Save data with invalid game state
      const invalidSaveData = {
        gameState: { ...mockGameState, turn: -1 },
        timestamp: Date.now(),
        version: '1.0.0'
      };
      
      localStorageMock.setItem('burn-rate-game-state', JSON.stringify(invalidSaveData));
      
      const result = gameStateManager.loadGameState();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Corrupted game state');
    });
  });

  describe('hasValidSavedState', () => {
    it('should return true when valid saved state exists', () => {
      gameStateManager.saveGameState(mockGameState);
      
      expect(gameStateManager.hasValidSavedState()).toBe(true);
    });

    it('should return false when no saved state exists', () => {
      expect(gameStateManager.hasValidSavedState()).toBe(false);
    });

    it('should return false when saved state is corrupted', () => {
      localStorageMock.setItem('burn-rate-game-state', 'corrupted-data');
      
      expect(gameStateManager.hasValidSavedState()).toBe(false);
    });
  });

  describe('clearSavedState', () => {
    it('should clear saved state successfully', () => {
      gameStateManager.saveGameState(mockGameState);
      expect(gameStateManager.hasValidSavedState()).toBe(true);
      
      const result = gameStateManager.clearSavedState();
      
      expect(result.success).toBe(true);
      expect(gameStateManager.hasValidSavedState()).toBe(false);
    });

    it('should handle localStorage errors during clear', () => {
      vi.spyOn(localStorageMock, 'removeItem').mockImplementation(() => {
        throw new Error('Cannot remove item');
      });

      const result = gameStateManager.clearSavedState();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to clear saved state');
    });
  });

  describe('getSavedStateInfo', () => {
    it('should return correct info for saved state', () => {
      const beforeSave = Date.now();
      gameStateManager.saveGameState(mockGameState);
      const afterSave = Date.now();
      
      const info = gameStateManager.getSavedStateInfo();
      
      expect(info.hasSavedState).toBe(true);
      expect(info.turn).toBe(5);
      expect(info.lastSaved).toBeInstanceOf(Date);
      expect(info.lastSaved!.getTime()).toBeGreaterThanOrEqual(beforeSave);
      expect(info.lastSaved!.getTime()).toBeLessThanOrEqual(afterSave);
    });

    it('should return no saved state info when none exists', () => {
      const info = gameStateManager.getSavedStateInfo();
      
      expect(info.hasSavedState).toBe(false);
      expect(info.lastSaved).toBeUndefined();
      expect(info.turn).toBeUndefined();
    });
  });

  describe('handlePageRefresh', () => {
    it('should recover saved state on page refresh', () => {
      gameStateManager.saveGameState(mockGameState);
      
      const result = gameStateManager.handlePageRefresh();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGameState);
    });

    it('should return error when no state to recover', () => {
      const result = gameStateManager.handlePageRefresh();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No valid saved state found for recovery');
    });
  });

  describe('createBackup', () => {
    it('should create backup successfully', () => {
      const result = gameStateManager.createBackup(mockGameState);
      
      expect(result.success).toBe(true);
      
      // Check that backup was created
      let backupFound = false;
      for (let i = 0; i < localStorageMock.length; i++) {
        const key = localStorageMock.key(i);
        if (key && key.startsWith('burn-rate-game-state-backup-')) {
          backupFound = true;
          const backupData = JSON.parse(localStorageMock.getItem(key)!);
          expect(backupData.gameState).toEqual(mockGameState);
          expect(backupData.isBackup).toBe(true);
          break;
        }
      }
      expect(backupFound).toBe(true);
    });
  });

  describe('validateStorageAvailability', () => {
    it('should validate localStorage availability', () => {
      const result = gameStateManager.validateStorageAvailability();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('configuration options', () => {
    it('should use custom storage key', () => {
      const customManager = new GameStateManager({ storageKey: 'custom-key' });
      
      customManager.saveGameState(mockGameState);
      
      expect(localStorageMock.getItem('custom-key')).toBeTruthy();
      expect(localStorageMock.getItem('burn-rate-game-state')).toBeNull();
    });

    it('should handle multiple stored states', () => {
      const multiStateManager = new GameStateManager({ maxStoredStates: 3 });
      
      // Save multiple states
      const state1 = { ...mockGameState, turn: 1 };
      const state2 = { ...mockGameState, turn: 2 };
      const state3 = { ...mockGameState, turn: 3 };
      
      multiStateManager.saveGameState(state1);
      multiStateManager.saveGameState(state2);
      multiStateManager.saveGameState(state3);
      
      // Check that multiple states exist
      expect(localStorageMock.getItem('burn-rate-game-state')).toBeTruthy();
      expect(localStorageMock.getItem('burn-rate-game-state-1')).toBeTruthy();
      expect(localStorageMock.getItem('burn-rate-game-state-2')).toBeTruthy();
    });
  });
});