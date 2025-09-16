import { GameState } from '../models/GameState.js';
import { AIState, AIDecision, BaseAIArchetype, AIArchetype } from '../models/AI.js';
import { AggressorAI } from './ai/AggressorAI.js';
import { EconomistAI } from './ai/EconomistAI.js';
import { TricksterAI } from './ai/TricksterAI.js';
import { HybridAI } from './ai/HybridAI.js';

export class AIEngine {
  private aiArchetype: BaseAIArchetype;
  private aiState: AIState;

  constructor(archetype: AIArchetype) {
    this.aiArchetype = this.createArchetype(archetype);
    this.aiState = this.initializeAIState(archetype);
  }

  private createArchetype(archetype: AIArchetype): BaseAIArchetype {
    switch (archetype) {
      case 'aggressor':
        return new AggressorAI();
      case 'economist':
        return new EconomistAI();
      case 'trickster':
        return new TricksterAI();
      case 'hybrid':
        return new HybridAI();
      default:
        throw new Error(`Unknown AI archetype: ${archetype}`);
    }
  }

  private initializeAIState(archetype: AIArchetype): AIState {
    // Initialize with base player state structure
    const baseState = {
      resources: {
        metal: 10000,
        energy: 10000,
        metalIncome: 10000,
        energyIncome: 10000
      },
      fleet: {
        homeSystem: {
          frigates: 0,
          cruisers: 0,
          battleships: 0
        },
        inTransit: {
          outbound: []
        }
      },
      economy: {
        reactors: 0,
        mines: 0,
        constructionQueue: []
      },
      intelligence: {
        lastScanTurn: 0,
        knownEnemyFleet: {
          frigates: 0,
          cruisers: 0,
          battleships: 0
        },
        scanAccuracy: 0.7,
        lastScanData: null,
        misinformationActive: false
      }
    };

    return {
      ...baseState,
      archetype,
      behaviorProbabilities: this.getBehaviorProbabilities(archetype),
      threatLevel: 0,
      economicAdvantage: 0
    };
  }

  private getBehaviorProbabilities(archetype: AIArchetype) {
    switch (archetype) {
      case 'aggressor':
        return {
          militaryFocus: 0.8,
          economicFocus: 0.2,
          aggressionLevel: 0.9,
          deceptionChance: 0.1,
          adaptiveVariation: 0.2
        };
      case 'economist':
        return {
          militaryFocus: 0.25,
          economicFocus: 0.75,
          aggressionLevel: 0.3,
          deceptionChance: 0.1,
          adaptiveVariation: 0.25
        };
      case 'trickster':
        return {
          militaryFocus: 0.4,
          economicFocus: 0.3,
          aggressionLevel: 0.6,
          deceptionChance: 0.7,
          adaptiveVariation: 0.3
        };
      case 'hybrid':
        return {
          militaryFocus: 0.6,
          economicFocus: 0.6,
          aggressionLevel: 0.5,
          deceptionChance: 0.2,
          adaptiveVariation: 0.4
        };
    }
  }

  public processTurn(gameState: GameState): AIDecision {
    // Update AI state with current game information
    this.updateAIState(gameState);
    
    // Make decision based on archetype
    const decision = this.aiArchetype.makeDecision(gameState, this.aiState);
    
    // Store the decision for future reference
    this.aiState.lastPlayerAction = decision;
    
    return decision;
  }

  private updateAIState(gameState: GameState): void {
    // Update AI state to match current game state
    this.aiState.resources = { ...gameState.ai.resources };
    this.aiState.fleet = { ...gameState.ai.fleet };
    this.aiState.economy = { ...gameState.ai.economy };
    this.aiState.intelligence = { ...gameState.ai.intelligence };
    
    // Update threat assessment
    this.aiState.threatLevel = this.calculateThreatLevel(gameState);
    this.aiState.economicAdvantage = this.calculateEconomicAdvantage(gameState);
  }

  private calculateThreatLevel(gameState: GameState): number {
    const playerFleet = gameState.player.fleet.homeSystem;
    const aiFleet = this.aiState.fleet.homeSystem;
    
    const playerStrength = this.calculateFleetStrength(playerFleet);
    const aiStrength = this.calculateFleetStrength(aiFleet);
    
    if (aiStrength === 0) return 1.0;
    
    const ratio = playerStrength / aiStrength;
    return Math.min(1.0, Math.max(0.0, ratio - 0.5));
  }

  private calculateEconomicAdvantage(gameState: GameState): number {
    const playerIncome = gameState.player.resources.metalIncome + gameState.player.resources.energyIncome;
    const aiIncome = this.aiState.resources.metalIncome + this.aiState.resources.energyIncome;
    
    if (playerIncome + aiIncome === 0) return 0;
    
    return (aiIncome - playerIncome) / (aiIncome + playerIncome);
  }

  private calculateFleetStrength(fleet: { frigates: number; cruisers: number; battleships: number }): number {
    return fleet.frigates * 1 + fleet.cruisers * 2.5 + fleet.battleships * 5;
  }

  public getAIState(): AIState {
    return { ...this.aiState };
  }

  public getArchetype(): AIArchetype {
    return this.aiState.archetype;
  }
}