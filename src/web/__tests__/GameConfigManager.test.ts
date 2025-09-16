import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameConfigManager, GameSettings, WebGameConfig } from '../GameConfigManager.js';

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

describe('GameConfigManager', () => {
  let configManager: GameConfigManager;

  beforeEach(() => {
    localStorageMock.clear();
    configManager = new GameConfigManager();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Settings Management', () => {
    it('should return default settings initially', () => {
      const settings = configManager.getSettings();
      
      expect(settings.theme).toBe('dark');
      expect(settings.showAnimations).toBe(true);
      expect(settings.autoSave).toBe(true);
      expect(settings.showDebugInfo).toBe(false);
      expect(settings.soundEnabled).toBe(true);
      expect(settings.volume).toBe(0.7);
    });

    it('should update settings correctly', () => {
      const newSettings: Partial<GameSettings> = {
        theme: 'light',
        showAnimations: false,
        volume: 0.5
      };

      configManager.updateSettings(newSettings);
      const settings = configManager.getSettings();

      expect(settings.theme).toBe('light');
      expect(settings.showAnimations).toBe(false);
      expect(settings.volume).toBe(0.5);
      // Other settings should remain unchanged
      expect(settings.autoSave).toBe(true);
      expect(settings.soundEnabled).toBe(true);
    });

    it('should persist settings to localStorage', () => {
      const newSettings: Partial<GameSettings> = {
        theme: 'light',
        volume: 0.3
      };

      configManager.updateSettings(newSettings);

      // Create new instance to test persistence
      const newConfigManager = new GameConfigManager();
      const settings = newConfigManager.getSettings();

      expect(settings.theme).toBe('light');
      expect(settings.volume).toBe(0.3);
    });
  });

  describe('Configuration Management', () => {
    it('should return default config initially', () => {
      const config = configManager.getConfig();
      
      expect(config.aiArchetype).toBe('hybrid');
      expect(config.startingResources).toEqual({ metal: 10000, energy: 10000 });
      expect(config.webConfig.theme).toBe('dark');
      expect(config.webConfig.containerId).toBe('burn-rate-game');
    });

    it('should update configuration correctly', () => {
      const newConfig: Partial<WebGameConfig> = {
        aiArchetype: 'aggressor',
        startingResources: { metal: 5000, energy: 5000 },
        webConfig: {
          containerId: 'custom-container',
          theme: 'light',
          showAnimations: false,
          autoSave: false,
          showDebugInfo: true
        }
      };

      configManager.updateConfig(newConfig);
      const config = configManager.getConfig();

      expect(config.aiArchetype).toBe('aggressor');
      expect(config.startingResources).toEqual({ metal: 5000, energy: 5000 });
      expect(config.webConfig.containerId).toBe('custom-container');
      expect(config.webConfig.theme).toBe('light');
    });

    it('should create game config with specified options', () => {
      const options = {
        aiArchetype: 'economist' as const,
        startingResources: { metal: 15000, energy: 12000 },
        debugMode: true,
        seed: 12345
      };

      const config = configManager.createGameConfig(options);

      expect(config.aiArchetype).toBe('economist');
      expect(config.startingResources).toEqual({ metal: 15000, energy: 12000 });
      expect(config.seed).toBe(12345);
      expect(config.webConfig.showDebugInfo).toBe(true);
    });
  });

  describe('AI Archetypes', () => {
    it('should return all available AI archetypes', () => {
      const archetypes = configManager.getAIArchetypes();
      
      expect(archetypes).toHaveLength(4);
      expect(archetypes.map(a => a.value)).toEqual(['aggressor', 'economist', 'trickster', 'hybrid']);
      
      archetypes.forEach(archetype => {
        expect(archetype.name).toBeTruthy();
        expect(archetype.description).toBeTruthy();
      });
    });

    it('should have descriptive names and descriptions', () => {
      const archetypes = configManager.getAIArchetypes();
      const aggressor = archetypes.find(a => a.value === 'aggressor');
      
      expect(aggressor?.name).toBe('Aggressor');
      expect(aggressor?.description).toContain('military');
    });
  });

  describe('Game Presets', () => {
    it('should return predefined game presets', () => {
      const presets = configManager.getGamePresets();
      
      expect(presets.length).toBeGreaterThan(0);
      
      presets.forEach(preset => {
        expect(preset.name).toBeTruthy();
        expect(preset.description).toBeTruthy();
        expect(preset.config).toBeTruthy();
      });
    });

    it('should include Quick Start preset', () => {
      const presets = configManager.getGamePresets();
      const quickStart = presets.find(p => p.name === 'Quick Start');
      
      expect(quickStart).toBeTruthy();
      expect(quickStart?.config.aiArchetype).toBe('hybrid');
      expect(quickStart?.config.startingResources).toEqual({ metal: 10000, energy: 10000 });
    });

    it('should include Debug Mode preset', () => {
      const presets = configManager.getGamePresets();
      const debugMode = presets.find(p => p.name === 'Debug Mode');
      
      expect(debugMode).toBeTruthy();
      expect(debugMode?.config.startingResources?.metal).toBeGreaterThan(10000);
      expect(debugMode?.config.webConfig?.showDebugInfo).toBe(true);
    });
  });

  describe('Resource Presets', () => {
    it('should return resource preset options', () => {
      const presets = configManager.getResourcePresets();
      
      expect(presets.length).toBeGreaterThan(0);
      
      presets.forEach(preset => {
        expect(preset.name).toBeTruthy();
        expect(preset.description).toBeTruthy();
        expect(preset.resources.metal).toBeGreaterThanOrEqual(0);
        expect(preset.resources.energy).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have Standard preset with default resources', () => {
      const presets = configManager.getResourcePresets();
      const standard = presets.find(p => p.name === 'Standard');
      
      expect(standard).toBeTruthy();
      expect(standard?.resources).toEqual({ metal: 10000, energy: 10000 });
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const validConfig: Partial<WebGameConfig> = {
        aiArchetype: 'hybrid',
        startingResources: { metal: 10000, energy: 10000 },
        seed: 12345,
        webConfig: {
          containerId: 'test-container',
          theme: 'dark',
          showAnimations: true,
          autoSave: true,
          showDebugInfo: false
        }
      };

      const result = configManager.validateConfig(validConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid AI archetype', () => {
      const invalidConfig: Partial<WebGameConfig> = {
        aiArchetype: 'invalid' as any
      };

      const result = configManager.validateConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid AI archetype: invalid');
    });

    it('should reject negative starting resources', () => {
      const invalidConfig: Partial<WebGameConfig> = {
        startingResources: { metal: -1000, energy: 5000 }
      };

      const result = configManager.validateConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Starting resources cannot be negative');
    });

    it('should reject excessive starting resources', () => {
      const invalidConfig: Partial<WebGameConfig> = {
        startingResources: { metal: 2000000, energy: 5000 }
      };

      const result = configManager.validateConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Starting resources cannot exceed 1,000,000');
    });

    it('should reject invalid seed', () => {
      const invalidConfig: Partial<WebGameConfig> = {
        seed: -5
      };

      const result = configManager.validateConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Seed must be a non-negative integer');
    });

    it('should reject invalid theme', () => {
      const invalidConfig: Partial<WebGameConfig> = {
        webConfig: {
          containerId: 'test',
          theme: 'invalid' as any,
          showAnimations: true,
          autoSave: true,
          showDebugInfo: false
        }
      };

      const result = configManager.validateConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Theme must be either "dark" or "light"');
    });
  });

  describe('Import/Export', () => {
    it('should export configuration as JSON', () => {
      configManager.updateSettings({ theme: 'light', volume: 0.5 });
      configManager.updateConfig({ aiArchetype: 'aggressor' });

      const exported = configManager.exportConfig();
      const parsed = JSON.parse(exported);

      expect(parsed.settings.theme).toBe('light');
      expect(parsed.settings.volume).toBe(0.5);
      expect(parsed.config.aiArchetype).toBe('aggressor');
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.exportDate).toBeTruthy();
    });

    it('should import valid configuration', () => {
      const configData = {
        settings: { theme: 'light', volume: 0.3 },
        config: { aiArchetype: 'economist', startingResources: { metal: 5000, energy: 5000 } },
        version: '1.0.0'
      };

      const result = configManager.importConfig(JSON.stringify(configData));
      
      expect(result.success).toBe(true);
      
      const settings = configManager.getSettings();
      const config = configManager.getConfig();
      
      expect(settings.theme).toBe('light');
      expect(settings.volume).toBe(0.3);
      expect(config.aiArchetype).toBe('economist');
    });

    it('should reject invalid JSON', () => {
      const result = configManager.importConfig('invalid json');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to import configuration');
    });

    it('should reject invalid configuration data', () => {
      const invalidData = {
        config: { aiArchetype: 'invalid', startingResources: { metal: -1000, energy: 5000 } }
      };

      const result = configManager.importConfig(JSON.stringify(invalidData));
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid configuration');
    });
  });

  describe('Utility Functions', () => {
    it('should generate random seed', () => {
      const seed1 = configManager.generateRandomSeed();
      const seed2 = configManager.generateRandomSeed();
      
      expect(typeof seed1).toBe('number');
      expect(typeof seed2).toBe('number');
      expect(seed1).toBeGreaterThanOrEqual(0);
      expect(seed1).toBeLessThan(1000000);
      expect(seed1).not.toBe(seed2); // Very unlikely to be the same
    });

    it('should reset to defaults', () => {
      // Modify settings and config
      configManager.updateSettings({ theme: 'light', volume: 0.1 });
      configManager.updateConfig({ aiArchetype: 'aggressor' });

      // Reset to defaults
      configManager.resetToDefaults();

      const settings = configManager.getSettings();
      const config = configManager.getConfig();

      expect(settings.theme).toBe('dark');
      expect(settings.volume).toBe(0.7);
      expect(config.aiArchetype).toBe('hybrid');
    });
  });
});