import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebInterface, WebConfig } from '../WebInterface.js';
import { GameEngine } from '../../engine/GameEngine.js';
import { GameInitializer } from '../../GameInitializer.js';

// Mock DOM environment
const mockContainer = {
  id: 'test-container',
  classList: {
    remove: vi.fn(),
    add: vi.fn()
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
};

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    getElementById: vi.fn().mockReturnValue(mockContainer),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    hidden: false
  },
  writable: true
});

// Mock localStorage
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  },
  writable: true
});

// Mock CustomEvent
Object.defineProperty(global, 'CustomEvent', {
  value: class MockCustomEvent {
    type: string;
    detail: any;
    
    constructor(type: string, options?: { detail?: any }) {
      this.type = type;
      this.detail = options?.detail;
    }
  },
  writable: true
});

describe('WebInterface Integration', () => {
  let gameEngine: GameEngine;
  let webInterface: WebInterface;
  let webConfig: WebConfig;

  beforeEach(async () => {
    // Initialize game using GameInitializer
    const initResult = await GameInitializer.initializeGame({
      aiArchetype: 'hybrid',
      startingResources: { metal: 10000, energy: 10000 }
    });

    expect(initResult.isValid).toBe(true);
    gameEngine = initResult.gameEngine;

    // Create web interface configuration
    webConfig = {
      containerId: 'test-container',
      showDebugInfo: true,
      autoSave: false,
      theme: 'dark'
    };

    // Create web interface
    webInterface = new WebInterface(gameEngine, webConfig);
  });

  describe('Initialization', () => {
    it('should create WebInterface with GameEngine from GameInitializer', () => {
      expect(webInterface).toBeDefined();
      expect(webInterface.getGameEngine()).toBe(gameEngine);
      expect(webInterface.getGameController()).toBeDefined();
    });

    it('should start successfully with valid configuration', async () => {
      await expect(webInterface.start()).resolves.not.toThrow();
      expect(webInterface.isInterfaceRunning()).toBe(true);
    });

    it('should validate initial game state', () => {
      const gameState = gameEngine.getGameState();
      expect(gameState.turn).toBe(1);
      expect(gameState.player.resources.metal).toBe(10000);
      expect(gameState.player.resources.energy).toBe(10000);
      expect(gameState.isGameOver).toBe(false);
    });
  });

  describe('Game Logic Integration', () => {
    beforeEach(async () => {
      await webInterface.start();
    });

    it('should execute build commands through GameController', async () => {
      const buildAction = {
        type: 'build' as const,
        data: {
          buildType: 'frigate',
          quantity: '5'
        },
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(buildAction);
      
      expect(result.success).toBe(true);
      expect(result.gameStateChanged).toBe(true);
      expect(result.message).toContain('Started building');
      
      // Verify resources were deducted
      const gameState = gameEngine.getGameState();
      expect(gameState.player.resources.metal).toBeLessThan(10000);
      expect(gameState.player.resources.energy).toBeLessThan(10000);
    });

    it('should execute attack commands through GameController', async () => {
      const attackAction = {
        type: 'attack' as const,
        data: {
          frigates: '10',
          cruisers: '5',
          battleships: '2',
          target: 'enemy'
        },
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(attackAction);
      
      expect(result.success).toBe(true);
      expect(result.gameStateChanged).toBe(true);
      expect(result.message).toContain('Fleet launched');
      
      // Verify fleet was deducted from home system
      const gameState = gameEngine.getGameState();
      expect(gameState.player.fleet.homeSystem.frigates).toBeLessThan(50);
      expect(gameState.player.fleet.homeSystem.cruisers).toBeLessThan(20);
      expect(gameState.player.fleet.homeSystem.battleships).toBeLessThan(10);
    });

    it('should execute scan commands through GameController', async () => {
      const scanAction = {
        type: 'scan' as const,
        data: {
          scanType: 'basic'
        },
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(scanAction);
      
      expect(result.success).toBe(true);
      expect(result.gameStateChanged).toBe(true);
      expect(result.message).toMatch(/scan|detected|fleet/);
      
      // Verify energy was deducted
      const gameState = gameEngine.getGameState();
      expect(gameState.player.resources.energy).toBeLessThan(10000);
    });

    it('should process end turn through GameEngine', async () => {
      const initialTurn = gameEngine.getCurrentTurn();
      
      const endTurnAction = {
        type: 'endTurn' as const,
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(endTurnAction);
      
      expect(result.success).toBe(true);
      expect(result.gameStateChanged).toBe(true);
      expect(result.message).toContain('Turn');
      
      // Verify turn was incremented
      const newTurn = gameEngine.getCurrentTurn();
      expect(newTurn).toBe(initialTurn + 1);
    });
  });

  describe('Game State Management', () => {
    beforeEach(async () => {
      await webInterface.start();
    });

    it('should update display when game state changes', async () => {
      const dispatchEventSpy = vi.spyOn(mockContainer, 'dispatchEvent');
      
      webInterface.updateDisplay();
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'gameStateUpdate',
          detail: expect.objectContaining({
            gameState: expect.any(Object)
          })
        })
      );
    });

    it('should handle game over conditions', async () => {
      const dispatchEventSpy = vi.spyOn(mockContainer, 'dispatchEvent');
      
      // Mock game over state
      vi.spyOn(gameEngine, 'isGameOver').mockReturnValue(true);
      vi.spyOn(gameEngine, 'getWinner').mockReturnValue('player');
      vi.spyOn(gameEngine, 'getVictoryType').mockReturnValue('military');
      
      // Trigger game over check
      await webInterface.handleUserAction({
        type: 'endTurn',
        timestamp: Date.now()
      });
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'gameOver',
          detail: expect.objectContaining({
            winner: 'player',
            victoryType: 'military'
          })
        })
      );
    });

    it('should save and load game state when auto-save is enabled', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem');
      const getItemSpy = vi.spyOn(localStorage, 'getItem');
      
      // Enable auto-save
      webInterface.updateConfig({ autoSave: true });
      
      // Trigger save
      webInterface.updateDisplay();
      
      // Should not save on display update, only on turn end or visibility change
      expect(setItemSpy).not.toHaveBeenCalled();
      
      // Test load
      const mockGameState = JSON.stringify({ turn: 5, test: true });
      getItemSpy.mockReturnValue(mockGameState);
      
      const hasState = webInterface.loadGameState();
      expect(hasState).toBe(true);
      expect(getItemSpy).toHaveBeenCalledWith('burnrate_gamestate');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await webInterface.start();
    });

    it('should handle invalid commands gracefully', async () => {
      const invalidAction = {
        type: 'invalid' as any,
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(invalidAction);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid action type');
      expect(result.gameStateChanged).toBe(false);
    });

    it('should handle insufficient resources gracefully', async () => {
      const expensiveBuildAction = {
        type: 'build' as const,
        data: {
          buildType: 'battleship',
          quantity: '1000' // More than we can afford
        },
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(expensiveBuildAction);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient');
      expect(result.gameStateChanged).toBe(false);
    });

    it('should handle interface not running state', async () => {
      webInterface.stop();
      
      const action = {
        type: 'status' as const,
        timestamp: Date.now()
      };

      const result = await webInterface.handleUserAction(action);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Interface is not running');
      expect(result.gameStateChanged).toBe(false);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration dynamically', () => {
      const newConfig = {
        showDebugInfo: false,
        theme: 'light' as const
      };

      webInterface.updateConfig(newConfig);
      
      const currentConfig = webInterface.getConfig();
      expect(currentConfig.showDebugInfo).toBe(false);
      expect(currentConfig.theme).toBe('light');
    });

    it('should apply theme changes immediately', async () => {
      await webInterface.start(); // Need to start interface first
      
      const addClassSpy = vi.spyOn(mockContainer.classList, 'add');
      const removeClassSpy = vi.spyOn(mockContainer.classList, 'remove');
      
      webInterface.updateConfig({ theme: 'light' });
      
      expect(removeClassSpy).toHaveBeenCalledWith('theme-dark', 'theme-light');
      expect(addClassSpy).toHaveBeenCalledWith('theme-light');
    });
  });

  afterEach(() => {
    if (webInterface && webInterface.isInterfaceRunning()) {
      webInterface.stop();
    }
    vi.clearAllMocks();
  });
});