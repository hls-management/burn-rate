import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../GameEngine.js';
import { GameState } from '../../models/GameState.js';

describe('GameEngine', () => {
  let gameEngine: GameEngine;

  beforeEach(() => {
    gameEngine = new GameEngine();
  });

  describe('Initialization', () => {
    it('should initialize with default game state', () => {
      const gameState = gameEngine.getGameState();
      
      expect(gameState.turn).toBe(1);
      expect(gameState.gamePhase).toBe('early');
      expect(gameState.isGameOver).toBe(false);
      expect(gameState.player.resources.metal).toBe(10000);
      expect(gameState.player.resources.energy).toBe(10000);
      expect(gameState.ai.resources.metal).toBe(10000);
      expect(gameState.ai.resources.energy).toBe(10000);
      // Check starting fleets
      expect(gameState.player.fleet.homeSystem.frigates).toBe(50);
      expect(gameState.player.fleet.homeSystem.cruisers).toBe(20);
      expect(gameState.player.fleet.homeSystem.battleships).toBe(10);
      expect(gameState.ai.fleet.homeSystem.frigates).toBe(50);
      expect(gameState.ai.fleet.homeSystem.cruisers).toBe(20);
      expect(gameState.ai.fleet.homeSystem.battleships).toBe(10);
    });

    it('should initialize with custom starting resources', () => {
      const customEngine = new GameEngine({
        startingResources: { metal: 5000, energy: 8000 }
      });
      
      const gameState = customEngine.getGameState();
      expect(gameState.player.resources.metal).toBe(5000);
      expect(gameState.player.resources.energy).toBe(8000);
      expect(gameState.ai.resources.metal).toBe(5000);
      expect(gameState.ai.resources.energy).toBe(8000);
    });

    it('should initialize with specified AI archetype', () => {
      const aggressorEngine = new GameEngine({ aiArchetype: 'aggressor' });
      // We can't directly test the AI archetype without exposing it,
      // but we can verify the engine initializes without errors
      expect(aggressorEngine.getCurrentTurn()).toBe(1);
    });
  });

  describe('Game State Access', () => {
    it('should provide read-only access to game state', () => {
      const gameState = gameEngine.getGameState();
      expect(gameState.turn).toBe(1);
      expect(gameEngine.getCurrentTurn()).toBe(1);
      expect(gameEngine.getGamePhase()).toBe('early');
      expect(gameEngine.isGameOver()).toBe(false);
    });

    it('should return undefined winner when game is not over', () => {
      expect(gameEngine.getWinner()).toBeUndefined();
      expect(gameEngine.getVictoryType()).toBeUndefined();
    });

    it('should return empty combat log initially', () => {
      const combatLog = gameEngine.getCombatLog();
      expect(combatLog).toEqual([]);
    });
  });

  describe('Game Phase Progression', () => {
    it('should progress game phases based on turn number', () => {
      // Early phase (turns 1-5)
      expect(gameEngine.getGamePhase()).toBe('early');
      
      // Simulate turns to reach mid phase
      for (let i = 0; i < 5; i++) {
        gameEngine.processTurn();
      }
      expect(gameEngine.getGamePhase()).toBe('mid');
      
      // Simulate turns to reach late phase
      for (let i = 0; i < 10; i++) {
        gameEngine.processTurn();
      }
      expect(gameEngine.getGamePhase()).toBe('late');
      
      // Simulate turns to reach endgame phase
      for (let i = 0; i < 10; i++) {
        gameEngine.processTurn();
      }
      expect(gameEngine.getGamePhase()).toBe('endgame');
    });
  });

  describe('Turn Processing', () => {
    it('should process a complete turn successfully', () => {
      const initialTurn = gameEngine.getCurrentTurn();
      const result = gameEngine.processTurn();
      
      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
      expect(gameEngine.getCurrentTurn()).toBe(initialTurn + 1);
    });

    it('should apply income each turn', () => {
      const initialState = gameEngine.getGameState();
      const initialPlayerMetal = initialState.player.resources.metal;
      const initialPlayerEnergy = initialState.player.resources.energy;
      
      gameEngine.processTurn();
      
      const newState = gameEngine.getGameState();
      // Should have gained net income (base income minus fleet upkeep)
      // Starting fleet: 50 frigates (2 metal, 1 energy each) + 20 cruisers (5 metal, 3 energy each) + 10 battleships (10 metal, 6 energy each)
      // Total upkeep: 50*2 + 20*5 + 10*10 = 100 + 100 + 100 = 300 metal
      //               50*1 + 20*3 + 10*6 = 50 + 60 + 60 = 170 energy
      // Net income: 10000 - 300 = 9700 metal, 10000 - 170 = 9830 energy
      expect(newState.player.resources.metal).toBe(initialPlayerMetal + 9700);
      expect(newState.player.resources.energy).toBe(initialPlayerEnergy + 9830);
    });

    it('should handle multiple turns without errors', () => {
      for (let i = 0; i < 10; i++) {
        const result = gameEngine.processTurn();

        expect(result.success).toBe(true);
        if (result.gameEnded) break; // Stop if game ended
      }
      
      if (!gameEngine.isGameOver()) {
        expect(gameEngine.getCurrentTurn()).toBe(11);
      }
    });
  });

  describe('Game Statistics', () => {
    it('should provide comprehensive game statistics', () => {
      const stats = gameEngine.getGameStatistics();
      
      expect(stats.turn).toBe(1);
      expect(stats.gamePhase).toBe('early');
      expect(stats.playerStats.totalFleetSize).toBe(80); // 50 + 20 + 10
      expect(stats.aiStats.totalFleetSize).toBe(80); // 50 + 20 + 10
      expect(stats.playerStats.economicStructures).toBe(0);
      expect(stats.aiStats.economicStructures).toBe(0);
      expect(stats.combatEvents).toBe(0);
    });

    it('should update statistics after turns', () => {
      gameEngine.processTurn();
      gameEngine.processTurn();
      
      const stats = gameEngine.getGameStatistics();
      expect(stats.turn).toBe(3);
      expect(stats.gamePhase).toBe('early');
    });
  });

  describe('Game State Validation', () => {
    it('should validate initial game state as valid', () => {
      const validation = gameEngine.validateGameState();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should maintain valid state after processing turns', () => {
      for (let i = 0; i < 5; i++) {
        gameEngine.processTurn();
        const validation = gameEngine.validateGameState();
        expect(validation.isValid).toBe(true);
      }
    });
  });

  describe('Game Reset', () => {
    it('should reset game to initial state', () => {
      // Process some turns
      gameEngine.processTurn();
      gameEngine.processTurn();
      expect(gameEngine.getCurrentTurn()).toBe(3);
      
      // Reset game
      gameEngine.resetGame();
      
      // Should be back to initial state
      expect(gameEngine.getCurrentTurn()).toBe(1);
      expect(gameEngine.getGamePhase()).toBe('early');
      expect(gameEngine.isGameOver()).toBe(false);
      
      const gameState = gameEngine.getGameState();
      expect(gameState.player.resources.metal).toBe(10000);
      expect(gameState.player.resources.energy).toBe(10000);
    });

    it('should reset with new configuration', () => {
      gameEngine.resetGame({
        startingResources: { metal: 15000, energy: 12000 },
        aiArchetype: 'economist'
      });
      
      const gameState = gameEngine.getGameState();
      expect(gameState.player.resources.metal).toBe(15000);
      expect(gameState.player.resources.energy).toBe(12000);
    });
  });

  describe('Victory Conditions', () => {
    it('should not end game initially', () => {
      const result = gameEngine.processTurn();
      expect(result.gameEnded).toBe(false);
      expect(result.winner).toBeUndefined();
      expect(result.victoryType).toBeUndefined();
    });

    it('should continue game when both players have fleets and resources', () => {
      // Process several turns
      for (let i = 0; i < 10; i++) {
        const result = gameEngine.processTurn();
        expect(result.gameEnded).toBe(false);
      }
      
      expect(gameEngine.isGameOver()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle turn processing gracefully', () => {
      const result = gameEngine.processTurn();
      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should maintain game state consistency', () => {
      for (let i = 0; i < 20; i++) {
        gameEngine.processTurn();
        const validation = gameEngine.validateGameState();
        if (!validation.isValid) {
          console.log(`Turn ${gameEngine.getCurrentTurn()}: ${validation.errors.join(', ')}`);
        }
        expect(validation.isValid).toBe(true);
      }
    });
  });

  describe('Combat Events', () => {
    it('should start with empty combat log', () => {
      const combatLog = gameEngine.getCombatLog();
      expect(combatLog).toEqual([]);
    });

    it('should maintain combat log through turns', () => {
      // Process several turns
      for (let i = 0; i < 5; i++) {
        const result = gameEngine.processTurn();
        expect(result.combatEvents).toBeDefined();
        expect(Array.isArray(result.combatEvents)).toBe(true);
      }
    });
  });
});