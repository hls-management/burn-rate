import { SCAN_COSTS, MISINFORMATION_BASE_CHANCE, CONFIDENCE_DECAY_RATE } from '../models/Intelligence.js';
export class IntelligenceEngine {
    /**
     * Validates if a player has sufficient resources to perform a scan
     */
    canAffordScan(playerState, scanType) {
        const cost = SCAN_COSTS[scanType];
        if (!cost) {
            throw new Error(`Unknown scan type: ${scanType}`);
        }
        return playerState.resources.metal >= cost.metal &&
            playerState.resources.energy >= cost.energy;
    }
    /**
     * Deducts scan costs from player resources
     */
    deductScanCost(playerState, scanType) {
        const cost = SCAN_COSTS[scanType];
        if (!cost) {
            throw new Error(`Unknown scan type: ${scanType}`);
        }
        playerState.resources.metal -= cost.metal;
        playerState.resources.energy -= cost.energy;
    }
    /**
     * Performs a basic scan - reveals total fleet count with ±30% accuracy
     */
    performBasicScan(targetState, currentTurn) {
        const actualFleet = targetState.fleet.homeSystem;
        const totalShips = actualFleet.frigates + actualFleet.cruisers + actualFleet.battleships;
        // Apply ±30% accuracy variation
        const accuracyVariation = 0.3;
        const randomFactor = 1 + (Math.random() - 0.5) * 2 * accuracyVariation;
        const reportedTotal = Math.max(0, Math.round(totalShips * randomFactor));
        return {
            scanType: 'basic',
            timestamp: currentTurn,
            fleetData: {
                // Only report total as a single frigate count for simplicity
                frigates: reportedTotal,
                cruisers: 0,
                battleships: 0
            },
            accuracy: 0.7, // 70% base accuracy for basic scans
            dataAge: 0
        };
    }
    /**
     * Performs a deep scan - reveals unit composition and economic status with ±10% accuracy
     */
    performDeepScan(targetState, currentTurn) {
        const actualFleet = targetState.fleet.homeSystem;
        const accuracyVariation = 0.1;
        // Apply ±10% accuracy to each unit type
        const applyAccuracy = (value) => {
            const randomFactor = 1 + (Math.random() - 0.5) * 2 * accuracyVariation;
            return Math.max(0, Math.round(value * randomFactor));
        };
        return {
            scanType: 'deep',
            timestamp: currentTurn,
            fleetData: {
                frigates: applyAccuracy(actualFleet.frigates),
                cruisers: applyAccuracy(actualFleet.cruisers),
                battleships: applyAccuracy(actualFleet.battleships)
            },
            economicData: {
                reactors: targetState.economy.reactors,
                mines: targetState.economy.mines
            },
            accuracy: 0.9, // 90% base accuracy for deep scans
            dataAge: 0
        };
    }
    /**
     * Performs an advanced scan - reveals strategic intent with vague numbers
     */
    performAdvancedScan(targetState, currentTurn) {
        const actualFleet = targetState.fleet.homeSystem;
        const totalShips = actualFleet.frigates + actualFleet.cruisers + actualFleet.battleships;
        const constructionQueue = targetState.economy.constructionQueue;
        // Determine strategic intent based on fleet composition and construction
        let strategicIntent = this.determineStrategicIntent(targetState);
        // Provide vague fleet numbers
        const fleetSizeCategory = this.categorizeFleetSize(totalShips);
        return {
            scanType: 'advanced',
            timestamp: currentTurn,
            fleetData: {
                // Vague numbers - just size categories
                frigates: fleetSizeCategory === 'small' ? Math.floor(totalShips * 0.6) :
                    fleetSizeCategory === 'medium' ? Math.floor(totalShips * 0.5) :
                        Math.floor(totalShips * 0.4),
                cruisers: Math.floor(totalShips * 0.3),
                battleships: Math.floor(totalShips * 0.1)
            },
            strategicIntent,
            accuracy: 0.95, // 95% accuracy for strategic assessment
            dataAge: 0
        };
    }
    /**
     * Determines strategic intent based on player state
     */
    determineStrategicIntent(targetState) {
        const fleet = targetState.fleet.homeSystem;
        const totalShips = fleet.frigates + fleet.cruisers + fleet.battleships;
        const constructionQueue = targetState.economy.constructionQueue;
        const economicStructures = targetState.economy.reactors + targetState.economy.mines;
        // Check construction queue for military vs economic focus
        const militaryInQueue = constructionQueue.filter(order => ['frigate', 'cruiser', 'battleship'].includes(order.unitType)).length;
        const economicInQueue = constructionQueue.filter(order => ['reactor', 'mine'].includes(order.unitType)).length;
        if (militaryInQueue > economicInQueue && totalShips > 100) {
            return "Major offensive operations planned within 2-3 turns. Heavy military buildup detected.";
        }
        else if (economicInQueue > militaryInQueue) {
            return "Focusing on economic expansion. Defensive posture likely for next few turns.";
        }
        else if (totalShips < 50) {
            return "Rebuilding phase detected. Vulnerable to immediate pressure.";
        }
        else if (fleet.battleships > fleet.frigates + fleet.cruisers) {
            return "Heavy battleship focus suggests anti-frigate strategy preparation.";
        }
        else if (fleet.frigates > fleet.cruisers + fleet.battleships) {
            return "Frigate swarm tactics detected. Likely targeting cruiser-heavy fleets.";
        }
        else {
            return "Balanced development approach. Strategic intentions unclear.";
        }
    }
    /**
     * Categorizes fleet size for vague reporting
     */
    categorizeFleetSize(totalShips) {
        if (totalShips < 100)
            return 'small';
        if (totalShips < 500)
            return 'medium';
        return 'large';
    }
    /**
     * Stores scan result in player's intelligence history
     */
    storeScanResult(playerState, scanResult) {
        // Add data age (0 for fresh scan)
        scanResult.dataAge = 0;
        // Store in scan history
        if (!playerState.intelligence.scanHistory) {
            playerState.intelligence.scanHistory = [];
        }
        playerState.intelligence.scanHistory.push(scanResult);
        // Update last scan turn
        playerState.intelligence.lastScanTurn = scanResult.timestamp;
        // Update known enemy fleet if scan includes fleet data
        if (scanResult.fleetData) {
            playerState.intelligence.knownEnemyFleet = {
                frigates: scanResult.fleetData.frigates || 0,
                cruisers: scanResult.fleetData.cruisers || 0,
                battleships: scanResult.fleetData.battleships || 0
            };
        }
        // Update scan accuracy
        playerState.intelligence.scanAccuracy = scanResult.accuracy;
        // Limit history size to last 10 scans
        if (playerState.intelligence.scanHistory && playerState.intelligence.scanHistory.length > 10) {
            playerState.intelligence.scanHistory = playerState.intelligence.scanHistory.slice(-10);
        }
    }
    /**
     * Applies misinformation to scan results
     */
    applyMisinformation(scanResult, misinformationChance) {
        if (Math.random() < misinformationChance) {
            const misinformedResult = { ...scanResult };
            misinformedResult.isMisinformation = true;
            // Apply misinformation based on scan type
            if (misinformedResult.fleetData) {
                const variation = 0.5; // ±50% variation for misinformation
                misinformedResult.fleetData = {
                    frigates: Math.max(0, Math.round((misinformedResult.fleetData.frigates || 0) * (1 + (Math.random() - 0.5) * 2 * variation))),
                    cruisers: Math.max(0, Math.round((misinformedResult.fleetData.cruisers || 0) * (1 + (Math.random() - 0.5) * 2 * variation))),
                    battleships: Math.max(0, Math.round((misinformedResult.fleetData.battleships || 0) * (1 + (Math.random() - 0.5) * 2 * variation)))
                };
            }
            // Reduce accuracy for misinformation
            misinformedResult.accuracy *= 0.5;
            return misinformedResult;
        }
        return scanResult;
    }
    /**
     * Ages existing scan data and reduces confidence
     */
    ageIntelligenceData(playerState, currentTurn) {
        if (playerState.intelligence.scanHistory) {
            playerState.intelligence.scanHistory.forEach(scan => {
                scan.dataAge = currentTurn - scan.timestamp;
                // Reduce accuracy over time
                scan.accuracy = Math.max(0.1, scan.accuracy - (scan.dataAge * CONFIDENCE_DECAY_RATE));
            });
        }
    }
    /**
     * Calculates intelligence gaps for in-transit fleets
     */
    calculateIntelligenceGap(playerState, currentTurn) {
        const lastScan = this.getLatestScan(playerState);
        if (!lastScan) {
            return {
                lastKnownFleet: { frigates: 0, cruisers: 0, battleships: 0 },
                lastScanTurn: 0,
                estimatedInTransit: 0,
                confidence: 0
            };
        }
        const turnsSinceLastScan = currentTurn - lastScan.timestamp;
        const confidence = Math.max(0, 1 - (turnsSinceLastScan * CONFIDENCE_DECAY_RATE));
        // Estimate potential in-transit fleets based on time gap
        const estimatedInTransit = turnsSinceLastScan > 2 ?
            Math.floor((playerState.intelligence.knownEnemyFleet.frigates +
                playerState.intelligence.knownEnemyFleet.cruisers +
                playerState.intelligence.knownEnemyFleet.battleships) * 0.3) : 0;
        return {
            lastKnownFleet: playerState.intelligence.knownEnemyFleet,
            lastScanTurn: lastScan.timestamp,
            estimatedInTransit,
            confidence
        };
    }
    /**
     * Gets the most recent scan result
     */
    getLatestScan(playerState) {
        const history = playerState.intelligence.scanHistory;
        return history && history.length > 0 ? history[history.length - 1] : null;
    }
    /**
     * Gets scan results of a specific type
     */
    getScansByType(playerState, scanType) {
        return playerState.intelligence.scanHistory?.filter(scan => scan.scanType === scanType) || [];
    }
    /**
     * Formats scan result for display
     */
    formatScanResult(scanResult) {
        const ageText = scanResult.dataAge > 0 ? ` (${scanResult.dataAge} turns old)` : ' (fresh)';
        const misinfoText = scanResult.isMisinformation ? ' [UNRELIABLE]' : '';
        let result = `${scanResult.scanType.toUpperCase()} SCAN - Turn ${scanResult.timestamp}${ageText}${misinfoText}\n`;
        result += `Accuracy: ${Math.round(scanResult.accuracy * 100)}%\n`;
        if (scanResult.fleetData) {
            result += `Fleet Composition:\n`;
            result += `  Frigates: ${scanResult.fleetData.frigates || 0}\n`;
            result += `  Cruisers: ${scanResult.fleetData.cruisers || 0}\n`;
            result += `  Battleships: ${scanResult.fleetData.battleships || 0}\n`;
            const total = (scanResult.fleetData.frigates || 0) +
                (scanResult.fleetData.cruisers || 0) +
                (scanResult.fleetData.battleships || 0);
            result += `  Total Ships: ${total}\n`;
        }
        if (scanResult.economicData) {
            result += `Economic Infrastructure:\n`;
            result += `  Reactors: ${scanResult.economicData.reactors}\n`;
            result += `  Mines: ${scanResult.economicData.mines}\n`;
        }
        if (scanResult.strategicIntent) {
            result += `Strategic Assessment:\n`;
            result += `  ${scanResult.strategicIntent}\n`;
        }
        return result;
    }
    /**
     * Formats intelligence gap information
     */
    formatIntelligenceGap(gap, currentTurn) {
        const turnsSince = currentTurn - gap.lastScanTurn;
        let result = `INTELLIGENCE ASSESSMENT\n`;
        result += `Last scan: ${turnsSince} turns ago (Turn ${gap.lastScanTurn})\n`;
        result += `Data confidence: ${Math.round(gap.confidence * 100)}%\n`;
        if (gap.estimatedInTransit > 0) {
            result += `WARNING: Estimated ${gap.estimatedInTransit} ships may be in transit (invisible to scans)\n`;
        }
        result += `Last known fleet composition:\n`;
        result += `  Frigates: ${gap.lastKnownFleet.frigates}\n`;
        result += `  Cruisers: ${gap.lastKnownFleet.cruisers}\n`;
        result += `  Battleships: ${gap.lastKnownFleet.battleships}\n`;
        if (gap.confidence < 0.5) {
            result += `CAUTION: Intelligence data is highly unreliable. Consider new scan.\n`;
        }
        return result;
    }
    /**
     * Main scan method that handles validation, cost deduction, and scan execution
     */
    performScan(playerState, targetState, scanType, currentTurn) {
        // Validate resources
        if (!this.canAffordScan(playerState, scanType)) {
            return null;
        }
        // Deduct costs
        this.deductScanCost(playerState, scanType);
        // Perform the appropriate scan
        let scanResult;
        switch (scanType) {
            case 'basic':
                scanResult = this.performBasicScan(targetState, currentTurn);
                break;
            case 'deep':
                scanResult = this.performDeepScan(targetState, currentTurn);
                break;
            case 'advanced':
                scanResult = this.performAdvancedScan(targetState, currentTurn);
                break;
            default:
                throw new Error(`Unknown scan type: ${scanType}`);
        }
        // Apply misinformation
        scanResult = this.applyMisinformation(scanResult, playerState.intelligence.misinformationChance || MISINFORMATION_BASE_CHANCE);
        // Store the scan result
        this.storeScanResult(playerState, scanResult);
        return scanResult;
    }
}
//# sourceMappingURL=IntelligenceEngine.js.map