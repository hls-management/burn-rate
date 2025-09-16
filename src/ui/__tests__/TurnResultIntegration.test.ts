import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameController } from '../GameController.js';
import { CLIInterface } from '../CLIInterface.js';
import { GameEngine } from '../../engine/GameEngine.js';

describe('Turn Result Display Integration', () => {
  let gameEngine: GameEngine;
  let gameController: GameController;
  let cliInterface: CLIInterface;
  let consoleSpy: any;

  beforeEach(() => {
    // Mock console.log to capture output
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Create game engine and related components
    gameEngine = new GameEngine();
    gameController = new GameController(gameEngine);
    cliInterface = new CLIInterface(gameEngine, {
      useColors: false, // Disable colors for testing
      combatDisplay: {
        showTacticalAnalysis: true,
        showBattlePhases: true,
        detailedCasualties: true,
        useEnhancedFormatting: true
      }
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should display turn result with enhanced combat display when turn ends', () => {
    // Create a mock turn result with combat events
    const mockTurnResult = {
      success: true,
      errors: [],
      combatEvents: [{
        turn: 5,
        attacker: 'player' as const,
        attackerFleet: { frigates: 10, cruisers: 5, battleships: 2 },
        defenderFleet: { frigates: 8, cruisers: 4, battleships: 1 },
        casualties: {
          attacker: { frigates: 2, cruisers: 1, battleships: 0 },
          defender: { frigates: 3, cruisers: 2, battleships: 1 }
        },
        survivors: {
          attacker: { frigates: 8, cruisers: 4, battleships: 2 },
          defender: { frigates: 5, cruisers: 2, battleships: 0 }
        },
        outcome: 'decisive_attacker' as const
      }],
      gameEnded: false,
      winner: null,
      victoryType: null
    };

    // Mock the game controller to return our test turn result
    vi.spyOn(gameController, 'getLastTurnResult').mockReturnValue(mockTurnResult);
    
    // Mock the executeCommand method to simulate end turn
    vi.spyOn(gameController, 'executeCommand').mockReturnValue({
      success: true,
      message: 'Turn completed',
      gameStateChanged: true
    });

    // Execute end turn command through the CLI interface
    const command = { type: 'end_turn' as const };
    gameController.executeCommand(command);

    // Simulate the CLI interface calling displayTurnResult
    const cliDisplaySpy = vi.spyOn(cliInterface as any, 'displayTurnResult');
    (cliInterface as any).displayTurnResult(mockTurnResult);

    // Verify that displayTurnResult was called
    expect(cliDisplaySpy).toHaveBeenCalledWith(mockTurnResult);

    // Verify that console output includes turn result information
    const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    expect(logCalls).toContain('TURN RESULT');
    expect(logCalls).toContain('COMBAT EVENTS');
    expect(logCalls).toContain('YOUR FLEET ATTACKS ENEMY SYSTEM');
  });

  it('should display "No combat this turn" when no combat events occur', () => {
    // Create a mock turn result with no combat events
    const mockTurnResult = {
      success: true,
      errors: [],
      combatEvents: [],
      gameEnded: false,
      winner: null,
      victoryType: null
    };

    // Simulate the CLI interface calling displayTurnResult
    (cliInterface as any).displayTurnResult(mockTurnResult);

    // Verify that console output includes no combat message
    const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    expect(logCalls).toContain('TURN RESULT');
    expect(logCalls).toContain('No combat this turn');
  });

  it('should respect combat display configuration options', () => {
    // Create CLI interface with disabled enhanced formatting
    const basicCLI = new CLIInterface(gameEngine, {
      useColors: false,
      combatDisplay: {
        useEnhancedFormatting: false,
        showTacticalAnalysis: false,
        showBattlePhases: false,
        detailedCasualties: false
      }
    });

    const mockTurnResult = {
      success: true,
      errors: [],
      combatEvents: [{
        turn: 3,
        attacker: 'player' as const,
        attackerFleet: { frigates: 10, cruisers: 5, battleships: 2 },
        defenderFleet: { frigates: 8, cruisers: 4, battleships: 1 },
        casualties: {
          attacker: { frigates: 2, cruisers: 1, battleships: 0 },
          defender: { frigates: 3, cruisers: 2, battleships: 1 }
        },
        survivors: {
          attacker: { frigates: 8, cruisers: 4, battleships: 2 },
          defender: { frigates: 5, cruisers: 2, battleships: 0 }
        },
        outcome: 'decisive_attacker' as const
      }],
      gameEnded: false,
      winner: null,
      victoryType: null
    };

    // Clear previous console calls
    consoleSpy.mockClear();

    // Display turn result with basic formatting
    (basicCLI as any).displayTurnResult(mockTurnResult);

    // Verify that basic formatting is used (no tactical analysis)
    const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    expect(logCalls).toContain('TURN RESULT');
    expect(logCalls).toContain('YOUR FLEET ATTACKS ENEMY SYSTEM');
    expect(logCalls).not.toContain('Tactical Analysis');
    expect(logCalls).not.toContain('Battle Progression');
  });

  it('should display turn summary with combat statistics', () => {
    // Create a mock turn result with multiple combat events
    const mockTurnResult = {
      success: true,
      errors: [],
      combatEvents: [
        {
          turn: 7,
          attacker: 'player' as const,
          attackerFleet: { frigates: 10, cruisers: 5, battleships: 2 },
          defenderFleet: { frigates: 8, cruisers: 4, battleships: 1 },
          casualties: {
            attacker: { frigates: 2, cruisers: 1, battleships: 0 },
            defender: { frigates: 8, cruisers: 4, battleships: 1 }
          },
          survivors: {
            attacker: { frigates: 8, cruisers: 4, battleships: 2 },
            defender: { frigates: 0, cruisers: 0, battleships: 0 }
          },
          outcome: 'decisive_attacker' as const
        },
        {
          turn: 7,
          attacker: 'ai' as const,
          attackerFleet: { frigates: 15, cruisers: 8, battleships: 3 },
          defenderFleet: { frigates: 12, cruisers: 6, battleships: 2 },
          casualties: {
            attacker: { frigates: 10, cruisers: 5, battleships: 2 },
            defender: { frigates: 5, cruisers: 2, battleships: 1 }
          },
          survivors: {
            attacker: { frigates: 5, cruisers: 3, battleships: 1 },
            defender: { frigates: 7, cruisers: 4, battleships: 1 }
          },
          outcome: 'close_battle' as const
        }
      ],
      gameEnded: false,
      winner: null,
      victoryType: null
    };

    // Display turn result
    (cliInterface as any).displayTurnResult(mockTurnResult);

    // Verify that turn summary includes combat statistics
    const logCalls = consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
    expect(logCalls).toContain('Turn Summary: 2 combat engagement(s) resolved');
    expect(logCalls).toContain('Player victories');
    expect(logCalls).toContain('Close battles');
  });
});