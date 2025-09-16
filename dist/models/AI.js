export class BaseAIArchetype {
    archetype;
    behaviorProbabilities;
    constructor(archetype, probabilities) {
        this.archetype = archetype;
        this.behaviorProbabilities = probabilities;
    }
    calculateThreatLevel(gameState, aiState) {
        const playerFleet = gameState.player.fleet.homeSystem;
        const aiFleet = aiState.fleet.homeSystem;
        const playerStrength = this.calculateFleetStrength(playerFleet);
        const aiStrength = this.calculateFleetStrength(aiFleet);
        if (aiStrength === 0)
            return 1.0; // Maximum threat if AI has no fleet
        const ratio = playerStrength / aiStrength;
        return Math.min(1.0, Math.max(0.0, ratio - 0.5)); // Normalize to 0-1 scale
    }
    calculateEconomicAdvantage(gameState, aiState) {
        const playerIncome = gameState.player.resources.metalIncome + gameState.player.resources.energyIncome;
        const aiIncome = aiState.resources.metalIncome + aiState.resources.energyIncome;
        if (playerIncome + aiIncome === 0)
            return 0;
        return (aiIncome - playerIncome) / (aiIncome + playerIncome);
    }
    calculateFleetStrength(fleet) {
        // Weighted strength calculation based on unit costs and effectiveness
        return fleet.frigates * 1 + fleet.cruisers * 2.5 + fleet.battleships * 5;
    }
    shouldAdaptBehavior() {
        return Math.random() < this.behaviorProbabilities.adaptiveVariation;
    }
    canAffordBuild(resources, buildType, quantity = 1) {
        const costs = this.getBuildCosts(buildType);
        return resources.metal >= costs.metal * quantity &&
            resources.energy >= costs.energy * quantity;
    }
    getBuildCosts(buildType) {
        const costs = {
            frigate: { metal: 4, energy: 2 },
            cruiser: { metal: 10, energy: 6 },
            battleship: { metal: 20, energy: 12 },
            reactor: { metal: 900, energy: 1200 },
            mine: { metal: 1500, energy: 600 }
        };
        return costs[buildType];
    }
    getOptimalFleetComposition(targetStrength, threatType) {
        // Simple composition logic - can be enhanced later
        if (threatType) {
            // Counter the dominant unit type
            const dominantUnit = this.getDominantUnitType(threatType);
            return this.getCounterComposition(dominantUnit, targetStrength);
        }
        // Default balanced composition
        const frigateCount = Math.floor(targetStrength * 0.5);
        const cruiserCount = Math.floor(targetStrength * 0.3);
        const battleshipCount = Math.floor(targetStrength * 0.2);
        return {
            frigates: frigateCount,
            cruisers: cruiserCount,
            battleships: battleshipCount
        };
    }
    getDominantUnitType(fleet) {
        const total = fleet.frigates + fleet.cruisers + fleet.battleships;
        if (total === 0)
            return 'frigate';
        const frigateRatio = fleet.frigates / total;
        const cruiserRatio = fleet.cruisers / total;
        const battleshipRatio = fleet.battleships / total;
        if (frigateRatio >= cruiserRatio && frigateRatio >= battleshipRatio)
            return 'frigate';
        if (cruiserRatio >= battleshipRatio)
            return 'cruiser';
        return 'battleship';
    }
    getCounterComposition(dominantUnit, strength) {
        // Rock-paper-scissors counters: Frigate > Cruiser > Battleship > Frigate
        switch (dominantUnit) {
            case 'frigate':
                return { frigates: 0, cruisers: 0, battleships: Math.floor(strength) };
            case 'cruiser':
                return { frigates: Math.floor(strength), cruisers: 0, battleships: 0 };
            case 'battleship':
                return { frigates: 0, cruisers: Math.floor(strength), battleships: 0 };
        }
    }
    validateDecision(decision, aiState) {
        switch (decision.type) {
            case 'build':
                if (!decision.buildType || !decision.buildQuantity)
                    return false;
                return this.canAffordBuild(aiState.resources, decision.buildType, decision.buildQuantity);
            case 'attack':
                if (!decision.attackFleet || !decision.attackTarget)
                    return false;
                return this.hasAvailableFleet(aiState, decision.attackFleet);
            case 'scan':
                if (!decision.scanType)
                    return false;
                const scanCosts = { basic: 1000, deep: 2500, advanced: 4000 };
                return aiState.resources.energy >= scanCosts[decision.scanType];
            case 'wait':
                return true;
            default:
                return false;
        }
    }
    hasAvailableFleet(aiState, requiredFleet) {
        const available = aiState.fleet.homeSystem;
        return available.frigates >= requiredFleet.frigates &&
            available.cruisers >= requiredFleet.cruisers &&
            available.battleships >= requiredFleet.battleships;
    }
}
//# sourceMappingURL=AI.js.map