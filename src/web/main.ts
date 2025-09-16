/**
 * Main entry point for the web version of Burn Rate
 * This file initializes the web interface and starts the game
 */

// Import styles
import './styles/main.css';

// Import game components
import { GameInitializer, GameInitializationConfig } from '../GameInitializer.js';
import { WebInterface, WebConfig } from './WebInterface.js';
import { WebDisplay } from './WebDisplay.js';
import { GameStateManager } from './GameStateManager.js';
import { GameConfigManager } from './GameConfigManager.js';

// Global game instance
let webInterface: WebInterface | null = null;
let webDisplay: WebDisplay | null = null;
let gameStateManager: GameStateManager | null = null;
let gameConfigManager: GameConfigManager | null = null;

console.log('Burn Rate Web Version - Loading...');

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing web interface...');
    
    try {
        // Initialize managers
        gameStateManager = new GameStateManager();
        gameConfigManager = new GameConfigManager();
        
        // Initialize web display
        webDisplay = new WebDisplay({
            containerId: 'burn-rate-game',
            showAnimations: true,
            theme: 'dark'
        });
        
        // Hide loading overlay
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        // Set up basic UI functionality
        setupTabNavigation();
        setupModalHandlers();
        
        // Set up game initialization
        await setupGameInitialization();
        
        console.log('Web interface initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize web interface:', error);
        showError('Failed to initialize game. Please refresh the page.');
    }
});

/**
 * Sets up game initialization and starts the game
 */
async function setupGameInitialization(): Promise<void> {
    try {
        // Check for saved game state
        const hasSavedGame = gameStateManager?.hasValidSavedState() || false;
        
        if (hasSavedGame) {
            // Show option to continue or start new game
            showGameStartOptions();
        } else {
            // Start new game with default configuration
            await startNewGame();
        }
        
    } catch (error) {
        console.error('Game initialization failed:', error);
        throw error;
    }
}

/**
 * Shows game start options (new game or continue)
 */
function showGameStartOptions(): void {
    const content = `
        <div class="game-start-options">
            <h4>Welcome to Burn Rate</h4>
            <p>A saved game was found. What would you like to do?</p>
            <div class="button-group">
                <button id="continue-game-btn" class="primary-button">Continue Game</button>
                <button id="new-game-btn" class="secondary-button">New Game</button>
            </div>
        </div>
    `;
    
    showModal('Game Start', content);
    
    // Set up button handlers
    const continueBtn = document.getElementById('continue-game-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    
    if (continueBtn) {
        continueBtn.addEventListener('click', async () => {
            hideModal();
            await continueGame();
        });
    }
    
    if (newGameBtn) {
        newGameBtn.addEventListener('click', async () => {
            hideModal();
            await startNewGame();
        });
    }
}

/**
 * Starts a new game with configuration options
 */
async function startNewGame(): Promise<void> {
    try {
        // Get game configuration from config manager
        const gameConfig = gameConfigManager?.getConfig() || { webConfig: {} } as any;
        
        // Initialize game using GameInitializer
        const initResult = await GameInitializer.initializeGame(gameConfig);
        
        if (!initResult.isValid) {
            throw new Error(`Game initialization failed: ${initResult.errors.join(', ')}`);
        }
        
        // Create web interface configuration
        const webConfig: WebConfig = {
            containerId: 'burn-rate-game',
            showDebugInfo: gameConfig.webConfig?.showDebugInfo || false,
            autoSave: true,
            theme: 'dark'
        };
        
        // Create and start web interface
        webInterface = new WebInterface(initResult.gameEngine, webConfig);
        await webInterface.start();
        
        // Set up game event listeners
        setupGameEventListeners();
        
        // Initial display update
        webInterface.updateDisplay();
        
        // Show game started message
        showSuccess('New game started! Good luck, Commander.');
        
        console.log('New game started successfully');
        
    } catch (error) {
        console.error('Failed to start new game:', error);
        showError(`Failed to start new game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Continues a saved game
 */
async function continueGame(): Promise<void> {
    try {
        // Load saved game state
        const savedState = gameStateManager?.loadGameState();
        if (!savedState) {
            throw new Error('No valid saved game found');
        }
        
        // For now, we'll start a new game since we don't have state restoration yet
        // TODO: Implement proper game state restoration
        await startNewGame();
        
        showSuccess('Game continued from saved state.');
        
    } catch (error) {
        console.error('Failed to continue game:', error);
        showError(`Failed to continue game: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Fallback to new game
        await startNewGame();
    }
}

/**
 * Sets up game event listeners for the web interface
 */
function setupGameEventListeners(): void {
    const container = document.getElementById('burn-rate-game');
    if (!container || !webInterface || !webDisplay) return;
    
    // Listen for game state updates
    container.addEventListener('gameStateUpdate', (event: any) => {
        const { gameState } = event.detail;
        webDisplay?.displayGameState(gameState);
    });
    
    // Listen for action results
    container.addEventListener('actionResult', (event: any) => {
        const result = event.detail;
        if (result.success) {
            showSuccess(result.message);
        } else {
            showError(result.message);
        }
    });
    
    // Listen for display errors
    container.addEventListener('displayError', (event: any) => {
        const { message } = event.detail;
        showError(message);
    });
    
    // Listen for game over events
    container.addEventListener('gameOver', (event: any) => {
        const { winner, victoryType } = event.detail;
        handleGameOver(winner, victoryType);
    });
    
    // Listen for debug updates
    container.addEventListener('debugUpdate', (event: any) => {
        const debugInfo = event.detail;
        updateDebugDisplay(debugInfo);
    });
    
    // Set up form submission handlers
    setupFormHandlers();
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts();
}

/**
 * Sets up form submission handlers
 */
function setupFormHandlers(): void {
    const container = document.getElementById('burn-rate-game');
    if (!container) return;
    
    // Handle all form submissions within the game container
    container.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        if (!webInterface) return;
        
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        const actionType = form.dataset.actionType;
        
        if (!actionType) return;
        
        const action = {
            type: actionType as any,
            data: Object.fromEntries(formData.entries()),
            timestamp: Date.now()
        };
        
        try {
            const result = await webInterface.handleUserAction(action);
            // Result is handled by event listeners
        } catch (error) {
            console.error('Form submission error:', error);
            showError('Action failed. Please try again.');
        }
    });
}

/**
 * Sets up keyboard shortcuts
 */
function setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', async (event) => {
        // Only handle shortcuts when not typing in input fields
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
            return;
        }
        
        if (!webInterface) return;
        
        switch (event.key) {
            case 'Enter':
                if (event.ctrlKey) {
                    // Ctrl+Enter: End turn
                    event.preventDefault();
                    await webInterface.handleUserAction({
                        type: 'endTurn',
                        timestamp: Date.now()
                    });
                }
                break;
            
            case 'h':
                // H: Show help
                event.preventDefault();
                showModal('Help', getHelpContent());
                break;
            
            case 's':
                if (event.ctrlKey) {
                    // Ctrl+S: Save game
                    event.preventDefault();
                    saveGame();
                } else {
                    // S: Show status
                    event.preventDefault();
                    await webInterface.handleUserAction({
                        type: 'status',
                        timestamp: Date.now()
                    });
                }
                break;
            
            case 'n':
                if (event.ctrlKey) {
                    // Ctrl+N: New game
                    event.preventDefault();
                    if (confirm('Start a new game? Current progress will be lost.')) {
                        await startNewGame();
                    }
                }
                break;
        }
    });
}

/**
 * Handles game over state
 */
function handleGameOver(winner: string, victoryType: string): void {
    const message = winner === 'player' ? 
        `Congratulations! You achieved ${victoryType} victory!` :
        `Game Over. The AI achieved ${victoryType} victory.`;
    
    const content = `
        <div class="game-over">
            <h4>Game Over</h4>
            <p>${message}</p>
            <div class="button-group">
                <button id="new-game-over-btn" class="primary-button">New Game</button>
                <button id="view-stats-btn" class="secondary-button">View Statistics</button>
            </div>
        </div>
    `;
    
    showModal('Game Over', content);
    
    // Set up button handlers
    const newGameBtn = document.getElementById('new-game-over-btn');
    const statsBtn = document.getElementById('view-stats-btn');
    
    if (newGameBtn) {
        newGameBtn.addEventListener('click', async () => {
            hideModal();
            await startNewGame();
        });
    }
    
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            showGameStatistics();
        });
    }
}

/**
 * Shows game statistics
 */
function showGameStatistics(): void {
    if (!webInterface) return;
    
    const gameEngine = webInterface.getGameEngine();
    const stats = gameEngine.getGameStatistics();
    
    const content = `
        <div class="game-statistics">
            <h4>Game Statistics</h4>
            <div class="stats-grid">
                <div class="stat-item">
                    <label>Final Turn:</label>
                    <span>${stats.turn}</span>
                </div>
                <div class="stat-item">
                    <label>Game Phase:</label>
                    <span>${stats.gamePhase}</span>
                </div>
                <div class="stat-item">
                    <label>Combat Events:</label>
                    <span>${stats.combatEvents}</span>
                </div>
                <div class="stat-item">
                    <label>Your Fleet Size:</label>
                    <span>${stats.playerStats.totalFleetSize}</span>
                </div>
                <div class="stat-item">
                    <label>AI Fleet Size:</label>
                    <span>${stats.aiStats.totalFleetSize}</span>
                </div>
            </div>
        </div>
    `;
    
    showModal('Game Statistics', content);
}

/**
 * Saves the current game
 */
function saveGame(): void {
    if (!webInterface || !gameStateManager) return;
    
    try {
        const gameState = webInterface.getGameEngine().getGameState();
        gameStateManager.saveGameState(gameState);
        showSuccess('Game saved successfully.');
    } catch (error) {
        console.error('Failed to save game:', error);
        showError('Failed to save game.');
    }
}

/**
 * Updates debug display
 */
function updateDebugDisplay(debugInfo: any): void {
    const debugPanel = document.getElementById('debug-panel');
    if (!debugPanel) return;
    
    debugPanel.innerHTML = `
        <h4>Debug Information</h4>
        <div class="debug-info">
            <div>Turn: ${debugInfo.turn}</div>
            <div>Phase: ${debugInfo.gamePhase}</div>
            <div>Game Over: ${debugInfo.isGameOver}</div>
            <div>Pending Actions: ${debugInfo.pendingActions}</div>
        </div>
    `;
}

/**
 * Set up tab navigation for command panels
 */
function setupTabNavigation(): void {
    const tabButtons = document.querySelectorAll('.tab-button');
    const commandPanels = document.querySelectorAll('.command-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all tabs and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            commandPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding panel
            button.classList.add('active');
            const targetPanel = document.getElementById(`${targetTab}-panel`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

/**
 * Set up modal handlers
 */
function setupModalHandlers(): void {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const helpBtn = document.getElementById('help-btn');
    const settingsBtn = document.getElementById('settings-btn');
    
    // Close modal handlers
    if (modalClose && modalOverlay) {
        modalClose.addEventListener('click', () => {
            modalOverlay.classList.add('hidden');
        });
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.add('hidden');
            }
        });
    }
    
    // Help button handler
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            showModal('Help', getHelpContent());
        });
    }
    
    // Settings button handler
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            showModal('Settings', getSettingsContent());
        });
    }
}

/**
 * Hide modal
 */
function hideModal(): void {
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.classList.add('hidden');
    }
}

/**
 * Show success message
 */
function showSuccess(message: string): void {
    // For now, use console.log - this should be replaced with proper UI notification
    console.log('SUCCESS:', message);
    // TODO: Implement proper success notification UI
}

/**
 * Show error message
 */
function showError(message: string): void {
    // For now, use console.error - this should be replaced with proper UI notification
    console.error('ERROR:', message);
    // TODO: Implement proper error notification UI
}

/**
 * Show modal with title and content
 */
function showModal(title: string, content: string): void {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    if (modalOverlay && modalTitle && modalBody) {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modalOverlay.classList.remove('hidden');
    }
}

/**
 * Get help content
 */
function getHelpContent(): string {
    return `
        <h4>Game Commands</h4>
        <p><strong>Build:</strong> Construct units and structures to strengthen your forces.</p>
        <p><strong>Attack:</strong> Launch attacks against enemy positions.</p>
        <p><strong>Scan:</strong> Gather intelligence about enemy activities.</p>
        <p><strong>End Turn:</strong> Complete your turn and let the AI take its actions.</p>
        
        <h4>Resources</h4>
        <p>Manage your resources carefully to maintain your military operations.</p>
        
        <h4>Victory Conditions</h4>
        <p>Defeat all enemy forces or achieve strategic objectives to win.</p>
    `;
}

/**
 * Get settings content
 */
function getSettingsContent(): string {
    return `
        <h4>Game Settings</h4>
        <p>Settings panel will be implemented in future tasks.</p>
        <p>Available options will include:</p>
        <ul>
            <li>AI Difficulty</li>
            <li>Game Speed</li>
            <li>Visual Theme</li>
            <li>Sound Effects</li>
        </ul>
    `;
}