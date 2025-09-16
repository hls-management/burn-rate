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

  describe('Error Handling and Fallbacks', () => {
    let consoleSpy: any;
    let errorColorManager: ColorManager;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Create a color manager with colors disabled for error testing
      errorColorManager = new ColorManager(false);
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    describe('colorize method error handling', () => {
      it('should handle non-string text input', () => {
        const result = errorColorManager.colorize(123 as any, 'victory');
        
        expect(result).toBe('123');
        expect(consoleSpy).toHaveBeenCalledWith(
          'ColorManager.colorize: text parameter must be a string, received:', 'number'
        );
      });

      it('should handle null text input', () => {
        const result = errorColorManager.colorize(null as any, 'victory');
        
        expect(result).toBe('');
        expect(consoleSpy).toHaveBeenCalled();
      });

      it('should handle undefined text input', () => {
        const result = errorColorManager.colorize(undefined as any, 'victory');
        
        expect(result).toBe('');
        expect(consoleSpy).toHaveBeenCalled();
      });

      it('should handle missing color codes gracefully', () => {
        // Create a color manager with colors enabled for this test
        const testColorManager = new ColorManager(true);
        
        // Corrupt the theme to simulate missing color codes
        const corruptTheme = { ...testColorManager.getTheme() };
        (corruptTheme as any).victory = undefined; // Set to undefined instead of deleting
        testColorManager.setTheme(corruptTheme);
        
        const result = testColorManager.colorize('test', 'victory');
        
        expect(result).toBe('test');
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Missing color code for type 'victory'")
        );
      });
    });

    describe('formatFleetComposition error handling', () => {
      it('should handle null fleet composition', () => {
        const result = errorColorManager.formatFleetComposition(null as any);
        
        expect(result).toBe('0F, 0C, 0B');
        expect(consoleSpy).toHaveBeenCalledWith(
          'ColorManager.formatFleetComposition: Invalid fleet composition data, using defaults'
        );
      });

      it('should handle invalid fleet composition data', () => {
        const result = errorColorManager.formatFleetComposition('invalid' as any);
        
        expect(result).toBe('0F, 0C, 0B');
        expect(consoleSpy).toHaveBeenCalled();
      });

      it('should handle invalid ship counts', () => {
        const invalidFleet = {
          frigates: 'not a number',
          cruisers: NaN,
          battleships: Infinity
        } as any;
        
        const result = errorColorManager.formatFleetComposition(invalidFleet);
        
        expect(result).toBe('0F, 0C, 0B');
        expect(consoleSpy).toHaveBeenCalledTimes(3); // One warning per invalid field
      });

      it('should handle negative ship counts', () => {
        const negativeFleet = {
          frigates: -10,
          cruisers: -5,
          battleships: -2
        };
        
        const result = errorColorManager.formatFleetComposition(negativeFleet);
        
        expect(result).toBe('0F, 0C, 0B');
        expect(consoleSpy).toHaveBeenCalledTimes(3);
      });

      it('should handle extremely large ship counts', () => {
        const largeFleet = {
          frigates: Number.MAX_SAFE_INTEGER + 1,
          cruisers: 1e20,
          battleships: Number.POSITIVE_INFINITY
        };
        
        const result = errorColorManager.formatFleetComposition(largeFleet);
        
        // Should clamp to maximum safe values
        expect(result).toContain('F');
        expect(result).toContain('C');
        expect(result).toContain('B');
        expect(consoleSpy).toHaveBeenCalled();
      });
    });

    describe('formatBattleOutcome error handling', () => {
      it('should handle non-string outcome', () => {
        const result = errorColorManager.formatBattleOutcome(123 as any, 'attacker');
        
        expect(result).toBe('UNKNOWN OUTCOME');
        expect(consoleSpy).toHaveBeenCalledWith(
          'ColorManager.formatBattleOutcome: Invalid outcome type, using default'
        );
      });

      it('should handle invalid perspective', () => {
        const result = errorColorManager.formatBattleOutcome('decisive_attacker', 'invalid' as any);
        
        expect(result).toContain('DECISIVE ATTACKER');
        expect(consoleSpy).toHaveBeenCalledWith(
          'ColorManager.formatBattleOutcome: Invalid perspective, defaulting to attacker'
        );
      });

      it('should handle unknown outcome types', () => {
        // Use a color manager with colors enabled for this test to reach the switch statement
        const testColorManager = new ColorManager(true);
        const result = testColorManager.formatBattleOutcome('unknown_battle_type', 'attacker');
        
        expect(result).toContain('UNKNOWN BATTLE TYPE');
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Unknown outcome 'unknown_battle_type'")
        );
      });
    });

    describe('formatCasualties error handling', () => {
      it('should handle invalid casualty numbers', () => {
        const result = errorColorManager.formatCasualties('invalid' as any, 100);
        
        expect(result).toBe('0 ships (0%)');
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid casualties value')
        );
      });

      it('should handle invalid total numbers', () => {
        const result = errorColorManager.formatCasualties(25, 'invalid' as any);
        
        expect(result).toBe('25 ships (0%)');
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid total value')
        );
      });

      it('should handle division by zero', () => {
        const result = errorColorManager.formatCasualties(25, 0);
        
        expect(result).toBe('25 ships (0%)');
      });
    });

    describe('formatSurvivors error handling', () => {
      it('should handle invalid survivor numbers', () => {
        const result = errorColorManager.formatSurvivors(NaN);
        
        expect(result).toBe('0 ships');
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid survivors value')
        );
      });
    });

    describe('formatPlayerIdentifier error handling', () => {
      it('should handle non-string text', () => {
        const result = errorColorManager.formatPlayerIdentifier('player', 123 as any);
        
        expect(result).toBe('123');
        expect(consoleSpy).toHaveBeenCalledWith(
          'ColorManager.formatPlayerIdentifier: text parameter must be a string'
        );
      });

      it('should handle invalid player type', () => {
        const result = errorColorManager.formatPlayerIdentifier('invalid' as any, 'test');
        
        expect(result).toBe('test');
        expect(consoleSpy).toHaveBeenCalledWith(
          'ColorManager.formatPlayerIdentifier: Invalid playerType, defaulting to player'
        );
      });
    });

    describe('createSeparator error handling', () => {
      it('should handle invalid length values', () => {
        const result = errorColorManager.createSeparator(-10);
        
        expect(result).toBe('-'); // Should use minimum length of 1
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('length value -10 below minimum 1')
        );
      });

      it('should handle extremely large length values', () => {
        const result = errorColorManager.createSeparator(1000);
        
        expect(result).toBe('-'.repeat(200)); // Should clamp to maximum
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('length value 1000 above maximum 200')
        );
      });

      it('should handle invalid character types', () => {
        const result = errorColorManager.createSeparator(10, null as any);
        
        expect(result).toBe('-'.repeat(10));
        expect(consoleSpy).toHaveBeenCalledWith(
          'ColorManager.createSeparator: Invalid character, using default'
        );
      });

      it('should handle empty character string', () => {
        const result = errorColorManager.createSeparator(10, '');
        
        expect(result).toBe('-'.repeat(10));
        expect(consoleSpy).toHaveBeenCalledWith(
          'ColorManager.createSeparator: Invalid character, using default'
        );
      });

      it('should handle multi-character strings by using first character', () => {
        const result = errorColorManager.createSeparator(5, 'abc');
        
        expect(result).toBe('aaaaa');
      });
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