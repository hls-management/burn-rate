import { BaseAIArchetype, AIState, AIDecision } from '../../models/AI.js';
import { GameState } from '../../models/GameState.js';
export declare class TricksterAI extends BaseAIArchetype {
    private lastDeceptionTurn;
    private deceptionCooldown;
    constructor();
    makeDecision(gameState: GameState, aiState: AIState): AIDecision;
    private makeDeceptiveDecision;
    private buildUnexpectedUnits;
    private makeStraightforwardDecision;
    private planOptimalAttack;
    private buildOptimalUnits;
    private getOptimalCounter;
    private makeBalancedDecision;
    private makeEconomicDecision;
    private makeMilitaryDecision;
}
//# sourceMappingURL=TricksterAI.d.ts.map