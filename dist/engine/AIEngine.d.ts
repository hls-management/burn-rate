import { GameState } from '../models/GameState.js';
import { AIState, AIDecision, AIArchetype } from '../models/AI.js';
export declare class AIEngine {
    private aiArchetype;
    private aiState;
    constructor(archetype: AIArchetype);
    private createArchetype;
    private initializeAIState;
    private getBehaviorProbabilities;
    processTurn(gameState: GameState): AIDecision;
    private updateAIState;
    private calculateThreatLevel;
    private calculateEconomicAdvantage;
    private calculateFleetStrength;
    getAIState(): AIState;
    getArchetype(): AIArchetype;
}
//# sourceMappingURL=AIEngine.d.ts.map