import { GameEngine, GameEngineConfig } from './engine/GameEngine.js';
import { CLIInterface, CLIConfig } from './ui/CLIInterface.js';
import { AIArchetype } from './models/AI.js';

export interface GameInitializationConfig {
  aiArchetype?: AIArchetype;
  startingResources?: {
    metal: number;
    energy: number;
  };
  cliConfig?: CLIConfig;
  seed?: number;
}

export class GameInitializer {
  /**
   * Initializes and validates a complete game setup
   */
  public static async initializeGame(config: GameInitializationConfig = {}): Promise<{
    gameEngine: GameEngine;
    cliInterface: CLIInterface;
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Set random seed if provided
      if (config.seed !== undefined) {
        // Note: JavaScript doesn't have built-in seeded random, but we can document this for future enhancement
        console.log(`Game seed: ${config.seed}`);
      }

      // Validate configuration
      const validationResult = this.validateConfiguration(config);
      if (!validationResult.isValid) {
        errors.push(...validationResult.errors);
      }

      // Create game engine configuration
      const gameEngineConfig: GameEngineConfig = {
        aiArchetype: config.aiArchetype || this.selectRandomAIArchetype(),
        startingResources: config.startingResources || {
          metal: 10000,
          energy: 10000
        }
      };

      // Initialize game engine
      const gameEngine = new GameEngine(gameEngineConfig);

      // Validate initial game state
      const gameStateValidation = gameEngine.validateGameState();
      if (!gameStateValidation.isValid) {
        errors.push(...gameStateValidation.errors);
      }

      // Create CLI configuration
      const cliConfig: CLIConfig = {
        showDebugInfo: config.cliConfig?.showDebugInfo || false,
        autoAdvanceTurn: config.cliConfig?.autoAdvanceTurn || false
      };

      // Initialize CLI interface
      const cliInterface = new CLIInterface(gameEngine, cliConfig);

      // Final validation
      const finalValidation = this.validateGameSetup(gameEngine, cliInterface);
      if (!finalValidation.isValid) {
        errors.push(...finalValidation.errors);
      }

      return {
        gameEngine,
        cliInterface,
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      errors.push(`Game initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Return minimal setup even on failure
      const fallbackEngine = new GameEngine();
      const fallbackCLI = new CLIInterface(fallbackEngine);
      
      return {
        gameEngine: fallbackEngine,
        cliInterface: fallbackCLI,
        isValid: false,
        errors
      };
    }
  }

  /**
   * Validates the initialization configuration
   */
  private static validateConfiguration(config: GameInitializationConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate AI archetype
    if (config.aiArchetype) {
      const validArchetypes: AIArchetype[] = ['aggressor', 'economist', 'trickster', 'hybrid'];
      if (!validArchetypes.includes(config.aiArchetype)) {
        errors.push(`Invalid AI archetype: ${config.aiArchetype}. Valid options: ${validArchetypes.join(', ')}`);
      }
    }

    // Validate starting resources
    if (config.startingResources) {
      if (config.startingResources.metal < 0 || config.startingResources.energy < 0) {
        errors.push('Starting resources cannot be negative');
      }
      
      if (config.startingResources.metal > 1000000 || config.startingResources.energy > 1000000) {
        errors.push('Starting resources are unreasonably high (max: 1,000,000)');
      }
    }

    // Validate seed
    if (config.seed !== undefined) {
      if (!Number.isInteger(config.seed) || config.seed < 0) {
        errors.push('Seed must be a non-negative integer');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates the complete game setup
   */
  private static validateGameSetup(gameEngine: GameEngine, cliInterface: CLIInterface): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // Validate game engine
      if (!gameEngine) {
        errors.push('Game engine is null or undefined');
        return { isValid: false, errors };
      }

      // Validate CLI interface
      if (!cliInterface) {
        errors.push('CLI interface is null or undefined');
        return { isValid: false, errors };
      }

      // Validate game state
      const gameState = gameEngine.getGameState();
      if (!gameState) {
        errors.push('Game state is null or undefined');
        return { isValid: false, errors };
      }

      // Validate turn number
      if (gameState.turn < 1) {
        errors.push('Invalid turn number');
      }

      // Validate player state
      if (!gameState.player) {
        errors.push('Player state is missing');
      } else {
        if (gameState.player.resources.metal < 0 || gameState.player.resources.energy < 0) {
          errors.push('Player has negative resources');
        }
      }

      // Validate AI state
      if (!gameState.ai) {
        errors.push('AI state is missing');
      } else {
        if (gameState.ai.resources.metal < 0 || gameState.ai.resources.energy < 0) {
          errors.push('AI has negative resources');
        }
      }

      // Validate game is not already over
      if (gameEngine.isGameOver()) {
        errors.push('Game is already over at initialization');
      }

    } catch (error) {
      errors.push(`Game setup validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Selects a random AI archetype for variety
   */
  private static selectRandomAIArchetype(): AIArchetype {
    const archetypes: AIArchetype[] = ['aggressor', 'economist', 'trickster', 'hybrid'];
    const randomIndex = Math.floor(Math.random() * archetypes.length);
    return archetypes[randomIndex];
  }

  /**
   * Creates a quick-start game with default settings
   */
  public static async createQuickStartGame(): Promise<{
    gameEngine: GameEngine;
    cliInterface: CLIInterface;
    isValid: boolean;
    errors: string[];
  }> {
    return this.initializeGame({
      aiArchetype: this.selectRandomAIArchetype(),
      startingResources: {
        metal: 10000,
        energy: 10000
      },
      cliConfig: {
        showDebugInfo: false,
        autoAdvanceTurn: false
      }
    });
  }

  /**
   * Creates a debug game with enhanced logging
   */
  public static async createDebugGame(): Promise<{
    gameEngine: GameEngine;
    cliInterface: CLIInterface;
    isValid: boolean;
    errors: string[];
  }> {
    return this.initializeGame({
      aiArchetype: 'hybrid',
      startingResources: {
        metal: 50000,
        energy: 50000
      },
      cliConfig: {
        showDebugInfo: true,
        autoAdvanceTurn: false
      }
    });
  }

  /**
   * Performs a comprehensive system check
   */
  public static async performSystemCheck(): Promise<{
    isHealthy: boolean;
    checks: Array<{
      name: string;
      passed: boolean;
      error?: string;
    }>;
  }> {
    const checks: Array<{ name: string; passed: boolean; error?: string }> = [];

    // Test game engine creation
    try {
      const engine = new GameEngine();
      checks.push({ name: 'Game Engine Creation', passed: true });
      
      // Test game state validation
      const validation = engine.validateGameState();
      checks.push({ 
        name: 'Initial Game State Validation', 
        passed: validation.isValid,
        error: validation.errors.join(', ') || undefined
      });
      
      // Test turn processing
      try {
        const turnResult = engine.processTurn([]);
        checks.push({ 
          name: 'Turn Processing', 
          passed: turnResult.success,
          error: turnResult.errors.join(', ') || undefined
        });
      } catch (error) {
        checks.push({ 
          name: 'Turn Processing', 
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
    } catch (error) {
      checks.push({ 
        name: 'Game Engine Creation', 
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test CLI interface creation
    try {
      const engine = new GameEngine();
      const cli = new CLIInterface(engine);
      checks.push({ name: 'CLI Interface Creation', passed: true });
    } catch (error) {
      checks.push({ 
        name: 'CLI Interface Creation', 
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test full game initialization
    try {
      const result = await this.initializeGame();
      checks.push({ 
        name: 'Full Game Initialization', 
        passed: result.isValid,
        error: result.errors.join(', ') || undefined
      });
    } catch (error) {
      checks.push({ 
        name: 'Full Game Initialization', 
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const allPassed = checks.every(check => check.passed);

    return {
      isHealthy: allPassed,
      checks
    };
  }
}