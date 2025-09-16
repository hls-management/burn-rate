#!/usr/bin/env node
import { GameInitializer } from './GameInitializer.js';
import { ErrorHandler } from './ErrorHandler.js';
/**
 * Main entry point for the CLI version of Burn Rate
 */
async function main() {
    console.log('Initializing Burn Rate...\n');
    try {
        // Parse command line arguments
        const args = process.argv.slice(2);
        const config = parseCommandLineArgs(args);
        // Perform system check if requested
        if (config.systemCheck) {
            await performSystemCheck();
            return;
        }
        // Initialize the game
        const gameSetup = await GameInitializer.initializeGame(config);
        if (!gameSetup.isValid) {
            console.error('❌ Game initialization failed:');
            gameSetup.errors.forEach(error => console.error(`  - ${error}`));
            if (gameSetup.errors.length > 0) {
                console.log('\nAttempting to start with fallback configuration...');
            }
        }
        else {
            console.log('✅ Game initialized successfully!');
            // Display AI archetype
            const gameState = gameSetup.gameEngine.getGameState();
            console.log(`🤖 AI Archetype: ${gameSetup.gameEngine.getGameState().ai ? 'Selected' : 'Unknown'}`);
        }
        // Set up graceful shutdown
        setupGracefulShutdown(gameSetup.cliInterface);
        // Start the game
        await gameSetup.cliInterface.start();
    }
    catch (error) {
        const errorResponse = ErrorHandler.handleSystemError(error instanceof Error ? error : new Error('Startup failed'));
        console.error(`❌ ${errorResponse.userMessage}`);
        if (errorResponse.shouldRestart) {
            console.log('Attempting emergency restart...');
            try {
                const fallbackSetup = await GameInitializer.createQuickStartGame();
                await fallbackSetup.cliInterface.start();
            }
            catch (fallbackError) {
                console.error('❌ Emergency restart failed:', fallbackError);
                process.exit(1);
            }
        }
        else {
            process.exit(1);
        }
    }
}
/**
 * Parses command line arguments
 */
function parseCommandLineArgs(args) {
    const config = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--help':
            case '-h':
                displayHelp();
                process.exit(0);
                break;
            case '--debug':
            case '-d':
                config.cliConfig = { showDebugInfo: true };
                break;
            case '--ai':
                if (i + 1 < args.length) {
                    config.aiArchetype = args[++i];
                }
                break;
            case '--resources':
                if (i + 2 < args.length) {
                    config.startingResources = {
                        metal: parseInt(args[++i], 10),
                        energy: parseInt(args[++i], 10)
                    };
                }
                break;
            case '--seed':
                if (i + 1 < args.length) {
                    config.seed = parseInt(args[++i], 10);
                }
                break;
            case '--system-check':
                config.systemCheck = true;
                break;
            default:
                if (arg.startsWith('-')) {
                    console.warn(`Unknown option: ${arg}`);
                }
                break;
        }
    }
    return config;
}
/**
 * Displays command line help
 */
function displayHelp() {
    console.log(`
Burn Rate - A fast-paced strategy game

Usage: burn-rate [options]

Options:
  -h, --help              Show this help message
  -d, --debug             Enable debug mode with enhanced logging
  --ai <archetype>        Set AI archetype (aggressor, economist, trickster, hybrid)
  --resources <M> <E>     Set starting resources (metal energy)
  --seed <number>         Set random seed for reproducible games
  --system-check          Perform system health check and exit

Examples:
  burn-rate                           # Start with default settings
  burn-rate --debug                   # Start in debug mode
  burn-rate --ai aggressor            # Play against aggressive AI
  burn-rate --resources 50000 50000   # Start with more resources
  burn-rate --system-check            # Check system health

Game Commands (in-game):
  help                    # Show in-game help
  build <qty> <unit>      # Build units or structures
  attack <F> <C> <B>      # Launch attack with fleet composition
  scan <type>             # Perform intelligence scan
  status                  # Show detailed game status
  end                     # End current turn
  quit                    # Exit game
`);
}
/**
 * Performs comprehensive system check
 */
async function performSystemCheck() {
    console.log('Performing system health check...\n');
    const systemCheck = await GameInitializer.performSystemCheck();
    console.log('='.repeat(60));
    console.log('SYSTEM HEALTH CHECK RESULTS');
    console.log('='.repeat(60));
    systemCheck.checks.forEach(check => {
        const status = check.passed ? '✅' : '❌';
        console.log(`${status} ${check.name}`);
        if (!check.passed && check.error) {
            console.log(`   Error: ${check.error}`);
        }
    });
    console.log('\n' + '='.repeat(60));
    if (systemCheck.isHealthy) {
        console.log('✅ System is healthy and ready to run Burn Rate');
    }
    else {
        console.log('⚠️  System issues detected. Game may not run properly.');
        const errorStats = ErrorHandler.getErrorStatistics();
        if (errorStats.total > 0) {
            console.log(`\nError History: ${errorStats.total} total errors`);
        }
        const suggestions = ErrorHandler.getRecoverySuggestions();
        if (suggestions.length > 0) {
            console.log('\nSuggestions:');
            suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
        }
    }
}
/**
 * Sets up graceful shutdown handlers
 */
function setupGracefulShutdown(cliInterface) {
    const shutdown = async (signal) => {
        console.log(`\n\nReceived ${signal}. Shutting down gracefully...`);
        try {
            await cliInterface.shutdown();
        }
        catch (error) {
            console.error('Error during shutdown:', error);
        }
        process.exit(0);
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        ErrorHandler.handleSystemError(error);
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        const error = reason instanceof Error ? reason : new Error(String(reason));
        ErrorHandler.handleSystemError(error);
        process.exit(1);
    });
}
// Run the game if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Failed to start game:', error);
        ErrorHandler.handleSystemError(error instanceof Error ? error : new Error('Startup failed'));
        process.exit(1);
    });
}
export { main };
//# sourceMappingURL=cli.js.map