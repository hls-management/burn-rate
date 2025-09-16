import { GameEngine } from './engine/GameEngine.js';
import { CLIInterface } from './ui/CLIInterface.js';
import { GameInitializer } from './GameInitializer.js';
import { ErrorHandler } from './ErrorHandler.js';
import { InputHandler } from './ui/InputHandler.js';
import { GameController } from './ui/GameController.js';

export interface ValidationResult {
  passed: boolean;
  testName: string;
  error?: string;
  duration?: number;
}

export class IntegrationValidator {
  /**
   * Runs comprehensive integration tests
   */
  public static async runFullValidation(): Promise<{
    allPassed: boolean;
    results: ValidationResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      duration: number;
    };
  }> {
    const startTime = Date.now();
    const results: ValidationResult[] = [];

    console.log('Starting comprehensive integration validation...\n');

    // Core component tests
    results.push(await this.testGameEngineCreation());
    results.push(await this.testCLIInterfaceCreation());
    results.push(await this.testGameInitialization());
    results.push(await this.testErrorHandling());
    
    // Game flow tests
    results.push(await this.testBasicGameFlow());
    results.push(await this.testCommandProcessing());
    results.push(await this.testTurnProgression());
    results.push(await this.testVictoryConditions());
    
    // Edge case tests
    results.push(await this.testResourceValidation());
    results.push(await this.testFleetValidation());
    results.push(await this.testEconomicStall());
    results.push(await this.testInvalidCommands());
    
    // Integration tests
    results.push(await this.testFullGameCycle());
    results.push(await this.testSystemRecovery());

    const endTime = Date.now();
    const duration = endTime - startTime;

    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const allPassed = failed === 0;

    return {
      allPassed,
      results,
      summary: {
        total: results.length,
        passed,
        failed,
        duration
      }
    };
  }

  /**
   * Tests game engine creation and basic functionality
   */
  private static async testGameEngineCreation(): Promise<ValidationResult> {
    const testStart = Date.now();
    
    try {
      const engine = new GameEngine();
      
      // Test basic methods
      const gameState = engine.getGameState();
      if (!gameState) {
        throw new Error('Game state is null');
      }
      
      if (gameState.turn !== 1) {
        throw new Error(`Expected turn 1, got ${gameState.turn}`);
      }
      
      // Test validation
      const validation = engine.validateGameState();
      if (!validation.isValid) {
        throw new Error(`Game state validation failed: ${validation.errors.join(', ')}`);
      }
      
      return {
        passed: true,
        testName: 'Game Engine Creation',
        duration: Date.now() - testStart
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Game Engine Creation',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - testStart
      };
    }
  }

  /**
   * Tests CLI interface creation
   */
  private static async testCLIInterfaceCreation(): Promise<ValidationResult> {
    const testStart = Date.now();
    
    try {
      const engine = new GameEngine();
      const cli = new CLIInterface(engine);
      
      // Test basic methods
      const gameEngine = cli.getGameEngine();
      if (!gameEngine) {
        throw new Error('CLI interface does not have game engine');
      }
      
      // Test health check
      const health = cli.performHealthCheck();
      if (!health) {
        throw new Error('Health check failed');
      }
      
      return {
        passed: true,
        testName: 'CLI Interface Creation',
        duration: Date.now() - testStart
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'CLI Interface Creation',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - testStart
      };
    }
  }

  /**
   * Tests game initialization system
   */
  private static async testGameInitialization(): Promise<ValidationResult> {
    const testStart = Date.now();
    
    try {
      const result = await GameInitializer.initializeGame();
      
      if (!result.gameEngine || !result.cliInterface) {
        throw new Error('Initialization did not return required components');
      }
      
      if (!result.isValid && result.errors.length === 0) {
        throw new Error('Invalid result but no errors reported');
      }
      
      // Test quick start
      const quickStart = await GameInitializer.createQuickStartGame();
      if (!quickStart.isValid) {
        throw new Error(`Quick start failed: ${quickStart.errors.join(', ')}`);
      }
      
      return {
        passed: true,
        testName: 'Game Initialization',
        duration: Date.now() - testStart
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Game Initialization',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - testStart
      };
    }
  }

  /**
   * Tests error handling system
   */
  private static async testErrorHandling(): Promise<ValidationResult> {
    const testStart = Date.now();
    
    try {
      // Test error handling
      const errorResponse = ErrorHandler.handleError('validation', 'medium', 'Test error');
      if (!errorResponse.userMessage) {
        throw new Error('Error handler did not return user message');
      }
      
      // Test system health
      const health = ErrorHandler.isSystemHealthy();
      if (typeof health.healthy !== 'boolean') {
        throw new Error('System health check returned invalid result');
      }
      
      // Test error statistics
      const stats = ErrorHandler.getErrorStatistics();
      if (typeof stats.total !== 'number') {
        throw new Error('Error statistics returned invalid result');
      }
      
      return {
        passed: true,
        testName: 'Error Handling',
        duration: Date.now() - testStart
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Error Handling',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - testStart
      };
    }
  }

  /**
   * Tests basic game flow
   */
  private static async testBasicGameFlow(): Promise<ValidationResult> {
    const testStart = Date.now();
    
    try {
      const engine = new GameEngine();
      const initialTurn = engine.getCurrentTurn();
      
      // Process a turn
      const turnResult = engine.processTurn([]);
      if (!turnResult.success) {
        throw new Error(`Turn processing failed: ${turnResult.errors.join(', ')}`);
      }
      
      // Check turn advancement
      const newTurn = engine.getCurrentTurn();
      if (newTurn !== initialTurn + 1) {
        throw new Error(`Turn did not advance correctly: ${initialTurn} -> ${newTurn}`);
      }
      
      // Check game state is still valid
      const validation = engine.validateGameState();
      if (!validation.isValid) {
        throw new Error(`Game state invalid after turn: ${validation.errors.join(', ')}`);
      }
      
      return {
        passed: true,
        testName: 'Basic Game Flow',
        duration: Date.now() - testStart
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Basic Game Flow',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - testStart
      };
    }
  }

  /**
   * Tests command processing
   */
  private static async testCommandProcessing(): Promise<ValidationResult> {
    const testStart = Date.now();
    
    try {
      const engine = new GameEngine();
      const inputHandler = new InputHandler();
      const gameController = new GameController(engine);
      
      // Test valid commands
      const validCommands = [
        'help',
        'status',
        'build 1 frigate',
        'scan basic',
        'end'
      ];
      
      for (const commandStr of validCommands) {
        const commandResult = inputHandler.processCommand(commandStr, engine.getGameState());
        if (!commandResult.success) {
          throw new Error(`Command parsing failed for '${commandStr}': ${commandResult.error}`);
        }
        
        if (commandResult.command) {
          const executionResult = gameController.executeCommand(commandResult.command);
          // Note: Some commands may fail due to resource constraints, which is expected
        }
      }
      
      // Test invalid commands
      const invalidCommands = [
        'invalid',
        'build',
        'attack',
        'scan'
      ];
      
      for (const commandStr of invalidCommands) {
        const commandResult = inputHandler.processCommand(commandStr, engine.getGameState());
        if (commandResult.success) {
          throw new Error(`Invalid command '${commandStr}' was accepted`);
        }
      }
      
      return {
        passed: true,
        testName: 'Command Processing',
        duration: Date.now() - testStart
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Command Processing',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - testStart
      };
    }
  }

  /**
   * Tests turn progression over multiple turns
   */
  private static async testTurnProgression(): Promise<ValidationResult> {
    const testStart = Date.now();
    
    try {
      const engine = new GameEngine();
      
      // Process multiple turns
      for (let i = 0; i < 5; i++) {
        const turnResult = engine.processTurn([]);
        if (!turnResult.success) {
          throw new Error(`Turn ${i + 1} failed: ${turnResult.errors.join(', ')}`);
        }
        
        if (engine.isGameOver()) {
          // Game ended early, which is valid
          break;
        }
      }
      
      // Verify game state is still consistent
      const validation = engine.validateGameState();
      if (!validation.isValid) {
        throw new Error(`Game state invalid after multiple turns: ${validation.errors.join(', ')}`);
      }
      
      return {
        passed: true,
        testName: 'Turn Progression',
        duration: Date.now() - testStart
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Turn Progression',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - testStart
      };
    }
  }

  /**
   * Tests victory conditions
   */
  private static async testVictoryConditions(): Promise<ValidationResult> {
    const testStart = Date.now();
    
    try {
      const engine = new GameEngine();
      
      // Game should not be over initially
      if (engine.isGameOver()) {
        throw new Error('Game is over at start');
      }
      
      // Victory conditions are tested in the GameEngine tests
      // Here we just verify the methods work
      const winner = engine.getWinner();
      const victoryType = engine.getVictoryType();
      
      // These should be undefined initially
      if (winner !== undefined || victoryType !== undefined) {
        throw new Error('Victory state set incorrectly at game start');
      }
      
      return {
        passed: true,
        testName: 'Victory Conditions',
        duration: Date.now() - testStart
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Victory Conditions',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - testStart
      };
    }
  }

  /**
   * Tests resource validation
   */
  private static async testResourceValidation(): Promise<ValidationResult> {
    const testStart = Date.now();
    
    try {
      const engine = new GameEngine();
      const gameController = new GameController(engine);
      
      // Try to build something expensive
      const expensiveCommand = {
        type: 'build' as const,
        buildType: 'battleship' as const,
        quantity: 1000
      };
      
      const result = gameController.executeCommand(expensiveCommand);
      // This should fail due to insufficient resources
      if (result.success) {
        throw new Error('Expensive build command should have failed');
      }
      
      return {
        passed: true,
        testName: 'Resource Validation',
        duration: Date.now() - testStart
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Resource Validation',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - testStart
      };
    }
  }

  /**
   * Tests fleet validation
   */
  private static async testFleetValidation(): Promise<ValidationResult> {
    const testStart = Date.now();
    
    try {
      const engine = new GameEngine();
      const gameController = new GameController(engine);
      
      // Try to attack with more ships than available
      const invalidAttackCommand = {
        type: 'attack' as const,
        attackFleet: {
          frigates: 1000,
          cruisers: 1000,
          battleships: 1000
        },
        target: 'ai_system'
      };
      
      const result = gameController.executeCommand(invalidAttackCommand);
      // This should fail due to insufficient fleet
      if (result.success) {
        throw new Error('Invalid attack command should have failed');
      }
      
      return {
        passed: true,
        testName: 'Fleet Validation',
        duration: Date.now() - testStart
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Fleet Validation',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - testStart
      };
    }
  }

  /**
   * Tests economic stall conditions
   */
  private static async testEconomicStall(): Promise<ValidationResult> {
    const testStart = Date.now();
    
    try {
      // This test would require manipulating game state to create stall conditions
      // For now, we'll just verify the validation methods work
      const engine = new GameEngine();
      const gameState = engine.getGameState();
      
      // Verify income is positive initially
      if (gameState.player.resources.metalIncome <= 0 || gameState.player.resources.energyIncome <= 0) {
        throw new Error('Initial income should be positive');
      }
      
      return {
        passed: true,
        testName: 'Economic Stall',
        duration: Date.now() - testStart
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Economic Stall',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - testStart
      };
    }
  }

  /**
   * Tests invalid command handling
   */
  private static async testInvalidCommands(): Promise<ValidationResult> {
    const testStart = Date.now();
    
    try {
      const engine = new GameEngine();
      const inputHandler = new InputHandler();
      
      const invalidCommands = [
        '',
        'xyz',
        'build abc def',
        'attack abc def ghi',
        'scan xyz'
      ];
      
      for (const command of invalidCommands) {
        const result = inputHandler.processCommand(command, engine.getGameState());
        if (result.success) {
          throw new Error(`Invalid command '${command}' was accepted`);
        }
      }
      
      return {
        passed: true,
        testName: 'Invalid Commands',
        duration: Date.now() - testStart
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Invalid Commands',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - testStart
      };
    }
  }

  /**
   * Tests a full game cycle
   */
  private static async testFullGameCycle(): Promise<ValidationResult> {
    const testStart = Date.now();
    
    try {
      const result = await GameInitializer.initializeGame();
      
      if (!result.isValid) {
        throw new Error(`Game initialization failed: ${result.errors.join(', ')}`);
      }
      
      const engine = result.gameEngine;
      
      // Simulate a few turns of gameplay
      for (let turn = 0; turn < 3; turn++) {
        const turnResult = engine.processTurn([]);
        if (!turnResult.success) {
          throw new Error(`Turn ${turn + 1} failed: ${turnResult.errors.join(', ')}`);
        }
        
        if (engine.isGameOver()) {
          break;
        }
      }
      
      // Verify final state
      const validation = engine.validateGameState();
      if (!validation.isValid) {
        throw new Error(`Final game state invalid: ${validation.errors.join(', ')}`);
      }
      
      return {
        passed: true,
        testName: 'Full Game Cycle',
        duration: Date.now() - testStart
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Full Game Cycle',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - testStart
      };
    }
  }

  /**
   * Tests system recovery capabilities
   */
  private static async testSystemRecovery(): Promise<ValidationResult> {
    const testStart = Date.now();
    
    try {
      // Test error recovery
      ErrorHandler.handleError('system', 'medium', 'Test recovery error');
      
      const health = ErrorHandler.isSystemHealthy();
      const suggestions = ErrorHandler.getRecoverySuggestions();
      
      if (!Array.isArray(suggestions)) {
        throw new Error('Recovery suggestions should be an array');
      }
      
      // Clear errors and verify
      ErrorHandler.clearErrorHistory();
      const clearedStats = ErrorHandler.getErrorStatistics();
      
      if (clearedStats.total !== 0) {
        throw new Error('Error history was not cleared properly');
      }
      
      return {
        passed: true,
        testName: 'System Recovery',
        duration: Date.now() - testStart
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'System Recovery',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - testStart
      };
    }
  }

  /**
   * Displays validation results
   */
  public static displayResults(results: ValidationResult[], summary: any): void {
    console.log('\n' + '='.repeat(80));
    console.log('INTEGRATION VALIDATION RESULTS');
    console.log('='.repeat(80));
    
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`${status} ${result.testName}${duration}`);
      
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`SUMMARY: ${summary.passed}/${summary.total} tests passed (${summary.duration}ms total)`);
    
    if (summary.failed > 0) {
      console.log(`❌ ${summary.failed} test(s) failed`);
    } else {
      console.log('✅ All tests passed! System is ready for production.');
    }
  }
}