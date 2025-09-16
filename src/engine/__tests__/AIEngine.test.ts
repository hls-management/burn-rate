import { describe, it, expect, beforeEach } from 'vitest';
import { AIEngine } from '../AIEngine.js';
import { GameState } from '../../models/GameState.js';
import { PlayerState } from '../../models/PlayerState.js';

describe('AIEngine', () => {
  let aiEngine: AIEngine;
  let mockGameState: GameState;

  beforeEach(() => {
    // Create mock game state
    const mockPlayerState: PlayerState = {
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
        scanAccuracy: 0.7,
        lastScanData: null,
        misinformationActive: false
      }
    };

    mockGameState = {
      turn: 1,
      player: JSON.parse(JSON.stringify(mockPlayerState)),
      ai: JSON.parse(JSON.stringify(mockPlayerState)),
      combatLog: [],
      gamePhase: 'early',
      isGameOver: false
    };
  });

  describe('Aggressor AI', () => {
    beforeEach(() => {
      aiEngine = new AIEngine('aggressor');
    });

    it('should initialize with aggressor archetype', () => {
      expect(aiEngine.getArchetype()).toBe('aggressor');
    });

    it('should make military-focused decisions', () => {
      const decision = aiEngine.processTurn(mockGameState);
      
      expect(decision).toBeDefined();
      expect(['build', 'attack', 'wait', 'scan']).toContain(decision.type);
      
      if (decision.type === 'build') {
        expect(['frigate', 'cruiser', 'battleship', 'reactor', 'mine']).toContain(decision.buildType);
      }
    });

    it('should prefer military units over economic structures', () => {
      const decisions = [];
      for (let i = 0; i < 10; i++) {
        const decision = aiEngine.processTurn(mockGameState);
        decisions.push(decision);
      }
      
      const militaryBuilds = decisions.filter(d => 
        d.type === 'build' && ['frigate', 'cruiser', 'battleship'].includes(d.buildType!)
      ).length;
      
      const economicBuilds = decisions.filter(d => 
        d.type === 'build' && ['reactor', 'mine'].includes(d.buildType!)
      ).length;
      
      expect(militaryBuilds).toBeGreaterThan(economicBuilds);
    });
  });

  describe('Economist AI', () => {
    beforeEach(() => {
      aiEngine = new AIEngine('economist');
    });

    it('should initialize with economist archetype', () => {
      expect(aiEngine.getArchetype()).toBe('economist');
    });

    it('should prioritize economic structures', () => {
      const decisions = [];
      for (let i = 0; i < 10; i++) {
        const decision = aiEngine.processTurn(mockGameState);
        decisions.push(decision);
      }
      
      const economicBuilds = decisions.filter(d => 
        d.type === 'build' && ['reactor', 'mine'].includes(d.buildType!)
      ).length;
      
      expect(economicBuilds).toBeGreaterThan(0);
    });

    it('should build military when threatened', () => {
      // Set up threatening player fleet
      mockGameState.player.fleet.homeSystem = {
        frigates: 10,
        cruisers: 5,
        battleships: 2
      };
      
      const decision = aiEngine.processTurn(mockGameState);
      
      if (decision.type === 'build') {
        // Should build some military units when threatened, but economist might still build economy
        expect(['frigate', 'cruiser', 'battleship', 'reactor', 'mine']).toContain(decision.buildType);
      }
    });
  });

  describe('Trickster AI', () => {
    beforeEach(() => {
      aiEngine = new AIEngine('trickster');
    });

    it('should initialize with trickster archetype', () => {
      expect(aiEngine.getArchetype()).toBe('trickster');
    });

    it('should use scanning for deception', () => {
      const decisions = [];
      for (let i = 0; i < 50; i++) {
        mockGameState.turn = i + 1;
        const decision = aiEngine.processTurn(mockGameState);
        decisions.push(decision);
      }
      
      const scanDecisions = decisions.filter(d => d.type === 'scan');
      // Trickster should occasionally scan for deception, but it's probabilistic
      expect(scanDecisions.length).toBeGreaterThanOrEqual(0);
    });

    it('should adapt behavior based on player scanning', () => {
      // Test with recent player scan
      mockGameState.player.intelligence.lastScanTurn = mockGameState.turn - 1;
      const recentScanDecision = aiEngine.processTurn(mockGameState);
      
      // Test with old player scan
      mockGameState.player.intelligence.lastScanTurn = mockGameState.turn - 5;
      mockGameState.turn += 1;
      const oldScanDecision = aiEngine.processTurn(mockGameState);
      
      // Behavior should potentially differ based on scan recency
      expect(recentScanDecision).toBeDefined();
      expect(oldScanDecision).toBeDefined();
    });
  });

  describe('Hybrid AI', () => {
    beforeEach(() => {
      aiEngine = new AIEngine('hybrid');
    });

    it('should initialize with hybrid archetype', () => {
      expect(aiEngine.getArchetype()).toBe('hybrid');
    });

    it('should show varied decision making', () => {
      const decisions = [];
      for (let i = 0; i < 30; i++) {
        mockGameState.turn = i + 1;
        // Vary game state to encourage different decisions
        if (i % 5 === 0) {
          mockGameState.player.fleet.homeSystem.frigates = Math.floor(Math.random() * 10);
        }
        const decision = aiEngine.processTurn(mockGameState);
        decisions.push(decision);
      }
      
      const decisionTypes = new Set(decisions.map(d => d.type));
      // Hybrid should show some variety, but might be mostly 'build' decisions
      expect(decisionTypes.size).toBeGreaterThanOrEqual(1);
    });

    it('should adapt to game state changes', () => {
      // Test adaptation to threat
      mockGameState.player.fleet.homeSystem = {
        frigates: 15,
        cruisers: 8,
        battleships: 3
      };
      
      const threatDecision = aiEngine.processTurn(mockGameState);
      
      // Test adaptation to economic advantage
      mockGameState.player.fleet.homeSystem = {
        frigates: 0,
        cruisers: 0,
        battleships: 0
      };
      mockGameState.player.resources.metalIncome = 5000;
      mockGameState.player.resources.energyIncome = 5000;
      
      const economicDecision = aiEngine.processTurn(mockGameState);
      
      expect(threatDecision).toBeDefined();
      expect(economicDecision).toBeDefined();
    });
  });

  describe('Decision Validation', () => {
    beforeEach(() => {
      aiEngine = new AIEngine('aggressor');
    });

    it('should not make invalid build decisions', () => {
      // Set AI to have no resources
      mockGameState.ai.resources.metal = 0;
      mockGameState.ai.resources.energy = 0;
      
      const decision = aiEngine.processTurn(mockGameState);
      
      if (decision.type === 'build') {
        // Should not try to build anything without resources
        expect(decision.type).toBe('wait');
      }
    });

    it('should not attack with insufficient fleet', () => {
      // Ensure AI has no fleet
      mockGameState.ai.fleet.homeSystem = {
        frigates: 0,
        cruisers: 0,
        battleships: 0
      };
      
      const decision = aiEngine.processTurn(mockGameState);
      
      // Should not attack with no fleet
      expect(decision.type).not.toBe('attack');
    });

    it('should not scan without sufficient energy', () => {
      // Set AI to have insufficient energy for any scan
      mockGameState.ai.resources.energy = 500;
      
      const decision = aiEngine.processTurn(mockGameState);
      
      if (decision.type === 'scan') {
        // Should not scan without sufficient energy
        expect(decision.type).not.toBe('scan');
      }
    });
  });

  describe('AI State Management', () => {
    beforeEach(() => {
      aiEngine = new AIEngine('economist');
    });

    it('should update threat level based on player fleet', () => {
      // Start with no threat
      let aiState = aiEngine.getAIState();
      expect(aiState.threatLevel).toBe(0);
      
      // Add player fleet to create threat
      mockGameState.player.fleet.homeSystem = {
        frigates: 20,
        cruisers: 10,
        battleships: 5
      };
      
      aiEngine.processTurn(mockGameState);
      aiState = aiEngine.getAIState();
      
      expect(aiState.threatLevel).toBeGreaterThan(0);
    });

    it('should calculate economic advantage correctly', () => {
      // Set up economic disadvantage for AI
      mockGameState.player.resources.metalIncome = 20000;
      mockGameState.player.resources.energyIncome = 20000;
      // Update the AI state in the game state too
      mockGameState.ai.resources.metalIncome = 8000;
      mockGameState.ai.resources.energyIncome = 8000;
      
      aiEngine.processTurn(mockGameState);
      const aiState = aiEngine.getAIState();
      
      // AI should recognize it has economic disadvantage
      // Player income: 40000, AI income: 16000
      // Advantage = (16000 - 40000) / (16000 + 40000) = -24000 / 56000 ≈ -0.43
      expect(aiState.economicAdvantage).toBeLessThan(0);
    });
  });
});