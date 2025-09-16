import { describe, it, expect, beforeEach } from 'vitest';
import { EconomyEngine } from '../EconomyEngine.js';
import { PlayerState } from '../../models/PlayerState.js';
import { BASE_INCOME, calculateStructureCost } from '../../models/Economy.js';
import { createEmptyFleet } from '../../models/Fleet.js';

describe('EconomyEngine - Income Calculation', () => {
  let economyEngine: EconomyEngine;
  let basePlayerState: PlayerState;

  beforeEach(() => {
    economyEngine = new EconomyEngine();
    basePlayerState = {
      resources: {
        metal: 15000,
        energy: 12000,
        metalIncome: 0,
        energyIncome: 0
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
        scanAccuracy: 0
      }
    };
  });

  describe('calculateIncome', () => {
    it('should apply base income with no structures or units', () => {
      const initialMetal = basePlayerState.resources.metal;
      const initialEnergy = basePlayerState.resources.energy;

      economyEngine.calculateIncome(basePlayerState);

      expect(basePlayerState.resources.metalIncome).toBe(BASE_INCOME.metal);
      expect(basePlayerState.resources.energyIncome).toBe(BASE_INCOME.energy);
      expect(basePlayerState.resources.metal).toBe(initialMetal + BASE_INCOME.metal);
      expect(basePlayerState.resources.energy).toBe(initialEnergy + BASE_INCOME.energy);
    });

    it('should add economic structure bonuses to base income', () => {
      basePlayerState.economy.reactors = 2;
      basePlayerState.economy.mines = 3;

      economyEngine.calculateIncome(basePlayerState);

      // Base income + structure bonuses: reactors give +500 energy each, mines give +500 metal each
      expect(basePlayerState.resources.metalIncome).toBe(BASE_INCOME.metal + 3 * 500);
      expect(basePlayerState.resources.energyIncome).toBe(BASE_INCOME.energy + 2 * 500);
    });

    it('should subtract construction drain from income', () => {
      basePlayerState.economy.constructionQueue = [
        {
          unitType: 'frigate',
          quantity: 10,
          turnsRemaining: 1,
          resourceDrainPerTurn: { metal: 40, energy: 20 }
        },
        {
          unitType: 'reactor',
          quantity: 1,
          turnsRemaining: 1,
          resourceDrainPerTurn: { metal: 900, energy: 1200 }
        }
      ];

      economyEngine.calculateIncome(basePlayerState);

      // Base income minus construction drain
      const expectedMetalIncome = BASE_INCOME.metal - 40 - 900;
      const expectedEnergyIncome = BASE_INCOME.energy - 20 - 1200;

      expect(basePlayerState.resources.metalIncome).toBe(expectedMetalIncome);
      expect(basePlayerState.resources.energyIncome).toBe(expectedEnergyIncome);
    });

    it('should subtract fleet upkeep from income', () => {
      basePlayerState.fleet.homeSystem = {
        frigates: 100,
        cruisers: 50,
        battleships: 20
      };

      economyEngine.calculateIncome(basePlayerState);

      // Fleet upkeep: frigates (2 metal, 1 energy), cruisers (5 metal, 3 energy), battleships (10 metal, 6 energy)
      const expectedMetalUpkeep = 100 * 2 + 50 * 5 + 20 * 10; // 200 + 250 + 200 = 650
      const expectedEnergyUpkeep = 100 * 1 + 50 * 3 + 20 * 6; // 100 + 150 + 120 = 370

      expect(basePlayerState.resources.metalIncome).toBe(BASE_INCOME.metal - expectedMetalUpkeep);
      expect(basePlayerState.resources.energyIncome).toBe(BASE_INCOME.energy - expectedEnergyUpkeep);
    });

    it('should handle complex income calculation with all factors', () => {
      // Set up complex scenario
      basePlayerState.economy.reactors = 2;
      basePlayerState.economy.mines = 1;
      basePlayerState.fleet.homeSystem = {
        frigates: 50,
        cruisers: 25,
        battleships: 10
      };
      basePlayerState.economy.constructionQueue = [
        {
          unitType: 'cruiser',
          quantity: 5,
          turnsRemaining: 2,
          resourceDrainPerTurn: { metal: 50, energy: 30 }
        }
      ];

      economyEngine.calculateIncome(basePlayerState);

      // Calculate expected values
      const structureIncome = {
        metal: BASE_INCOME.metal + 1 * 500, // 1 mine
        energy: BASE_INCOME.energy + 2 * 500 // 2 reactors
      };
      const fleetUpkeep = {
        metal: 50 * 2 + 25 * 5 + 10 * 10, // 100 + 125 + 100 = 325
        energy: 50 * 1 + 25 * 3 + 10 * 6  // 50 + 75 + 60 = 185
      };
      const constructionDrain = { metal: 50, energy: 30 };

      const expectedMetalIncome = structureIncome.metal - fleetUpkeep.metal - constructionDrain.metal;
      const expectedEnergyIncome = structureIncome.energy - fleetUpkeep.energy - constructionDrain.energy;

      expect(basePlayerState.resources.metalIncome).toBe(expectedMetalIncome);
      expect(basePlayerState.resources.energyIncome).toBe(expectedEnergyIncome);
    });

    it('should prevent negative resources', () => {
      basePlayerState.resources.metal = 100;
      basePlayerState.resources.energy = 50;
      
      // Create massive upkeep that would cause negative income
      basePlayerState.fleet.homeSystem = {
        frigates: 10000,
        cruisers: 5000,
        battleships: 2000
      };

      economyEngine.calculateIncome(basePlayerState);

      expect(basePlayerState.resources.metal).toBe(0);
      expect(basePlayerState.resources.energy).toBe(0);
    });
  });

  describe('getNetIncome', () => {
    it('should return net income without modifying player state', () => {
      basePlayerState.economy.reactors = 1;
      basePlayerState.fleet.homeSystem.frigates = 100;
      
      const originalState = JSON.parse(JSON.stringify(basePlayerState));

      const netIncome = economyEngine.getNetIncome(basePlayerState);

      // State should be unchanged
      expect(basePlayerState).toEqual(originalState);
      
      // Net income should be calculated correctly
      const expectedMetalIncome = BASE_INCOME.metal - 100 * 2; // Base - frigate upkeep
      const expectedEnergyIncome = BASE_INCOME.energy + 500 - 100 * 1; // Base + reactor - frigate upkeep

      expect(netIncome.metal).toBe(expectedMetalIncome);
      expect(netIncome.energy).toBe(expectedEnergyIncome);
    });
  });

  describe('isEconomyStalled', () => {
    it('should return false for positive income', () => {
      expect(economyEngine.isEconomyStalled(basePlayerState)).toBe(false);
    });

    it('should return true when metal income is zero or negative', () => {
      basePlayerState.fleet.homeSystem.frigates = 5000; // Massive metal upkeep
      expect(economyEngine.isEconomyStalled(basePlayerState)).toBe(true);
    });

    it('should return true when energy income is zero or negative', () => {
      basePlayerState.fleet.homeSystem.frigates = 10000; // Massive energy upkeep
      expect(economyEngine.isEconomyStalled(basePlayerState)).toBe(true);
    });

    it('should return true when both incomes are negative', () => {
      basePlayerState.fleet.homeSystem = {
        frigates: 10000,
        cruisers: 5000,
        battleships: 2000
      };
      expect(economyEngine.isEconomyStalled(basePlayerState)).toBe(true);
    });
  });

  describe('getIncomeBreakdown', () => {
    it('should provide detailed income breakdown', () => {
      basePlayerState.economy.reactors = 2;
      basePlayerState.economy.mines = 1;
      basePlayerState.fleet.homeSystem = {
        frigates: 100,
        cruisers: 50,
        battleships: 25
      };
      basePlayerState.economy.constructionQueue = [
        {
          unitType: 'battleship',
          quantity: 2,
          turnsRemaining: 4,
          resourceDrainPerTurn: { metal: 40, energy: 24 }
        }
      ];

      const breakdown = economyEngine.getIncomeBreakdown(basePlayerState);

      expect(breakdown.baseIncome).toEqual(BASE_INCOME);
      expect(breakdown.structureBonus).toEqual({ metal: 500, energy: 1000 });
      expect(breakdown.constructionDrain).toEqual({ metal: 40, energy: 24 });
      
      // Fleet upkeep: 100*2 + 50*5 + 25*10 = 200 + 250 + 250 = 700 metal
      //               100*1 + 50*3 + 25*6 = 100 + 150 + 150 = 400 energy
      expect(breakdown.fleetUpkeep).toEqual({ metal: 700, energy: 400 });
      
      // Net: (10000 + 500) - 40 - 700 = 9760 metal
      //      (10000 + 1000) - 24 - 400 = 10576 energy
      expect(breakdown.netIncome).toEqual({ metal: 9760, energy: 10576 });
    });

    it('should handle zero values correctly', () => {
      const breakdown = economyEngine.getIncomeBreakdown(basePlayerState);

      expect(breakdown.baseIncome).toEqual(BASE_INCOME);
      expect(breakdown.structureBonus).toEqual({ metal: 0, energy: 0 });
      expect(breakdown.constructionDrain).toEqual({ metal: 0, energy: 0 });
      expect(breakdown.fleetUpkeep).toEqual({ metal: 0, energy: 0 });
      expect(breakdown.netIncome).toEqual(BASE_INCOME);
    });
  });

  describe('Income Scenarios - Edge Cases', () => {
    it('should handle maximum structure counts', () => {
      basePlayerState.economy.reactors = 10;
      basePlayerState.economy.mines = 10;

      economyEngine.calculateIncome(basePlayerState);

      expect(basePlayerState.resources.metalIncome).toBe(BASE_INCOME.metal + 10 * 500);
      expect(basePlayerState.resources.energyIncome).toBe(BASE_INCOME.energy + 10 * 500);
    });

    it('should handle large fleet compositions', () => {
      basePlayerState.fleet.homeSystem = {
        frigates: 1000,
        cruisers: 500,
        battleships: 200
      };

      const netIncome = economyEngine.getNetIncome(basePlayerState);

      const expectedMetalUpkeep = 1000 * 2 + 500 * 5 + 200 * 10; // 2000 + 2500 + 2000 = 6500
      const expectedEnergyUpkeep = 1000 * 1 + 500 * 3 + 200 * 6; // 1000 + 1500 + 1200 = 3700

      expect(netIncome.metal).toBe(BASE_INCOME.metal - expectedMetalUpkeep);
      expect(netIncome.energy).toBe(BASE_INCOME.energy - expectedEnergyUpkeep);
    });

    it('should handle multiple construction orders', () => {
      basePlayerState.economy.constructionQueue = [
        {
          unitType: 'frigate',
          quantity: 100,
          turnsRemaining: 1,
          resourceDrainPerTurn: { metal: 400, energy: 200 }
        },
        {
          unitType: 'cruiser',
          quantity: 50,
          turnsRemaining: 2,
          resourceDrainPerTurn: { metal: 500, energy: 300 }
        },
        {
          unitType: 'reactor',
          quantity: 2,
          turnsRemaining: 1,
          resourceDrainPerTurn: { metal: 1800, energy: 2400 }
        }
      ];

      const netIncome = economyEngine.getNetIncome(basePlayerState);

      const totalDrain = {
        metal: 400 + 500 + 1800,
        energy: 200 + 300 + 2400
      };

      expect(netIncome.metal).toBe(BASE_INCOME.metal - totalDrain.metal);
      expect(netIncome.energy).toBe(BASE_INCOME.energy - totalDrain.energy);
    });
  });

  describe('Construction System', () => {
    describe('processConstruction', () => {
      it('should advance construction queue and complete orders', () => {
        basePlayerState.economy.constructionQueue = [
          {
            unitType: 'frigate',
            quantity: 5,
            turnsRemaining: 1,
            resourceDrainPerTurn: { metal: 20, energy: 10 }
          },
          {
            unitType: 'reactor',
            quantity: 1,
            turnsRemaining: 2,
            resourceDrainPerTurn: { metal: 900, energy: 1200 }
          }
        ];

        const initialFrigates = basePlayerState.fleet.homeSystem.frigates;
        const initialReactors = basePlayerState.economy.reactors;

        economyEngine.processConstruction(basePlayerState);

        // Frigate order should be completed
        expect(basePlayerState.fleet.homeSystem.frigates).toBe(initialFrigates + 5);
        expect(basePlayerState.economy.reactors).toBe(initialReactors); // Reactor not done yet

        // Queue should have one remaining order with reduced turns
        expect(basePlayerState.economy.constructionQueue).toHaveLength(1);
        expect(basePlayerState.economy.constructionQueue[0].turnsRemaining).toBe(1);
      });

      it('should halt new production when economy is stalled', () => {
        // Create stalled economy
        basePlayerState.fleet.homeSystem.frigates = 10000; // Massive upkeep

        basePlayerState.economy.constructionQueue = [
          {
            unitType: 'frigate',
            quantity: 1,
            turnsRemaining: 1,
            resourceDrainPerTurn: { metal: 4, energy: 2 }
          }
        ];

        economyEngine.processConstruction(basePlayerState);

        // Should still process existing orders even when stalled
        expect(basePlayerState.fleet.homeSystem.frigates).toBe(10001);
        expect(basePlayerState.economy.constructionQueue).toHaveLength(0);
      });

      it('should complete multiple orders in same turn', () => {
        basePlayerState.economy.constructionQueue = [
          {
            unitType: 'frigate',
            quantity: 10,
            turnsRemaining: 1,
            resourceDrainPerTurn: { metal: 40, energy: 20 }
          },
          {
            unitType: 'cruiser',
            quantity: 5,
            turnsRemaining: 1,
            resourceDrainPerTurn: { metal: 50, energy: 30 }
          },
          {
            unitType: 'mine',
            quantity: 1,
            turnsRemaining: 1,
            resourceDrainPerTurn: { metal: 1500, energy: 600 }
          }
        ];

        const initialFrigates = basePlayerState.fleet.homeSystem.frigates;
        const initialCruisers = basePlayerState.fleet.homeSystem.cruisers;
        const initialMines = basePlayerState.economy.mines;

        economyEngine.processConstruction(basePlayerState);

        expect(basePlayerState.fleet.homeSystem.frigates).toBe(initialFrigates + 10);
        expect(basePlayerState.fleet.homeSystem.cruisers).toBe(initialCruisers + 5);
        expect(basePlayerState.economy.mines).toBe(initialMines + 1);
        expect(basePlayerState.economy.constructionQueue).toHaveLength(0);
      });
    });

    describe('canAffordAndSustainBuildOrder', () => {
      it('should return true when order is affordable and sustainable', () => {
        const buildOrder: BuildOrder = {
          unitType: 'frigate',
          quantity: 10,
          turnsRemaining: 1,
          resourceDrainPerTurn: { metal: 40, energy: 20 }
        };

        const result = economyEngine.canAffordAndSustainBuildOrder(basePlayerState, buildOrder);

        expect(result.canAfford).toBe(true);
        expect(result.canSustain).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return false when resources are insufficient', () => {
        basePlayerState.resources.metal = 50;
        basePlayerState.resources.energy = 30;

        const buildOrder: BuildOrder = {
          unitType: 'battleship',
          quantity: 10,
          turnsRemaining: 4,
          resourceDrainPerTurn: { metal: 200, energy: 120 }
        };

        const result = economyEngine.canAffordAndSustainBuildOrder(basePlayerState, buildOrder);

        expect(result.canAfford).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('Insufficient resources');
      });

      it('should return false when income cannot sustain drain', () => {
        // Create scenario where resources exist but income is too low
        basePlayerState.fleet.homeSystem.frigates = 6000; // 12,000 metal upkeep, 6,000 energy upkeep
        // Net income: 10,000 - 12,000 = -2,000 metal, 10,000 - 6,000 = 4,000 energy

        const buildOrder: BuildOrder = {
          unitType: 'battleship',
          quantity: 100,
          turnsRemaining: 4,
          resourceDrainPerTurn: { metal: 2000, energy: 1200 }
        };

        const result = economyEngine.canAffordAndSustainBuildOrder(basePlayerState, buildOrder);

        expect(result.canSustain).toBe(false);
        expect(result.errors.some(err => err.includes('Insufficient income'))).toBe(true);
      });
    });

    describe('addBuildOrder', () => {
      it('should successfully add valid build order', () => {
        const buildOrder: BuildOrder = {
          unitType: 'cruiser',
          quantity: 5,
          turnsRemaining: 2,
          resourceDrainPerTurn: { metal: 50, energy: 30 }
        };

        const result = economyEngine.addBuildOrder(basePlayerState, buildOrder);

        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(basePlayerState.economy.constructionQueue).toHaveLength(1);
        expect(basePlayerState.economy.constructionQueue[0]).toEqual(buildOrder);
      });

      it('should reject invalid build order', () => {
        const invalidOrder: BuildOrder = {
          unitType: 'frigate',
          quantity: -5, // Invalid quantity
          turnsRemaining: 1,
          resourceDrainPerTurn: { metal: 20, energy: 10 }
        };

        const result = economyEngine.addBuildOrder(basePlayerState, invalidOrder);

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(basePlayerState.economy.constructionQueue).toHaveLength(0);
      });

      it('should reject order that would stall economy', () => {
        // Set up player with enough resources but order that would stall economy
        basePlayerState.resources.metal = 100000;
        basePlayerState.resources.energy = 100000;

        const massiveOrder: BuildOrder = {
          unitType: 'battleship',
          quantity: 100,
          turnsRemaining: 1,
          resourceDrainPerTurn: { metal: 15000, energy: 12000 } // Would cause stall: 10000 - 15000 = -5000 metal
        };

        const result = economyEngine.addBuildOrder(basePlayerState, massiveOrder);

        expect(result.success).toBe(false);
        expect(result.errors.some(err => err.includes('stall the economy'))).toBe(true);
        expect(basePlayerState.economy.constructionQueue).toHaveLength(0);
      });

      it('should allow multiple build orders if sustainable', () => {
        const order1: BuildOrder = {
          unitType: 'frigate',
          quantity: 10,
          turnsRemaining: 1,
          resourceDrainPerTurn: { metal: 40, energy: 20 }
        };

        const order2: BuildOrder = {
          unitType: 'mine',
          quantity: 1,
          turnsRemaining: 1,
          resourceDrainPerTurn: { metal: 1500, energy: 600 }
        };

        const result1 = economyEngine.addBuildOrder(basePlayerState, order1);
        const result2 = economyEngine.addBuildOrder(basePlayerState, order2);

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
        expect(basePlayerState.economy.constructionQueue).toHaveLength(2);
      });
    });

    describe('cancelBuildOrder', () => {
      beforeEach(() => {
        basePlayerState.economy.constructionQueue = [
          {
            unitType: 'frigate',
            quantity: 5,
            turnsRemaining: 1,
            resourceDrainPerTurn: { metal: 20, energy: 10 }
          },
          {
            unitType: 'cruiser',
            quantity: 3,
            turnsRemaining: 2,
            resourceDrainPerTurn: { metal: 30, energy: 18 }
          }
        ];
      });

      it('should successfully cancel build order by index', () => {
        const result = economyEngine.cancelBuildOrder(basePlayerState, 0);

        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(basePlayerState.economy.constructionQueue).toHaveLength(1);
        expect(basePlayerState.economy.constructionQueue[0].unitType).toBe('cruiser');
      });

      it('should reject invalid index', () => {
        const result = economyEngine.cancelBuildOrder(basePlayerState, 5);

        expect(result.success).toBe(false);
        expect(result.errors[0]).toContain('Invalid build order index');
        expect(basePlayerState.economy.constructionQueue).toHaveLength(2);
      });

      it('should handle negative index', () => {
        const result = economyEngine.cancelBuildOrder(basePlayerState, -1);

        expect(result.success).toBe(false);
        expect(result.errors[0]).toContain('Invalid build order index');
      });
    });

    describe('Construction Utility Methods', () => {
      beforeEach(() => {
        basePlayerState.economy.constructionQueue = [
          {
            unitType: 'frigate',
            quantity: 10,
            turnsRemaining: 1,
            resourceDrainPerTurn: { metal: 40, energy: 20 }
          },
          {
            unitType: 'reactor',
            quantity: 2,
            turnsRemaining: 3,
            resourceDrainPerTurn: { metal: 1800, energy: 2400 }
          }
        ];
      });

      it('should calculate total construction drain', () => {
        const drain = economyEngine.getTotalConstructionDrain(basePlayerState);

        expect(drain.metal).toBe(40 + 1800);
        expect(drain.energy).toBe(20 + 2400);
      });

      it('should detect active construction', () => {
        expect(economyEngine.hasActiveConstruction(basePlayerState)).toBe(true);

        basePlayerState.economy.constructionQueue = [];
        expect(economyEngine.hasActiveConstruction(basePlayerState)).toBe(false);
      });

      it('should provide construction status', () => {
        const status = economyEngine.getConstructionStatus(basePlayerState);

        expect(status).toHaveLength(2);
        expect(status[0].completionTurn).toBe(1);
        expect(status[1].completionTurn).toBe(3);
        expect(status[0].order.unitType).toBe('frigate');
        expect(status[1].order.unitType).toBe('reactor');
      });
    });

    describe('Stall Point Detection', () => {
      it('should detect stall when metal income drops to zero', () => {
        basePlayerState.fleet.homeSystem.frigates = 5000; // 10,000 metal upkeep

        expect(economyEngine.isEconomyStalled(basePlayerState)).toBe(true);
      });

      it('should detect stall when energy income drops to zero', () => {
        basePlayerState.fleet.homeSystem.frigates = 10000; // 10,000 energy upkeep

        expect(economyEngine.isEconomyStalled(basePlayerState)).toBe(true);
      });

      it('should not stall with positive income', () => {
        basePlayerState.economy.reactors = 5; // +2500 energy
        basePlayerState.economy.mines = 3;    // +1500 metal
        basePlayerState.fleet.homeSystem.frigates = 1000; // -2000 metal, -1000 energy

        expect(economyEngine.isEconomyStalled(basePlayerState)).toBe(false);
      });

      it('should prevent new orders when stalled but continue existing', () => {
        // Set up stalled economy
        basePlayerState.fleet.homeSystem.frigates = 6000; // Causes stall

        // Add existing order
        basePlayerState.economy.constructionQueue = [
          {
            unitType: 'frigate',
            quantity: 1,
            turnsRemaining: 1,
            resourceDrainPerTurn: { metal: 4, energy: 2 }
          }
        ];

        // Try to add new order
        const newOrder: BuildOrder = {
          unitType: 'cruiser',
          quantity: 1,
          turnsRemaining: 2,
          resourceDrainPerTurn: { metal: 10, energy: 6 }
        };

        const addResult = economyEngine.addBuildOrder(basePlayerState, newOrder);
        expect(addResult.success).toBe(false);

        // Process construction - should complete existing order
        const initialFrigates = basePlayerState.fleet.homeSystem.frigates;
        economyEngine.processConstruction(basePlayerState);
        
        expect(basePlayerState.fleet.homeSystem.frigates).toBe(initialFrigates + 1);
        expect(basePlayerState.economy.constructionQueue).toHaveLength(0);
      });
    });

    describe('Upkeep and Economic Balance', () => {
      describe('applyUpkeep', () => {
        it('should validate economic state without modifying player', () => {
          const originalState = JSON.parse(JSON.stringify(basePlayerState));
          
          // Suppress console.warn for test
          const originalWarn = console.warn;
          console.warn = () => {};

          economyEngine.applyUpkeep(basePlayerState);

          // Restore console.warn
          console.warn = originalWarn;

          expect(basePlayerState).toEqual(originalState);
        });

        it('should log warnings for stalled economy', () => {
          basePlayerState.fleet.homeSystem.frigates = 6000; // Causes stall

          const warnings: string[] = [];
          const originalWarn = console.warn;
          console.warn = (message: string, warningList: string[]) => {
            warnings.push(...warningList);
          };

          economyEngine.applyUpkeep(basePlayerState);

          console.warn = originalWarn;

          expect(warnings.length).toBeGreaterThan(0);
          expect(warnings.some(w => w.includes('stalled'))).toBe(true);
        });
      });

      describe('validateEconomicState', () => {
        it('should return valid state for healthy economy', () => {
          basePlayerState.economy.reactors = 2;
          basePlayerState.economy.mines = 2;
          basePlayerState.fleet.homeSystem.frigates = 100;

          const validation = economyEngine.validateEconomicState(basePlayerState);

          expect(validation.isValid).toBe(true);
          expect(validation.warnings).toHaveLength(0);
        });

        it('should detect stalled economy', () => {
          basePlayerState.fleet.homeSystem.frigates = 6000; // Causes metal stall

          const validation = economyEngine.validateEconomicState(basePlayerState);

          expect(validation.isValid).toBe(false);
          expect(validation.warnings.some(w => w.includes('Metal income is zero or negative'))).toBe(true);
          expect(validation.recommendations.some(r => r.includes('mines'))).toBe(true);
        });

        it('should detect low income warnings', () => {
          basePlayerState.fleet.homeSystem.frigates = 4600; // 9200 metal upkeep, leaves 800 metal income

          const validation = economyEngine.validateEconomicState(basePlayerState);

          expect(validation.warnings.some(w => w.includes('critically low'))).toBe(true);
        });

        it('should detect excessive construction drain', () => {
          basePlayerState.economy.constructionQueue = [
            {
              unitType: 'battleship',
              quantity: 100,
              turnsRemaining: 4,
              resourceDrainPerTurn: { metal: 9000, energy: 5000 } // 90% and 50% of base income
            }
          ];

          const validation = economyEngine.validateEconomicState(basePlayerState);

          expect(validation.warnings.some(w => w.includes('excessive metal resources'))).toBe(true);
        });

        it('should detect excessive fleet upkeep', () => {
          basePlayerState.fleet.homeSystem.frigates = 3600; // 7200 metal upkeep (72% of base)

          const validation = economyEngine.validateEconomicState(basePlayerState);

          expect(validation.warnings.some(w => w.includes('excessive metal'))).toBe(true);
        });

        it('should recommend investing excess resources', () => {
          basePlayerState.resources.metal = 60000;
          basePlayerState.resources.energy = 55000;

          const validation = economyEngine.validateEconomicState(basePlayerState);

          expect(validation.recommendations.some(r => r.includes('excess metal'))).toBe(true);
          expect(validation.recommendations.some(r => r.includes('excess energy'))).toBe(true);
        });

        it('should warn about non-viable structures', () => {
          basePlayerState.economy.reactors = 10; // Many reactors make next one expensive

          const validation = economyEngine.validateEconomicState(basePlayerState);

          expect(validation.warnings.some(w => w.includes('not be cost-effective'))).toBe(true);
        });
      });

      describe('getEconomicEfficiency', () => {
        it('should calculate efficiency metrics', () => {
          basePlayerState.economy.reactors = 2;
          basePlayerState.economy.mines = 1;
          basePlayerState.fleet.homeSystem = {
            frigates: 100,
            cruisers: 50,
            battleships: 25
          };

          const efficiency = economyEngine.getEconomicEfficiency(basePlayerState);

          expect(efficiency.overallEfficiency).toBeGreaterThan(0);
          expect(efficiency.overallEfficiency).toBeLessThanOrEqual(1);
          expect(efficiency.metalEfficiency).toBeGreaterThan(0);
          expect(efficiency.energyEfficiency).toBeGreaterThan(0);
          expect(efficiency.structureEfficiency).toBeGreaterThan(0);
          expect(efficiency.fleetEfficiency).toBeGreaterThan(0);
        });

        it('should handle zero fleet size', () => {
          const efficiency = economyEngine.getEconomicEfficiency(basePlayerState);

          expect(efficiency.fleetEfficiency).toBe(0);
          expect(efficiency.overallEfficiency).toBeGreaterThan(0);
        });

        it('should cap efficiency values at 1', () => {
          // Create super efficient scenario
          basePlayerState.economy.reactors = 20;
          basePlayerState.economy.mines = 20;

          const efficiency = economyEngine.getEconomicEfficiency(basePlayerState);

          expect(efficiency.metalEfficiency).toBeLessThanOrEqual(1);
          expect(efficiency.energyEfficiency).toBeLessThanOrEqual(1);
          expect(efficiency.overallEfficiency).toBeLessThanOrEqual(1);
        });
      });

      describe('getEconomicRecommendations', () => {
        it('should provide high priority recommendations for stalled economy', () => {
          basePlayerState.fleet.homeSystem.frigates = 6000; // Causes stall

          const recommendations = economyEngine.getEconomicRecommendations(basePlayerState);

          const highPriority = recommendations.filter(r => r.priority === 'high');
          expect(highPriority.length).toBeGreaterThan(0);
          expect(highPriority[0].action).toContain('Reduce fleet size');
        });

        it('should provide medium priority recommendations for low income', () => {
          basePlayerState.fleet.homeSystem.frigates = 4200; // Low but positive income

          const recommendations = economyEngine.getEconomicRecommendations(basePlayerState);

          const mediumPriority = recommendations.filter(r => r.priority === 'medium');
          expect(mediumPriority.length).toBeGreaterThan(0);
          expect(mediumPriority.some(r => r.action.includes('mines') || r.action.includes('reactors'))).toBe(true);
        });

        it('should provide low priority recommendations for excess resources', () => {
          basePlayerState.resources.metal = 40000;
          basePlayerState.resources.energy = 35000;

          const recommendations = economyEngine.getEconomicRecommendations(basePlayerState);

          const lowPriority = recommendations.filter(r => r.priority === 'low');
          expect(lowPriority.length).toBeGreaterThan(0);
          expect(lowPriority.some(r => r.action.includes('fleet expansion'))).toBe(true);
        });

        it('should handle healthy economy with minimal recommendations', () => {
          basePlayerState.economy.reactors = 2;
          basePlayerState.economy.mines = 2;
          basePlayerState.fleet.homeSystem.frigates = 500;

          const recommendations = economyEngine.getEconomicRecommendations(basePlayerState);

          // Should have few or no high priority recommendations
          const highPriority = recommendations.filter(r => r.priority === 'high');
          expect(highPriority.length).toBe(0);
        });

        it('should prioritize recommendations correctly', () => {
          // Create mixed scenario
          basePlayerState.fleet.homeSystem.frigates = 5500; // Near stall
          basePlayerState.resources.metal = 35000; // Some excess

          const recommendations = economyEngine.getEconomicRecommendations(basePlayerState);

          // Should have high priority first
          const priorities = recommendations.map(r => r.priority);
          const highIndex = priorities.indexOf('high');
          const lowIndex = priorities.indexOf('low');

          if (highIndex !== -1 && lowIndex !== -1) {
            expect(highIndex).toBeLessThan(lowIndex);
          }
        });
      });

      describe('Economic Balance Integration', () => {
        it('should maintain balance through complete economic cycle', () => {
          // Start with balanced economy
          basePlayerState.economy.reactors = 1;
          basePlayerState.economy.mines = 1;
          basePlayerState.fleet.homeSystem.frigates = 200;

          // Calculate initial state
          economyEngine.calculateIncome(basePlayerState);
          const initialIncome = economyEngine.getNetIncome(basePlayerState);

          // Add construction
          const buildOrder: BuildOrder = {
            unitType: 'cruiser',
            quantity: 10,
            turnsRemaining: 2,
            resourceDrainPerTurn: { metal: 100, energy: 60 }
          };

          economyEngine.addBuildOrder(basePlayerState, buildOrder);

          // Process construction
          economyEngine.processConstruction(basePlayerState);
          economyEngine.calculateIncome(basePlayerState);

          // Apply upkeep validation
          economyEngine.applyUpkeep(basePlayerState);

          // Economy should still be functional
          const finalIncome = economyEngine.getNetIncome(basePlayerState);
          expect(finalIncome.metal).toBeGreaterThan(0);
          expect(finalIncome.energy).toBeGreaterThan(0);
        });

        it('should handle exponential structure scaling', () => {
          // Test that structure costs increase exponentially
          const firstReactorCost = calculateStructureCost('reactor', 0);
          const secondReactorCost = calculateStructureCost('reactor', 1);
          const thirdReactorCost = calculateStructureCost('reactor', 2);
          const fourthReactorCost = calculateStructureCost('reactor', 3);

          expect(secondReactorCost.metal).toBeGreaterThan(firstReactorCost.metal);
          expect(thirdReactorCost.metal).toBeGreaterThan(secondReactorCost.metal);
          expect(fourthReactorCost.metal).toBeGreaterThan(thirdReactorCost.metal);

          // Verify costs are increasing at an accelerating rate
          const firstIncrease = secondReactorCost.metal - firstReactorCost.metal;
          const secondIncrease = thirdReactorCost.metal - secondReactorCost.metal;
          const thirdIncrease = fourthReactorCost.metal - thirdReactorCost.metal;
          
          expect(secondIncrease).toBeGreaterThan(firstIncrease);
          expect(thirdIncrease).toBeGreaterThan(secondIncrease);
        });

        it('should validate complete economic state', () => {
          // Create complex economic scenario
          basePlayerState.economy.reactors = 3;
          basePlayerState.economy.mines = 2;
          basePlayerState.fleet.homeSystem = {
            frigates: 500,
            cruisers: 200,
            battleships: 50
          };
          basePlayerState.economy.constructionQueue = [
            {
              unitType: 'reactor',
              quantity: 1,
              turnsRemaining: 1,
              resourceDrainPerTurn: { metal: 2000, energy: 2500 }
            }
          ];

          const validation = economyEngine.validateEconomicState(basePlayerState);
          const efficiency = economyEngine.getEconomicEfficiency(basePlayerState);
          const recommendations = economyEngine.getEconomicRecommendations(basePlayerState);

          // All systems should provide meaningful output
          expect(validation).toBeDefined();
          expect(efficiency.overallEfficiency).toBeGreaterThan(0);
          expect(recommendations).toBeDefined();
        });
      });
    });
  });
});