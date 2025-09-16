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
    dataAge: number;
}
export interface IntelligenceGap {
    lastKnownFleet: FleetComposition;
    lastScanTurn: number;
    estimatedInTransit: number;
    confidence: number;
}
export interface ScanCosts {
    basic: {
        metal: 0;
        energy: 1000;
    };
    deep: {
        metal: 0;
        energy: 2500;
    };
    advanced: {
        metal: 0;
        energy: 4000;
    };
}
export declare const SCAN_COSTS: ScanCosts;
export declare const MISINFORMATION_BASE_CHANCE = 0.2;
export declare const CONFIDENCE_DECAY_RATE = 0.1;
//# sourceMappingURL=Intelligence.d.ts.map