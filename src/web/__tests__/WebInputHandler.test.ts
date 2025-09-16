import { describe, it, expect, beforeEach } from 'vitest';
import { WebInputHandler, FormValidationResult, WebCommandData } from '../WebInputHandler.js';
import { InputHandler, Command } from '../../ui/InputHandler.js';
import { GameState, FleetComposition } from '../../models/GameState.js';
import { PlayerState } from '../../models/PlayerState.js';

describe('WebInputHandler', () => {
  let webInputHandler: WebInputHandler;
  let mockInputHandler: InputHandler;
  let mockGameState: GameState;

  beforeEach(() => {
    mockInputHandler = new InputHandler();
    webInputHandler = new WebInputHandler(mockInputHandler);

    // Create mock game state
    mockGameState = {
      turn: 1,
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
          }
        },
        economy: {
          reactors: 1,
          mines: 1
        },
        intelligence: {
          lastScanTurn: 0,
          knownEnemyFleet: {
            frigates: 0,
            cruisers: 0,
            battleships: 0
          }
        }
      },
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
  });

  describe('handleBuildForm', () => {
    it('should handle valid build form data', () => {
      const formData = new FormData();
      formData.append('buildType', 'frigate');
      formData.append('quantity', '10');

      const result = webInputHandler.handleBuildForm(formData, mockGameState);

      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('build');
      expect(result.command?.buildType).toBe('frigate');
      expect(result.command?.quantity).toBe(10);
    });

    it('should reject invalid build type', () => {
      const formData = new FormData();
      formData.append('buildType', 'invalid');
      formData.append('quantity', '10');

      const result = webInputHandler.handleBuildForm(formData, mockGameState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid build type');
    });

    it('should reject invalid quantity', () => {
      const formData = new FormData();
      formData.append('buildType', 'frigate');
      formData.append('quantity', 'invalid');

      const result = webInputHandler.handleBuildForm(formData, mockGameState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quantity must be a number');
    });

    it('should reject insufficient resources', () => {
      const formData = new FormData();
      formData.append('buildType', 'frigate');
      formData.append('quantity', '10000'); // Too expensive

      const result = webInputHandler.handleBuildForm(formData, mockGameState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient');
    });
  });

  describe('handleAttackForm', () => {
    it('should handle valid attack form data', () => {
      const formData = new FormData();
      formData.append('frigates', '50');
      formData.append('cruisers', '25');
      formData.append('battleships', '10');
      formData.append('target', 'enemy');

      const result = webInputHandler.handleAttackForm(formData, mockGameState);

      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('attack');
      expect(result.command?.attackFleet?.frigates).toBe(50);
      expect(result.command?.attackFleet?.cruisers).toBe(25);
      expect(result.command?.attackFleet?.battleships).toBe(10);
    });

    it('should reject insufficient fleet', () => {
      const formData = new FormData();
      formData.append('frigates', '200'); // More than available
      formData.append('cruisers', '25');
      formData.append('battleships', '10');
      formData.append('target', 'enemy');

      const result = webInputHandler.handleAttackForm(formData, mockGameState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient frigates');
    });

    it('should reject empty fleet', () => {
      const formData = new FormData();
      formData.append('frigates', '0');
      formData.append('cruisers', '0');
      formData.append('battleships', '0');
      formData.append('target', 'enemy');

      const result = webInputHandler.handleAttackForm(formData, mockGameState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot attack with empty fleet');
    });
  });

  describe('handleScanForm', () => {
    it('should handle valid scan form data', () => {
      const formData = new FormData();
      formData.append('scanType', 'basic');

      const result = webInputHandler.handleScanForm(formData, mockGameState);

      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('scan');
      expect(result.command?.scanType).toBe('basic');
    });

    it('should reject invalid scan type', () => {
      const formData = new FormData();
      formData.append('scanType', 'invalid');

      const result = webInputHandler.handleScanForm(formData, mockGameState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid scan type');
    });

    it('should reject insufficient energy', () => {
      // Set low energy
      mockGameState.player.resources.energy = 500;

      const formData = new FormData();
      formData.append('scanType', 'basic');

      const result = webInputHandler.handleScanForm(formData, mockGameState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient energy');
    });
  });

  describe('handleSimpleCommand', () => {
    it('should handle end turn command', () => {
      const result = webInputHandler.handleSimpleCommand('end_turn');

      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('end_turn');
    });

    it('should handle help command', () => {
      const result = webInputHandler.handleSimpleCommand('help');

      expect(result.success).toBe(true);
      expect(result.command?.type).toBe('help');
    });

    it('should reject unknown command', () => {
      const result = webInputHandler.handleSimpleCommand('unknown');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown command');
    });
  });

  describe('validateBuildForm', () => {
    it('should validate correct build form data', () => {
      const data: WebCommandData = {
        buildType: 'frigate',
        quantity: '10'
      };

      const result = webInputHandler.validateBuildForm(data);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing build type', () => {
      const data: WebCommandData = {
        quantity: '10'
      };

      const result = webInputHandler.validateBuildForm(data);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Build type is required');
    });

    it('should detect invalid quantity', () => {
      const data: WebCommandData = {
        buildType: 'frigate',
        quantity: '-5'
      };

      const result = webInputHandler.validateBuildForm(data);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Quantity must be positive');
    });
  });

  describe('validateAttackForm', () => {
    it('should validate correct attack form data', () => {
      const data: WebCommandData = {
        frigates: '50',
        cruisers: '25',
        battleships: '10',
        target: 'enemy'
      };

      const result = webInputHandler.validateAttackForm(data);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect empty fleet', () => {
      const data: WebCommandData = {
        frigates: '0',
        cruisers: '0',
        battleships: '0',
        target: 'enemy'
      };

      const result = webInputHandler.validateAttackForm(data);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Cannot attack with empty fleet');
    });
  });

  describe('sanitizeFormData', () => {
    it('should sanitize malicious input', () => {
      const formData = new FormData();
      formData.append('buildType', '<script>alert("xss")</script>frigate');
      formData.append('quantity', '10&amp;');

      const sanitized = webInputHandler.sanitizeFormData(formData);

      expect(sanitized.buildType).toBe('scriptalertxssscriptfrigate');
      expect(sanitized.quantity).toBe('10amp');
    });

    it('should trim whitespace', () => {
      const formData = new FormData();
      formData.append('buildType', '  frigate  ');
      formData.append('quantity', '  10  ');

      const sanitized = webInputHandler.sanitizeFormData(formData);

      expect(sanitized.buildType).toBe('frigate');
      expect(sanitized.quantity).toBe('10');
    });
  });

  describe('getCommandCostBreakdown', () => {
    it('should calculate build costs correctly', () => {
      const command: Command = {
        type: 'build',
        buildType: 'frigate',
        quantity: 10
      };

      const breakdown = webInputHandler.getCommandCostBreakdown(command);

      expect(breakdown.immediate.metal).toBe(40); // 4 * 10
      expect(breakdown.immediate.energy).toBe(20); // 2 * 10
      expect(breakdown.ongoing.metal).toBe(20); // 2 * 10 upkeep
      expect(breakdown.ongoing.energy).toBe(10); // 1 * 10 upkeep
    });

    it('should calculate scan costs correctly', () => {
      const command: Command = {
        type: 'scan',
        scanType: 'basic'
      };

      const breakdown = webInputHandler.getCommandCostBreakdown(command);

      expect(breakdown.immediate.energy).toBe(1000);
      expect(breakdown.ongoing.metal).toBe(0);
      expect(breakdown.ongoing.energy).toBe(0);
    });
  });

  describe('validateBatchCommands', () => {
    it('should validate multiple commands in sequence', () => {
      const commands: Command[] = [
        { type: 'build', buildType: 'frigate', quantity: 5 },
        { type: 'scan', scanType: 'basic' },
        { type: 'attack', attackFleet: { frigates: 10, cruisers: 5, battleships: 2 }, target: 'enemy' }
      ];

      const result = webInputHandler.validateBatchCommands(commands, mockGameState);

      expect(result.validCommands).toHaveLength(3);
      expect(result.invalidCommands).toHaveLength(0);
    });

    it('should detect resource conflicts in batch', () => {
      // Set low resources
      mockGameState.player.resources.metal = 100;
      mockGameState.player.resources.energy = 100;

      const commands: Command[] = [
        { type: 'build', buildType: 'battleship', quantity: 10 }, // Expensive
        { type: 'scan', scanType: 'advanced' } // Also expensive
      ];

      const result = webInputHandler.validateBatchCommands(commands, mockGameState);

      expect(result.invalidCommands.length).toBeGreaterThan(0);
    });
  });
});