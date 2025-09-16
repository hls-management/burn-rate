import { BaseAIArchetype, AIState, AIDecision } from '../../models/AI.js';
import { GameState } from '../../models/GameState.js';
export declare class AggressorAI extends BaseAIArchetype {
    constructor();
    makeDecision(gameState: GameState, aiState: AIState): AIDecision;
    private makeDefensiveDecision;
    private makeMilitaryDecision;
    private planAttackFleet;
    private buildMilitaryUnits;
    private makeEconomicDecision;
}
//# sourceMappingURL=AggressorAI.d.ts.map