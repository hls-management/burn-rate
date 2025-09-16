import { GameEngine, TurnResult } from '../engine/GameEngine.js';
import { GameDisplay } from './GameDisplay.js';
import { InputHandler, CommandResult } from './InputHandler.js';
import { GameController } from './GameController.js';
import { ErrorHandler } from '../ErrorHandler.js';

export interface CLIConfig {
  showDebugInfo?: boolean;
  autoAdvanceTurn?: boolean;
  useColors?: boolean;
}

export class CLIInterface {
  private gameEngine: GameEngine;
  private gameController: GameController;
  private gameDisplay: GameDisplay;
  private inputHandler: InputHandler;
  private config: CLIConfig;
  private isRunning: boolean = false;

  constructor(gameEngine: GameEngine, config: CLIConfig = {}) {
    this.gameEngine = gameEngine;
    this.gameController = new GameController(gameEngine);
    this.gameDisplay = new GameDisplay(config);
    this.inputHandler = new InputHandler();
    this.config = config;
  }

  /**
   * Starts the CLI game loop
   */
  public async start(): Promise<void> {
    this.isRunning = true;
    
    // Display welcome message and initial game state
    this.displayWelcome();
    this.displayGameState();
    
    // Main game loop
    while (this.isRunning && !this.gameEngine.isGameOver()) {
      await this.processPlayerTurn();
    }
    
    // Display game over message
    if (this.gameEngine.isGameOver()) {
      this.displayGameOver();
    }
  }

  /**
   * Stops the CLI interface
   */
  public stop(): void {
    this.isRunning = false;
  }

  /**
   * Displays the welcome message and game instructions
   */
  private displayWelcome(): void {
    console.clear();
    console.log('='.repeat(60));
    console.log('                    BURN RATE                    ');
    console.log('='.repeat(60));
    console.log('');
    console.log('Welcome to Burn Rate - A fast-paced strategy game');
    console.log('');
    console.log('OBJECTIVE: Eliminate the AI through military or economic victory');
    console.log('- Military Victory: Destroy all enemy fleets');
    console.log('- Economic Victory: Force enemy economy to collapse');
    console.log('');
    console.log('Type "help" for available commands');
    console.log('Type "status" to see detailed game information');
    console.log('');
  }

  /**
   * Processes a single player turn
   */
  private async processPlayerTurn(): Promise<void> {
    let turnComplete = false;

    console.log(`\n--- TURN ${this.gameEngine.getCurrentTurn()} ---`);
    
    while (!turnComplete && this.isRunning) {
      try {
        // Validate game state before processing
        const gameStateValidation = this.gameEngine.validateGameState();
        if (!gameStateValidation.isValid) {
          const errorResponse = ErrorHandler.handleGameStateError(gameStateValidation.errors);
          this.gameDisplay.displayError(errorResponse.userMessage);
          
          if (!errorResponse.canContinue) {
            this.isRunning = false;
            return;
          }
        }

        // Display current game state
        this.displayGameState();
        
        // Get player input
        const input = await this.getPlayerInput();
        
        if (!input.trim()) {
          continue;
        }

        // Process command with error handling
        const commandResult = this.processCommandSafely(input);
        
        if (commandResult.success && commandResult.command) {
          // Execute the command using the game controller
          const executionResult = this.gameController.executeCommand(commandResult.command);
          
          if (executionResult.success) {
            console.log(`✓ ${executionResult.message}`);
            
            // Handle special command types
            switch (commandResult.command.type) {
              case 'status':
                this.displayDetailedStatus();
                break;
                
              case 'help':
                this.displayHelp();
                break;
                
              case 'end_turn':
                turnComplete = true;
                break;
                
              case 'quit':
                this.isRunning = false;
                return;
            }
          } else {
            const errorResponse = ErrorHandler.handleUserInputError(executionResult.message);
            this.gameDisplay.displayError(errorResponse.userMessage);
          }
        } else {
          const errorResponse = ErrorHandler.handleUserInputError(commandResult.error || 'Invalid command');
          this.gameDisplay.displayError(errorResponse.userMessage);
        }

      } catch (error) {
        const errorResponse = ErrorHandler.handleSystemError(error instanceof Error ? error : new Error('Unknown error'));
        this.gameDisplay.displayError(errorResponse.userMessage);
        
        if (!errorResponse.canContinue) {
          this.isRunning = false;
          return;
        }
      }
    }
  }

  /**
   * Gets input from the player
   */
  private async getPlayerInput(): Promise<string> {
    return new Promise((resolve) => {
      process.stdout.write('\n> ');
      
      const handleInput = (data: Buffer) => {
        const input = data.toString().trim();
        process.stdin.removeListener('data', handleInput);
        resolve(input);
      };
      
      process.stdin.on('data', handleInput);
    });
  }

  /**
   * Displays the current game state
   */
  private displayGameState(): void {
    const gameState = this.gameEngine.getGameState();
    this.gameDisplay.displayGameState(gameState);
  }

  /**
   * Displays detailed game status
   */
  private displayDetailedStatus(): void {
    const gameState = this.gameEngine.getGameState();
    const stats = this.gameEngine.getGameStatistics();
    this.gameDisplay.displayDetailedStatus(gameState, stats);
  }

  /**
   * Displays help information
   */
  private displayHelp(): void {
    this.gameDisplay.displayHelp();
  }

  /**
   * Displays turn result including combat events
   */
  private displayTurnResult(turnResult: TurnResult): void {
    this.gameDisplay.displayTurnResult(turnResult);
  }

  /**
   * Displays game over message
   */
  private displayGameOver(): void {
    const gameState = this.gameEngine.getGameState();
    this.gameDisplay.displayGameOver(gameState);
  }



  /**
   * Gets the current game engine instance
   */
  public getGameEngine(): GameEngine {
    return this.gameEngine;
  }

  /**
   * Processes a command with comprehensive error handling
   */
  private processCommandSafely(input: string): CommandResult {
    try {
      return this.inputHandler.processCommand(input, this.gameEngine.getGameState());
    } catch (error) {
      return {
        success: false,
        error: `Command processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Performs a system health check
   */
  public performHealthCheck(): {
    healthy: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const systemHealth = ErrorHandler.isSystemHealthy();
    const suggestions = ErrorHandler.getRecoverySuggestions();
    
    return {
      healthy: systemHealth.healthy,
      issues: systemHealth.issues,
      suggestions
    };
  }

  /**
   * Displays system health information
   */
  public displayHealthCheck(): void {
    const health = this.performHealthCheck();
    
    console.log('\n' + '='.repeat(60));
    console.log('SYSTEM HEALTH CHECK');
    console.log('='.repeat(60));
    
    if (health.healthy) {
      console.log('✅ System is healthy');
    } else {
      console.log('⚠️  System issues detected:');
      health.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }
    
    if (health.suggestions.length > 0) {
      console.log('\nSuggestions:');
      health.suggestions.forEach(suggestion => {
        console.log(`  - ${suggestion}`);
      });
    }
    
    const errorStats = ErrorHandler.getErrorStatistics();
    console.log(`\nError Statistics: ${errorStats.total} total errors`);
    console.log(`Recent Critical: ${errorStats.recentCritical}`);
  }

  /**
   * Resets the game with new configuration
   */
  public resetGame(config?: any): void {
    try {
      this.gameEngine.resetGame(config);
      ErrorHandler.clearErrorHistory();
      console.log('\nGame reset! Starting new game...\n');
    } catch (error) {
      const errorResponse = ErrorHandler.handleSystemError(error instanceof Error ? error : new Error('Reset failed'));
      this.gameDisplay.displayError(errorResponse.userMessage);
    }
  }

  /**
   * Gracefully shuts down the CLI interface
   */
  public async shutdown(): Promise<void> {
    console.log('\nShutting down game...');
    
    // Perform final health check
    const health = this.performHealthCheck();
    if (!health.healthy) {
      console.log('⚠️  Issues detected during shutdown:');
      health.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    this.isRunning = false;
    console.log('Goodbye!');
  }
}