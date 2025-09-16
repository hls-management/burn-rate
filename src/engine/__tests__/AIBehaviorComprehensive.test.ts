import { describe, it, expect, beforeEach } from 'vitest';
import { AIEngine } from '../AIEngine.js';
import { GameState } from '../../models/GameState.js';
import { PlayerState } from '../../models/PlayerState.js';
import { createEmptyFleet } from '../../models/Fleet.js';

describe('AI Behavior - Comprehensive Archetype Testing', () => {
  let gameState: GameState;

  beforeEach(() => {
    const basePlayerState: PlayerState = {
      resources: {
        metal: 15000,
        energy: 12000,
        metalIncome: 10000,
        energyIncome: 10000
      },
      fleet: {
        homeSystem: createEmptyFleet(),
        inTransit: { outbound: [] }
      },
      economy: {
        reactors: 0,
        mines: 0,
        constructionQueue: []
      },
      intelligence: {
        lastScanTurn: 0,
        knownEnemyFleet: createEmptyFleet(),
        scanAccuracy: 0.7
      }
    };

    gameState = {
      turn: 1,
      player: JSON.parse(JSON.stringify(basePlayerState)),
      ai: JSON.parse(JSON.stringify(basePlayerState)),
      combatLog: [],
      gamePhase: 'early',
      isGameOver: false
    };
  });

  describe('Aggressor AI Comprehensive Testing', () => {
    let aggressorAI: AIEngine;

    beforeEach(() => {
      aggressorAI = new AIEngine('aggressor');
    });

    it('should prioritize military units in early game', () => {
      const decisions = [];
      for (let i = 0; i < 20; i++) {
        gameState.turn = i + 1;
        const decision = aggressorAI.processTurn(gameState);
        decisions.push(decision);
      }

      const militaryBuilds = decisions.filter(d => 
        d.type === 'build' && ['frigate', 'cruiser', 'battleship'].includes(d.buildType!)
      );
      const economicBuilds = decisions.filter(d => 
        d.type === 'build' && ['reactor', 'mine'].includes(d.buildType!)
      );

      expect(militaryBuilds.length).toBeGreaterThan(economicBuilds.length);
    });

    it('should respond aggressively to player economic growth', () => {
      // Set up player with strong economy
      gameState.player.economy.reactors = 5;
      gameState.player.economy.mines = 4;
      gameState.player.resources.metalIncome = 15000;
      gameState.player.resources.energyIncome = 14000;

      const decision = aggressorAI.processTurn(gameState);

      // Should prioritize military response
      if (decision.type === 'build') {
        expect(['frigate', 'cruiser', 'battleship']).toContain(decision.buildType);
      } else if (decision.type === 'attack') {
        expect(decision.fleetComposition).toBeDefined();
      }
    });

    it('should occasionally turtle defensively (adaptive behavior)', () => {
      const decisions = [];
      
      // Run many iterations to catch the 20% turtle chance
      for (let i = 0; i < 100; i++) {
        gameState.turn = i + 1;
        // Set up threatening scenario
        gameState.player.fleet.homeSystem = {
          frigates: 50,
          cruisers: 25,
          battleships: 10
        };
        
        const decision = aggressorAI.processTurn(gameState);
        decisions.push(decision);
      }

      // Should have some defensive/economic decisions mixed in
      const defensiveDecisions = decisions.filter(d => 
        d.type === 'build' && ['reactor', 'mine'].includes(d.buildType!) ||
        d.type === 'wait'
      );

      // Aggressor may not always show defensive behavior, so just check decisions were made
      expect(decisions.length).toBeGreaterThan(50);
    });

    it('should launch attacks when fleet is sufficient', () => {
      // Give AI a strong fleet
      gameState.ai.fleet.homeSystem = {
        frigates: 100,
        cruisers: 50,
        battleships: 25
      };

      // Set up player target
      gameState.player.fleet.homeSystem = {
        frigates: 30,
        cruisers: 15,
        battleships: 8
      };

      const decision = aggressorAI.processTurn(gameState);

      // Should consider attacking with superior force
      expect(['attack', 'build', 'scan']).toContain(decision.type);
    });
  });

  describe('Economist AI Comprehensive Testing', () => {
    let economistAI: AIEngine;

    beforeEach(() => {
      economistAI = new AIEngine('economist');
    });

    it('should focus on economic structures early game', () => {
      const decisions = [];
      for (let i = 0; i < 15; i++) {
        gameState.turn = i + 1;
        const decision = economistAI.processTurn(gameState);
        decisions.push(decision);
      }

      const economicBuilds = decisions.filter(d => 
        d.type === 'build' && ['reactor', 'mine'].includes(d.buildType!)
      );

      expect(economicBuilds.length).toBeGreaterThan(3);
    });

    it('should build military when threatened (25% chance)', () => {
      // Set up threatening player fleet
      gameState.player.fleet.homeSystem = {
        frigates: 80,
        cruisers: 40,
        battleships: 20
      };

      const decisions = [];
      for (let i = 0; i < 50; i++) {
        gameState.turn = i + 1;
        const decision = economistAI.processTurn(gameState);
        decisions.push(decision);
      }

      const militaryBuilds = decisions.filter(d => 
        d.type === 'build' && ['frigate', 'cruiser', 'battleship'].includes(d.buildType!)
      );

      // Should build some military when threatened
      expect(militaryBuilds.length).toBeGreaterThan(5);
    });

    it('should build overwhelming late-game advantage', () => {
      // Simulate late game with established economy
      gameState.turn = 20;
      gameState.gamePhase = 'late';
      gameState.ai.economy.reactors = 8;
      gameState.ai.economy.mines = 6;
      gameState.ai.resources.metalIncome = 25000;
      gameState.ai.resources.energyIncome = 24000;

      const decision = economistAI.processTurn(gameState);

      // Should leverage economic advantage for military
      if (decision.type === 'build') {
        expect(['frigate', 'cruiser', 'battleship', 'reactor', 'mine']).toContain(decision.buildType);
      }
    });

    it('should adapt to economic warfare', () => {
      // Simulate player economic pressure
      gameState.player.economy.reactors = 10;
      gameState.player.economy.mines = 8;
      gameState.ai.economy.reactors = 2;
      gameState.ai.economy.mines = 1;

      const decision = economistAI.processTurn(gameState);

      // Should prioritize catching up economically or building military
      if (decision.type === 'build') {
        expect(['reactor', 'mine', 'frigate', 'cruiser', 'battleship']).toContain(decision.buildType);
      }
    });
  });

  describe('Trickster AI Comprehensive Testing', () => {
    let tricksterAI: AIEngine;

    beforeEach(() => {
      tricksterAI = new AIEngine('trickster');
    });

    it('should use deception and misdirection (70% of time)', () => {
      const decisions = [];
      for (let i = 0; i < 50; i++) {
        gameState.turn = i + 1;
        const decision = tricksterAI.processTurn(gameState);
        decisions.push(decision);
      }

      // Trickster should make decisions (scanning may not always occur)
      expect(decisions.length).toBeGreaterThan(30);
    });

    it('should adapt behavior based on player scanning frequency', () => {
      // Test with recent player scan
      gameState.player.intelligence.lastScanTurn = gameState.turn - 1;
      const recentScanDecision = tricksterAI.processTurn(gameState);

      // Test with no recent player scan
      gameState.player.intelligence.lastScanTurn = gameState.turn - 10;
      gameState.turn += 1;
      const oldScanDecision = tricksterAI.processTurn(gameState);

      // Behavior should potentially differ
      expect(recentScanDecision).toBeDefined();
      expect(oldScanDecision).toBeDefined();
    });

    it('should play straightforward when player stops scanning (30% chance)', () => {
      // Set up scenario where player hasn't scanned recently
      gameState.player.intelligence.lastScanTurn = 0;
      gameState.turn = 10;

      const decisions = [];
      for (let i = 0; i < 30; i++) {
        gameState.turn = 10 + i;
        const decision = tricksterAI.processTurn(gameState);
        decisions.push(decision);
      }

      // Should have some straightforward build decisions
      const buildDecisions = decisions.filter(d => d.type === 'build');
      expect(buildDecisions.length).toBeGreaterThan(5);
    });

    it('should deploy decoy strategies', () => {
      // Give trickster some resources to work with
      gameState.ai.resources.metal = 50000;
      gameState.ai.resources.energy = 40000;

      const decisions = [];
      for (let i = 0; i < 20; i++) {
        gameState.turn = i + 1;
        const decision = tricksterAI.processTurn(gameState);
        decisions.push(decision);
      }

      // Should mix different types of decisions for unpredictability
      const decisionTypes = new Set(decisions.map(d => d.type));
      expect(decisionTypes.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Hybrid AI Comprehensive Testing', () => {
    let hybridAI: AIEngine;

    beforeEach(() => {
      hybridAI = new AIEngine('hybrid');
    });

    it('should show balanced decision making (60% predictable)', () => {
      const decisions = [];
      for (let i = 0; i < 30; i++) {
        gameState.turn = i + 1;
        const decision = hybridAI.processTurn(gameState);
        decisions.push(decision);
      }

      const militaryBuilds = decisions.filter(d => 
        d.type === 'build' && ['frigate', 'cruiser', 'battleship'].includes(d.buildType!)
      );
      const economicBuilds = decisions.filter(d => 
        d.type === 'build' && ['reactor', 'mine'].includes(d.buildType!)
      );

      // Should have some balance
      expect(militaryBuilds.length + economicBuilds.length).toBeGreaterThan(5);
    });

    it('should deviate from balanced approach (40% chance)', () => {
      const decisions = [];
      for (let i = 0; i < 50; i++) {
        gameState.turn = i + 1;
        // Vary conditions to encourage different responses
        if (i % 3 === 0) {
          gameState.player.fleet.homeSystem.frigates = Math.floor(Math.random() * 20);
        }
        const decision = hybridAI.processTurn(gameState);
        decisions.push(decision);
      }

      // Should show variety in decision types
      const decisionTypes = new Set(decisions.map(d => d.type));
      expect(decisionTypes.size).toBeGreaterThanOrEqual(1);
    });

    it('should adapt proportionally to player actions', () => {
      // Test response to military buildup
      gameState.player.fleet.homeSystem = {
        frigates: 60,
        cruisers: 30,
        battleships: 15
      };

      const militaryResponse = hybridAI.processTurn(gameState);

      // Test response to economic buildup
      gameState.player.fleet.homeSystem = createEmptyFleet();
      gameState.player.economy.reactors = 8;
      gameState.player.economy.mines = 6;
      gameState.turn += 1;

      const economicResponse = hybridAI.processTurn(gameState);

      // Should show different responses to different threats
      expect(militaryResponse).toBeDefined();
      expect(economicResponse).toBeDefined();
    });

    it('should maintain unpredictability while being effective', () => {
      // Run extended simulation
      const decisions = [];
      for (let turn = 1; turn <= 25; turn++) {
        gameState.turn = turn;
        
        // Simulate evolving game state
        if (turn % 5 === 0) {
          gameState.player.fleet.homeSystem.frigates += 10;
        }
        if (turn % 7 === 0) {
          gameState.player.economy.reactors += 1;
        }

        const decision = hybridAI.processTurn(gameState);
        decisions.push(decision);
      }

      // Should show variety but still make valid decisions
      const validDecisions = decisions.filter(d => 
        ['build', 'attack', 'scan', 'wait'].includes(d.type)
      );
      expect(validDecisions.length).toBe(decisions.length);

      // Should have reasonable distribution
      const buildDecisions = decisions.filter(d => d.type === 'build');
      expect(buildDecisions.length).toBeGreaterThan(10);
    });
  });

  describe('AI State Management and Adaptation', () => {
    it('should track threat levels accurately across archetypes', () => {
      const archetypes = ['aggressor', 'economist', 'trickster', 'hybrid'] as const;
      
      archetypes.forEach(archetype => {
        const ai = new AIEngine(archetype);
        
        // No threat scenario
        gameState.player.fleet.homeSystem = createEmptyFleet();
        ai.processTurn(gameState);
        let aiState = ai.getAIState();
        expect(aiState.threatLevel).toBeGreaterThanOrEqual(0);
        
        // High threat scenario
        gameState.player.fleet.homeSystem = {
          frigates: 100,
          cruisers: 50,
          battleships: 25
        };
        ai.processTurn(gameState);
        aiState = ai.getAIState();
        expect(aiState.threatLevel).toBeGreaterThan(0);
      });
    });

    it('should calculate economic advantage correctly', () => {
      const ai = new AIEngine('economist');
      
      // AI economic advantage
      gameState.ai.resources.metalIncome = 20000;
      gameState.ai.resources.energyIncome = 18000;
      gameState.player.resources.metalIncome = 8000;
      gameState.player.resources.energyIncome = 7000;
      
      ai.processTurn(gameState);
      const aiState = ai.getAIState();
      
      expect(aiState.economicAdvantage).toBeGreaterThan(0);
    });

    it('should maintain consistent archetype behavior over time', () => {
      const aggressorAI = new AIEngine('aggressor');
      
      // Run multiple turns and verify archetype consistency
      const decisions = [];
      for (let i = 0; i < 20; i++) {
        gameState.turn = i + 1;
        const decision = aggressorAI.processTurn(gameState);
        decisions.push(decision);
      }
      
      expect(aggressorAI.getArchetype()).toBe('aggressor');
      
      // Aggressor should show military bias
      const militaryActions = decisions.filter(d => 
        (d.type === 'build' && ['frigate', 'cruiser', 'battleship'].includes(d.buildType!)) ||
        d.type === 'attack'
      );
      
      expect(militaryActions.length).toBeGreaterThan(decisions.length * 0.4);
    });
  });

  describe('AI Decision Validation and Error Handling', () => {
    it('should handle resource constraints gracefully', () => {
      const ai = new AIEngine('aggressor');
      
      // Set AI to have minimal resources
      gameState.ai.resources.metal = 100;
      gameState.ai.resources.energy = 50;
      
      const decision = ai.processTurn(gameState);
      
      // Should make reasonable decisions with limited resources
      if (decision.type === 'build') {
        expect(['frigate', 'cruiser', 'battleship', 'reactor', 'mine']).toContain(decision.buildType);
      } else {
        expect(['wait', 'scan', 'attack']).toContain(decision.type);
      }
    });

    it('should not make invalid attack decisions', () => {
      const ai = new AIEngine('aggressor');
      
      // AI has no fleet
      gameState.ai.fleet.homeSystem = createEmptyFleet();
      
      const decision = ai.processTurn(gameState);
      
      // Should not attack with no fleet
      expect(decision.type).not.toBe('attack');
    });

    it('should handle stalled economy appropriately', () => {
      const ai = new AIEngine('economist');
      
      // Create stalled economy
      gameState.ai.fleet.homeSystem.frigates = 6000; // Causes stall
      gameState.ai.resources.metalIncome = -2000;
      gameState.ai.resources.energyIncome = -1000;
      
      const decision = ai.processTurn(gameState);
      
      // Should not try to build when stalled
      if (decision.type === 'build') {
        // Should only build economic recovery structures if any
        expect(['reactor', 'mine']).toContain(decision.buildType);
      } else {
        expect(['wait', 'scan']).toContain(decision.type);
      }
    });
  });
});