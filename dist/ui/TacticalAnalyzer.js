import { UNIT_STATS } from '../models/Fleet.js';
/**
 * Tactical Analyzer utility class for calculating unit effectiveness and battle advantages
 */
export class TacticalAnalyzer {
    /**
     * Calculates unit effectiveness for a specific unit type against enemy fleet composition
     */
    calculateUnitEffectiveness(unitType, unitCount, enemyFleet) {
        if (unitCount === 0)
            return 0;
        const stats = UNIT_STATS[unitType];
        const totalEnemyUnits = enemyFleet.frigates + enemyFleet.cruisers + enemyFleet.battleships;
        if (totalEnemyUnits === 0)
            return 1.0; // Perfect effectiveness against empty fleet
        // Calculate weighted effectiveness based on enemy composition
        const frigateWeight = enemyFleet.frigates / totalEnemyUnits;
        const cruiserWeight = enemyFleet.cruisers / totalEnemyUnits;
        const battleshipWeight = enemyFleet.battleships / totalEnemyUnits;
        const weightedEffectiveness = (stats.effectiveness.vsFrigate * frigateWeight) +
            (stats.effectiveness.vsCruiser * cruiserWeight) +
            (stats.effectiveness.vsBattleship * battleshipWeight);
        return weightedEffectiveness;
    }
    /**
     * Determines battle advantage for a specific unit type
     */
    determineBattleAdvantage(unitType, attackerCount, defenderFleet) {
        const effectiveness = this.calculateUnitEffectiveness(unitType, attackerCount, defenderFleet);
        let advantage;
        let explanation;
        if (effectiveness >= 1.3) {
            advantage = 'strong';
            explanation = `${unitType}s have strong effectiveness against enemy composition`;
        }
        else if (effectiveness <= 0.7) {
            advantage = 'weak';
            explanation = `${unitType}s are at a disadvantage against enemy composition`;
        }
        else {
            advantage = 'neutral';
            explanation = `${unitType}s have balanced effectiveness against enemy composition`;
        }
        return {
            unitType,
            advantage,
            explanation,
            effectivenessRatio: effectiveness
        };
    }
    /**
     * Calculates tactical advantages for entire fleet composition
     */
    calculateTacticalAdvantages(attackerFleet, defenderFleet) {
        const advantages = [];
        // Analyze each unit type in attacker fleet
        if (attackerFleet.frigates > 0) {
            advantages.push(this.determineBattleAdvantage('frigate', attackerFleet.frigates, defenderFleet));
        }
        if (attackerFleet.cruisers > 0) {
            advantages.push(this.determineBattleAdvantage('cruiser', attackerFleet.cruisers, defenderFleet));
        }
        if (attackerFleet.battleships > 0) {
            advantages.push(this.determineBattleAdvantage('battleship', attackerFleet.battleships, defenderFleet));
        }
        return advantages;
    }
    /**
     * Calculates casualty percentages from combat event
     */
    calculateCasualtyPercentages(event) {
        const attackerTotal = event.attackerFleet.frigates + event.attackerFleet.cruisers + event.attackerFleet.battleships;
        const defenderTotal = event.defenderFleet.frigates + event.defenderFleet.cruisers + event.defenderFleet.battleships;
        const attackerCasualties = event.casualties.attacker.frigates + event.casualties.attacker.cruisers + event.casualties.attacker.battleships;
        const defenderCasualties = event.casualties.defender.frigates + event.casualties.defender.cruisers + event.casualties.defender.battleships;
        const attackerLossRate = attackerTotal > 0 ? (attackerCasualties / attackerTotal) : 0;
        const defenderLossRate = defenderTotal > 0 ? (defenderCasualties / defenderTotal) : 0;
        return {
            attackerLossRate: Math.round(attackerLossRate * 100) / 100, // Round to 2 decimal places
            defenderLossRate: Math.round(defenderLossRate * 100) / 100
        };
    }
    /**
     * Calculates overall effectiveness ratios for both fleets
     */
    calculateEffectivenessRatios(attackerFleet, defenderFleet) {
        // Calculate attacker effectiveness against defender
        const attackerFrigateEff = this.calculateUnitEffectiveness('frigate', attackerFleet.frigates, defenderFleet);
        const attackerCruiserEff = this.calculateUnitEffectiveness('cruiser', attackerFleet.cruisers, defenderFleet);
        const attackerBattleshipEff = this.calculateUnitEffectiveness('battleship', attackerFleet.battleships, defenderFleet);
        const attackerTotal = attackerFleet.frigates + attackerFleet.cruisers + attackerFleet.battleships;
        const attackerEffectiveness = attackerTotal > 0 ?
            ((attackerFrigateEff * attackerFleet.frigates) +
                (attackerCruiserEff * attackerFleet.cruisers) +
                (attackerBattleshipEff * attackerFleet.battleships)) / attackerTotal : 0;
        // Calculate defender effectiveness against attacker
        const defenderFrigateEff = this.calculateUnitEffectiveness('frigate', defenderFleet.frigates, attackerFleet);
        const defenderCruiserEff = this.calculateUnitEffectiveness('cruiser', defenderFleet.cruisers, attackerFleet);
        const defenderBattleshipEff = this.calculateUnitEffectiveness('battleship', defenderFleet.battleships, attackerFleet);
        const defenderTotal = defenderFleet.frigates + defenderFleet.cruisers + defenderFleet.battleships;
        const defenderEffectiveness = defenderTotal > 0 ?
            ((defenderFrigateEff * defenderFleet.frigates) +
                (defenderCruiserEff * defenderFleet.cruisers) +
                (defenderBattleshipEff * defenderFleet.battleships)) / defenderTotal : 0;
        return {
            attackerEffectiveness: Math.round(attackerEffectiveness * 100) / 100,
            defenderEffectiveness: Math.round(defenderEffectiveness * 100) / 100
        };
    }
    /**
     * Determines battle phases based on fleet compositions and outcome
     */
    determineBattlePhases(attackerFleet, defenderFleet, outcome) {
        const phases = [];
        // Calculate overall strength ratio for phase determination
        const attackerTotal = attackerFleet.frigates + attackerFleet.cruisers + attackerFleet.battleships;
        const defenderTotal = defenderFleet.frigates + defenderFleet.cruisers + defenderFleet.battleships;
        const strengthRatio = defenderTotal > 0 ? attackerTotal / defenderTotal : Infinity;
        // Opening phase - initial engagement
        let openingAdvantage;
        let openingDescription;
        if (attackerFleet.frigates > defenderFleet.frigates * 1.5) {
            openingAdvantage = 'attacker';
            openingDescription = 'Attacker gains early advantage with superior frigate numbers';
        }
        else if (defenderFleet.frigates > attackerFleet.frigates * 1.5) {
            openingAdvantage = 'defender';
            openingDescription = 'Defender controls opening with frigate superiority';
        }
        else {
            openingAdvantage = 'neutral';
            openingDescription = 'Opening engagement is evenly matched';
        }
        phases.push({
            phase: 'opening',
            description: openingDescription,
            advantage: openingAdvantage,
            strengthRatio: strengthRatio
        });
        // Main phase - heavy engagement
        let mainAdvantage;
        let mainDescription;
        const attackerHeavy = attackerFleet.cruisers + attackerFleet.battleships;
        const defenderHeavy = defenderFleet.cruisers + defenderFleet.battleships;
        if (attackerHeavy > defenderHeavy * 1.3) {
            mainAdvantage = 'attacker';
            mainDescription = 'Attacker dominates with superior heavy units';
        }
        else if (defenderHeavy > attackerHeavy * 1.3) {
            mainAdvantage = 'defender';
            mainDescription = 'Defender holds firm with heavy unit advantage';
        }
        else {
            mainAdvantage = 'neutral';
            mainDescription = 'Main engagement sees fierce fighting on both sides';
        }
        phases.push({
            phase: 'main',
            description: mainDescription,
            advantage: mainAdvantage,
            strengthRatio: strengthRatio
        });
        // Cleanup phase - battle resolution
        let cleanupAdvantage;
        let cleanupDescription;
        switch (outcome) {
            case 'decisive_attacker':
                cleanupAdvantage = 'attacker';
                cleanupDescription = 'Attacker achieves decisive victory in final phase';
                break;
            case 'decisive_defender':
                cleanupAdvantage = 'defender';
                cleanupDescription = 'Defender successfully repels attack in final phase';
                break;
            case 'close_battle':
                cleanupAdvantage = 'neutral';
                cleanupDescription = 'Battle concludes with heavy losses on both sides';
                break;
        }
        phases.push({
            phase: 'cleanup',
            description: cleanupDescription,
            advantage: cleanupAdvantage,
            strengthRatio: strengthRatio
        });
        return phases;
    }
    /**
     * Creates enhanced combat display with full tactical analysis
     */
    createEnhancedCombatDisplay(event) {
        const tacticalAdvantages = this.calculateTacticalAdvantages(event.attackerFleet, event.defenderFleet);
        const battlePhases = this.determineBattlePhases(event.attackerFleet, event.defenderFleet, event.outcome);
        const effectivenessRatios = this.calculateEffectivenessRatios(event.attackerFleet, event.defenderFleet);
        const casualtyPercentages = this.calculateCasualtyPercentages(event);
        return {
            event,
            tacticalAdvantages,
            battlePhases,
            effectivenessRatios,
            casualtyPercentages
        };
    }
    /**
     * Analyzes fleet composition balance and provides recommendations
     */
    analyzeFleetBalance(fleet) {
        const total = fleet.frigates + fleet.cruisers + fleet.battleships;
        if (total === 0) {
            return {
                balance: 'unbalanced',
                recommendation: 'Build a fleet to defend your system',
                strengths: [],
                weaknesses: ['No defensive capability']
            };
        }
        const frigateRatio = fleet.frigates / total;
        const cruiserRatio = fleet.cruisers / total;
        const battleshipRatio = fleet.battleships / total;
        const strengths = [];
        const weaknesses = [];
        // Analyze composition
        if (frigateRatio > 0.6) {
            strengths.push('Fast response capability');
            strengths.push('Cost-effective against cruisers');
            weaknesses.push('Vulnerable to battleships');
            return {
                balance: 'frigate_heavy',
                recommendation: 'Consider adding battleships for better balance',
                strengths,
                weaknesses
            };
        }
        if (cruiserRatio > 0.5) {
            strengths.push('Strong against battleships');
            strengths.push('Balanced offensive capability');
            weaknesses.push('Vulnerable to frigate swarms');
            return {
                balance: 'cruiser_heavy',
                recommendation: 'Add frigates for anti-cruiser defense',
                strengths,
                weaknesses
            };
        }
        if (battleshipRatio > 0.4) {
            strengths.push('Devastating against frigates');
            strengths.push('High individual unit strength');
            weaknesses.push('Vulnerable to cruiser focus fire');
            weaknesses.push('High resource investment');
            return {
                balance: 'battleship_heavy',
                recommendation: 'Add cruisers for better tactical flexibility',
                strengths,
                weaknesses
            };
        }
        // Balanced fleet
        strengths.push('Tactical flexibility');
        strengths.push('No major vulnerabilities');
        return {
            balance: 'balanced',
            recommendation: 'Maintain current composition balance',
            strengths,
            weaknesses: ['Higher resource requirements for balance']
        };
    }
}
/**
 * Default tactical analyzer instance
 */
export const defaultTacticalAnalyzer = new TacticalAnalyzer();
//# sourceMappingURL=TacticalAnalyzer.js.map