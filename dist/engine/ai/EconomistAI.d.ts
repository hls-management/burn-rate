import { BaseAIArchetype, AIState, AIDecision } from '../../models/AI.js';
import { GameState } from '../../models/GameState.js';
export declare class EconomistAI extends BaseAIArchetype {
    constructor();
    makeDecision(gameState: GameState, aiState: AIState): AIDecision;
    private makeEconomicDecision;
    private makeMilitaryDecision;
    private planConservativeAttack;
    private makeDefensiveMilitaryDecision;
}
//# sourceMappingURL=EconomistAI.d.ts.map