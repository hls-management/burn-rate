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
});