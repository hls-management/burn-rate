import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameStateManager } from '../GameStateManager.js';
import { GameConfigManager } from '../GameConfigManager.js';
import { GameState } from '../../models/GameState.js';

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
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Game State and Configuration Integration', () => {
  let gameStateManager: GameStateManager;
  let configManager: GameConfigManager;
  let mockGameState: GameState;

  beforeEach(() => {
    localStorageMock.clear();
    gameStateManager = new GameStateManager();
    configManager = new GameConfigManager();
    
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

  describe('Configuration-driven Game State Management', () => {
    it('should save and load game state with auto-save enabled', () => {
      // Enable auto-save in configuration
      configManager.updateSettings({ autoSave: true });
      
      // Create game state manager with auto-save config
      const config = configManager.getConfig();
      const autoSaveManager = new GameStateManager({
        autoSave: config.webConfig.autoSave
      });

      // Save game state
      const saveResult = autoSaveManager.saveGameState(mockGameState);
      expect(saveResult.success).toBe(true);

      // Load game state
      const loadResult = autoSaveManager.loadGameState();
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toEqual(mockGameState);
    });

    it('should handle debug mode configuration', () => {
      // Enable debug mode
      const debugConfig = configManager.createGameConfig({
        aiArchetype: 'hybrid',
        debugMode: true,
        startingResources: { metal: 50000, energy: 50000 }
      });

      expect(debugConfig.webConfig.showDebugInfo).toBe(true);
      expect(debugConfig.startingResources.metal).toBe(50000);
      expect(debugConfig.startingResources.energy).toBe(50000);
    });

    it('should persist settings and configuration separately', () => {
      // Update settings
      configManager.updateSettings({
        theme: 'light',
        autoSave: false,
        showDebugInfo: true
      });

      // Update configuration
      configManager.updateConfig({
        aiArchetype: 'aggressor',
        startingResources: { metal: 5000, energy: 5000 }
      });

      // Create new managers to test persistence
      const newConfigManager = new GameConfigManager();
      
      const settings = newConfigManager.getSettings();
      const config = newConfigManager.getConfig();

      expect(settings.theme).toBe('light');
      expect(settings.autoSave).toBe(false);
      expect(settings.showDebugInfo).toBe(true);
      expect(config.aiArchetype).toBe('aggressor');
      expect(config.startingResources).toEqual({ metal: 5000, energy: 5000 });
    });

    it('should handle game state backup with configuration', () => {
      // Configure for multiple backups
      const backupManager = new GameStateManager({
        maxStoredStates: 3,
        autoSave: true
      });

      // Create backup
      const backupResult = backupManager.createBackup(mockGameState);
      expect(backupResult.success).toBe(true);

      // The backup functionality is tested in the GameStateManager unit tests
      // Here we just verify the integration works without errors
    });

    it('should validate storage availability for both managers', () => {
      const stateValidation = gameStateManager.validateStorageAvailability();
      expect(stateValidation.isValid).toBe(true);

      // Configuration manager should also work with localStorage
      const settings = configManager.getSettings();
      configManager.updateSettings({ theme: 'light' });
      const newSettings = configManager.getSettings();
      
      expect(newSettings.theme).toBe('light');
    });

    it('should handle preset configurations with game state', () => {
      // Get a preset configuration
      const presets = configManager.getGamePresets();
      const debugPreset = presets.find(p => p.name === 'Debug Mode');
      
      expect(debugPreset).toBeTruthy();
      expect(debugPreset!.config.webConfig?.showDebugInfo).toBe(true);
      
      // Apply preset
      configManager.updateConfig(debugPreset!.config);
      
      // Verify configuration was applied
      const config = configManager.getConfig();
      expect(config.webConfig.showDebugInfo).toBe(true);
    });

    it('should export and import complete configuration', () => {
      // Set up configuration and save game state
      configManager.updateSettings({ theme: 'light', volume: 0.5 });
      configManager.updateConfig({ aiArchetype: 'economist' });
      gameStateManager.saveGameState(mockGameState);

      // Export configuration
      const exported = configManager.exportConfig();
      expect(exported).toBeTruthy();

      // Clear and import
      localStorageMock.clear();
      const newConfigManager = new GameConfigManager();
      const importResult = newConfigManager.importConfig(exported);
      
      expect(importResult.success).toBe(true);
      
      const settings = newConfigManager.getSettings();
      const config = newConfigManager.getConfig();
      
      expect(settings.theme).toBe('light');
      expect(settings.volume).toBe(0.5);
      expect(config.aiArchetype).toBe('economist');
    });

    it('should handle page refresh scenario with saved state and config', () => {
      // Save configuration and game state
      configManager.updateSettings({ autoSave: true });
      gameStateManager.saveGameState(mockGameState);

      // Simulate page refresh by creating new managers
      const newConfigManager = new GameConfigManager();
      const newStateManager = new GameStateManager();

      // Verify configuration persisted
      const settings = newConfigManager.getSettings();
      expect(settings.autoSave).toBe(true);

      // Verify game state can be recovered
      const refreshResult = newStateManager.handlePageRefresh();
      expect(refreshResult.success).toBe(true);
      expect(refreshResult.data).toEqual(mockGameState);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle localStorage failures gracefully in both managers', () => {
      // Mock localStorage to fail
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        throw new Error('Storage quota exceeded');
      };

      // Test game state manager error handling
      const saveResult = gameStateManager.saveGameState(mockGameState);
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain('Failed to save game state');

      // Test config manager error handling (should not throw)
      expect(() => {
        configManager.updateSettings({ theme: 'light' });
      }).not.toThrow();

      // Restore localStorage
      localStorageMock.setItem = originalSetItem;
    });

    it('should validate configuration before creating game state manager', () => {
      // Create invalid configuration
      const invalidConfig = {
        aiArchetype: 'invalid' as any,
        startingResources: { metal: -1000, energy: 5000 }
      };

      const validation = configManager.validateConfig(invalidConfig);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);

      // Should not create game with invalid config
      expect(validation.errors).toContain('Invalid AI archetype: invalid');
      expect(validation.errors).toContain('Starting resources cannot be negative');
    });
  });
});