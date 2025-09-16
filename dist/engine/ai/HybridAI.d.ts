import { BaseAIArchetype, AIState, AIDecision } from '../../models/AI.js';
import { GameState } from '../../models/GameState.js';
export declare class HybridAI extends BaseAIArchetype {
    private currentStrategy;
    private strategyChangeTimer;
    private strategyDuration;
    constructor();
    makeDecision(gameState: GameState, aiState: AIState): AIDecision;
    private selectInitialStrategy;
    private selectNewStrategy;
    private adaptStrategy;
    private executeStrategy;
    private makeAggressiveDecision;
    private makeEconomicDecision;
    private makeDefensiveDecision;
    private makeOpportunisticDecision;
    private planAggressiveAttack;
    private getDefensiveCounter;
}
//# sourceMappingURL=HybridAI.d.ts.map