import { PlayerState } from '../models/PlayerState.js';
import { ScanType, ScanResult, IntelligenceGap } from '../models/Intelligence.js';
export declare class IntelligenceEngine {
    /**
     * Validates if a player has sufficient resources to perform a scan
     */
    canAffordScan(playerState: PlayerState, scanType: ScanType): boolean;
    /**
     * Deducts scan costs from player resources
     */
    deductScanCost(playerState: PlayerState, scanType: ScanType): void;
    /**
     * Performs a basic scan - reveals total fleet count with ±30% accuracy
     */
    performBasicScan(targetState: PlayerState, currentTurn: number): ScanResult;
    /**
     * Performs a deep scan - reveals unit composition and economic status with ±10% accuracy
     */
    performDeepScan(targetState: PlayerState, currentTurn: number): ScanResult;
    /**
     * Performs an advanced scan - reveals strategic intent with vague numbers
     */
    performAdvancedScan(targetState: PlayerState, currentTurn: number): ScanResult;
    /**
     * Determines strategic intent based on player state
     */
    private determineStrategicIntent;
    /**
     * Categorizes fleet size for vague reporting
     */
    private categorizeFleetSize;
    /**
     * Stores scan result in player's intelligence history
     */
    storeScanResult(playerState: PlayerState, scanResult: ScanResult): void;
    /**
     * Applies misinformation to scan results
     */
    applyMisinformation(scanResult: ScanResult, misinformationChance: number): ScanResult;
    /**
     * Ages existing scan data and reduces confidence
     */
    ageIntelligenceData(playerState: PlayerState, currentTurn: number): void;
    /**
     * Calculates intelligence gaps for in-transit fleets
     */
    calculateIntelligenceGap(playerState: PlayerState, currentTurn: number): IntelligenceGap;
    /**
     * Gets the most recent scan result
     */
    getLatestScan(playerState: PlayerState): ScanResult | null;
    /**
     * Gets scan results of a specific type
     */
    getScansByType(playerState: PlayerState, scanType: ScanType): ScanResult[];
    /**
     * Formats scan result for display
     */
    formatScanResult(scanResult: ScanResult): string;
    /**
     * Formats intelligence gap information
     */
    formatIntelligenceGap(gap: IntelligenceGap, currentTurn: number): string;
    /**
     * Main scan method that handles validation, cost deduction, and scan execution
     */
    performScan(playerState: PlayerState, targetState: PlayerState, scanType: ScanType, currentTurn: number): ScanResult | null;
}
//# sourceMappingURL=IntelligenceEngine.d.ts.map