import { BaseAIArchetype } from '../../models/AI.js';
export class TricksterAI extends BaseAIArchetype {
    lastDeceptionTurn = 0;
    deceptionCooldown = 3; // Turns between deception attempts
    constructor() {
        super('trickster', {
            militaryFocus: 0.4,
            economicFocus: 0.3,
            aggressionLevel: 0.6,
            deceptionChance: 0.7,
            adaptiveVariation: 0.3
        });
    }
    makeDecision(gameState, aiState) {
        // Update threat assessment
        aiState.threatLevel = this.calculateThreatLevel(gameState, aiState);
        aiState.economicAdvantage = this.calculateEconomicAdvantage(gameState, aiState);
        // 30% chance to play straightforward when player stops scanning
        const playerLastScan = gameState.player.intelligence.lastScanTurn;
        const turnsSincePlayerScan = gameState.turn - playerLastScan;
        if (turnsSincePlayerScan > 3 && Math.random() < 0.3) {
            return this.makeStraightforwardDecision(gameState, aiState);
        }
        // 70% deception and misdirection
        if (Math.random() < this.behaviorProbabilities.deceptionChance) {
            return this.makeDeceptiveDecision(gameState, aiState);
        }
        // Fallback to balanced approach
        return this.makeBalancedDecision(gameState, aiState);
    }
    makeDeceptiveDecision(gameState, aiState) {
        const currentTurn = gameState.turn;
        // Deploy misinformation through scanning behavior
        if (currentTurn - this.lastDeceptionTurn >= this.deceptionCooldown) {
            // Scan to appear like we're gathering intelligence (misdirection)
            if (aiState.resources.energy >= 1000 && Math.random() < 0.4) {
                this.lastDeceptionTurn = currentTurn;
                return {
                    type: 'scan',
                    scanType: 'basic'
                };
            }
        }
        // Build unexpected unit compositions
        return this.buildUnexpectedUnits(aiState, gameState);
    }
    buildUnexpectedUnits(aiState, gameState) {
        const playerFleet = gameState.player.fleet.homeSystem;
        const playerDominantUnit = this.getDominantUnitType(playerFleet);
        // Build units that seem suboptimal but create confusion
        switch (playerDominantUnit) {
            case 'frigate':
                // Player expects us to build battleships, build cruisers instead
                if (this.canAffordBuild(aiState.resources, 'cruiser')) {
                    return {
                        type: 'build',
                        buildType: 'cruiser',
                        buildQuantity: Math.floor(Math.random() * 2) + 1
                    };
                }
                break;
            case 'cruiser':
                // Player expects frigates, build battleships
                if (this.canAffordBuild(aiState.resources, 'battleship')) {
                    return {
                        type: 'build',
                        buildType: 'battleship',
                        buildQuantity: 1
                    };
                }
                break;
            case 'battleship':
                // Player expects cruisers, build frigates
                if (this.canAffordBuild(aiState.resources, 'frigate', 3)) {
                    return {
                        type: 'build',
                        buildType: 'frigate',
                        buildQuantity: Math.floor(Math.random() * 4) + 2
                    };
                }
                break;
        }
        // Fallback to random unit type
        const unitTypes = ['frigate', 'cruiser', 'battleship'];
        const randomUnit = unitTypes[Math.floor(Math.random() * unitTypes.length)];
        if (this.canAffordBuild(aiState.resources, randomUnit)) {
            return {
                type: 'build',
                buildType: randomUnit,
                buildQuantity: 1
            };
        }
        return { type: 'wait' };
    }
    makeStraightforwardDecision(gameState, aiState) {
        // Play optimally when player isn't watching
        const currentFleet = aiState.fleet.homeSystem;
        const totalUnits = currentFleet.frigates + currentFleet.cruisers + currentFleet.battleships;
        // Attack if we have advantage
        if (totalUnits >= 6 && aiState.threatLevel < 0.6) {
            const playerFleet = gameState.player.fleet.homeSystem;
            const attackFleet = this.planOptimalAttack(currentFleet, playerFleet);
            if (attackFleet && this.hasAvailableFleet(aiState, attackFleet)) {
                return {
                    type: 'attack',
                    attackTarget: 'player_home',
                    attackFleet
                };
            }
        }
        // Build optimal counters
        return this.buildOptimalUnits(aiState, gameState);
    }
    planOptimalAttack(availableFleet, enemyFleet) {
        const ourStrength = this.calculateFleetStrength(availableFleet);
        const enemyStrength = this.calculateFleetStrength(enemyFleet);
        if (ourStrength < enemyStrength * 1.2)
            return null;
        // Use 50-70% of fleet for attack
        const attackRatio = 0.5 + Math.random() * 0.2;
        return {
            frigates: Math.floor(availableFleet.frigates * attackRatio),
            cruisers: Math.floor(availableFleet.cruisers * attackRatio),
            battleships: Math.floor(availableFleet.battleships * attackRatio)
        };
    }
    buildOptimalUnits(aiState, gameState) {
        const playerFleet = gameState.player.fleet.homeSystem;
        const optimalCounter = this.getOptimalCounter(playerFleet);
        if (this.canAffordBuild(aiState.resources, optimalCounter.unitType, optimalCounter.quantity)) {
            return {
                type: 'build',
                buildType: optimalCounter.unitType,
                buildQuantity: optimalCounter.quantity
            };
        }
        // Fallback to any affordable unit
        if (this.canAffordBuild(aiState.resources, 'frigate')) {
            return {
                type: 'build',
                buildType: 'frigate',
                buildQuantity: 1
            };
        }
        return { type: 'wait' };
    }
    getOptimalCounter(enemyFleet) {
        const dominantUnit = this.getDominantUnitType(enemyFleet);
        switch (dominantUnit) {
            case 'frigate':
                return { unitType: 'battleship', quantity: 1 };
            case 'cruiser':
                return { unitType: 'frigate', quantity: 3 };
            case 'battleship':
                return { unitType: 'cruiser', quantity: 2 };
        }
    }
    makeBalancedDecision(gameState, aiState) {
        // Mix of economic and military decisions
        if (Math.random() < 0.5) {
            return this.makeEconomicDecision(aiState);
        }
        else {
            return this.makeMilitaryDecision(aiState);
        }
    }
    makeEconomicDecision(aiState) {
        if (aiState.resources.metalIncome < 15000 && this.canAffordBuild(aiState.resources, 'mine')) {
            return {
                type: 'build',
                buildType: 'mine',
                buildQuantity: 1
            };
        }
        if (aiState.resources.energyIncome < 15000 && this.canAffordBuild(aiState.resources, 'reactor')) {
            return {
                type: 'build',
                buildType: 'reactor',
                buildQuantity: 1
            };
        }
        return this.makeMilitaryDecision(aiState);
    }
    makeMilitaryDecision(aiState) {
        const unitTypes = ['frigate', 'cruiser', 'battleship'];
        const randomUnit = unitTypes[Math.floor(Math.random() * unitTypes.length)];
        if (this.canAffordBuild(aiState.resources, randomUnit)) {
            return {
                type: 'build',
                buildType: randomUnit,
                buildQuantity: 1
            };
        }
        return { type: 'wait' };
    }
}
//# sourceMappingURL=TricksterAI.js.map