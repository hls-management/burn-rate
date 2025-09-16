import { describe, it, expect } from 'vitest';
import {
  validateGameState,
  validateGamePhase,
  validatePlayerState,
  validateResources,
  validateFleet,
  validateEconomy,
  validateStateTransition,
  createInitialGameState,
  determineGamePhase
} from '../validation.js';
import { GameState, PlayerState, GamePhase } from '../index.js';

describe('Game State Validation', () => {
  const createValidPlayerState = (): PlayerState => ({
    resources: {
      metal: 10000,
      energy: 10000,
      metalIncome: 10000,
      energyIncome: 10000
    },
    fleet: {
      homeSystem: {
        frigates: 0,
        cruisers: 0,
        battleships: 0
      },
      inTransit: {
        outbound: []
      }
    },
    economy: {
      reactors: 0,
      mines: 0,
      constructionQueue: []
    },
    intelligence: {
      lastScanTurn: 0,
      knownEnemyFleet: {
        frigates: 0,
        cruisers: 0,
        battleships: 0
      },
      scanAccuracy: 0.7
    }
  });

  const createValidGameState = (): GameState => ({
    turn: 1,
    player: createValidPlayerState(),
    ai: createValidPlayerState(),
    combatLog: [],
    gamePhase: 'early',
    isGameOver: false
  });

  describe('validateGameState', () => {
    it('should validate a correct game state', () => {
      const gameState = createValidGameState();
      const result = validateGameState(gameState);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid turn number', () => {
      const gameState = createValidGameState();
      gameState.turn = 0;
      const result = validateGameState(gameState);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Turn number must be at least 1');
    });

    it('should require winner when game is over', () => {
      const gameState = createValidGameState();
      gameState.isGameOver = true;
      const result = validateGameState(gameState);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Game over state requires a winner');
      expect(result.errors).toContain('Game over state requires a victory type');
    });
  });

  describe('validateGamePhase', () => {
    it('should validate correct phase transitions', () => {
      expect(validateGamePhase('early', 1).isValid).toBe(true);
      expect(validateGamePhase('early', 5).isValid).toBe(true);
      expect(validateGamePhase('mid', 10).isValid).toBe(true);
      expect(validateGamePhase('late', 20).isValid).toBe(true);
      expect(validateGamePhase('endgame', 30).isValid).toBe(true);
    });

    it('should reject incorrect phase for turn', () => {
      const result = validateGamePhase('late', 3);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("should be in 'early' phase");
    });
  });

  describe('validateResources', () => {
    it('should validate normal resource values', () => {
      const resources = {
        metal: 5000,
        energy: 3000,
        metalIncome: 8000,
        energyIncome: 7000
      };
      const result = validateResources(resources);
      expect(result.isValid).toBe(true);
    });

    it('should allow negative resources but within bounds', () => {
      const resources = {
        metal: -1000,
        energy: -500,
        metalIncome: -100,
        energyIncome: -200
      };
      const result = validateResources(resources);
      expect(result.isValid).toBe(true);
    });

    it('should reject unreasonably negative values', () => {
      const resources = {
        metal: -200000,
        energy: 0,
        metalIncome: 0,
        energyIncome: 0
      };
      const result = validateResources(resources);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Metal resources are unreasonably negative');
    });
  });

  describe('validateFleet', () => {
    it('should validate normal fleet composition', () => {
      const fleet = {
        homeSystem: {
          frigates: 10,
          cruisers: 5,
          battleships: 2
        },
        inTransit: {
          outbound: []
        }
      };
      const result = validateFleet(fleet);
      expect(result.isValid).toBe(true);
    });

    it('should reject negative fleet counts', () => {
      const fleet = {
        homeSystem: {
          frigates: -1,
          cruisers: 0,
          battleships: 0
        },
        inTransit: {
          outbound: []
        }
      };
      const result = validateFleet(fleet);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Frigate count cannot be negative');
    });

    it('should validate fleet movements', () => {
      const fleet = {
        homeSystem: {
          frigates: 0,
          cruisers: 0,
          battleships: 0
        },
        inTransit: {
          outbound: [{
            composition: { frigates: 5, cruisers: 2, battleships: 1 },
            target: 'enemy_system',
            arrivalTurn: 3,
            returnTurn: 4,
            missionType: 'outbound' as const
          }]
        }
      };
      const result = validateFleet(fleet);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateEconomy', () => {
    it('should validate normal economy state', () => {
      const economy = {
        reactors: 2,
        mines: 3,
        constructionQueue: [{
          unitType: 'frigate' as const,
          quantity: 5,
          turnsRemaining: 1,
          resourceDrainPerTurn: { metal: 20, energy: 10 }
        }]
      };
      const result = validateEconomy(economy);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid build orders', () => {
      const economy = {
        reactors: 0,
        mines: 0,
        constructionQueue: [{
          unitType: 'invalid_type' as any,
          quantity: 0,
          turnsRemaining: -1,
          resourceDrainPerTurn: { metal: -5, energy: 10 }
        }]
      };
      const result = validateEconomy(economy);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateStateTransition', () => {
    it('should validate normal turn progression', () => {
      const prevState = createValidGameState();
      const newState = { ...prevState, turn: 2, gamePhase: 'early' as GamePhase };
      const result = validateStateTransition(prevState, newState);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid turn increments', () => {
      const prevState = createValidGameState();
      const newState = { ...prevState, turn: 3 };
      const result = validateStateTransition(prevState, newState);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Turn must increment by 1, got 1 -> 3');
    });

    it('should reject phase regression', () => {
      const prevState = { ...createValidGameState(), gamePhase: 'mid' as GamePhase };
      const newState = { ...prevState, turn: 2, gamePhase: 'early' as GamePhase };
      const result = validateStateTransition(prevState, newState);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Game phase cannot regress');
    });
  });

  describe('createInitialGameState', () => {
    it('should create valid initial game state', () => {
      const playerState = createValidPlayerState();
      const aiState = createValidPlayerState();
      const gameState = createInitialGameState(playerState, aiState);
      
      expect(gameState.turn).toBe(1);
      expect(gameState.gamePhase).toBe('early');
      expect(gameState.isGameOver).toBe(false);
      expect(gameState.combatLog).toHaveLength(0);
    });

    it('should throw error for invalid initial state', () => {
      const invalidPlayerState = createValidPlayerState();
      invalidPlayerState.resources.metal = -200000; // Invalid
      const aiState = createValidPlayerState();
      
      expect(() => createInitialGameState(invalidPlayerState, aiState)).toThrow();
    });
  });

  describe('determineGamePhase', () => {
    it('should determine correct phases based on turn', () => {
      expect(determineGamePhase(1)).toBe('early');
      expect(determineGamePhase(5)).toBe('early');
      expect(determineGamePhase(6)).toBe('mid');
      expect(determineGamePhase(15)).toBe('mid');
      expect(determineGamePhase(16)).toBe('late');
      expect(determineGamePhase(25)).toBe('late');
      expect(determineGamePhase(26)).toBe('endgame');
      expect(determineGamePhase(100)).toBe('endgame');
    });
  });
});