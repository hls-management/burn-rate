import { GameEngine } from './engine/GameEngine.js';
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
export declare class GameInitializer {
    /**
     * Initializes and validates a complete game setup
     */
    static initializeGame(config?: GameInitializationConfig): Promise<{
        gameEngine: GameEngine;
        cliInterface: CLIInterface;
        isValid: boolean;
        errors: string[];
    }>;
    /**
     * Validates the initialization configuration
     */
    private static validateConfiguration;
    /**
     * Validates the complete game setup
     */
    private static validateGameSetup;
    /**
     * Selects a random AI archetype for variety
     */
    private static selectRandomAIArchetype;
    /**
     * Creates a quick-start game with default settings
     */
    static createQuickStartGame(): Promise<{
        gameEngine: GameEngine;
        cliInterface: CLIInterface;
        isValid: boolean;
        errors: string[];
    }>;
    /**
     * Creates a debug game with enhanced logging
     */
    static createDebugGame(): Promise<{
        gameEngine: GameEngine;
        cliInterface: CLIInterface;
        isValid: boolean;
        errors: string[];
    }>;
    /**
     * Performs a comprehensive system check
     */
    static performSystemCheck(): Promise<{
        isHealthy: boolean;
        checks: Array<{
            name: string;
            passed: boolean;
            error?: string;
        }>;
    }>;
}
//# sourceMappingURL=GameInitializer.d.ts.map