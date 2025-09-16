import { PlayerState, BuildableType, UnitType } from './PlayerState.js';
import { GameState, FleetComposition } from './GameState.js';
export type AIArchetype = 'aggressor' | 'economist' | 'trickster' | 'hybrid';
export interface AIDecision {
    type: 'build' | 'attack' | 'scan' | 'wait';
    buildType?: BuildableType;
    buildQuantity?: number;
    attackTarget?: string;
    attackFleet?: FleetComposition;
    scanType?: 'basic' | 'deep' | 'advanced';
}
export interface AIBehaviorProbabilities {
    militaryFocus: number;
    economicFocus: number;
    aggressionLevel: number;
    deceptionChance: number;
    adaptiveVariation: number;
}
export interface AIState extends PlayerState {
    archetype: AIArchetype;
    behaviorProbabilities: AIBehaviorProbabilities;
    lastPlayerAction?: AIDecision;
    threatLevel: number;
    economicAdvantage: number;
}
export declare abstract class BaseAIArchetype {
    protected archetype: AIArchetype;
    protected behaviorProbabilities: AIBehaviorProbabilities;
    constructor(archetype: AIArchetype, probabilities: AIBehaviorProbabilities);
    abstract makeDecision(gameState: GameState, aiState: AIState): AIDecision;
    protected calculateThreatLevel(gameState: GameState, aiState: AIState): number;
    protected calculateEconomicAdvantage(gameState: GameState, aiState: AIState): number;
    protected calculateFleetStrength(fleet: FleetComposition): number;
    protected shouldAdaptBehavior(): boolean;
    protected canAffordBuild(resources: PlayerState['resources'], buildType: BuildableType, quantity?: number): boolean;
    protected getBuildCosts(buildType: BuildableType): {
        metal: number;
        energy: number;
    };
    protected getOptimalFleetComposition(targetStrength: number, threatType?: FleetComposition): FleetComposition;
    protected getDominantUnitType(fleet: FleetComposition): UnitType;
    private getCounterComposition;
    protected validateDecision(decision: AIDecision, aiState: AIState): boolean;
    protected hasAvailableFleet(aiState: AIState, requiredFleet: FleetComposition): boolean;
}
//# sourceMappingURL=AI.d.ts.map