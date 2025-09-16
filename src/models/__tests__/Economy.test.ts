import { describe, it, expect } from 'vitest';
import {
  validateBuildOrder,
  validateConstructionQueue,
  calculateStructureCost,
  calculateStructureIncome,
  calculateConstructionDrain,
  calculateNetIncome,
  createStructureBuildOrder,
  createUnitBuildOrder,
  processConstructionQueue,
  canAffordBuildOrder,
  canSustainBuildOrder,
  calculateStructurePaybackTime,
  isStructureViable,
  createEmptyEconomy,
  getTotalStructures,
  STRUCTURE_STATS,
  BASE_INCOME
} from '../Economy.js';
import { BuildOrder, Economy, Resources } from '../index.js';

describe('Economy Management', () => {
  const sampleResources: Resources = {
    metal: 15000,
    energy: 12000,
    metalIncome: 10000,
    energyIncome: 10000
  };

  const sampleBuildOrder: BuildOrder = {
    unitType: 'frigate',
    quantity: 5,
    turnsRemaining: 1,
    resourceDrainPerTurn: { metal: 20, energy: 10 }
  };

  describe('validateBuildOrder', () => {
    it('should validate a correct build order', () => {
      const result = validateBuildOrder(sampleBuildOrder);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid quantity', () => {
      const invalidOrder = { ...sampleBuildOrder, quantity: 0 };
      const result = validateBuildOrder(invalidOrder);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Build order quantity must be positive');
    });

    it('should reject negative turns remaining', () => {
      const invalidOrder = { ...sampleBuildOrder, turnsRemaining: -1 };
      const result = validateBuildOrder(invalidOrder);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Turns remaining cannot be negative');
    });

    it('should reject negative resource drain', () => {
      const invalidOrder = { 
        ...sampleBuildOrder, 
        resourceDrainPerTurn: { metal: -5, energy: 10 }
      };
      const result = validateBuildOrder(invalidOrder);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Metal drain per turn cannot be negative');
    });

    it('should reject invalid unit type', () => {
      const invalidOrder = { ...sampleBuildOrder, unitType: 'invalid' as any };
      const result = validateBuildOrder(invalidOrder);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid unit type: invalid');
    });
  });

  describe('validateConstructionQueue', () => {
    it('should validate a correct construction queue', () => {
      const queue = [sampleBuildOrder];
      const result = validateConstructionQueue(queue);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject queue with invalid orders', () => {
      const invalidOrder = { ...sampleBuildOrder, quantity: -1 };
      const queue = [sampleBuildOrder, invalidOrder];
      const result = validateConstructionQueue(queue);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Build order 2:');
    });
  });

  describe('calculateStructureCost', () => {
    it('should calculate base cost for first structure', () => {
      const cost = calculateStructureCost('reactor', 0);
      expect(cost.metal).toBe(STRUCTURE_STATS.reactor.buildCost.metal);
      expect(cost.energy).toBe(STRUCTURE_STATS.reactor.buildCost.energy);
    });

    it('should apply exponential scaling for additional structures', () => {
      const baseCost = calculateStructureCost('reactor', 0);
      const secondCost = calculateStructureCost('reactor', 1);
      const thirdCost = calculateStructureCost('reactor', 2);

      expect(secondCost.metal).toBeGreaterThan(baseCost.metal);
      expect(thirdCost.metal).toBeGreaterThan(secondCost.metal);
      
      // Verify exponential growth
      expect(thirdCost.metal / baseCost.metal).toBeGreaterThan(secondCost.metal / baseCost.metal);
    });

    it('should handle both structure types', () => {
      const reactorCost = calculateStructureCost('reactor', 1);
      const mineCost = calculateStructureCost('mine', 1);

      expect(reactorCost.metal).toBeGreaterThan(0);
      expect(reactorCost.energy).toBeGreaterThan(0);
      expect(mineCost.metal).toBeGreaterThan(0);
      expect(mineCost.energy).toBeGreaterThan(0);
    });
  });

  describe('calculateStructureIncome', () => {
    it('should calculate base income with no structures', () => {
      const income = calculateStructureIncome(0, 0);
      expect(income.metal).toBe(BASE_INCOME.metal);
      expect(income.energy).toBe(BASE_INCOME.energy);
    });

    it('should add reactor income bonus', () => {
      const income = calculateStructureIncome(2, 0);
      expect(income.metal).toBe(BASE_INCOME.metal);
      expect(income.energy).toBe(BASE_INCOME.energy + 2 * STRUCTURE_STATS.reactor.incomeBonus.energy);
    });

    it('should add mine income bonus', () => {
      const income = calculateStructureIncome(0, 3);
      expect(income.metal).toBe(BASE_INCOME.metal + 3 * STRUCTURE_STATS.mine.incomeBonus.metal);
      expect(income.energy).toBe(BASE_INCOME.energy);
    });

    it('should combine both structure bonuses', () => {
      const income = calculateStructureIncome(2, 3);
      expect(income.metal).toBe(BASE_INCOME.metal + 3 * STRUCTURE_STATS.mine.incomeBonus.metal);
      expect(income.energy).toBe(BASE_INCOME.energy + 2 * STRUCTURE_STATS.reactor.incomeBonus.energy);
    });
  });

  describe('calculateConstructionDrain', () => {
    it('should return zero for empty queue', () => {
      const drain = calculateConstructionDrain([]);
      expect(drain.metal).toBe(0);
      expect(drain.energy).toBe(0);
    });

    it('should sum drain from multiple build orders', () => {
      const order1: BuildOrder = {
        unitType: 'frigate',
        quantity: 1,
        turnsRemaining: 1,
        resourceDrainPerTurn: { metal: 10, energy: 5 }
      };
      const order2: BuildOrder = {
        unitType: 'cruiser',
        quantity: 1,
        turnsRemaining: 2,
        resourceDrainPerTurn: { metal: 15, energy: 8 }
      };

      const drain = calculateConstructionDrain([order1, order2]);
      expect(drain.metal).toBe(25); // 10 + 15
      expect(drain.energy).toBe(13); // 5 + 8
    });
  });

  describe('calculateNetIncome', () => {
    it('should subtract construction drain from structure income', () => {
      const structureIncome = { metal: 12000, energy: 11000 };
      const constructionDrain = { metal: 2000, energy: 1500 };

      const netIncome = calculateNetIncome(structureIncome, constructionDrain);
      expect(netIncome.metal).toBe(10000);
      expect(netIncome.energy).toBe(9500);
    });

    it('should allow negative net income', () => {
      const structureIncome = { metal: 5000, energy: 4000 };
      const constructionDrain = { metal: 8000, energy: 6000 };

      const netIncome = calculateNetIncome(structureIncome, constructionDrain);
      expect(netIncome.metal).toBe(-3000);
      expect(netIncome.energy).toBe(-2000);
    });
  });

  describe('createStructureBuildOrder', () => {
    it('should create a valid structure build order', () => {
      const buildOrder = createStructureBuildOrder('reactor', 2, 1);

      expect(buildOrder.unitType).toBe('reactor');
      expect(buildOrder.quantity).toBe(2);
      expect(buildOrder.turnsRemaining).toBe(STRUCTURE_STATS.reactor.buildTime);
      
      const expectedCost = calculateStructureCost('reactor', 1);
      expect(buildOrder.resourceDrainPerTurn.metal).toBe(expectedCost.metal * 2);
      expect(buildOrder.resourceDrainPerTurn.energy).toBe(expectedCost.energy * 2);
    });
  });

  describe('createUnitBuildOrder', () => {
    it('should create a valid unit build order', () => {
      const unitStats = { buildTime: 2, buildCost: { metal: 10, energy: 6 } };
      const buildOrder = createUnitBuildOrder('cruiser', 3, unitStats);

      expect(buildOrder.unitType).toBe('cruiser');
      expect(buildOrder.quantity).toBe(3);
      expect(buildOrder.turnsRemaining).toBe(2);
      expect(buildOrder.resourceDrainPerTurn.metal).toBe(30); // 10 * 3
      expect(buildOrder.resourceDrainPerTurn.energy).toBe(18); // 6 * 3
    });
  });

  describe('processConstructionQueue', () => {
    it('should complete orders with zero turns remaining', () => {
      const order1 = { ...sampleBuildOrder, turnsRemaining: 1 };
      const order2 = { ...sampleBuildOrder, turnsRemaining: 2 };
      const queue = [order1, order2];

      const result = processConstructionQueue(queue);

      expect(result.completedOrders).toHaveLength(1);
      expect(result.completedOrders[0].turnsRemaining).toBe(0);
      expect(result.remainingQueue).toHaveLength(1);
      expect(result.remainingQueue[0].turnsRemaining).toBe(1);
    });

    it('should handle empty queue', () => {
      const result = processConstructionQueue([]);
      expect(result.completedOrders).toHaveLength(0);
      expect(result.remainingQueue).toHaveLength(0);
    });
  });

  describe('canAffordBuildOrder', () => {
    it('should return true when resources are sufficient', () => {
      const buildOrder: BuildOrder = {
        unitType: 'frigate',
        quantity: 1,
        turnsRemaining: 2,
        resourceDrainPerTurn: { metal: 100, energy: 50 }
      };

      const resources: Resources = {
        metal: 300,
        energy: 150,
        metalIncome: 0,
        energyIncome: 0
      };

      expect(canAffordBuildOrder(resources, buildOrder)).toBe(true);
    });

    it('should return false when resources are insufficient', () => {
      const buildOrder: BuildOrder = {
        unitType: 'frigate',
        quantity: 1,
        turnsRemaining: 2,
        resourceDrainPerTurn: { metal: 100, energy: 50 }
      };

      const resources: Resources = {
        metal: 150, // Not enough for 2 turns * 100 = 200
        energy: 150,
        metalIncome: 0,
        energyIncome: 0
      };

      expect(canAffordBuildOrder(resources, buildOrder)).toBe(false);
    });
  });

  describe('canSustainBuildOrder', () => {
    it('should return true when income can sustain drain', () => {
      const netIncome = { metal: 1000, energy: 800 };
      const buildOrder: BuildOrder = {
        unitType: 'frigate',
        quantity: 1,
        turnsRemaining: 1,
        resourceDrainPerTurn: { metal: 500, energy: 300 }
      };

      expect(canSustainBuildOrder(netIncome, buildOrder)).toBe(true);
    });

    it('should return false when income cannot sustain drain', () => {
      const netIncome = { metal: 400, energy: 800 };
      const buildOrder: BuildOrder = {
        unitType: 'frigate',
        quantity: 1,
        turnsRemaining: 1,
        resourceDrainPerTurn: { metal: 500, energy: 300 }
      };

      expect(canSustainBuildOrder(netIncome, buildOrder)).toBe(false);
    });
  });

  describe('calculateStructurePaybackTime', () => {
    it('should calculate payback time for reactor', () => {
      const paybackTime = calculateStructurePaybackTime('reactor', 0);
      
      // Base reactor costs 900 metal, 1200 energy, provides 500 energy/turn
      // Payback time should be 1200 / 500 = 2.4 turns (energy is bottleneck)
      expect(paybackTime).toBeCloseTo(2.4, 1);
    });

    it('should calculate payback time for mine', () => {
      const paybackTime = calculateStructurePaybackTime('mine', 0);
      
      // Base mine costs 1500 metal, 600 energy, provides 500 metal/turn
      // Payback time should be 1500 / 500 = 3 turns (metal is bottleneck)
      expect(paybackTime).toBeCloseTo(3, 1);
    });

    it('should increase payback time with structure count', () => {
      const firstPayback = calculateStructurePaybackTime('reactor', 0);
      const secondPayback = calculateStructurePaybackTime('reactor', 1);
      
      expect(secondPayback).toBeGreaterThan(firstPayback);
    });
  });

  describe('isStructureViable', () => {
    it('should return true for viable structures', () => {
      expect(isStructureViable('reactor', 0, 10)).toBe(true);
      expect(isStructureViable('mine', 0, 10)).toBe(true);
    });

    it('should return false for non-viable structures', () => {
      // With many existing structures, payback time becomes too long
      expect(isStructureViable('reactor', 10, 5)).toBe(false);
    });
  });

  describe('createEmptyEconomy', () => {
    it('should create an empty economy state', () => {
      const economy = createEmptyEconomy();
      expect(economy.reactors).toBe(0);
      expect(economy.mines).toBe(0);
      expect(economy.constructionQueue).toHaveLength(0);
    });
  });

  describe('getTotalStructures', () => {
    it('should count total structures', () => {
      const economy: Economy = {
        reactors: 3,
        mines: 2,
        constructionQueue: []
      };

      expect(getTotalStructures(economy)).toBe(5);
    });

    it('should return zero for empty economy', () => {
      const economy = createEmptyEconomy();
      expect(getTotalStructures(economy)).toBe(0);
    });
  });

  describe('STRUCTURE_STATS', () => {
    it('should have valid structure definitions', () => {
      expect(STRUCTURE_STATS.reactor.buildTime).toBeGreaterThan(0);
      expect(STRUCTURE_STATS.mine.buildTime).toBeGreaterThan(0);
      
      expect(STRUCTURE_STATS.reactor.buildCost.metal).toBeGreaterThan(0);
      expect(STRUCTURE_STATS.reactor.buildCost.energy).toBeGreaterThan(0);
      expect(STRUCTURE_STATS.mine.buildCost.metal).toBeGreaterThan(0);
      expect(STRUCTURE_STATS.mine.buildCost.energy).toBeGreaterThan(0);
      
      expect(STRUCTURE_STATS.reactor.incomeBonus.energy).toBeGreaterThan(0);
      expect(STRUCTURE_STATS.mine.incomeBonus.metal).toBeGreaterThan(0);
    });

    it('should have reasonable payback times', () => {
      // Structures should pay for themselves in reasonable time
      const reactorPayback = calculateStructurePaybackTime('reactor', 0);
      const minePayback = calculateStructurePaybackTime('mine', 0);
      
      expect(reactorPayback).toBeLessThan(10);
      expect(minePayback).toBeLessThan(10);
    });
  });
});