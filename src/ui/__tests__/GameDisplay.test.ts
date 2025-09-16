import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameDisplay } from '../GameDisplay.js';
import { CombatEvent, FleetComposition } from '../../models/GameState.js';

describe('GameDisplay Enhanced Combat Display', () => {
  let gameDisplay: GameDisplay;
  let consoleSpy: any;

  beforeEach(() => {
    gameDisplay = new GameDisplay({ useColors: false }); // Disable colors for testing
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should display enhanced combat event with tactical analysis', () => {
    const attackerFleet: FleetComposition = {
      frigates: 50,
      cruisers: 20,
      battleships: 10
    };

    const defenderFleet: FleetComposition = {
      frigates: 30,
      cruisers: 25,
      battleships: 15
    };

    const combatEvent: CombatEvent = {
      turn: 5,
      attacker: 'player',
      attackerFleet,
      defenderFleet,
      outcome: 'close_battle',
      casualties: {
        attacker: { frigates: 20, cruisers: 8, battleships: 3 },
        defender: { frigates: 15, cruisers: 10, battleships: 6 }
      },
      survivors: {
        attacker: { frigates: 30, cruisers: 12, battleships: 7 },
        defender: { frigates: 15, cruisers: 15, battleships: 9 }
      }
    };

    // Call the private method through displayTurnResult
    const turnResult = {
      errors: [],
      combatEvents: [combatEvent],
      gameEnded: false,
      winner: null,
      victoryType: null
    };

    gameDisplay.displayTurnResult(turnResult);

    // Verify that console.log was called with enhanced combat information
    expect(consoleSpy).toHaveBeenCalled();
    
    // Check for key elements of enhanced display
    const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    
    // Should include tactical analysis
    expect(logCalls).toContain('Tactical Analysis');
    
    // Should include battle phase progression
    expect(logCalls).toContain('Battle Progression');
    expect(logCalls).toContain('Phase 1: Opening');
    expect(logCalls).toContain('Phase 2: Main');
    expect(logCalls).toContain('Phase 3: Cleanup');
    
    // Should include detailed fleet compositions
    expect(logCalls).toContain('Attacker: 80 ships');
    expect(logCalls).toContain('Defender: 70 ships');
    
    // Should include battle result
    expect(logCalls).toContain('Battle Result');
    
    // Should include casualties section
    expect(logCalls).toContain('Casualties');
    
    // Should include survivors section
    expect(logCalls).toContain('Survivors');
  });

  it('should handle decisive attacker victory', () => {
    const combatEvent: CombatEvent = {
      turn: 3,
      attacker: 'ai',
      attackerFleet: { frigates: 100, cruisers: 50, battleships: 25 },
      defenderFleet: { frigates: 20, cruisers: 10, battleships: 5 },
      outcome: 'decisive_attacker',
      casualties: {
        attacker: { frigates: 5, cruisers: 2, battleships: 1 },
        defender: { frigates: 18, cruisers: 9, battleships: 4 }
      },
      survivors: {
        attacker: { frigates: 95, cruisers: 48, battleships: 24 },
        defender: { frigates: 2, cruisers: 1, battleships: 1 }
      }
    };

    const turnResult = {
      errors: [],
      combatEvents: [combatEvent],
      gameEnded: false,
      winner: null,
      victoryType: null
    };

    gameDisplay.displayTurnResult(turnResult);

    const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    
    // Should show decisive victory
    expect(logCalls).toContain('DECISIVE ATTACKER');
    
    // Should show explanation for decisive victory
    expect(logCalls).toContain('overwhelmed');
  });

  it('should display no combat message when no events occur', () => {
    const turnResult = {
      errors: [],
      combatEvents: [],
      gameEnded: false,
      winner: null,
      victoryType: null
    };

    gameDisplay.displayTurnResult(turnResult);

    const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    expect(logCalls).toContain('No combat this turn');
  });

  it('should display enhanced casualty reporting with percentages and severity', () => {
    const combatEvent: CombatEvent = {
      turn: 7,
      attacker: 'player',
      attackerFleet: { frigates: 40, cruisers: 20, battleships: 10 }, // 70 total
      defenderFleet: { frigates: 30, cruisers: 15, battleships: 5 },  // 50 total
      outcome: 'close_battle',
      casualties: {
        attacker: { frigates: 32, cruisers: 16, battleships: 8 }, // 56/70 = 80% casualties
        defender: { frigates: 18, cruisers: 9, battleships: 3 }   // 30/50 = 60% casualties
      },
      survivors: {
        attacker: { frigates: 8, cruisers: 4, battleships: 2 },   // 14 survivors
        defender: { frigates: 12, cruisers: 6, battleships: 2 }   // 20 survivors
      }
    };

    const turnResult = {
      errors: [],
      combatEvents: [combatEvent],
      gameEnded: false,
      winner: null,
      victoryType: null
    };

    gameDisplay.displayTurnResult(turnResult);

    const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    
    // Should show casualty percentages
    expect(logCalls).toContain('80%');
    expect(logCalls).toContain('60%');
    
    // Should show casualty severity
    expect(logCalls).toContain('HEAVY');
    
    // Should show detailed breakdown
    expect(logCalls).toContain('Breakdown:');
    
    // Should show tactical context for heavy losses (70% > 60% threshold)
    expect(logCalls).toContain('Impact:');
    
    // Should show comparative analysis
    expect(logCalls).toContain('Analysis:');
  });

  it('should display enhanced survivor reporting with tactical context', () => {
    const combatEvent: CombatEvent = {
      turn: 8,
      attacker: 'ai',
      attackerFleet: { frigates: 60, cruisers: 30, battleships: 15 }, // 105 total
      defenderFleet: { frigates: 25, cruisers: 15, battleships: 10 }, // 50 total
      outcome: 'decisive_attacker',
      casualties: {
        attacker: { frigates: 12, cruisers: 6, battleships: 3 },  // 21/105 = 20% casualties
        defender: { frigates: 20, cruisers: 12, battleships: 8 }  // 40/50 = 80% casualties
      },
      survivors: {
        attacker: { frigates: 48, cruisers: 24, battleships: 12 }, // 84 survivors (80% survival)
        defender: { frigates: 5, cruisers: 3, battleships: 2 }     // 10 survivors (20% survival)
      }
    };

    const turnResult = {
      errors: [],
      combatEvents: [combatEvent],
      gameEnded: false,
      winner: null,
      victoryType: null
    };

    gameDisplay.displayTurnResult(turnResult);

    const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    
    // Should show survival rates
    expect(logCalls).toContain('80% survival');
    expect(logCalls).toContain('20% survival');
    
    // Should show tactical context
    expect(logCalls).toContain('Status:');
    
    // Should show return information for attackers
    expect(logCalls).toContain('Return ETA:');
    
    // Should show defensive assessment for defenders
    expect(logCalls).toContain('Defense:');
    
    // Should show fleet composition of survivors
    expect(logCalls).toContain('Composition:');
  });

  it('should handle total fleet annihilation scenario', () => {
    const combatEvent: CombatEvent = {
      turn: 10,
      attacker: 'player',
      attackerFleet: { frigates: 20, cruisers: 10, battleships: 5 },
      defenderFleet: { frigates: 25, cruisers: 15, battleships: 8 },
      outcome: 'close_battle',
      casualties: {
        attacker: { frigates: 20, cruisers: 10, battleships: 5 }, // Total loss
        defender: { frigates: 25, cruisers: 15, battleships: 8 }  // Total loss
      },
      survivors: {
        attacker: { frigates: 0, cruisers: 0, battleships: 0 },
        defender: { frigates: 0, cruisers: 0, battleships: 0 }
      }
    };

    const turnResult = {
      errors: [],
      combatEvents: [combatEvent],
      gameEnded: false,
      winner: null,
      victoryType: null
    };

    gameDisplay.displayTurnResult(turnResult);

    const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    
    // Should show total annihilation message
    expect(logCalls).toContain('Total fleet annihilation');
    
    // Should show tactical implications
    expect(logCalls).toContain('Mutual destruction');
  });

  describe('Error Handling and Fallbacks', () => {
    let consoleSpy: any;
    let consoleWarnSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should handle null combat event gracefully', () => {
      const turnResult = {
        errors: [],
        combatEvents: [null as any],
        gameEnded: false,
        winner: null,
        victoryType: null
      };

      gameDisplay.displayTurnResult(turnResult);

      const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
      
      // Should show error message
      expect(logCalls).toContain('Combat Event Display Error');
      expect(logCalls).toContain('Combat event is null or not an object');
    });

    it('should handle malformed combat event data', () => {
      const malformedEvent = {
        turn: 'invalid',
        attacker: 'invalid_type',
        attackerFleet: null,
        defenderFleet: 'not an object',
        outcome: 123,
        casualties: undefined,
        survivors: { invalid: 'data' }
      };

      const turnResult = {
        errors: [],
        combatEvents: [malformedEvent as any],
        gameEnded: false,
        winner: null,
        victoryType: null
      };

      gameDisplay.displayTurnResult(turnResult);

      const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
      
      // Should show multiple validation errors
      expect(logCalls).toContain('Combat Event Display Error');
      expect(logCalls).toContain('Invalid turn number');
      expect(logCalls).toContain('Invalid attacker type');
      expect(logCalls).toContain('Missing or invalid battle outcome');
    });

    it('should handle fleet composition with invalid data', () => {
      const eventWithInvalidFleets: CombatEvent = {
        turn: 5,
        attacker: 'player',
        attackerFleet: {
          frigates: NaN,
          cruisers: -10,
          battleships: Infinity
        },
        defenderFleet: {
          frigates: 'not a number' as any,
          cruisers: null as any,
          battleships: undefined as any
        },
        outcome: 'close_battle',
        casualties: {
          attacker: { frigates: 0, cruisers: 0, battleships: 0 },
          defender: { frigates: 0, cruisers: 0, battleships: 0 }
        },
        survivors: {
          attacker: { frigates: 0, cruisers: 0, battleships: 0 },
          defender: { frigates: 0, cruisers: 0, battleships: 0 }
        }
      };

      const turnResult = {
        errors: [],
        combatEvents: [eventWithInvalidFleets],
        gameEnded: false,
        winner: null,
        victoryType: null
      };

      gameDisplay.displayTurnResult(turnResult);

      const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
      
      // Should show validation errors for fleet compositions
      expect(logCalls).toContain('Combat Event Display Error');
      expect(logCalls).toContain('Invalid frigates count');
      expect(logCalls).toContain('Invalid cruisers count');
      expect(logCalls).toContain('Invalid battleships count');
    });

    it('should handle mathematical inconsistencies in fleet data', () => {
      const inconsistentEvent: CombatEvent = {
        turn: 5,
        attacker: 'player',
        attackerFleet: { frigates: 100, cruisers: 50, battleships: 25 }, // Total: 175
        defenderFleet: { frigates: 80, cruisers: 40, battleships: 20 },  // Total: 140
        outcome: 'close_battle',
        casualties: {
          attacker: { frigates: 50, cruisers: 25, battleships: 10 }, // Total: 85
          defender: { frigates: 40, cruisers: 20, battleships: 10 }  // Total: 70
        },
        survivors: {
          attacker: { frigates: 40, cruisers: 20, battleships: 10 }, // Total: 70 (85 + 70 = 155 ≠ 175)
          defender: { frigates: 30, cruisers: 15, battleships: 8 }   // Total: 53 (70 + 53 = 123 ≠ 140)
        }
      };

      const turnResult = {
        errors: [],
        combatEvents: [inconsistentEvent],
        gameEnded: false,
        winner: null,
        victoryType: null
      };

      gameDisplay.displayTurnResult(turnResult);

      const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
      
      // Should show mathematical inconsistency errors
      expect(logCalls).toContain('Combat Event Display Error');
      expect(logCalls).toContain('fleet math inconsistency');
    });

    it('should use fallback display when enhanced display fails', () => {
      // Create a combat event that will cause the enhanced display to fail
      const problematicEvent: CombatEvent = {
        turn: 5,
        attacker: 'player',
        attackerFleet: { frigates: 50, cruisers: 20, battleships: 10 },
        defenderFleet: { frigates: 30, cruisers: 15, battleships: 5 },
        outcome: 'close_battle',
        casualties: {
          attacker: { frigates: 20, cruisers: 8, battleships: 3 },
          defender: { frigates: 15, cruisers: 7, battleships: 2 }
        },
        survivors: {
          attacker: { frigates: 30, cruisers: 12, battleships: 7 },
          defender: { frigates: 15, cruisers: 8, battleships: 3 }
        }
      };

      // Mock the tactical analyzer to throw an error
      const tacticalAnalyzerSpy = vi.spyOn(gameDisplay['tacticalAnalyzer'], 'createEnhancedCombatDisplay')
        .mockImplementation(() => {
          throw new Error('Tactical analyzer failure');
        });

      const turnResult = {
        errors: [],
        combatEvents: [problematicEvent],
        gameEnded: false,
        winner: null,
        victoryType: null
      };

      gameDisplay.displayTurnResult(turnResult);

      const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
      
      // Should show error and fallback to basic display
      expect(logCalls).toContain('Error during enhanced combat display');
      expect(logCalls).toContain('YOUR FLEET ATTACKS ENEMY SYSTEM');
      
      tacticalAnalyzerSpy.mockRestore();
    });

    it('should handle completely corrupted combat event data', () => {
      const corruptedEvent = {
        // Missing all required fields
        randomField: 'random value',
        anotherField: { nested: 'object' }
      };

      const turnResult = {
        errors: [],
        combatEvents: [corruptedEvent as any],
        gameEnded: false,
        winner: null,
        victoryType: null
      };

      gameDisplay.displayTurnResult(turnResult);

      const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
      
      // Should show fallback display
      expect(logCalls).toContain('COMBAT EVENT (BASIC DISPLAY)');
      expect(logCalls).toContain('Turn: Unknown');
      expect(logCalls).toContain('Attacker: Unknown');
      expect(logCalls).toContain('Outcome: Unknown');
    });

    it('should handle missing combat events array', () => {
      const turnResult = {
        errors: [],
        combatEvents: null as any,
        gameEnded: false,
        winner: null,
        victoryType: null
      };

      gameDisplay.displayTurnResult(turnResult);

      const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
      
      // Should show no combat message
      expect(logCalls).toContain('No combat this turn');
    });

    it('should handle errors in color manager gracefully', () => {
      // Mock color manager to throw errors
      const colorManagerSpy = vi.spyOn(gameDisplay['colorManager'], 'colorize')
        .mockImplementation(() => {
          throw new Error('Color manager failure');
        });

      const turnResult = {
        errors: [],
        combatEvents: [],
        gameEnded: false,
        winner: null,
        victoryType: null
      };

      gameDisplay.displayTurnResult(turnResult);

      const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
      
      // Should still display no combat message without colors
      expect(logCalls).toContain('No combat this turn');
      
      colorManagerSpy.mockRestore();
    });

    it('should handle critical errors in all display methods', () => {
      // Create an event that will cause all display methods to fail
      const problematicEvent = {
        get turn() { throw new Error('Property access error'); },
        get attacker() { throw new Error('Property access error'); },
        get outcome() { throw new Error('Property access error'); }
      };

      const turnResult = {
        errors: [],
        combatEvents: [problematicEvent as any],
        gameEnded: false,
        winner: null,
        victoryType: null
      };

      gameDisplay.displayTurnResult(turnResult);

      const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
      
      // Should show error and skip the problematic event
      expect(logCalls).toContain('Error displaying combat event 1');
      expect(logCalls).toContain('Property access error');
      expect(logCalls).toContain('Skipping to next event');
    });
  });
});