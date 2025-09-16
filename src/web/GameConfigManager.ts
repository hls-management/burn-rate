import { AIArchetype } from '../models/AI.js';
import { GameEngineConfig } from '../engine/GameEngine.js';

/**
 * Web-specific game configuration interface
 */
export interface WebGameConfig extends GameEngineConfig {
  webConfig: {
    containerId: string;
    theme: 'dark' | 'light';
    showAnimations: boolean;
    autoSave: boolean;
    showDebugInfo: boolean;
  };
  seed?: number;
}

/**
 * Configuration presets for different game modes
 */
export interface GamePreset {
  name: string;
  description: string;
  config: Partial<WebGameConfig>;
}

/**
 * Settings that can be changed during gameplay
 */
export interface GameSettings {
  theme: 'dark' | 'light';
  showAnimations: boolean;
  autoSave: boolean;
  showDebugInfo: boolean;
  soundEnabled: boolean;
  volume: number;
}

/**
 * Manages game configuration and settings for the web interface
 */
export class GameConfigManager {
  private static readonly SETTINGS_KEY = 'burn-rate-settings';
  private static readonly CONFIG_KEY = 'burn-rate-config';

  private currentSettings: GameSettings;
  private currentConfig: WebGameConfig;

  constructor() {
    this.currentSettings = this.loadSettings();
    this.currentConfig = this.loadConfig();
  }

  /**
   * Gets the current game settings
   */
  public getSettings(): GameSettings {
    return { ...this.currentSettings };
  }

  /**
   * Updates game settings
   */
  public updateSettings(newSettings: Partial<GameSettings>): void {
    this.currentSettings = {
      ...this.currentSettings,
      ...newSettings
    };
    this.saveSettings();
  }

  /**
   * Gets the current game configuration
   */
  public getConfig(): WebGameConfig {
    return { ...this.currentConfig };
  }

  /**
   * Updates game configuration
   */
  public updateConfig(newConfig: Partial<WebGameConfig>): void {
    this.currentConfig = {
      ...this.currentConfig,
      ...newConfig,
      webConfig: {
        ...this.currentConfig.webConfig,
        ...(newConfig.webConfig || {})
      }
    };
    this.saveConfig();
  }

  /**
   * Creates a new game configuration with specified options
   */
  public createGameConfig(options: {
    aiArchetype?: AIArchetype;
    startingResources?: { metal: number; energy: number };
    debugMode?: boolean;
    seed?: number;
  }): WebGameConfig {
    const config: WebGameConfig = {
      aiArchetype: options.aiArchetype || 'hybrid',
      startingResources: options.startingResources || { metal: 10000, energy: 10000 },
      seed: options.seed,
      webConfig: {
        containerId: 'burn-rate-game',
        theme: this.currentSettings.theme,
        showAnimations: this.currentSettings.showAnimations,
        autoSave: this.currentSettings.autoSave,
        showDebugInfo: options.debugMode || this.currentSettings.showDebugInfo
      }
    };

    this.currentConfig = config;
    this.saveConfig();
    return config;
  }

  /**
   * Gets available AI archetypes with descriptions
   */
  public getAIArchetypes(): Array<{
    value: AIArchetype;
    name: string;
    description: string;
  }> {
    return [
      {
        value: 'aggressor',
        name: 'Aggressor',
        description: 'Focuses on military expansion and early attacks. Builds large fleets quickly and attacks frequently.'
      },
      {
        value: 'economist',
        name: 'Economist',
        description: 'Prioritizes economic development and infrastructure. Builds up resources before military expansion.'
      },
      {
        value: 'trickster',
        name: 'Trickster',
        description: 'Uses deception and unpredictable strategies. May provide false intelligence and vary tactics.'
      },
      {
        value: 'hybrid',
        name: 'Hybrid',
        description: 'Adapts strategy based on game conditions. Balances economic and military development dynamically.'
      }
    ];
  }

  /**
   * Gets predefined game presets
   */
  public getGamePresets(): GamePreset[] {
    return [
      {
        name: 'Quick Start',
        description: 'Standard game with balanced settings for new players',
        config: {
          aiArchetype: 'hybrid',
          startingResources: { metal: 10000, energy: 10000 },
          webConfig: {
            containerId: 'burn-rate-game',
            theme: 'dark',
            showAnimations: true,
            autoSave: true,
            showDebugInfo: false
          }
        }
      },
      {
        name: 'Economic Challenge',
        description: 'Start with limited resources against an economist AI',
        config: {
          aiArchetype: 'economist',
          startingResources: { metal: 5000, energy: 5000 },
          webConfig: {
            containerId: 'burn-rate-game',
            theme: 'dark',
            showAnimations: true,
            autoSave: true,
            showDebugInfo: false
          }
        }
      },
      {
        name: 'Military Rush',
        description: 'Face an aggressive AI with standard resources',
        config: {
          aiArchetype: 'aggressor',
          startingResources: { metal: 10000, energy: 10000 },
          webConfig: {
            containerId: 'burn-rate-game',
            theme: 'dark',
            showAnimations: true,
            autoSave: true,
            showDebugInfo: false
          }
        }
      },
      {
        name: 'Unpredictable',
        description: 'Random AI behavior with trickster archetype',
        config: {
          aiArchetype: 'trickster',
          startingResources: { metal: 10000, energy: 10000 },
          webConfig: {
            containerId: 'burn-rate-game',
            theme: 'dark',
            showAnimations: true,
            autoSave: true,
            showDebugInfo: false
          }
        }
      },
      {
        name: 'Debug Mode',
        description: 'Enhanced resources and debug information for testing',
        config: {
          aiArchetype: 'hybrid',
          startingResources: { metal: 50000, energy: 50000 },
          webConfig: {
            containerId: 'burn-rate-game',
            theme: 'dark',
            showAnimations: false,
            autoSave: false,
            showDebugInfo: true
          }
        }
      }
    ];
  }

  /**
   * Validates game configuration
   */
  public validateConfig(config: Partial<WebGameConfig>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate AI archetype
    if (config.aiArchetype) {
      const validArchetypes: AIArchetype[] = ['aggressor', 'economist', 'trickster', 'hybrid'];
      if (!validArchetypes.includes(config.aiArchetype)) {
        errors.push(`Invalid AI archetype: ${config.aiArchetype}`);
      }
    }

    // Validate starting resources
    if (config.startingResources) {
      if (config.startingResources.metal < 0 || config.startingResources.energy < 0) {
        errors.push('Starting resources cannot be negative');
      }
      if (config.startingResources.metal > 1000000 || config.startingResources.energy > 1000000) {
        errors.push('Starting resources cannot exceed 1,000,000');
      }
    }

    // Validate seed
    if (config.seed !== undefined) {
      if (!Number.isInteger(config.seed) || config.seed < 0) {
        errors.push('Seed must be a non-negative integer');
      }
    }

    // Validate web config
    if (config.webConfig) {
      if (config.webConfig.theme && !['dark', 'light'].includes(config.webConfig.theme)) {
        errors.push('Theme must be either "dark" or "light"');
      }
      if (config.webConfig.containerId && typeof config.webConfig.containerId !== 'string') {
        errors.push('Container ID must be a string');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Resets configuration to defaults
   */
  public resetToDefaults(): void {
    this.currentSettings = this.getDefaultSettings();
    this.currentConfig = this.getDefaultConfig();
    this.saveSettings();
    this.saveConfig();
  }

  /**
   * Exports current configuration as JSON
   */
  public exportConfig(): string {
    return JSON.stringify({
      settings: this.currentSettings,
      config: this.currentConfig,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    }, null, 2);
  }

  /**
   * Imports configuration from JSON
   */
  public importConfig(jsonData: string): {
    success: boolean;
    error?: string;
  } {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.settings) {
        this.currentSettings = { ...this.getDefaultSettings(), ...data.settings };
        this.saveSettings();
      }
      
      if (data.config) {
        const validation = this.validateConfig(data.config);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Invalid configuration: ${validation.errors.join(', ')}`
          };
        }
        
        this.currentConfig = { ...this.getDefaultConfig(), ...data.config };
        this.saveConfig();
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: `Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generates a random seed
   */
  public generateRandomSeed(): number {
    return Math.floor(Math.random() * 1000000);
  }

  /**
   * Gets resource preset options
   */
  public getResourcePresets(): Array<{
    name: string;
    description: string;
    resources: { metal: number; energy: number };
  }> {
    return [
      {
        name: 'Minimal',
        description: 'Very limited starting resources',
        resources: { metal: 2500, energy: 2500 }
      },
      {
        name: 'Limited',
        description: 'Reduced starting resources',
        resources: { metal: 5000, energy: 5000 }
      },
      {
        name: 'Standard',
        description: 'Default balanced resources',
        resources: { metal: 10000, energy: 10000 }
      },
      {
        name: 'Abundant',
        description: 'Increased starting resources',
        resources: { metal: 20000, energy: 20000 }
      },
      {
        name: 'Unlimited',
        description: 'Very high starting resources for testing',
        resources: { metal: 100000, energy: 100000 }
      }
    ];
  }

  /**
   * Loads settings from localStorage
   */
  private loadSettings(): GameSettings {
    try {
      const stored = localStorage.getItem(GameConfigManager.SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.getDefaultSettings(), ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    return this.getDefaultSettings();
  }

  /**
   * Saves settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(GameConfigManager.SETTINGS_KEY, JSON.stringify(this.currentSettings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  }

  /**
   * Loads configuration from localStorage
   */
  private loadConfig(): WebGameConfig {
    try {
      const stored = localStorage.getItem(GameConfigManager.CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.getDefaultConfig(), ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load config from localStorage:', error);
    }
    return this.getDefaultConfig();
  }

  /**
   * Saves configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(GameConfigManager.CONFIG_KEY, JSON.stringify(this.currentConfig));
    } catch (error) {
      console.warn('Failed to save config to localStorage:', error);
    }
  }

  /**
   * Gets default settings
   */
  private getDefaultSettings(): GameSettings {
    return {
      theme: 'dark',
      showAnimations: true,
      autoSave: true,
      showDebugInfo: false,
      soundEnabled: true,
      volume: 0.7
    };
  }

  /**
   * Gets default configuration
   */
  private getDefaultConfig(): WebGameConfig {
    return {
      aiArchetype: 'hybrid',
      startingResources: { metal: 10000, energy: 10000 },
      webConfig: {
        containerId: 'burn-rate-game',
        theme: 'dark',
        showAnimations: true,
        autoSave: true,
        showDebugInfo: false
      }
    };
  }
}