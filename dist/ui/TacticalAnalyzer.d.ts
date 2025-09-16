import { FleetComposition, CombatEvent } from '../models/GameState.js';
import { UnitType } from '../models/Fleet.js';
/**
 * Represents tactical advantage information for a specific unit type
 */
export interface TacticalAdvantage {
    unitType: UnitType;
    advantage: 'strong' | 'weak' | 'neutral';
    explanation: string;
    effectivenessRatio: number;
}
/**
 * Represents battle phase information
 */
export interface BattlePhase {
    phase: 'opening' | 'main' | 'cleanup';
    description: string;
    advantage: 'attacker' | 'defender' | 'neutral';
    strengthRatio: number;
}
/**
 * Enhanced combat display information with tactical analysis
 */
export interface EnhancedCombatDisplay {
    event: CombatEvent;
    tacticalAdvantages: TacticalAdvantage[];
    battlePhases: BattlePhase[];
    effectivenessRatios: {
        attackerEffectiveness: number;
        defenderEffectiveness: number;
    };
    casualtyPercentages: {
        attackerLossRate: number;
        defenderLossRate: number;
    };
}
/**
 * Tactical Analyzer utility class for calculating unit effectiveness and battle advantages
 */
export declare class TacticalAnalyzer {
    /**
     * Calculates unit effectiveness for a specific unit type against enemy fleet composition
     */
    calculateUnitEffectiveness(unitType: UnitType, unitCount: number, enemyFleet: FleetComposition): number;
    /**
     * Determines battle advantage for a specific unit type
     */
    determineBattleAdvantage(unitType: UnitType, attackerCount: number, defenderFleet: FleetComposition): TacticalAdvantage;
    /**
     * Calculates tactical advantages for entire fleet composition
     */
    calculateTacticalAdvantages(attackerFleet: FleetComposition, defenderFleet: FleetComposition): TacticalAdvantage[];
    /**
     * Calculates casualty percentages from combat event
     */
    calculateCasualtyPercentages(event: CombatEvent): {
        attackerLossRate: number;
        defenderLossRate: number;
    };
    /**
     * Calculates overall effectiveness ratios for both fleets
     */
    calculateEffectivenessRatios(attackerFleet: FleetComposition, defenderFleet: FleetComposition): {
        attackerEffectiveness: number;
        defenderEffectiveness: number;
    };
    /**
     * Determines battle phases based on fleet compositions and outcome
     */
    determineBattlePhases(attackerFleet: FleetComposition, defenderFleet: FleetComposition, outcome: 'decisive_attacker' | 'decisive_defender' | 'close_battle'): BattlePhase[];
    /**
     * Creates enhanced combat display with full tactical analysis
     */
    createEnhancedCombatDisplay(event: CombatEvent): EnhancedCombatDisplay;
    /**
     * Analyzes fleet composition balance and provides recommendations
     */
    analyzeFleetBalance(fleet: FleetComposition): {
        balance: 'balanced' | 'frigate_heavy' | 'cruiser_heavy' | 'battleship_heavy' | 'unbalanced';
        recommendation: string;
        strengths: string[];
        weaknesses: string[];
    };
}
/**
 * Default tactical analyzer instance
 */
export declare const defaultTacticalAnalyzer: TacticalAnalyzer;
//# sourceMappingURL=TacticalAnalyzer.d.ts.map