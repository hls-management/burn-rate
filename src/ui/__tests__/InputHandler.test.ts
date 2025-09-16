import { describe, it, expect, beforeEach } from 'vitest';
import { InputHandler } from '../InputHandler.js';
import { GameState } from '../../models/GameState.js';
import { PlayerState } from '../../models/PlayerState.js';

describe('InputHandler', () => {
  let inputHandler: InputHandler;
  let mockGameState: GameState;

  beforeEach(() => {
    inputHandler = new InputHandler();
    
    // Create a mock game state for validation
    const mockPlayerState: PlayerState = {
      resources: {
        metal: 10000,
        energy: 10000,
        metalIncome: 10000,
        energyIncome: 10000
      },
      fleet: {
        homeSystem: {
          frigates: 50,
          cruisers: 20,
          battleships: 10
        },
        inTransit: {
          outbound: []
        }
      },
      economy: {
        reactors: 0,
        mines: 0,
        constructionQueue: []
      },
      intelligence: {
        lastScanTurn: 0,
        knownEnemyFleet: {
          frigates: 0,
          cruisers: 0,
          battleships: 0
        },
        scanAccuracy: 0.7
      }
    };

    mockGameState = {
      turn: 1,
      player: mockPlayerState,
      ai: { ...mockPlayerState },
      combatLog: [],
      gamePhase: 'early',
      isGameOver: false
    };
  });

  describe('Build Command Parsing', () => {
    it('should parse valid frigate build command', () => {
      const result = inputHandler.processCommand('build 5 frigate', mockGameState);
      
      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('build');
      expect(result.command?.buildType).toBe('frigate');
      expect(result.command?.quantity).toBe(5);
    });

    it('should parse valid reactor build command', () => {
      const result = inputHandler.processCommand('build 1 reactor', mockGameState);
      
      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('build');
      expect(result.command?.buildType).toBe('reactor');
      expect(result.command?.quantity).toBe(1);
    });

    it('should reject build command with invalid unit type', () => {
      const result = inputHandler.processCommand('build 5 invalid_unit', mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid build type');
    });

    it('should reject build command with invalid quantity', () => {
      const result = inputHandler.processCommand('build abc frigate', mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Quantity must be a positive number');
    });

    it('should reject build command with insufficient resources', () => {
      const result = inputHandler.processCommand('build 10000 battleship', mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient');
    });

    it('should reject build command with wrong format', () => {
      const result = inputHandler.processCommand('build 5', mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Build command format');
    });
  });

  describe('Attack Command Parsing', () => {
    it('should parse valid attack command', () => {
      const result = inputHandler.processCommand('attack 10 5 2', mockGameState);
      
      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('attack');
      expect(result.command?.attackFleet?.frigates).toBe(10);
      expect(result.command?.attackFleet?.cruisers).toBe(5);
      expect(result.command?.attackFleet?.battleships).toBe(2);
      expect(result.command?.target).toBe('ai_system');
    });

    it('should reject attack command with invalid numbers', () => {
      const result = inputHandler.processCommand('attack abc 5 2', mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Fleet numbers must be valid integers');
    });

    it('should reject attack command with negative numbers', () => {
      const result = inputHandler.processCommand('attack -5 5 2', mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Fleet numbers cannot be negative');
    });

    it('should reject attack command with empty fleet', () => {
      const result = inputHandler.processCommand('attack 0 0 0', mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot attack with empty fleet');
    });

    it('should reject attack command with insufficient fleet', () => {
      const result = inputHandler.processCommand('attack 100 50 20', mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient');
    });

    it('should reject attack command with wrong format', () => {
      const result = inputHandler.processCommand('attack 10 5', mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Attack command format');
    });
  });

  describe('Scan Command Parsing', () => {
    it('should parse valid basic scan command', () => {
      const result = inputHandler.processCommand('scan basic', mockGameState);
      
      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('scan');
      expect(result.command?.scanType).toBe('basic');
    });

    it('should parse valid deep scan command', () => {
      const result = inputHandler.processCommand('scan deep', mockGameState);
      
      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('scan');
      expect(result.command?.scanType).toBe('deep');
    });

    it('should parse valid advanced scan command', () => {
      const result = inputHandler.processCommand('scan advanced', mockGameState);
      
      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('scan');
      expect(result.command?.scanType).toBe('advanced');
    });

    it('should reject scan command with invalid type', () => {
      const result = inputHandler.processCommand('scan invalid', mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid scan type');
    });

    it('should reject scan command with insufficient energy', () => {
      // Reduce energy to insufficient amount
      mockGameState.player.resources.energy = 500;
      const result = inputHandler.processCommand('scan basic', mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient energy');
    });

    it('should reject scan command with wrong format', () => {
      const result = inputHandler.processCommand('scan', mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Scan command format');
    });
  });

  describe('Simple Commands', () => {
    it('should parse status command', () => {
      const result = inputHandler.processCommand('status', mockGameState);
      
      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('status');
    });

    it('should parse help command', () => {
      const result = inputHandler.processCommand('help', mockGameState);
      
      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('help');
    });

    it('should parse end turn command variations', () => {
      const variations = ['end', 'endturn', 'end_turn'];
      
      variations.forEach(variation => {
        const result = inputHandler.processCommand(variation, mockGameState);
        expect(result.success).toBe(true);
        expect(result.command?.type).toBe('end_turn');
      });
    });

    it('should parse quit command variations', () => {
      const variations = ['quit', 'exit'];
      
      variations.forEach(variation => {
        const result = inputHandler.processCommand(variation, mockGameState);
        expect(result.success).toBe(true);
        expect(result.command?.type).toBe('quit');
      });
    });
  });

  describe('Invalid Commands', () => {
    it('should reject unknown command', () => {
      const result = inputHandler.processCommand('unknown_command', mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown command');
    });

    it('should reject empty command', () => {
      const result = inputHandler.processCommand('', mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No command entered');
    });

    it('should handle whitespace-only input', () => {
      const result = inputHandler.processCommand('   ', mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No command entered');
    });
  });

  describe('Case Insensitivity', () => {
    it('should handle uppercase commands', () => {
      const result = inputHandler.processCommand('BUILD 5 FRIGATE', mockGameState);
      
      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('build');
      expect(result.command?.buildType).toBe('frigate');
    });

    it('should handle mixed case commands', () => {
      const result = inputHandler.processCommand('ScAn BaSiC', mockGameState);
      
      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('scan');
      expect(result.command?.scanType).toBe('basic');
    });
  });

  describe('Syntax Validation', () => {
    it('should validate build command syntax', () => {
      const result = inputHandler.validateSyntax('build 5 frigate');
      expect(result.valid).toBe(true);
    });

    it('should validate attack command syntax', () => {
      const result = inputHandler.validateSyntax('attack 10 5 2');
      expect(result.valid).toBe(true);
    });

    it('should validate scan command syntax', () => {
      const result = inputHandler.validateSyntax('scan basic');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid build syntax', () => {
      const result = inputHandler.validateSyntax('build 5');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('build <quantity> <unit/structure>');
    });

    it('should reject invalid attack syntax', () => {
      const result = inputHandler.validateSyntax('attack 10 5');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('attack <frigates> <cruisers> <battleships>');
    });
  });

  describe('Command Suggestions', () => {
    it('should provide command suggestions', () => {
      const suggestions = inputHandler.getCommandSuggestions('b');
      expect(suggestions).toContain('build');
    });

    it('should provide empty suggestions for non-matching input', () => {
      const suggestions = inputHandler.getCommandSuggestions('xyz');
      expect(suggestions).toHaveLength(0);
    });

    it('should provide all commands for empty input', () => {
      const suggestions = inputHandler.getCommandSuggestions('');
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });
});