import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ColorManager, ColorTheme } from '../ColorManager.js';
import { FleetComposition } from '../../models/GameState.js';

describe('ColorManager', () => {
  let colorManager: ColorManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Mock stdout.isTTY property
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      configurable: true
    });
    
    // Set up color-supporting environment
    process.env.TERM = 'xterm-256color';
    delete process.env.NO_COLOR;
    delete process.env.FORCE_COLOR;
    
    colorManager = new ColorManager(true);
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Restore original isTTY property
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      configurable: true
    });
    
    vi.restoreAllMocks();
  });

  describe('Color Support Detection', () => {
    it('should detect color support with color terminal', () => {
      process.env.TERM = 'xterm-256color';
      const manager = new ColorManager(true);
      
      expect(manager.isColorSupported()).toBe(true);
      expect(manager.areColorsEnabled()).toBe(true);
    });

    it('should detect color support with COLORTERM', () => {
      process.env.COLORTERM = 'truecolor';
      delete process.env.TERM;
      const manager = new ColorManager(true);
      
      expect(manager.isColorSupported()).toBe(true);
    });

    it('should respect NO_COLOR environment variable', () => {
      process.env.NO_COLOR = '1';
      process.env.TERM = 'xterm-256color';
      const manager = new ColorManager(true);
      
      expect(manager.isColorSupported()).toBe(false);
      expect(manager.areColorsEnabled()).toBe(false);
    });

    it('should respect FORCE_COLOR environment variable', () => {
      process.env.FORCE_COLOR = '1';
      process.env.TERM = 'dumb';
      const manager = new ColorManager(true);
      
      expect(manager.isColorSupported()).toBe(true);
    });

    it('should not support colors in dumb terminal without force', () => {
      process.env.TERM = 'dumb';
      delete process.env.COLORTERM;
      delete process.env.FORCE_COLOR;
      const manager = new ColorManager(true);
      
      expect(manager.isColorSupported()).toBe(false);
    });

    it('should not support colors when not TTY', () => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: false,
        configurable: true
      });
      const manager = new ColorManager(true);
      
      expect(manager.isColorSupported()).toBe(false);
    });
  });

  describe('Basic Color Operations', () => {
    it('should colorize text when colors are enabled', () => {
      const result = colorManager.colorize('test', 'victory');
      
      expect(result).toContain('\x1b[32m'); // Green color code
      expect(result).toContain('test');
      expect(result).toContain('\x1b[0m'); // Reset code
    });

    it('should not colorize text when colors are disabled', () => {
      colorManager.setColorsEnabled(false);
      const result = colorManager.colorize('test', 'victory');
      
      expect(result).toBe('test');
      expect(result).not.toContain('\x1b[');
    });

    it('should handle all color types correctly', () => {
      const colorTypes: (keyof ColorTheme)[] = [
        'victory', 'defeat', 'neutral', 'player', 'enemy',
        'frigate', 'cruiser', 'battleship', 'casualties', 'survivors'
      ];

      colorTypes.forEach(colorType => {
        const result = colorManager.colorize('test', colorType);
        expect(result).toContain('test');
        expect(result).toContain('\x1b['); // Should contain ANSI codes
      });
    });
  });

  describe('Fleet Composition Formatting', () => {
    const sampleFleet: FleetComposition = {
      frigates: 10,
      cruisers: 5,
      battleships: 2
    };

    it('should format fleet composition with colors', () => {
      const result = colorManager.formatFleetComposition(sampleFleet, true);
      
      expect(result).toContain('10F');
      expect(result).toContain('5C');
      expect(result).toContain('2B');
      expect(result).toContain('\x1b[36m'); // Cyan for frigates
      expect(result).toContain('\x1b[33m'); // Yellow for cruisers
      expect(result).toContain('\x1b[31m'); // Red for battleships
    });

    it('should format fleet composition without colors when disabled', () => {
      const result = colorManager.formatFleetComposition(sampleFleet, false);
      
      expect(result).toBe('10F, 5C, 2B');
      expect(result).not.toContain('\x1b[');
    });

    it('should format fleet composition without colors when manager disabled', () => {
      colorManager.setColorsEnabled(false);
      const result = colorManager.formatFleetComposition(sampleFleet, true);
      
      expect(result).toBe('10F, 5C, 2B');
      expect(result).not.toContain('\x1b[');
    });
  });

  describe('Battle Outcome Formatting', () => {
    it('should format decisive attacker victory correctly', () => {
      const attackerResult = colorManager.formatBattleOutcome('decisive_attacker', 'attacker');
      const defenderResult = colorManager.formatBattleOutcome('decisive_attacker', 'defender');
      
      expect(attackerResult).toContain('\x1b[32m'); // Green for attacker victory
      expect(defenderResult).toContain('\x1b[31m'); // Red for defender defeat
      expect(attackerResult).toContain('DECISIVE ATTACKER');
    });

    it('should format decisive defender victory correctly', () => {
      const attackerResult = colorManager.formatBattleOutcome('decisive_defender', 'attacker');
      const defenderResult = colorManager.formatBattleOutcome('decisive_defender', 'defender');
      
      expect(attackerResult).toContain('\x1b[31m'); // Red for attacker defeat
      expect(defenderResult).toContain('\x1b[32m'); // Green for defender victory
    });

    it('should format close battle correctly', () => {
      const result = colorManager.formatBattleOutcome('close_battle', 'attacker');
      
      expect(result).toContain('\x1b[33m'); // Yellow for neutral
      expect(result).toContain('CLOSE BATTLE');
    });

    it('should format unknown outcome as neutral', () => {
      const result = colorManager.formatBattleOutcome('unknown_outcome', 'attacker');
      
      expect(result).toContain('\x1b[33m'); // Yellow for neutral
      expect(result).toContain('UNKNOWN OUTCOME'); // Underscores are replaced with spaces
    });

    it('should format without colors when disabled', () => {
      colorManager.setColorsEnabled(false);
      const result = colorManager.formatBattleOutcome('decisive_attacker', 'attacker');
      
      expect(result).toBe('DECISIVE ATTACKER');
      expect(result).not.toContain('\x1b[');
    });
  });

  describe('Casualty and Survivor Formatting', () => {
    it('should format casualties with percentage', () => {
      const result = colorManager.formatCasualties(25, 100);
      
      expect(result).toContain('25 ships (25%)');
      expect(result).toContain('\x1b[91m'); // Bright red for casualties
    });

    it('should handle zero total ships', () => {
      const result = colorManager.formatCasualties(0, 0);
      
      expect(result).toContain('0 ships (0%)');
    });

    it('should format survivors correctly', () => {
      const result = colorManager.formatSurvivors(15);
      
      expect(result).toContain('15 ships');
      expect(result).toContain('\x1b[92m'); // Bright green for survivors
    });

    it('should format without colors when disabled', () => {
      colorManager.setColorsEnabled(false);
      
      const casualtyResult = colorManager.formatCasualties(25, 100);
      const survivorResult = colorManager.formatSurvivors(15);
      
      expect(casualtyResult).toBe('25 ships (25%)');
      expect(survivorResult).toBe('15 ships');
      expect(casualtyResult).not.toContain('\x1b[');
      expect(survivorResult).not.toContain('\x1b[');
    });
  });

  describe('Player Identifier Formatting', () => {
    it('should format player identifier correctly', () => {
      const result = colorManager.formatPlayerIdentifier('player', 'YOUR');
      
      expect(result).toContain('YOUR');
      expect(result).toContain('\x1b[34m'); // Blue for player
    });

    it('should format AI identifier correctly', () => {
      const result = colorManager.formatPlayerIdentifier('ai', 'ENEMY');
      
      expect(result).toContain('ENEMY');
      expect(result).toContain('\x1b[35m'); // Magenta for enemy
    });

    it('should format without colors when disabled', () => {
      colorManager.setColorsEnabled(false);
      const result = colorManager.formatPlayerIdentifier('player', 'YOUR');
      
      expect(result).toBe('YOUR');
      expect(result).not.toContain('\x1b[');
    });
  });

  describe('Separator Creation', () => {
    it('should create colored separator with default parameters', () => {
      const result = colorManager.createSeparator();
      
      expect(result).toContain('-'.repeat(60));
      expect(result).toContain('\x1b[33m'); // Yellow for neutral
    });

    it('should create separator with custom length and character', () => {
      const result = colorManager.createSeparator(20, '=');
      
      expect(result).toContain('='.repeat(20));
    });

    it('should create separator without colors when disabled', () => {
      colorManager.setColorsEnabled(false);
      const result = colorManager.createSeparator();
      
      expect(result).toBe('-'.repeat(60));
      expect(result).not.toContain('\x1b[');
    });
  });

  describe('Theme Management', () => {
    it('should allow setting custom theme', () => {
      const customTheme: Partial<ColorTheme> = {
        victory: '\x1b[96m', // Bright cyan
        defeat: '\x1b[95m'   // Bright magenta
      };
      
      colorManager.setTheme(customTheme);
      const theme = colorManager.getTheme();
      
      expect(theme.victory).toBe('\x1b[96m');
      expect(theme.defeat).toBe('\x1b[95m');
      expect(theme.neutral).toBe('\x1b[33m'); // Should keep original
    });

    it('should reset to default theme', () => {
      const customTheme: Partial<ColorTheme> = {
        victory: '\x1b[96m'
      };
      
      colorManager.setTheme(customTheme);
      colorManager.resetTheme();
      const theme = colorManager.getTheme();
      
      expect(theme.victory).toBe('\x1b[32m'); // Back to default green
    });

    it('should return copy of theme to prevent mutation', () => {
      const theme1 = colorManager.getTheme();
      const theme2 = colorManager.getTheme();
      
      theme1.victory = 'modified';
      expect(theme2.victory).not.toBe('modified');
    });
  });

  describe('Color Enable/Disable', () => {
    it('should enable colors when supported', () => {
      colorManager.setColorsEnabled(true);
      expect(colorManager.areColorsEnabled()).toBe(true);
    });

    it('should disable colors when requested', () => {
      colorManager.setColorsEnabled(false);
      expect(colorManager.areColorsEnabled()).toBe(false);
    });

    it('should not enable colors when not supported', () => {
      // Create manager with no color support
      process.env.TERM = 'dumb';
      delete process.env.COLORTERM;
      const noColorManager = new ColorManager(true);
      
      expect(noColorManager.areColorsEnabled()).toBe(false);
      
      noColorManager.setColorsEnabled(true);
      expect(noColorManager.areColorsEnabled()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text colorization', () => {
      const result = colorManager.colorize('', 'victory');
      
      expect(result).toContain('\x1b[32m');
      expect(result).toContain('\x1b[0m');
    });

    it('should handle zero fleet composition', () => {
      const emptyFleet: FleetComposition = {
        frigates: 0,
        cruisers: 0,
        battleships: 0
      };
      
      const result = colorManager.formatFleetComposition(emptyFleet);
      expect(result).toContain('0F');
      expect(result).toContain('0C');
      expect(result).toContain('0B');
    });

    it('should handle large numbers in fleet composition', () => {
      const largeFleet: FleetComposition = {
        frigates: 999999,
        cruisers: 888888,
        battleships: 777777
      };
      
      const result = colorManager.formatFleetComposition(largeFleet);
      expect(result).toContain('999999F');
      expect(result).toContain('888888C');
      expect(result).toContain('777777B');
    });
  });
});

describe('Default Color Manager', () => {
  it('should export a default color manager instance', async () => {
    const { defaultColorManager } = await import('../ColorManager.js');
    
    expect(defaultColorManager).toBeInstanceOf(ColorManager);
    expect(typeof defaultColorManager.colorize).toBe('function');
  });
});