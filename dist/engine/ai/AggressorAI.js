import { BaseAIArchetype } from '../../models/AI.js';
export class AggressorAI extends BaseAIArchetype {
    constructor() {
        super('aggressor', {
            militaryFocus: 0.8,
            economicFocus: 0.2,
            aggressionLevel: 0.9,
            deceptionChance: 0.1,
            adaptiveVariation: 0.2
        });
    }
    makeDecision(gameState, aiState) {
        // Update threat assessment
        aiState.threatLevel = this.calculateThreatLevel(gameState, aiState);
        aiState.economicAdvantage = this.calculateEconomicAdvantage(gameState, aiState);
        // 20% chance to turtle defensively (adaptive behavior)
        if (this.shouldAdaptBehavior() && aiState.threatLevel > 0.7) {
            return this.makeDefensiveDecision(aiState);
        }
        // 80% military focus - prioritize building units and attacking
        if (Math.random() < this.behaviorProbabilities.militaryFocus) {
            return this.makeMilitaryDecision(gameState, aiState);
        }
        // 20% economic focus - build economic structures when needed
        return this.makeEconomicDecision(aiState);
    }
    makeDefensiveDecision(aiState) {
        // Focus on building defensive units (battleships for their strength)
        if (this.canAffordBuild(aiState.resources, 'battleship')) {
            return {
                type: 'build',
                buildType: 'battleship',
                buildQuantity: 1
            };
        }
        if (this.canAffordBuild(aiState.resources, 'cruiser')) {
            return {
                type: 'build',
                buildType: 'cruiser',
                buildQuantity: Math.floor(Math.random() * 3) + 1
            };
        }
        if (this.canAffordBuild(aiState.resources, 'frigate')) {
            return {
                type: 'build',
                buildType: 'frigate',
                buildQuantity: Math.floor(Math.random() * 5) + 1
            };
        }
        return { type: 'wait' };
    }
    makeMilitaryDecision(gameState, aiState) {
        const currentFleet = aiState.fleet.homeSystem;
        const totalUnits = currentFleet.frigates + currentFleet.cruisers + currentFleet.battleships;
        // If we have a decent fleet, consider attacking
        if (totalUnits >= 5 && aiState.threatLevel < 0.8) {
            const playerFleet = gameState.player.fleet.homeSystem;
            const attackFleet = this.planAttackFleet(currentFleet, playerFleet);
            if (attackFleet && this.hasAvailableFleet(aiState, attackFleet)) {
                return {
                    type: 'attack',
                    attackTarget: 'player_home',
                    attackFleet
                };
            }
        }
        // Otherwise, build military units
        return this.buildMilitaryUnits(aiState);
    }
    planAttackFleet(availableFleet, enemyFleet) {
        const totalAvailable = availableFleet.frigates + availableFleet.cruisers + availableFleet.battleships;
        if (totalAvailable < 3)
            return null;
        // Use 60-80% of available fleet for attack
        const attackRatio = 0.6 + Math.random() * 0.2;
        return {
            frigates: Math.floor(availableFleet.frigates * attackRatio),
            cruisers: Math.floor(availableFleet.cruisers * attackRatio),
            battleships: Math.floor(availableFleet.battleships * attackRatio)
        };
    }
    buildMilitaryUnits(aiState) {
        // Prefer fast, aggressive units
        if (this.canAffordBuild(aiState.resources, 'frigate', 3)) {
            return {
                type: 'build',
                buildType: 'frigate',
                buildQuantity: Math.floor(Math.random() * 3) + 1
            };
        }
        if (this.canAffordBuild(aiState.resources, 'cruiser', 2)) {
            return {
                type: 'build',
                buildType: 'cruiser',
                buildQuantity: Math.floor(Math.random() * 2) + 1
            };
        }
        if (this.canAffordBuild(aiState.resources, 'battleship')) {
            return {
                type: 'build',
                buildType: 'battleship',
                buildQuantity: 1
            };
        }
        return { type: 'wait' };
    }
    makeEconomicDecision(aiState) {
        // Only build economy if income is getting low
        const totalIncome = aiState.resources.metalIncome + aiState.resources.energyIncome;
        if (totalIncome < 15000) {
            if (aiState.resources.metalIncome < aiState.resources.energyIncome &&
                this.canAffordBuild(aiState.resources, 'mine')) {
                return {
                    type: 'build',
                    buildType: 'mine',
                    buildQuantity: 1
                };
            }
            if (this.canAffordBuild(aiState.resources, 'reactor')) {
                return {
                    type: 'build',
                    buildType: 'reactor',
                    buildQuantity: 1
                };
            }
        }
        // Fall back to military if can't build economy
        return this.buildMilitaryUnits(aiState);
    }
}
//# sourceMappingURL=AggressorAI.js.map