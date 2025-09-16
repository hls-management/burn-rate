import { GameEngine, TurnResult } from '../engine/GameEngine.js';
import { GameController, CommandExecutionResult } from '../ui/GameController.js';
import { GameState } from '../models/GameState.js';
import { Command } from '../ui/InputHandler.js';

export interface WebConfig {
  containerId: string;
  showDebugInfo?: boolean;
  autoSave?: boolean;
  theme?: 'dark' | 'light';
}

export interface UserAction {
  type: 'build' | 'attack' | 'scan' | 'endTurn' | 'newGame' | 'status' | 'help';
  data?: any;
  timestamp: number;
}

export class WebInterface {
  private gameEngine: GameEngine;
  private gameController: GameController;
  private config: WebConfig;
  private isRunning: boolean = false;
  private container: HTMLElement | null = null;

  constructor(gameEngine: GameEngine, config: WebConfig) {
    this.gameEngine = gameEngine;
    this.gameController = new GameController(gameEngine);
    this.config = config;
  }

  /**
   * Starts the web interface and initializes the game
   */
  public async start(): Promise<void> {
    try {
      // Find the container element
      this.container = document.getElementById(this.config.containerId);
      if (!this.container) {
        throw new Error(`Container element with id '${this.config.containerId}' not found`);
      }

      // Initialize the interface
      this.isRunning = true;
      
      // Set up DOM event listeners
      this.setupEventListeners();
      
      // Initial display update
      this.updateDisplay();
      
      console.log('Web interface started successfully');
    } catch (error) {
      console.error('Failed to start web interface:', error);
      throw error;
    }
  }

  /**
   * Stops the web interface
   */
  public stop(): void {
    this.isRunning = false;
    this.removeEventListeners();
    console.log('Web interface stopped');
  }

  /**
   * Handles user actions from the web interface
   */
  public async handleUserAction(action: UserAction): Promise<CommandExecutionResult> {
    if (!this.isRunning) {
      return {
        success: false,
        message: 'Interface is not running',
        gameStateChanged: false
      };
    }

    try {
      // Convert user action to game command
      const command = this.convertActionToCommand(action);
      
      if (!command) {
        return {
          success: false,
          message: 'Invalid action type',
          gameStateChanged: false
        };
      }

      // Execute the command
      const result = this.gameController.executeCommand(command);
      
      // Handle special cases
      if (result.success && command.type === 'end_turn') {
        // Process the turn and update display
        await this.processTurn();
      }
      
      // Update display if game state changed
      if (result.gameStateChanged) {
        this.updateDisplay();
      }
      
      return result;
    } catch (error) {
      console.error('Error handling user action:', error);
      return {
        success: false,
        message: `Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        gameStateChanged: false
      };
    }
  }

  /**
   * Updates the display to reflect current game state
   */
  public updateDisplay(): void {
    if (!this.container || !this.isRunning) {
      return;
    }

    try {
      const gameState = this.gameEngine.getGameState();
      
      // Dispatch custom event for display update
      const event = new CustomEvent('gameStateUpdate', {
        detail: { gameState }
      });
      this.container.dispatchEvent(event);
      
      // Update debug info if enabled
      if (this.config.showDebugInfo) {
        this.updateDebugInfo(gameState);
      }
    } catch (error) {
      console.error('Error updating display:', error);
    }
  }

  /**
   * Gets the game engine instance
   */
  public getGameEngine(): GameEngine {
    return this.gameEngine;
  }

  /**
   * Gets the game controller instance
   */
  public getGameController(): GameController {
    return this.gameController;
  }

  /**
   * Gets the current configuration
   */
  public getConfig(): WebConfig {
    return { ...this.config };
  }

  /**
   * Updates the configuration
   */
  public updateConfig(newConfig: Partial<WebConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Apply theme changes immediately
    if (newConfig.theme) {
      this.applyTheme(newConfig.theme);
    }
  }

  /**
   * Checks if the interface is running
   */
  public isInterfaceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Sets up DOM event listeners
   */
  private setupEventListeners(): void {
    if (!this.container) return;

    // Listen for form submissions and button clicks
    this.container.addEventListener('submit', this.handleFormSubmit.bind(this));
    this.container.addEventListener('click', this.handleButtonClick.bind(this));
    
    // Listen for keyboard shortcuts
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * Removes DOM event listeners
   */
  private removeEventListeners(): void {
    if (!this.container) return;

    this.container.removeEventListener('submit', this.handleFormSubmit.bind(this));
    this.container.removeEventListener('click', this.handleButtonClick.bind(this));
    document.removeEventListener('keydown', this.handleKeydown.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * Handles form submissions
   */
  private async handleFormSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Determine action type from form
    const actionType = form.dataset.actionType as UserAction['type'];
    if (!actionType) return;

    const action: UserAction = {
      type: actionType,
      data: Object.fromEntries(formData.entries()),
      timestamp: Date.now()
    };

    const result = await this.handleUserAction(action);
    this.displayActionResult(result);
  }

  /**
   * Handles button clicks
   */
  private async handleButtonClick(event: Event): Promise<void> {
    const button = event.target as HTMLButtonElement;
    const actionType = button.dataset.action as UserAction['type'];
    
    if (!actionType) return;

    const action: UserAction = {
      type: actionType,
      data: button.dataset,
      timestamp: Date.now()
    };

    const result = await this.handleUserAction(action);
    this.displayActionResult(result);
  }

  /**
   * Handles keyboard shortcuts
   */
  private async handleKeydown(event: KeyboardEvent): Promise<void> {
    // Only handle shortcuts when not typing in input fields
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key) {
      case 'Enter':
        if (event.ctrlKey) {
          // Ctrl+Enter: End turn
          event.preventDefault();
          await this.handleUserAction({
            type: 'endTurn',
            timestamp: Date.now()
          });
        }
        break;
      
      case 'h':
        // H: Show help
        event.preventDefault();
        await this.handleUserAction({
          type: 'help',
          timestamp: Date.now()
        });
        break;
      
      case 's':
        // S: Show status
        event.preventDefault();
        await this.handleUserAction({
          type: 'status',
          timestamp: Date.now()
        });
        break;
    }
  }

  /**
   * Handles page visibility changes
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Page is hidden - could pause updates or save state
      if (this.config.autoSave) {
        this.saveGameState();
      }
    } else {
      // Page is visible - resume updates
      this.updateDisplay();
    }
  }

  /**
   * Converts user action to game command
   */
  private convertActionToCommand(action: UserAction): Command | null {
    switch (action.type) {
      case 'build':
        return {
          type: 'build',
          buildType: action.data?.buildType,
          quantity: parseInt(action.data?.quantity) || 1
        };
      
      case 'attack':
        return {
          type: 'attack',
          attackFleet: {
            frigates: parseInt(action.data?.frigates) || 0,
            cruisers: parseInt(action.data?.cruisers) || 0,
            battleships: parseInt(action.data?.battleships) || 0
          },
          target: action.data?.target || 'enemy'
        };
      
      case 'scan':
        return {
          type: 'scan',
          scanType: action.data?.scanType
        };
      
      case 'endTurn':
        return { type: 'end_turn' };
      
      case 'status':
        return { type: 'status' };
      
      case 'help':
        return { type: 'help' };
      
      default:
        return null;
    }
  }

  /**
   * Processes a game turn
   */
  private async processTurn(): Promise<void> {
    try {
      // The turn processing is handled by the GameController.executeCommand('end_turn')
      // This method can be used for additional web-specific turn processing
      
      // Update display after turn processing
      this.updateDisplay();
      
      // Check for game over
      if (this.gameEngine.isGameOver()) {
        this.handleGameOver();
      }
    } catch (error) {
      console.error('Error processing turn:', error);
      this.displayError(`Turn processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handles game over state
   */
  private handleGameOver(): void {
    const winner = this.gameEngine.getWinner();
    const victoryType = this.gameEngine.getVictoryType();
    
    // Dispatch game over event
    const event = new CustomEvent('gameOver', {
      detail: { winner, victoryType }
    });
    this.container?.dispatchEvent(event);
  }

  /**
   * Displays action result to user
   */
  private displayActionResult(result: CommandExecutionResult): void {
    const event = new CustomEvent('actionResult', {
      detail: result
    });
    this.container?.dispatchEvent(event);
  }

  /**
   * Displays error message to user
   */
  private displayError(message: string): void {
    const event = new CustomEvent('displayError', {
      detail: { message }
    });
    this.container?.dispatchEvent(event);
  }

  /**
   * Updates debug information display
   */
  private updateDebugInfo(gameState: GameState): void {
    if (!this.config.showDebugInfo) return;

    const debugInfo = {
      turn: gameState.turn,
      gamePhase: gameState.gamePhase,
      isGameOver: gameState.isGameOver,
      playerResources: gameState.player.resources,
      aiResources: gameState.ai.resources,
      pendingActions: this.gameController.getPendingActions().length
    };

    const event = new CustomEvent('debugUpdate', {
      detail: debugInfo
    });
    this.container?.dispatchEvent(event);
  }

  /**
   * Applies theme to the interface
   */
  private applyTheme(theme: 'dark' | 'light'): void {
    if (!this.container) return;

    this.container.classList.remove('theme-dark', 'theme-light');
    this.container.classList.add(`theme-${theme}`);
  }

  /**
   * Saves current game state (if auto-save is enabled)
   */
  private saveGameState(): void {
    if (!this.config.autoSave) return;

    try {
      const gameState = this.gameEngine.getGameState();
      localStorage.setItem('burnrate_gamestate', JSON.stringify(gameState));
      console.log('Game state saved');
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }

  /**
   * Loads game state from storage
   */
  public loadGameState(): boolean {
    try {
      const saved = localStorage.getItem('burnrate_gamestate');
      if (saved) {
        // Note: This would require a method to restore game state in GameEngine
        // For now, we'll just return true if data exists
        console.log('Saved game state found');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return false;
    }
  }

  /**
   * Clears saved game state
   */
  public clearSavedState(): void {
    try {
      localStorage.removeItem('burnrate_gamestate');
      console.log('Saved game state cleared');
    } catch (error) {
      console.error('Failed to clear saved state:', error);
    }
  }
}