import { describe, it, expect } from 'vitest';
import { TacticalAnalyzer } from '../TacticalAnalyzer.js';
import { FleetComposition, CombatEvent } from '../../models/GameState.js';

describe('TacticalAnalyzer', () => {
  let analyzer: TacticalAnalyzer;

  beforeEach(() => {
    analyzer = new TacticalAnalyzer();
  });

  describe('calculateUnitEffectiveness', () => {
    it('should return 0 for zero unit count', () => {
      const enemyFleet: FleetComposition = { frigates: 10, cruisers: 5, battleships: 2 };
      const effectiveness = analyzer.calculateUnitEffectiveness('frigate', 0, enemyFleet);
      expect(effectiveness).toBe(0);
    });

    it('should return 1.0 for effectiveness against empty fleet', () => {
      const emptyFleet: FleetComposition = { frigates: 0, cruisers: 0, battleships: 0 };
      const effectiveness = analyzer.calculateUnitEffectiveness('frigate', 10, emptyFleet);
      expect(effectiveness).toBe(1.0);
    });

    it('should calculate weighted effectiveness correctly', () => {
      // Fleet with only cruisers - frigates should be very effective (1.5)
      const cruiserFleet: FleetComposition = { frigates: 0, cruisers: 10, battleships: 0 };
      const effectiveness = analyzer.calculateUnitEffectiveness('frigate', 5, cruiserFleet);
      expect(effectiveness).toBe(1.5); // frigate vs cruiser effectiveness
    });

    it('should calculate mixed fleet effectiveness', () => {
      // Mixed fleet: equal parts of each unit type
      const mixedFleet: FleetComposition = { frigates: 10, cruisers: 10, battleships: 10 };
      const effectiveness = analyzer.calculateUnitEffectiveness('frigate', 5, mixedFleet);
      
      // Expected: (1.0 * 1/3) + (1.5 * 1/3) + (0.7 * 1/3) = 1.067
      expect(effectiveness).toBeCloseTo(1.067, 2);
    });
  });

  describe('determineBattleAdvantage', () => {
    it('should identify strong advantage', () => {
      const cruiserFleet: FleetComposition = { frigates: 0, cruisers: 10, battleships: 0 };
      const advantage = analyzer.determineBattleAdvantage('frigate', 5, cruiserFleet);
      
      expect(advantage.advantage).toBe('strong');
      expect(advantage.unitType).toBe('frigate');
      expect(advantage.effectivenessRatio).toBe(1.5);
      expect(advantage.explanation).toContain('strong effectiveness');
    });

    it('should identify weak advantage', () => {
      const battleshipFleet: FleetComposition = { frigates: 0, cruisers: 0, battleships: 10 };
      const advantage = analyzer.determineBattleAdvantage('frigate', 5, battleshipFleet);
      
      expect(advantage.advantage).toBe('weak');
      expect(advantage.unitType).toBe('frigate');
      expect(advantage.effectivenessRatio).toBe(0.7);
      expect(advantage.explanation).toContain('disadvantage');
    });

    it('should identify neutral advantage', () => {
      const frigateFleet: FleetComposition = { frigates: 10, cruisers: 0, battleships: 0 };
      const advantage = analyzer.determineBattleAdvantage('frigate', 5, frigateFleet);
      
      expect(advantage.advantage).toBe('neutral');
      expect(advantage.unitType).toBe('frigate');
      expect(advantage.effectivenessRatio).toBe(1.0);
      expect(advantage.explanation).toContain('balanced effectiveness');
    });
  });

  describe('calculateTacticalAdvantages', () => {
    it('should analyze all unit types in attacker fleet', () => {
      const attackerFleet: FleetComposition = { frigates: 10, cruisers: 5, battleships: 2 };
      const defenderFleet: FleetComposition = { frigates: 5, cruisers: 10, battleships: 1 };
      
      const advantages = analyzer.calculateTacticalAdvantages(attackerFleet, defenderFleet);
      
      expect(advantages).toHaveLength(3);
      expect(advantages.map(a => a.unitType)).toEqual(['frigate', 'cruiser', 'battleship']);
    });

    it('should only analyze unit types present in attacker fleet', () => {
      const attackerFleet: FleetComposition = { frigates: 10, cruisers: 0, battleships: 0 };
      const defenderFleet: FleetComposition = { frigates: 5, cruisers: 10, battleships: 1 };
      
      const advantages = analyzer.calculateTacticalAdvantages(attackerFleet, defenderFleet);
      
      expect(advantages).toHaveLength(1);
      expect(advantages[0].unitType).toBe('frigate');
    });

    it('should return empty array for empty attacker fleet', () => {
      const attackerFleet: FleetComposition = { frigates: 0, cruisers: 0, battleships: 0 };
      const defenderFleet: FleetComposition = { frigates: 5, cruisers: 10, battleships: 1 };
      
      const advantages = analyzer.calculateTacticalAdvantages(attackerFleet, defenderFleet);
      
      expect(advantages).toHaveLength(0);
    });
  });

  describe('calculateCasualtyPercentages', () => {
    it('should calculate casualty percentages correctly', () => {
      const combatEvent: CombatEvent = {
        turn: 1,
        attacker: 'player',
        attackerFleet: { frigates: 10, cruisers: 5, battleships: 2 }, // Total: 17
        defenderFleet: { frigates: 8, cruisers: 4, battleships: 1 },  // Total: 13
        outcome: 'close_battle',
        casualties: {
          attacker: { frigates: 3, cruisers: 1, battleships: 0 },    // Total: 4
          defender: { frigates: 4, cruisers: 2, battleships: 1 }     // Total: 7
        },
        survivors: {
          attacker: { frigates: 7, cruisers: 4, battleships: 2 },
          defender: { frigates: 4, cruisers: 2, battleships: 0 }
        }
      };
      
      const percentages = analyzer.calculateCasualtyPercentages(combatEvent);
      
      expect(percentages.attackerLossRate).toBeCloseTo(0.24, 2); // 4/17 ≈ 0.24
      expect(percentages.defenderLossRate).toBeCloseTo(0.54, 2); // 7/13 ≈ 0.54
    });

    it('should handle zero fleet sizes', () => {
      const combatEvent: CombatEvent = {
        turn: 1,
        attacker: 'player',
        attackerFleet: { frigates: 0, cruisers: 0, battleships: 0 },
        defenderFleet: { frigates: 0, cruisers: 0, battleships: 0 },
        outcome: 'close_battle',
        casualties: {
          attacker: { frigates: 0, cruisers: 0, battleships: 0 },
          defender: { frigates: 0, cruisers: 0, battleships: 0 }
        },
        survivors: {
          attacker: { frigates: 0, cruisers: 0, battleships: 0 },
          defender: { frigates: 0, cruisers: 0, battleships: 0 }
        }
      };
      
      const percentages = analyzer.calculateCasualtyPercentages(combatEvent);
      
      expect(percentages.attackerLossRate).toBe(0);
      expect(percentages.defenderLossRate).toBe(0);
    });
  });

  describe('calculateEffectivenessRatios', () => {
    it('should calculate effectiveness ratios for both fleets', () => {
      const attackerFleet: FleetComposition = { frigates: 10, cruisers: 0, battleships: 0 };
      const defenderFleet: FleetComposition = { frigates: 0, cruisers: 10, battleships: 0 };
      
      const ratios = analyzer.calculateEffectivenessRatios(attackerFleet, defenderFleet);
      
      expect(ratios.attackerEffectiveness).toBe(1.5); // Frigates vs cruisers
      expect(ratios.defenderEffectiveness).toBe(0.7); // Cruisers vs frigates
    });

    it('should handle empty fleets', () => {
      const attackerFleet: FleetComposition = { frigates: 0, cruisers: 0, battleships: 0 };
      const defenderFleet: FleetComposition = { frigates: 10, cruisers: 5, battleships: 2 };
      
      const ratios = analyzer.calculateEffectivenessRatios(attackerFleet, defenderFleet);
      
      expect(ratios.attackerEffectiveness).toBe(0);
      expect(ratios.defenderEffectiveness).toBeGreaterThan(0);
    });

    it('should calculate weighted effectiveness for mixed fleets', () => {
      const attackerFleet: FleetComposition = { frigates: 6, cruisers: 3, battleships: 1 }; // Total: 10
      const defenderFleet: FleetComposition = { frigates: 5, cruisers: 5, battleships: 0 }; // Total: 10
      
      const ratios = analyzer.calculateEffectivenessRatios(attackerFleet, defenderFleet);
      
      // Attacker effectiveness: (1.25 * 6 + 0.85 * 3 + 1.35 * 1) / 10 = 1.145
      expect(ratios.attackerEffectiveness).toBeCloseTo(1.15, 1);
      
      // Defender effectiveness should be calculated similarly
      expect(ratios.defenderEffectiveness).toBeGreaterThan(0);
      expect(ratios.defenderEffectiveness).toBeLessThan(2);
    });
  });

  describe('determineBattlePhases', () => {
    it('should create three battle phases', () => {
      const attackerFleet: FleetComposition = { frigates: 10, cruisers: 5, battleships: 2 };
      const defenderFleet: FleetComposition = { frigates: 8, cruisers: 4, battleships: 1 };
      
      const phases = analyzer.determineBattlePhases(attackerFleet, defenderFleet, 'close_battle');
      
      expect(phases).toHaveLength(3);
      expect(phases.map(p => p.phase)).toEqual(['opening', 'main', 'cleanup']);
    });

    it('should determine opening phase advantage based on frigate numbers', () => {
      const attackerFleet: FleetComposition = { frigates: 20, cruisers: 0, battleships: 0 };
      const defenderFleet: FleetComposition = { frigates: 5, cruisers: 0, battleships: 0 };
      
      const phases = analyzer.determineBattlePhases(attackerFleet, defenderFleet, 'decisive_attacker');
      
      const openingPhase = phases.find(p => p.phase === 'opening');
      expect(openingPhase?.advantage).toBe('attacker');
      expect(openingPhase?.description).toContain('superior frigate numbers');
    });

    it('should determine main phase advantage based on heavy units', () => {
      const attackerFleet: FleetComposition = { frigates: 5, cruisers: 10, battleships: 5 };
      const defenderFleet: FleetComposition = { frigates: 5, cruisers: 2, battleships: 1 };
      
      const phases = analyzer.determineBattlePhases(attackerFleet, defenderFleet, 'decisive_attacker');
      
      const mainPhase = phases.find(p => p.phase === 'main');
      expect(mainPhase?.advantage).toBe('attacker');
      expect(mainPhase?.description).toContain('superior heavy units');
    });

    it('should set cleanup phase based on battle outcome', () => {
      const attackerFleet: FleetComposition = { frigates: 10, cruisers: 5, battleships: 2 };
      const defenderFleet: FleetComposition = { frigates: 8, cruisers: 4, battleships: 1 };
      
      const phases = analyzer.determineBattlePhases(attackerFleet, defenderFleet, 'decisive_defender');
      
      const cleanupPhase = phases.find(p => p.phase === 'cleanup');
      expect(cleanupPhase?.advantage).toBe('defender');
      expect(cleanupPhase?.description).toContain('successfully repels attack');
    });
  });

  describe('createEnhancedCombatDisplay', () => {
    it('should create complete enhanced combat display', () => {
      const combatEvent: CombatEvent = {
        turn: 1,
        attacker: 'player',
        attackerFleet: { frigates: 10, cruisers: 5, battleships: 2 },
        defenderFleet: { frigates: 8, cruisers: 4, battleships: 1 },
        outcome: 'close_battle',
        casualties: {
          attacker: { frigates: 3, cruisers: 1, battleships: 0 },
          defender: { frigates: 4, cruisers: 2, battleships: 1 }
        },
        survivors: {
          attacker: { frigates: 7, cruisers: 4, battleships: 2 },
          defender: { frigates: 4, cruisers: 2, battleships: 0 }
        }
      };
      
      const display = analyzer.createEnhancedCombatDisplay(combatEvent);
      
      expect(display.event).toBe(combatEvent);
      expect(display.tacticalAdvantages).toHaveLength(3);
      expect(display.battlePhases).toHaveLength(3);
      expect(display.effectivenessRatios).toHaveProperty('attackerEffectiveness');
      expect(display.effectivenessRatios).toHaveProperty('defenderEffectiveness');
      expect(display.casualtyPercentages).toHaveProperty('attackerLossRate');
      expect(display.casualtyPercentages).toHaveProperty('defenderLossRate');
    });
  });

  describe('analyzeFleetBalance', () => {
    it('should identify empty fleet as unbalanced', () => {
      const emptyFleet: FleetComposition = { frigates: 0, cruisers: 0, battleships: 0 };
      const analysis = analyzer.analyzeFleetBalance(emptyFleet);
      
      expect(analysis.balance).toBe('unbalanced');
      expect(analysis.recommendation).toContain('Build a fleet');
      expect(analysis.weaknesses).toContain('No defensive capability');
    });

    it('should identify frigate-heavy fleet', () => {
      const frigateFleet: FleetComposition = { frigates: 70, cruisers: 15, battleships: 15 }; // 70% frigates
      const analysis = analyzer.analyzeFleetBalance(frigateFleet);
      
      expect(analysis.balance).toBe('frigate_heavy');
      expect(analysis.recommendation).toContain('battleships');
      expect(analysis.strengths).toContain('Fast response capability');
      expect(analysis.weaknesses).toContain('Vulnerable to battleships');
    });

    it('should identify cruiser-heavy fleet', () => {
      const cruiserFleet: FleetComposition = { frigates: 20, cruisers: 60, battleships: 20 }; // 60% cruisers
      const analysis = analyzer.analyzeFleetBalance(cruiserFleet);
      
      expect(analysis.balance).toBe('cruiser_heavy');
      expect(analysis.recommendation).toContain('frigates');
      expect(analysis.strengths).toContain('Strong against battleships');
      expect(analysis.weaknesses).toContain('Vulnerable to frigate swarms');
    });

    it('should identify battleship-heavy fleet', () => {
      const battleshipFleet: FleetComposition = { frigates: 20, cruisers: 30, battleships: 50 }; // 50% battleships
      const analysis = analyzer.analyzeFleetBalance(battleshipFleet);
      
      expect(analysis.balance).toBe('battleship_heavy');
      expect(analysis.recommendation).toContain('cruisers');
      expect(analysis.strengths).toContain('Devastating against frigates');
      expect(analysis.weaknesses).toContain('Vulnerable to cruiser focus fire');
    });

    it('should identify balanced fleet', () => {
      const balancedFleet: FleetComposition = { frigates: 40, cruisers: 35, battleships: 25 }; // Balanced ratios
      const analysis = analyzer.analyzeFleetBalance(balancedFleet);
      
      expect(analysis.balance).toBe('balanced');
      expect(analysis.recommendation).toContain('Maintain current composition');
      expect(analysis.strengths).toContain('Tactical flexibility');
      expect(analysis.strengths).toContain('No major vulnerabilities');
    });
  });
});