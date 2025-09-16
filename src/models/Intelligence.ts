import { FleetComposition } from './GameState.js';

export type ScanType = 'basic' | 'deep' | 'advanced';

export interface Intelligence {
  lastScanTurn: number;
  knownEnemyFleet: FleetComposition;
  scanAccuracy: number;
  scanHistory?: ScanResult[];
  misinformationChance?: number;
  lastScanData?: ScanResult | null;
  misinformationActive?: boolean;
}

export interface ScanResult {
  scanType: ScanType;
  timestamp: number;
  fleetData?: Partial<FleetComposition>;
  economicData?: {
    reactors: number;
    mines: number;
  };
  strategicIntent?: string;
  accuracy: number;
  isMisinformation?: boolean;
  dataAge: number; // turns since scan was performed
}

export interface IntelligenceGap {
  lastKnownFleet: FleetComposition;
  lastScanTurn: number;
  estimatedInTransit: number; // estimated ships that might be in transit
  confidence: number; // 0-1, decreases over time
}

export interface ScanCosts {
  basic: { metal: 0, energy: 1000 };
  deep: { metal: 0, energy: 2500 };
  advanced: { metal: 0, energy: 4000 };
}

export const SCAN_COSTS: ScanCosts = {
  basic: { metal: 0, energy: 1000 },
  deep: { metal: 0, energy: 2500 },
  advanced: { metal: 0, energy: 4000 }
};

export const MISINFORMATION_BASE_CHANCE = 0.2; // 20% base chance
export const CONFIDENCE_DECAY_RATE = 0.1; // 10% confidence loss per turn