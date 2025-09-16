import { describe, it, expect, beforeEach } from 'vitest';
import { IntelligenceEngine } from '../IntelligenceEngine.js';
import { PlayerState } from '../../models/PlayerState.js';
import { FleetComposition } from '../../models/GameState.js';
import { ScanResult } from '../../models/Intelligence.js';

describe('IntelligenceEngine', () => {
  let intelligenceEngine: IntelligenceEngine;
  let playerState: PlayerState;
  let targetState: PlayerState;

  beforeEach(() => {
    intelligenceEngine = new IntelligenceEngine();
    
    playerState = {
      resources: {
        metal: 10000,
        energy: 10000,
        metalIncome: 10000,
        energyIncome: 10000
      },
      fleet: {
        homeSystem: { frigates: 100, cruisers: 50, battleships: 25 },
        inTransit: { outbound: [] }
      },
      economy: {
        reactors: 2,
        mines: 3,
        constructionQueue: []
      },
      intelligence: {
        lastScanTurn: 0,
        knownEnemyFleet: { frigates: 0, cruisers: 0, battleships: 0 },
        scanAccuracy: 0,
        scanHistory: [],
        misinformationChance: 0.2
      }
    };

    targetState = {
      resources: {
        metal: 5000,
        energy: 8000,
        metalIncome: 8000,
        energyIncome: 9000
      },
      fleet: {
        homeSystem: { frigates: 200, cruisers: 100, battleships: 50 },
        inTransit: { outbound: [] }
      },
      economy: {
        reactors: 1,
        mines: 2,
        constructionQueue: []
      },
      intelligence: {
        lastScanTurn: 0,
        knownEnemyFleet: { frigates: 0, cruisers: 0, battleships: 0 },
        scanAccuracy: 0,
        scanHistory: [],
        misinformationChance: 0.2
      }
    };
  });

  describe('canAffordScan', () => {
    it('should return true when player has sufficient resources for basic scan', () => {
      expect(intelligenceEngine.canAffordScan(playerState, 'basic')).toBe(true);
    });

    it('should return true when player has sufficient resources for deep scan', () => {
      expect(intelligenceEngine.canAffordScan(playerState, 'deep')).toBe(true);
    });

    it('should return true when player has sufficient resources for advanced scan', () => {
      expect(intelligenceEngine.canAffordScan(playerState, 'advanced')).toBe(true);
    });

    it('should return false when player lacks energy for basic scan', () => {
      playerState.resources.energy = 500;
      expect(intelligenceEngine.canAffordScan(playerState, 'basic')).toBe(false);
    });

    it('should return false when player lacks energy for deep scan', () => {
      playerState.resources.energy = 2000;
      expect(intelligenceEngine.canAffordScan(playerState, 'deep')).toBe(false);
    });

    it('should return false when player lacks energy for advanced scan', () => {
      playerState.resources.energy = 3500;
      expect(intelligenceEngine.canAffordScan(playerState, 'advanced')).toBe(false);
    });
  });

  describe('deductScanCost', () => {
    it('should deduct 1000 energy for basic scan', () => {
      const initialEnergy = playerState.resources.energy;
      intelligenceEngine.deductScanCost(playerState, 'basic');
      expect(playerState.resources.energy).toBe(initialEnergy - 1000);
      expect(playerState.resources.metal).toBe(10000); // unchanged
    });

    it('should deduct 2500 energy for deep scan', () => {
      const initialEnergy = playerState.resources.energy;
      intelligenceEngine.deductScanCost(playerState, 'deep');
      expect(playerState.resources.energy).toBe(initialEnergy - 2500);
      expect(playerState.resources.metal).toBe(10000); // unchanged
    });

    it('should deduct 4000 energy for advanced scan', () => {
      const initialEnergy = playerState.resources.energy;
      intelligenceEngine.deductScanCost(playerState, 'advanced');
      expect(playerState.resources.energy).toBe(initialEnergy - 4000);
      expect(playerState.resources.metal).toBe(10000); // unchanged
    });
  });

  describe('performBasicScan', () => {
    it('should return scan result with basic type and timestamp', () => {
      const result = intelligenceEngine.performBasicScan(targetState, 5);
      expect(result.scanType).toBe('basic');
      expect(result.timestamp).toBe(5);
      expect(result.accuracy).toBe(0.7);
    });

    it('should report total fleet count as frigates with accuracy variation', () => {
      const result = intelligenceEngine.performBasicScan(targetState, 1);
      const actualTotal = 200 + 100 + 50; // 350 total ships
      const reportedTotal = result.fleetData?.frigates || 0;
      
      // Should be within ±30% of actual total
      expect(reportedTotal).toBeGreaterThanOrEqual(Math.floor(actualTotal * 0.7));
      expect(reportedTotal).toBeLessThanOrEqual(Math.ceil(actualTotal * 1.3));
      
      // Other unit types should be 0 for basic scan
      expect(result.fleetData?.cruisers).toBe(0);
      expect(result.fleetData?.battleships).toBe(0);
    });

    it('should not include economic or strategic data', () => {
      const result = intelligenceEngine.performBasicScan(targetState, 1);
      expect(result.economicData).toBeUndefined();
      expect(result.strategicIntent).toBeUndefined();
    });
  });

  describe('performDeepScan', () => {
    it('should return scan result with deep type and high accuracy', () => {
      const result = intelligenceEngine.performDeepScan(targetState, 3);
      expect(result.scanType).toBe('deep');
      expect(result.timestamp).toBe(3);
      expect(result.accuracy).toBe(0.9);
    });

    it('should report unit composition with ±10% accuracy', () => {
      const result = intelligenceEngine.performDeepScan(targetState, 1);
      const actualFleet = targetState.fleet.homeSystem;
      
      // Check frigates within ±10%
      const reportedFrigates = result.fleetData?.frigates || 0;
      expect(reportedFrigates).toBeGreaterThanOrEqual(Math.floor(actualFleet.frigates * 0.9));
      expect(reportedFrigates).toBeLessThanOrEqual(Math.ceil(actualFleet.frigates * 1.1));
      
      // Check cruisers within ±10%
      const reportedCruisers = result.fleetData?.cruisers || 0;
      expect(reportedCruisers).toBeGreaterThanOrEqual(Math.floor(actualFleet.cruisers * 0.9));
      expect(reportedCruisers).toBeLessThanOrEqual(Math.ceil(actualFleet.cruisers * 1.1));
      
      // Check battleships within ±10%
      const reportedBattleships = result.fleetData?.battleships || 0;
      expect(reportedBattleships).toBeGreaterThanOrEqual(Math.floor(actualFleet.battleships * 0.9));
      expect(reportedBattleships).toBeLessThanOrEqual(Math.ceil(actualFleet.battleships * 1.1));
    });

    it('should include accurate economic data', () => {
      const result = intelligenceEngine.performDeepScan(targetState, 1);
      expect(result.economicData).toBeDefined();
      expect(result.economicData?.reactors).toBe(targetState.economy.reactors);
      expect(result.economicData?.mines).toBe(targetState.economy.mines);
    });

    it('should not include strategic intent', () => {
      const result = intelligenceEngine.performDeepScan(targetState, 1);
      expect(result.strategicIntent).toBeUndefined();
    });
  });

  describe('performAdvancedScan', () => {
    it('should return scan result with advanced type and highest accuracy', () => {
      const result = intelligenceEngine.performAdvancedScan(targetState, 7);
      expect(result.scanType).toBe('advanced');
      expect(result.timestamp).toBe(7);
      expect(result.accuracy).toBe(0.95);
    });

    it('should include strategic intent analysis', () => {
      const result = intelligenceEngine.performAdvancedScan(targetState, 1);
      expect(result.strategicIntent).toBeDefined();
      expect(typeof result.strategicIntent).toBe('string');
      expect(result.strategicIntent!.length).toBeGreaterThan(0);
    });

    it('should provide vague fleet composition numbers', () => {
      const result = intelligenceEngine.performAdvancedScan(targetState, 1);
      expect(result.fleetData).toBeDefined();
      expect(result.fleetData?.frigates).toBeGreaterThanOrEqual(0);
      expect(result.fleetData?.cruisers).toBeGreaterThanOrEqual(0);
      expect(result.fleetData?.battleships).toBeGreaterThanOrEqual(0);
    });

    it('should detect military buildup intent', () => {
      // Add military units to construction queue
      targetState.economy.constructionQueue = [
        {
          unitType: 'battleship',
          quantity: 10,
          turnsRemaining: 3,
          resourceDrainPerTurn: { metal: 200, energy: 120 }
        },
        {
          unitType: 'cruiser',
          quantity: 20,
          turnsRemaining: 2,
          resourceDrainPerTurn: { metal: 200, energy: 120 }
        }
      ];

      const result = intelligenceEngine.performAdvancedScan(targetState, 1);
      expect(result.strategicIntent).toContain('offensive');
    });

    it('should detect economic focus intent', () => {
      // Add economic structures to construction queue
      targetState.economy.constructionQueue = [
        {
          unitType: 'reactor',
          quantity: 2,
          turnsRemaining: 1,
          resourceDrainPerTurn: { metal: 900, energy: 1200 }
        },
        {
          unitType: 'mine',
          quantity: 3,
          turnsRemaining: 1,
          resourceDrainPerTurn: { metal: 1500, energy: 600 }
        }
      ];

      const result = intelligenceEngine.performAdvancedScan(targetState, 1);
      expect(result.strategicIntent).toContain('economic');
    });
  });

  describe('performScan', () => {
    it('should return null when player cannot afford scan', () => {
      playerState.resources.energy = 500;
      const result = intelligenceEngine.performScan(playerState, targetState, 'basic', 1);
      expect(result).toBeNull();
    });

    it('should deduct costs and return scan result when affordable', () => {
      const initialEnergy = playerState.resources.energy;
      const result = intelligenceEngine.performScan(playerState, targetState, 'basic', 1);
      
      expect(result).not.toBeNull();
      expect(result?.scanType).toBe('basic');
      expect(playerState.resources.energy).toBe(initialEnergy - 1000);
    });

    it('should handle all scan types correctly', () => {
      const basicResult = intelligenceEngine.performScan(playerState, targetState, 'basic', 1);
      expect(basicResult?.scanType).toBe('basic');

      const deepResult = intelligenceEngine.performScan(playerState, targetState, 'deep', 2);
      expect(deepResult?.scanType).toBe('deep');

      const advancedResult = intelligenceEngine.performScan(playerState, targetState, 'advanced', 3);
      expect(advancedResult?.scanType).toBe('advanced');
    });

    it('should throw error for unknown scan type', () => {
      expect(() => {
        intelligenceEngine.performScan(playerState, targetState, 'unknown' as any, 1);
      }).toThrow('Unknown scan type: unknown');
    });

    it('should store scan results in intelligence history', () => {
      const result = intelligenceEngine.performScan(playerState, targetState, 'basic', 5);
      
      expect(result).not.toBeNull();
      expect(playerState.intelligence.scanHistory).toHaveLength(1);
      expect(playerState.intelligence.scanHistory[0]).toEqual(result);
      expect(playerState.intelligence.lastScanTurn).toBe(5);
    });
  });

  describe('storeScanResult', () => {
    it('should store scan result and update intelligence data', () => {
      const scanResult: ScanResult = {
        scanType: 'deep',
        timestamp: 3,
        fleetData: { frigates: 150, cruisers: 75, battleships: 30 },
        accuracy: 0.9,
        dataAge: 0
      };

      intelligenceEngine.storeScanResult(playerState, scanResult);

      expect(playerState.intelligence.scanHistory).toHaveLength(1);
      expect(playerState.intelligence.lastScanTurn).toBe(3);
      expect(playerState.intelligence.knownEnemyFleet).toEqual({
        frigates: 150,
        cruisers: 75,
        battleships: 30
      });
      expect(playerState.intelligence.scanAccuracy).toBe(0.9);
    });

    it('should limit scan history to 10 entries', () => {
      // Add 12 scan results
      for (let i = 1; i <= 12; i++) {
        const scanResult: ScanResult = {
          scanType: 'basic',
          timestamp: i,
          fleetData: { frigates: i * 10, cruisers: 0, battleships: 0 },
          accuracy: 0.7,
          dataAge: 0
        };
        intelligenceEngine.storeScanResult(playerState, scanResult);
      }

      expect(playerState.intelligence.scanHistory).toHaveLength(10);
      expect(playerState.intelligence.scanHistory[0].timestamp).toBe(3); // First two should be removed
      expect(playerState.intelligence.scanHistory[9].timestamp).toBe(12);
    });
  });

  describe('applyMisinformation', () => {
    it('should return original result when no misinformation occurs', () => {
      const scanResult: ScanResult = {
        scanType: 'basic',
        timestamp: 1,
        fleetData: { frigates: 100, cruisers: 50, battleships: 25 },
        accuracy: 0.7,
        dataAge: 0
      };

      // Mock Math.random to return 0.5 (above 0.2 misinformation chance)
      const originalRandom = Math.random;
      Math.random = () => 0.5;

      const result = intelligenceEngine.applyMisinformation(scanResult, 0.2);

      expect(result.isMisinformation).toBeUndefined();
      expect(result.fleetData).toEqual(scanResult.fleetData);
      expect(result.accuracy).toBe(0.7);

      Math.random = originalRandom;
    });

    it('should apply misinformation when chance is triggered', () => {
      const scanResult: ScanResult = {
        scanType: 'basic',
        timestamp: 1,
        fleetData: { frigates: 100, cruisers: 50, battleships: 25 },
        accuracy: 0.7,
        dataAge: 0
      };

      // Mock Math.random to trigger misinformation
      const originalRandom = Math.random;
      Math.random = () => 0.1; // Below 0.2 misinformation chance

      const result = intelligenceEngine.applyMisinformation(scanResult, 0.2);

      expect(result.isMisinformation).toBe(true);
      expect(result.accuracy).toBe(0.35); // 50% of original
      expect(result.fleetData).not.toEqual(scanResult.fleetData);

      Math.random = originalRandom;
    });
  });

  describe('ageIntelligenceData', () => {
    it('should age scan data and reduce accuracy', () => {
      const scanResult: ScanResult = {
        scanType: 'basic',
        timestamp: 1,
        fleetData: { frigates: 100, cruisers: 0, battleships: 0 },
        accuracy: 0.7,
        dataAge: 0
      };

      playerState.intelligence.scanHistory = [scanResult];
      intelligenceEngine.ageIntelligenceData(playerState, 3);

      expect(playerState.intelligence.scanHistory[0].dataAge).toBe(2);
      expect(playerState.intelligence.scanHistory[0].accuracy).toBeCloseTo(0.5, 1); // 0.7 - (2 * 0.1)
    });

    it('should not reduce accuracy below 0.1', () => {
      const scanResult: ScanResult = {
        scanType: 'basic',
        timestamp: 1,
        fleetData: { frigates: 100, cruisers: 0, battleships: 0 },
        accuracy: 0.3,
        dataAge: 0
      };

      playerState.intelligence.scanHistory = [scanResult];
      intelligenceEngine.ageIntelligenceData(playerState, 10);

      expect(playerState.intelligence.scanHistory[0].accuracy).toBe(0.1);
    });
  });

  describe('calculateIntelligenceGap', () => {
    it('should return zero confidence when no scans exist', () => {
      const gap = intelligenceEngine.calculateIntelligenceGap(playerState, 5);

      expect(gap.confidence).toBe(0);
      expect(gap.estimatedInTransit).toBe(0);
      expect(gap.lastScanTurn).toBe(0);
    });

    it('should calculate confidence decay over time', () => {
      const scanResult: ScanResult = {
        scanType: 'basic',
        timestamp: 1,
        fleetData: { frigates: 300, cruisers: 0, battleships: 0 },
        accuracy: 0.7,
        dataAge: 0
      };

      playerState.intelligence.scanHistory = [scanResult];
      playerState.intelligence.knownEnemyFleet = { frigates: 300, cruisers: 0, battleships: 0 };

      const gap = intelligenceEngine.calculateIntelligenceGap(playerState, 4);

      expect(gap.confidence).toBe(0.7); // 1 - (3 * 0.1)
      expect(gap.lastScanTurn).toBe(1);
      expect(gap.estimatedInTransit).toBe(90); // 30% of 300 ships
    });
  });

  describe('formatScanResult', () => {
    it('should format basic scan result correctly', () => {
      const scanResult: ScanResult = {
        scanType: 'basic',
        timestamp: 5,
        fleetData: { frigates: 250, cruisers: 0, battleships: 0 },
        accuracy: 0.7,
        dataAge: 2
      };

      const formatted = intelligenceEngine.formatScanResult(scanResult);

      expect(formatted).toContain('BASIC SCAN - Turn 5 (2 turns old)');
      expect(formatted).toContain('Accuracy: 70%');
      expect(formatted).toContain('Frigates: 250');
      expect(formatted).toContain('Total Ships: 250');
    });

    it('should indicate misinformation in formatted output', () => {
      const scanResult: ScanResult = {
        scanType: 'deep',
        timestamp: 3,
        fleetData: { frigates: 100, cruisers: 50, battleships: 25 },
        accuracy: 0.45,
        dataAge: 0,
        isMisinformation: true
      };

      const formatted = intelligenceEngine.formatScanResult(scanResult);

      expect(formatted).toContain('[UNRELIABLE]');
      expect(formatted).toContain('(fresh)');
    });

    it('should format advanced scan with strategic intent', () => {
      const scanResult: ScanResult = {
        scanType: 'advanced',
        timestamp: 7,
        fleetData: { frigates: 200, cruisers: 100, battleships: 50 },
        strategicIntent: 'Major offensive operations planned within 2-3 turns.',
        accuracy: 0.95,
        dataAge: 1
      };

      const formatted = intelligenceEngine.formatScanResult(scanResult);

      expect(formatted).toContain('ADVANCED SCAN');
      expect(formatted).toContain('Strategic Assessment:');
      expect(formatted).toContain('Major offensive operations planned');
    });
  });

  describe('getLatestScan', () => {
    it('should return null when no scans exist', () => {
      const latest = intelligenceEngine.getLatestScan(playerState);
      expect(latest).toBeNull();
    });

    it('should return the most recent scan', () => {
      const scan1: ScanResult = {
        scanType: 'basic',
        timestamp: 1,
        accuracy: 0.7,
        dataAge: 0
      };

      const scan2: ScanResult = {
        scanType: 'deep',
        timestamp: 3,
        accuracy: 0.9,
        dataAge: 0
      };

      playerState.intelligence.scanHistory = [scan1, scan2];
      const latest = intelligenceEngine.getLatestScan(playerState);

      expect(latest).toEqual(scan2);
    });
  });

  describe('getScansByType', () => {
    it('should filter scans by type', () => {
      const basicScan: ScanResult = {
        scanType: 'basic',
        timestamp: 1,
        accuracy: 0.7,
        dataAge: 0
      };

      const deepScan: ScanResult = {
        scanType: 'deep',
        timestamp: 2,
        accuracy: 0.9,
        dataAge: 0
      };

      const anotherBasicScan: ScanResult = {
        scanType: 'basic',
        timestamp: 3,
        accuracy: 0.7,
        dataAge: 0
      };

      playerState.intelligence.scanHistory = [basicScan, deepScan, anotherBasicScan];
      const basicScans = intelligenceEngine.getScansByType(playerState, 'basic');

      expect(basicScans).toHaveLength(2);
      expect(basicScans[0]).toEqual(basicScan);
      expect(basicScans[1]).toEqual(anotherBasicScan);
    });
  });
});