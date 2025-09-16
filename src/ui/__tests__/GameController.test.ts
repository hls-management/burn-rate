import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../../engine/GameEngine.js';
import { GameController } from '../GameController.js';
import { Command } from '../InputHandler.js';

describe('GameController', () => {
  let gameEngine: GameEngine;
  let gameController: GameController;

  beforeEach(() => {
    gameEngine = new GameEngine({
      startingResources: { metal: 10000, energy: 10000 }
    });
    gameController = new GameController(gameEngine);
  });

  describe('Build Commands', () => {
    it('should execute frigate build command successfully', () => {
      const command: Command = {
        type: 'build',
        buildType: 'frigate',
        quantity: 5
      };

      const result = gameController.executeCommand(command);

      expect(result.success).toBe(true);
      expect(result.gameStateChanged).toBe(true);
      expect(result.message).toContain('Started building 5 frigate(s)');
      
      // Check that resources were deducted
      const gameState = gameEngine.getGameState();
      expect(gameState.player.resources.metal).toBe(10000 - (4 * 5)); // 4 metal per frigate
      expect(gameState.player.resources.energy).toBe(10000 - (2 * 5)); // 2 energy per frigate
      
      // Check that build order was added
      expect(gameState.player.economy.constructionQueue).toHaveLength(1);
      expect(gameState.player.economy.constructionQueue[0].unitType).toBe('frigate');
      expect(gameState.player.economy.constructionQueue[0].quantity).toBe(5);
    });

    it('should fail build command with insufficient resources', () => {
      const command: Command = {
        type: 'build',
        buildType: 'battleship',
        quantity: 1000 // This should exceed available resources
      };

      const result = gameController.executeCommand(command);

      expect(result.success).toBe(false);
      expect(result.gameStateChanged).toBe(false);
      expect(result.message).toContain('Insufficient');
    });

    it('should execute reactor build command successfully', () => {
      const command: Command = {
        type: 'build',
        buildType: 'reactor',
        quantity: 1
      };

      const result = gameController.executeCommand(command);

      expect(result.success).toBe(true);
      expect(result.gameStateChanged).toBe(true);
      expect(result.message).toContain('Started building 1 reactor(s)');
      
      // Check that resources were deducted
      const gameState = gameEngine.getGameState();
      expect(gameState.player.resources.metal).toBe(10000 - 900); // 900 metal per reactor
      expect(gameState.player.resources.energy).toBe(10000 - 1200); // 1200 energy per reactor
    });
  });

  describe('Attack Commands', () => {
    it('should execute attack command successfully', () => {
      const command: Command = {
        type: 'attack',
        attackFleet: {
          frigates: 10,
          cruisers: 5,
          battleships: 2
        },
        target: 'ai_system'
      };

      const result = gameController.executeCommand(command);

      expect(result.success).toBe(true);
      expect(result.gameStateChanged).toBe(true);
      expect(result.message).toContain('Fleet launched!');
      expect(result.message).toContain('17 ships en route'); // 10 + 5 + 2
      
      // Check that fleet was deducted from home system
      const gameState = gameEngine.getGameState();
      const homeFleet = gameState.player.fleet.homeSystem;
      expect(homeFleet.frigates).toBe(50 - 10); // Started with 50
      expect(homeFleet.cruisers).toBe(20 - 5);  // Started with 20
      expect(homeFleet.battleships).toBe(10 - 2); // Started with 10
      
      // Check that fleet movement was created
      expect(gameState.player.fleet.inTransit.outbound).toHaveLength(1);
      const movement = gameState.player.fleet.inTransit.outbound[0];
      expect(movement.composition.frigates).toBe(10);
      expect(movement.composition.cruisers).toBe(5);
      expect(movement.composition.battleships).toBe(2);
    });

    it('should fail attack command with insufficient fleet', () => {
      const command: Command = {
        type: 'attack',
        attackFleet: {
          frigates: 1000, // More than available
          cruisers: 0,
          battleships: 0
        },
        target: 'ai_system'
      };

      const result = gameController.executeCommand(command);

      expect(result.success).toBe(false);
      expect(result.gameStateChanged).toBe(false);
      expect(result.message).toContain('Insufficient frigates');
    });
  });

  describe('Scan Commands', () => {
    it('should execute basic scan command successfully', () => {
      const command: Command = {
        type: 'scan',
        scanType: 'basic'
      };

      const result = gameController.executeCommand(command);

      expect(result.success).toBe(true);
      expect(result.gameStateChanged).toBe(true);
      expect(result.message).toContain('Enemy fleet detected');
      
      // Check that energy was deducted
      const gameState = gameEngine.getGameState();
      expect(gameState.player.resources.energy).toBe(10000 - 1000); // 1000 energy for basic scan
      
      // Check that intelligence was updated
      expect(gameState.player.intelligence.lastScanTurn).toBe(gameState.turn);
    });

    it('should execute deep scan command successfully', () => {
      const command: Command = {
        type: 'scan',
        scanType: 'deep'
      };

      const result = gameController.executeCommand(command);

      expect(result.success).toBe(true);
      expect(result.gameStateChanged).toBe(true);
      expect(result.message).toContain('Detailed scan complete');
      
      // Check that energy was deducted
      const gameState = gameEngine.getGameState();
      expect(gameState.player.resources.energy).toBe(10000 - 2500); // 2500 energy for deep scan
    });

    it('should fail scan command with insufficient energy', () => {
      // First, spend most of the energy
      const gameState = gameEngine.getGameState();
      gameState.player.resources.energy = 500; // Not enough for any scan

      const command: Command = {
        type: 'scan',
        scanType: 'basic'
      };

      const result = gameController.executeCommand(command);

      expect(result.success).toBe(false);
      expect(result.gameStateChanged).toBe(false);
      expect(result.message).toContain('Insufficient energy');
    });
  });

  describe('End Turn Command', () => {
    it('should execute end turn command successfully', () => {
      const command: Command = {
        type: 'end_turn'
      };

      const initialTurn = gameEngine.getCurrentTurn();
      const result = gameController.executeCommand(command);

      expect(result.success).toBe(true);
      expect(result.gameStateChanged).toBe(true);
      expect(result.message).toContain('completed');
      
      // Check that turn advanced
      expect(gameEngine.getCurrentTurn()).toBe(initialTurn + 1);
    });
  });

  describe('Status and Help Commands', () => {
    it('should execute status command successfully', () => {
      const command: Command = {
        type: 'status'
      };

      const result = gameController.executeCommand(command);

      expect(result.success).toBe(true);
      expect(result.gameStateChanged).toBe(false);
      expect(result.message).toBe('Information displayed');
    });

    it('should execute help command successfully', () => {
      const command: Command = {
        type: 'help'
      };

      const result = gameController.executeCommand(command);

      expect(result.success).toBe(true);
      expect(result.gameStateChanged).toBe(false);
      expect(result.message).toBe('Information displayed');
    });
  });

  describe('Invalid Commands', () => {
    it('should handle invalid command type', () => {
      const command = {
        type: 'invalid'
      } as any;

      const result = gameController.executeCommand(command);

      expect(result.success).toBe(false);
      expect(result.gameStateChanged).toBe(false);
      expect(result.message).toContain('Unknown command type');
    });

    it('should handle build command with missing parameters', () => {
      const command: Command = {
        type: 'build'
        // Missing buildType and quantity
      };

      const result = gameController.executeCommand(command);

      expect(result.success).toBe(false);
      expect(result.gameStateChanged).toBe(false);
      expect(result.message).toContain('Invalid build command');
    });
  });
});