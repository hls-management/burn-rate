import { describe, it, expect } from 'vitest';
import {
  validateFleetComposition,
  validateFleetMovement,
  getTotalFleetSize,
  calculateFleetUpkeep,
  calculateFleetBuildCost,
  addFleetCompositions,
  subtractFleetCompositions,
  canAffordFleetComposition,
  createEmptyFleet,
  isFleetEmpty,
  calculateFleetStrength,
  createFleetMovement,
  generateRandomFactor,
  calculateUnitTypeStrength,
  isFleetInTransit,
  canRecallFleet,
  updateFleetMissionType,
  processFleetMovements,
  isHomeSystemVulnerable,
  getCounterAttackWindow,
  getVisibleFleets,
  createReturningFleet,
  determineBattleOutcome,
  calculateCasualties,
  resolveCombat,
  checkFleetElimination,
  processCombatMovement,
  checkVictoryConditions,
  UNIT_STATS
} from '../Fleet.js';
import { FleetComposition, FleetMovement } from '../index.js';

describe('Fleet Management', () => {
  const sampleFleet: FleetComposition = {
    frigates: 10,
    cruisers: 5,
    battleships: 2
  };

  const emptyFleet: FleetComposition = {
    frigates: 0,
    cruisers: 0,
    battleships: 0
  };

  describe('validateFleetComposition', () => {
    it('should validate a normal fleet composition', () => {
      const result = validateFleetComposition(sampleFleet);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative unit counts', () => {
      const invalidFleet: FleetComposition = {
        frigates: -1,
        cruisers: 0,
        battleships: 0
      };
      const result = validateFleetComposition(invalidFleet);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Frigate count cannot be negative');
    });

    it('should reject unreasonably large fleets', () => {
      const massiveFleet: FleetComposition = {
        frigates: 2000000,
        cruisers: 0,
        battleships: 0
      };
      const result = validateFleetComposition(massiveFleet);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unit counts exceed reasonable maximum');
    });

    it('should validate empty fleet', () => {
      const result = validateFleetComposition(emptyFleet);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateFleetMovement', () => {
    const validMovement: FleetMovement = {
      composition: sampleFleet,
      target: 'enemy_system',
      arrivalTurn: 5,
      returnTurn: 7,
      missionType: 'outbound'
    };

    it('should validate a normal fleet movement', () => {
      const result = validateFleetMovement(validMovement, 3);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject movement with arrival in the past', () => {
      const pastMovement = { ...validMovement, arrivalTurn: 2 };
      const result = validateFleetMovement(pastMovement, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Arrival turn must be in the future');
    });

    it('should reject movement with invalid return timing', () => {
      const invalidMovement = { ...validMovement, returnTurn: 4 };
      const result = validateFleetMovement(invalidMovement, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Return turn must be after arrival turn');
    });

    it('should reject empty fleet movement', () => {
      const emptyMovement = { ...validMovement, composition: emptyFleet };
      const result = validateFleetMovement(emptyMovement, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot send empty fleet');
    });

    it('should reject movement with empty target', () => {
      const noTargetMovement = { ...validMovement, target: '' };
      const result = validateFleetMovement(noTargetMovement, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Movement target cannot be empty');
    });
  });

  describe('getTotalFleetSize', () => {
    it('should calculate total fleet size correctly', () => {
      expect(getTotalFleetSize(sampleFleet)).toBe(17); // 10 + 5 + 2
      expect(getTotalFleetSize(emptyFleet)).toBe(0);
    });
  });

  describe('calculateFleetUpkeep', () => {
    it('should calculate upkeep costs correctly', () => {
      const upkeep = calculateFleetUpkeep(sampleFleet);
      
      // 10 frigates * 2 metal + 5 cruisers * 5 metal + 2 battleships * 10 metal = 65 metal
      // 10 frigates * 1 energy + 5 cruisers * 3 energy + 2 battleships * 6 energy = 37 energy
      expect(upkeep.metal).toBe(65);
      expect(upkeep.energy).toBe(37);
    });

    it('should return zero for empty fleet', () => {
      const upkeep = calculateFleetUpkeep(emptyFleet);
      expect(upkeep.metal).toBe(0);
      expect(upkeep.energy).toBe(0);
    });
  });

  describe('calculateFleetBuildCost', () => {
    it('should calculate build costs correctly', () => {
      const cost = calculateFleetBuildCost(sampleFleet);
      
      // 10 frigates * 4 metal + 5 cruisers * 10 metal + 2 battleships * 20 metal = 130 metal
      // 10 frigates * 2 energy + 5 cruisers * 6 energy + 2 battleships * 12 energy = 74 energy
      expect(cost.metal).toBe(130);
      expect(cost.energy).toBe(74);
    });
  });

  describe('addFleetCompositions', () => {
    it('should add fleet compositions correctly', () => {
      const fleet1: FleetComposition = { frigates: 5, cruisers: 3, battleships: 1 };
      const fleet2: FleetComposition = { frigates: 2, cruisers: 1, battleships: 1 };
      
      const result = addFleetCompositions(fleet1, fleet2);
      expect(result).toEqual({ frigates: 7, cruisers: 4, battleships: 2 });
    });
  });

  describe('subtractFleetCompositions', () => {
    it('should subtract fleet compositions correctly', () => {
      const fleet1: FleetComposition = { frigates: 10, cruisers: 5, battleships: 2 };
      const fleet2: FleetComposition = { frigates: 3, cruisers: 2, battleships: 1 };
      
      const result = subtractFleetCompositions(fleet1, fleet2);
      expect(result).toEqual({ frigates: 7, cruisers: 3, battleships: 1 });
    });

    it('should prevent negative values', () => {
      const fleet1: FleetComposition = { frigates: 2, cruisers: 1, battleships: 0 };
      const fleet2: FleetComposition = { frigates: 5, cruisers: 3, battleships: 1 };
      
      const result = subtractFleetCompositions(fleet1, fleet2);
      expect(result).toEqual({ frigates: 0, cruisers: 0, battleships: 0 });
    });
  });

  describe('canAffordFleetComposition', () => {
    it('should return true when fleet is affordable', () => {
      const available: FleetComposition = { frigates: 10, cruisers: 5, battleships: 2 };
      const required: FleetComposition = { frigates: 5, cruisers: 3, battleships: 1 };
      
      expect(canAffordFleetComposition(available, required)).toBe(true);
    });

    it('should return false when fleet is not affordable', () => {
      const available: FleetComposition = { frigates: 2, cruisers: 1, battleships: 0 };
      const required: FleetComposition = { frigates: 5, cruisers: 3, battleships: 1 };
      
      expect(canAffordFleetComposition(available, required)).toBe(false);
    });
  });

  describe('createEmptyFleet', () => {
    it('should create an empty fleet', () => {
      const fleet = createEmptyFleet();
      expect(fleet).toEqual({ frigates: 0, cruisers: 0, battleships: 0 });
    });
  });

  describe('isFleetEmpty', () => {
    it('should identify empty fleets', () => {
      expect(isFleetEmpty(emptyFleet)).toBe(true);
      expect(isFleetEmpty(sampleFleet)).toBe(false);
    });
  });

  describe('generateRandomFactor', () => {
    it('should generate factors within valid range', () => {
      for (let i = 0; i < 100; i++) {
        const factor = generateRandomFactor();
        expect(factor).toBeGreaterThanOrEqual(0.8);
        expect(factor).toBeLessThanOrEqual(1.2);
      }
    });
  });

  describe('calculateUnitTypeStrength', () => {
    it('should calculate frigate strength correctly', () => {
      const enemyFleet: FleetComposition = { frigates: 5, cruisers: 10, battleships: 2 };
      const fixedRandomFactor = 1.0;
      
      const strength = calculateUnitTypeStrength(10, 'frigate', enemyFleet, fixedRandomFactor);
      
      // 10 frigates vs (5 frigates * 1.0 + 10 cruisers * 1.5 + 2 battleships * 0.7) * 1.0
      // = 10 * (5 + 15 + 1.4) = 10 * 21.4 = 214
      expect(strength).toBe(214);
    });

    it('should calculate cruiser strength correctly', () => {
      const enemyFleet: FleetComposition = { frigates: 5, cruisers: 10, battleships: 2 };
      const fixedRandomFactor = 1.0;
      
      const strength = calculateUnitTypeStrength(8, 'cruiser', enemyFleet, fixedRandomFactor);
      
      // 8 cruisers vs (5 frigates * 0.7 + 10 cruisers * 1.0 + 2 battleships * 1.5) * 1.0
      // = 8 * (3.5 + 10 + 3) = 8 * 16.5 = 132
      expect(strength).toBe(132);
    });

    it('should calculate battleship strength correctly', () => {
      const enemyFleet: FleetComposition = { frigates: 5, cruisers: 10, battleships: 2 };
      const fixedRandomFactor = 1.0;
      
      const strength = calculateUnitTypeStrength(3, 'battleship', enemyFleet, fixedRandomFactor);
      
      // 3 battleships vs (5 frigates * 1.5 + 10 cruisers * 0.7 + 2 battleships * 1.0) * 1.0
      // = 3 * (7.5 + 7 + 2) = 3 * 16.5 = 49.5
      expect(strength).toBe(49.5);
    });

    it('should return 0 for zero units', () => {
      const enemyFleet: FleetComposition = { frigates: 5, cruisers: 10, battleships: 2 };
      const strength = calculateUnitTypeStrength(0, 'frigate', enemyFleet, 1.0);
      expect(strength).toBe(0);
    });

    it('should apply random factor correctly', () => {
      const enemyFleet: FleetComposition = { frigates: 10, cruisers: 0, battleships: 0 };
      
      const strengthLow = calculateUnitTypeStrength(10, 'frigate', enemyFleet, 0.8);
      const strengthHigh = calculateUnitTypeStrength(10, 'frigate', enemyFleet, 1.2);
      
      expect(strengthHigh).toBeGreaterThan(strengthLow);
      expect(strengthHigh / strengthLow).toBeCloseTo(1.5, 1); // 1.2 / 0.8 = 1.5
    });
  });

  describe('calculateFleetStrength', () => {
    it('should calculate fleet strength with deterministic random factors', () => {
      const frigateFleet: FleetComposition = { frigates: 10, cruisers: 0, battleships: 0 };
      const cruiserFleet: FleetComposition = { frigates: 0, cruisers: 10, battleships: 0 };
      
      const fixedFactors = { frigate: 1.0, cruiser: 1.0, battleship: 1.0 };
      const strength = calculateFleetStrength(frigateFleet, cruiserFleet, fixedFactors);
      
      // 10 frigates vs 10 cruisers with 1.5x effectiveness = 10 * 10 * 1.5 = 150
      expect(strength).toBe(150);
    });

    it('should demonstrate rock-paper-scissors effectiveness', () => {
      const fixedFactors = { frigate: 1.0, cruiser: 1.0, battleship: 1.0 };
      
      // Equal numbers test
      const equalFleet: FleetComposition = { frigates: 10, cruisers: 10, battleships: 10 };
      
      // Frigates vs Cruisers (advantage)
      const frigateVsCruiser = calculateFleetStrength(
        { frigates: 10, cruisers: 0, battleships: 0 },
        { frigates: 0, cruisers: 10, battleships: 0 },
        fixedFactors
      );
      
      // Cruisers vs Frigates (disadvantage)
      const cruiserVsFrigate = calculateFleetStrength(
        { frigates: 0, cruisers: 10, battleships: 0 },
        { frigates: 10, cruisers: 0, battleships: 0 },
        fixedFactors
      );
      
      expect(frigateVsCruiser).toBeGreaterThan(cruiserVsFrigate);
      expect(frigateVsCruiser / cruiserVsFrigate).toBeCloseTo(2.14, 1); // 1.5 / 0.7 ≈ 2.14
    });

    it('should handle mixed fleet compositions', () => {
      const mixedAttacker: FleetComposition = { frigates: 5, cruisers: 3, battleships: 2 };
      const mixedDefender: FleetComposition = { frigates: 4, cruisers: 4, battleships: 4 };
      
      const fixedFactors = { frigate: 1.0, cruiser: 1.0, battleship: 1.0 };
      const strength = calculateFleetStrength(mixedAttacker, mixedDefender, fixedFactors);
      
      // Manual calculation:
      // Frigates: 5 * (4*1.0 + 4*1.5 + 4*0.7) = 5 * 12.8 = 64
      // Cruisers: 3 * (4*0.7 + 4*1.0 + 4*1.5) = 3 * 12.8 = 38.4
      // Battleships: 2 * (4*1.5 + 4*0.7 + 4*1.0) = 2 * 12.8 = 25.6
      // Total: 64 + 38.4 + 25.6 = 128
      expect(strength).toBe(128);
    });

    it('should return 0 for empty attacking fleet', () => {
      const fixedFactors = { frigate: 1.0, cruiser: 1.0, battleship: 1.0 };
      const strength = calculateFleetStrength(emptyFleet, sampleFleet, fixedFactors);
      expect(strength).toBe(0);
    });

    it('should return 0 when attacking empty fleet', () => {
      const fixedFactors = { frigate: 1.0, cruiser: 1.0, battleship: 1.0 };
      const strength = calculateFleetStrength(sampleFleet, emptyFleet, fixedFactors);
      expect(strength).toBe(0);
    });

    it('should use random factors when not provided', () => {
      const frigateFleet: FleetComposition = { frigates: 10, cruisers: 0, battleships: 0 };
      const cruiserFleet: FleetComposition = { frigates: 0, cruisers: 10, battleships: 0 };
      
      // Run multiple times to ensure randomness
      const strengths = [];
      for (let i = 0; i < 10; i++) {
        strengths.push(calculateFleetStrength(frigateFleet, cruiserFleet));
      }
      
      // Should have some variation due to random factors
      const minStrength = Math.min(...strengths);
      const maxStrength = Math.max(...strengths);
      expect(maxStrength).toBeGreaterThan(minStrength);
    });
  });

  describe('createFleetMovement', () => {
    it('should create a valid fleet movement', () => {
      const movement = createFleetMovement(sampleFleet, 'target_system', 5);
      
      expect(movement.composition).toEqual(sampleFleet);
      expect(movement.target).toBe('target_system');
      expect(movement.arrivalTurn).toBe(6); // currentTurn + 1
      expect(movement.returnTurn).toBe(8);  // currentTurn + 3
      expect(movement.missionType).toBe('outbound');
    });
  });

  describe('isFleetInTransit', () => {
    const movement: FleetMovement = {
      composition: sampleFleet,
      target: 'enemy_system',
      arrivalTurn: 6,
      returnTurn: 8,
      missionType: 'outbound'
    };

    it('should detect fleet in transit during departure turn', () => {
      expect(isFleetInTransit(movement, 5)).toBe(true); // Departure turn
    });

    it('should detect fleet in transit during arrival turn', () => {
      expect(isFleetInTransit(movement, 6)).toBe(true); // Arrival/combat turn
    });

    it('should detect fleet in transit during return journey', () => {
      expect(isFleetInTransit(movement, 7)).toBe(true); // Return journey
    });

    it('should not detect fleet in transit before departure', () => {
      expect(isFleetInTransit(movement, 4)).toBe(false); // Before departure
    });

    it('should not detect fleet in transit after return', () => {
      expect(isFleetInTransit(movement, 8)).toBe(false); // After return
    });
  });

  describe('canRecallFleet', () => {
    const movement: FleetMovement = {
      composition: sampleFleet,
      target: 'enemy_system',
      arrivalTurn: 6,
      returnTurn: 8,
      missionType: 'outbound'
    };

    it('should allow recall before departure', () => {
      expect(canRecallFleet(movement, 4)).toBe(true);
    });

    it('should not allow recall on departure turn', () => {
      expect(canRecallFleet(movement, 5)).toBe(false);
    });

    it('should not allow recall after departure', () => {
      expect(canRecallFleet(movement, 6)).toBe(false);
      expect(canRecallFleet(movement, 7)).toBe(false);
    });
  });

  describe('updateFleetMissionType', () => {
    const baseMovement: FleetMovement = {
      composition: sampleFleet,
      target: 'enemy_system',
      arrivalTurn: 6,
      returnTurn: 8,
      missionType: 'outbound'
    };

    it('should set mission type to outbound before arrival', () => {
      const updated = updateFleetMissionType(baseMovement, 5);
      expect(updated.missionType).toBe('outbound');
    });

    it('should set mission type to combat on arrival turn', () => {
      const updated = updateFleetMissionType(baseMovement, 6);
      expect(updated.missionType).toBe('combat');
    });

    it('should set mission type to returning after combat', () => {
      const updated = updateFleetMissionType(baseMovement, 7);
      expect(updated.missionType).toBe('returning');
    });
  });

  describe('processFleetMovements', () => {
    const movements: FleetMovement[] = [
      {
        composition: { frigates: 5, cruisers: 0, battleships: 0 },
        target: 'system1',
        arrivalTurn: 6,
        returnTurn: 8,
        missionType: 'outbound'
      },
      {
        composition: { frigates: 0, cruisers: 3, battleships: 0 },
        target: 'system2',
        arrivalTurn: 7,
        returnTurn: 9,
        missionType: 'outbound'
      },
      {
        composition: { frigates: 0, cruisers: 0, battleships: 2 },
        target: 'system3',
        arrivalTurn: 5,
        returnTurn: 7,
        missionType: 'outbound'
      }
    ];

    it('should categorize movements correctly on turn 6', () => {
      const result = processFleetMovements(movements, 6);
      
      expect(result.updated).toHaveLength(1); // system2 still outbound
      expect(result.combatMovements).toHaveLength(1); // system1 in combat
      expect(result.returning).toHaveLength(1); // system3 returning
      
      expect(result.combatMovements[0].target).toBe('system1');
      expect(result.returning[0].target).toBe('system3');
    });

    it('should handle empty movements array', () => {
      const result = processFleetMovements([], 6);
      
      expect(result.updated).toHaveLength(0);
      expect(result.combatMovements).toHaveLength(0);
      expect(result.returning).toHaveLength(0);
    });
  });

  describe('isHomeSystemVulnerable', () => {
    const homeFleet: FleetComposition = { frigates: 20, cruisers: 10, battleships: 5 };
    const outboundMovements: FleetMovement[] = [
      {
        composition: { frigates: 5, cruisers: 2, battleships: 1 },
        target: 'enemy_system',
        arrivalTurn: 6,
        returnTurn: 8,
        missionType: 'outbound'
      }
    ];

    it('should detect vulnerability when fleets are in transit', () => {
      expect(isHomeSystemVulnerable(homeFleet, outboundMovements, 5)).toBe(true); // Departure
      expect(isHomeSystemVulnerable(homeFleet, outboundMovements, 6)).toBe(true); // Combat
      expect(isHomeSystemVulnerable(homeFleet, outboundMovements, 7)).toBe(true); // Return
    });

    it('should not detect vulnerability when no fleets in transit', () => {
      expect(isHomeSystemVulnerable(homeFleet, outboundMovements, 4)).toBe(false); // Before departure
      expect(isHomeSystemVulnerable(homeFleet, outboundMovements, 8)).toBe(false); // After return
    });

    it('should not detect vulnerability with no outbound movements', () => {
      expect(isHomeSystemVulnerable(homeFleet, [], 6)).toBe(false);
    });
  });

  describe('getCounterAttackWindow', () => {
    const movement: FleetMovement = {
      composition: sampleFleet,
      target: 'enemy_system',
      arrivalTurn: 6,
      returnTurn: 8,
      missionType: 'outbound'
    };

    it('should calculate counter-attack window correctly', () => {
      const window = getCounterAttackWindow(movement);
      
      expect(window.startTurn).toBe(5); // Fleet departs on turn 5
      expect(window.endTurn).toBe(7);   // Fleet returns on turn 8, vulnerable until turn 7
      expect(window.duration).toBe(3);  // 3 turns of vulnerability
    });
  });

  describe('getVisibleFleets', () => {
    const homeFleet: FleetComposition = { frigates: 20, cruisers: 10, battleships: 5 };
    const outboundMovements: FleetMovement[] = [
      {
        composition: { frigates: 5, cruisers: 2, battleships: 1 },
        target: 'enemy_system',
        arrivalTurn: 6,
        returnTurn: 8,
        missionType: 'outbound'
      }
    ];

    it('should return full home fleet when no fleets in transit', () => {
      const visible = getVisibleFleets(homeFleet, outboundMovements, 4);
      expect(visible).toEqual(homeFleet);
    });

    it('should return only home fleet when fleets are in transit', () => {
      const visible = getVisibleFleets(homeFleet, outboundMovements, 6);
      expect(visible).toEqual(homeFleet); // In-transit fleets are invisible
    });

    it('should return home fleet with no outbound movements', () => {
      const visible = getVisibleFleets(homeFleet, [], 6);
      expect(visible).toEqual(homeFleet);
    });
  });

  describe('createReturningFleet', () => {
    const originalMovement: FleetMovement = {
      composition: sampleFleet,
      target: 'enemy_system',
      arrivalTurn: 6,
      returnTurn: 8,
      missionType: 'combat'
    };

    it('should create returning fleet for survivors', () => {
      const survivors: FleetComposition = { frigates: 3, cruisers: 1, battleships: 0 };
      const returning = createReturningFleet(survivors, originalMovement, 6);
      
      expect(returning).not.toBeNull();
      expect(returning!.composition).toEqual(survivors);
      expect(returning!.target).toBe('home');
      expect(returning!.arrivalTurn).toBe(7);
      expect(returning!.returnTurn).toBe(7);
      expect(returning!.missionType).toBe('returning');
    });

    it('should return null for no survivors', () => {
      const noSurvivors: FleetComposition = { frigates: 0, cruisers: 0, battleships: 0 };
      const returning = createReturningFleet(noSurvivors, originalMovement, 6);
      
      expect(returning).toBeNull();
    });
  });

  describe('UNIT_STATS', () => {
    it('should have correct rock-paper-scissors relationships', () => {
      // Frigates beat cruisers
      expect(UNIT_STATS.frigate.effectiveness.vsCruiser).toBeGreaterThan(1.0);
      expect(UNIT_STATS.cruiser.effectiveness.vsFrigate).toBeLessThan(1.0);
      
      // Cruisers beat battleships
      expect(UNIT_STATS.cruiser.effectiveness.vsBattleship).toBeGreaterThan(1.0);
      expect(UNIT_STATS.battleship.effectiveness.vsCruiser).toBeLessThan(1.0);
      
      // Battleships beat frigates
      expect(UNIT_STATS.battleship.effectiveness.vsFrigate).toBeGreaterThan(1.0);
      expect(UNIT_STATS.frigate.effectiveness.vsBattleship).toBeLessThan(1.0);
    });

    it('should have reasonable build times and costs', () => {
      expect(UNIT_STATS.frigate.buildTime).toBe(1);
      expect(UNIT_STATS.cruiser.buildTime).toBe(2);
      expect(UNIT_STATS.battleship.buildTime).toBe(4);
      
      // Costs should increase with unit power
      expect(UNIT_STATS.frigate.buildCost.metal).toBeLessThan(UNIT_STATS.cruiser.buildCost.metal);
      expect(UNIT_STATS.cruiser.buildCost.metal).toBeLessThan(UNIT_STATS.battleship.buildCost.metal);
    });
  });

  describe('Combat Resolution Engine', () => {
    describe('determineBattleOutcome', () => {
      it('should determine decisive attacker victory', () => {
        expect(determineBattleOutcome(200, 100)).toBe('decisive_attacker'); // 2:1 ratio
        expect(determineBattleOutcome(300, 100)).toBe('decisive_attacker'); // 3:1 ratio
      });

      it('should determine decisive defender victory', () => {
        expect(determineBattleOutcome(100, 200)).toBe('decisive_defender'); // 1:2 ratio
        expect(determineBattleOutcome(100, 300)).toBe('decisive_defender'); // 1:3 ratio
      });

      it('should determine close battle', () => {
        expect(determineBattleOutcome(100, 100)).toBe('close_battle'); // 1:1 ratio
        expect(determineBattleOutcome(150, 100)).toBe('close_battle'); // 1.5:1 ratio
        expect(determineBattleOutcome(100, 150)).toBe('close_battle'); // 1:1.5 ratio
      });

      it('should handle edge cases', () => {
        expect(determineBattleOutcome(0, 0)).toBe('decisive_defender'); // No attacker strength = defender wins
        expect(determineBattleOutcome(0, 100)).toBe('decisive_defender');
        expect(determineBattleOutcome(100, 0)).toBe('decisive_attacker');
      });
    });

    describe('calculateCasualties', () => {
      const testFleet: FleetComposition = { frigates: 100, cruisers: 50, battleships: 20 };

      it('should calculate casualties for decisive winner', () => {
        const result = calculateCasualties(testFleet, 'decisive_attacker', true);
        
        // Decisive winner should have 10-30% casualties
        const totalOriginal = getTotalFleetSize(testFleet);
        const totalCasualties = getTotalFleetSize(result.casualties);
        const totalSurvivors = getTotalFleetSize(result.survivors);
        
        expect(totalCasualties).toBeGreaterThanOrEqual(totalOriginal * 0.1);
        expect(totalCasualties).toBeLessThanOrEqual(totalOriginal * 0.3);
        expect(totalSurvivors + totalCasualties).toBe(totalOriginal);
      });

      it('should calculate casualties for decisive loser', () => {
        const result = calculateCasualties(testFleet, 'decisive_defender', false);
        
        // Decisive loser should have 70-90% casualties
        const totalOriginal = getTotalFleetSize(testFleet);
        const totalCasualties = getTotalFleetSize(result.casualties);
        
        expect(totalCasualties).toBeGreaterThanOrEqual(totalOriginal * 0.7);
        expect(totalCasualties).toBeLessThanOrEqual(totalOriginal * 0.9);
      });

      it('should calculate casualties for close battle', () => {
        const result = calculateCasualties(testFleet, 'close_battle', true);
        
        // Close battle should have 40-60% casualties regardless of winner
        const totalOriginal = getTotalFleetSize(testFleet);
        const totalCasualties = getTotalFleetSize(result.casualties);
        
        expect(totalCasualties).toBeGreaterThanOrEqual(totalOriginal * 0.4);
        expect(totalCasualties).toBeLessThanOrEqual(totalOriginal * 0.6);
      });

      it('should preserve fleet composition structure', () => {
        const result = calculateCasualties(testFleet, 'close_battle', true);
        
        expect(result.survivors.frigates + result.casualties.frigates).toBe(testFleet.frigates);
        expect(result.survivors.cruisers + result.casualties.cruisers).toBe(testFleet.cruisers);
        expect(result.survivors.battleships + result.casualties.battleships).toBe(testFleet.battleships);
      });
    });

    describe('resolveCombat', () => {
      const attackerFleet: FleetComposition = { frigates: 20, cruisers: 10, battleships: 5 };
      const defenderFleet: FleetComposition = { frigates: 15, cruisers: 8, battleships: 3 };

      it('should resolve combat with deterministic factors', () => {
        const fixedFactors = {
          attackerFactors: { frigate: 1.0, cruiser: 1.0, battleship: 1.0 },
          defenderFactors: { frigate: 1.0, cruiser: 1.0, battleship: 1.0 }
        };
        
        const result = resolveCombat(attackerFleet, defenderFleet, fixedFactors);
        
        expect(result.outcome).toMatch(/decisive_attacker|decisive_defender|close_battle/);
        expect(result.strengthRatio).toBeGreaterThan(0);
        
        // Verify survivors + casualties = original fleet
        const attackerTotal = getTotalFleetSize(attackerFleet);
        const attackerSurvivorsTotal = getTotalFleetSize(result.attackerSurvivors);
        const attackerCasualtiesTotal = getTotalFleetSize(result.attackerCasualties);
        expect(attackerSurvivorsTotal + attackerCasualtiesTotal).toBe(attackerTotal);
      });

      it('should handle empty fleets', () => {
        const result = resolveCombat(emptyFleet, defenderFleet);
        
        expect(result.outcome).toBe('decisive_defender');
        expect(getTotalFleetSize(result.attackerSurvivors)).toBe(0);
        expect(getTotalFleetSize(result.attackerCasualties)).toBe(0);
      });

      it('should produce consistent results with same inputs', () => {
        const fixedFactors = {
          attackerFactors: { frigate: 1.1, cruiser: 0.9, battleship: 1.0 },
          defenderFactors: { frigate: 0.8, cruiser: 1.2, battleship: 1.1 }
        };
        
        const result1 = resolveCombat(attackerFleet, defenderFleet, fixedFactors);
        const result2 = resolveCombat(attackerFleet, defenderFleet, fixedFactors);
        
        expect(result1.outcome).toBe(result2.outcome);
        expect(result1.strengthRatio).toBe(result2.strengthRatio);
      });
    });

    describe('checkFleetElimination', () => {
      it('should detect elimination when no fleets remain', () => {
        const eliminated = checkFleetElimination(emptyFleet, []);
        expect(eliminated).toBe(true);
      });

      it('should not detect elimination with home fleet', () => {
        const notEliminated = checkFleetElimination(sampleFleet, []);
        expect(notEliminated).toBe(false);
      });

      it('should not detect elimination with fleets in transit', () => {
        const outboundMovements: FleetMovement[] = [
          {
            composition: { frigates: 5, cruisers: 2, battleships: 1 },
            target: 'enemy_system',
            arrivalTurn: 6,
            returnTurn: 8,
            missionType: 'outbound'
          }
        ];
        
        const notEliminated = checkFleetElimination(emptyFleet, outboundMovements);
        expect(notEliminated).toBe(false);
      });

      it('should detect elimination when all movements have empty fleets', () => {
        const emptyMovements: FleetMovement[] = [
          {
            composition: emptyFleet,
            target: 'enemy_system',
            arrivalTurn: 6,
            returnTurn: 8,
            missionType: 'outbound'
          }
        ];
        
        const eliminated = checkFleetElimination(emptyFleet, emptyMovements);
        expect(eliminated).toBe(true);
      });
    });

    describe('processCombatMovement', () => {
      const attackingMovement: FleetMovement = {
        composition: { frigates: 10, cruisers: 5, battleships: 2 },
        target: 'defender_system',
        arrivalTurn: 6,
        returnTurn: 8,
        missionType: 'combat'
      };
      
      const defenderFleet: FleetComposition = { frigates: 8, cruisers: 4, battleships: 2 };

      it('should process combat and return results', () => {
        const result = processCombatMovement(attackingMovement, defenderFleet, 6);
        
        expect(result.combatResult).toBeDefined();
        expect(result.updatedDefenderFleet).toBeDefined();
        
        // Should have returning fleet if there are survivors
        if (getTotalFleetSize(result.combatResult.attackerSurvivors) > 0) {
          expect(result.returningFleet).not.toBeNull();
          expect(result.returningFleet!.target).toBe('home');
        } else {
          expect(result.returningFleet).toBeNull();
        }
      });

      it('should update defender fleet with survivors', () => {
        const result = processCombatMovement(attackingMovement, defenderFleet, 6);
        
        // Defender fleet should be updated with combat survivors
        expect(result.updatedDefenderFleet).toEqual(result.combatResult.defenderSurvivors);
      });
    });

    describe('checkVictoryConditions', () => {
      const playerFleet: FleetComposition = { frigates: 10, cruisers: 5, battleships: 2 };
      const aiFleet: FleetComposition = { frigates: 8, cruisers: 4, battleships: 2 };
      const noMovements: FleetMovement[] = [];

      it('should detect player victory when AI is eliminated', () => {
        const result = checkVictoryConditions(playerFleet, noMovements, emptyFleet, noMovements);
        expect(result).toBe('player_victory');
      });

      it('should detect AI victory when player is eliminated', () => {
        const result = checkVictoryConditions(emptyFleet, noMovements, aiFleet, noMovements);
        expect(result).toBe('ai_victory');
      });

      it('should detect ongoing game when both have fleets', () => {
        const result = checkVictoryConditions(playerFleet, noMovements, aiFleet, noMovements);
        expect(result).toBe('ongoing');
      });

      it('should handle mutual elimination as AI victory', () => {
        const result = checkVictoryConditions(emptyFleet, noMovements, emptyFleet, noMovements);
        expect(result).toBe('ai_victory');
      });

      it('should consider fleets in transit', () => {
        const playerMovements: FleetMovement[] = [
          {
            composition: { frigates: 5, cruisers: 2, battleships: 1 },
            target: 'ai_system',
            arrivalTurn: 6,
            returnTurn: 8,
            missionType: 'outbound'
          }
        ];
        
        // Player has no home fleet but has fleet in transit
        const result = checkVictoryConditions(emptyFleet, playerMovements, emptyFleet, noMovements);
        expect(result).toBe('player_victory'); // Player still has fleet in transit
      });
    });
  });})
;