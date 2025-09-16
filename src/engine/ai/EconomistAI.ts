import { BaseAIArchetype, AIState, AIDecision } from '../../models/AI.js';
import { GameState } from '../../models/GameState.js';

export class EconomistAI extends BaseAIArchetype {
  constructor() {
    super('economist', {
      militaryFocus: 0.25,
      economicFocus: 0.75,
      aggressionLevel: 0.3,
      deceptionChance: 0.1,
      adaptiveVariation: 0.25
    });
  }

  makeDecision(gameState: GameState, aiState: AIState): AIDecision {
    // Update threat assessment
    aiState.threatLevel = this.calculateThreatLevel(gameState, aiState);
    aiState.economicAdvantage = this.calculateEconomicAdvantage(gameState, aiState);

    // 25% chance to build military when threatened
    if (aiState.threatLevel > 0.5 && Math.random() < this.behaviorProbabilities.militaryFocus) {
      return this.makeMilitaryDecision(gameState, aiState);
    }

    // 75% economic focus - prioritize economic expansion
    if (Math.random() < this.behaviorProbabilities.economicFocus) {
      return this.makeEconomicDecision(aiState);
    }

    // Fallback to defensive military
    return this.makeDefensiveMilitaryDecision(aiState);
  }

  private makeEconomicDecision(aiState: AIState): AIDecision {
    const currentIncome = aiState.resources.metalIncome + aiState.resources.energyIncome;
    const targetIncome = 25000; // Economist wants strong economy

    if (currentIncome < targetIncome) {
      // Prioritize the resource type that's lower
      if (aiState.resources.metalIncome <= aiState.resources.energyIncome) {
        if (this.canAffordBuild(aiState.resources, 'mine')) {
          return {
            type: 'build',
            buildType: 'mine',
            buildQuantity: 1
          };
        }
      } else {
        if (this.canAffordBuild(aiState.resources, 'reactor')) {
          return {
            type: 'build',
            buildType: 'reactor',
            buildQuantity: 1
          };
        }
      }
    }

    // If economy is strong enough, build some defensive units
    return this.makeDefensiveMilitaryDecision(aiState);
  }

  private makeMilitaryDecision(gameState: GameState, aiState: AIState): AIDecision {
    const currentFleet = aiState.fleet.homeSystem;
    const totalUnits = currentFleet.frigates + currentFleet.cruisers + currentFleet.battleships;

    // Only attack if we have overwhelming advantage
    if (totalUnits >= 10 && aiState.economicAdvantage > 0.3) {
      const playerFleet = gameState.player.fleet.homeSystem;
      const attackFleet = this.planConservativeAttack(currentFleet, playerFleet);
      
      if (attackFleet && this.hasAvailableFleet(aiState, attackFleet)) {
        return {
          type: 'attack',
          attackTarget: 'player_home',
          attackFleet
        };
      }
    }

    // Otherwise build defensive units
    return this.makeDefensiveMilitaryDecision(aiState);
  }

  private planConservativeAttack(availableFleet: any, enemyFleet: any) {
    const ourStrength = this.calculateFleetStrength(availableFleet);
    const enemyStrength = this.calculateFleetStrength(enemyFleet);
    
    // Only attack if we have 2:1 advantage
    if (ourStrength < enemyStrength * 2) return null;

    // Use only 40-50% of fleet for attack (conservative)
    const attackRatio = 0.4 + Math.random() * 0.1;
    
    return {
      frigates: Math.floor(availableFleet.frigates * attackRatio),
      cruisers: Math.floor(availableFleet.cruisers * attackRatio),
      battleships: Math.floor(availableFleet.battleships * attackRatio)
    };
  }

  private makeDefensiveMilitaryDecision(aiState: AIState): AIDecision {
    const currentFleet = aiState.fleet.homeSystem;
    const totalUnits = currentFleet.frigates + currentFleet.cruisers + currentFleet.battleships;

    // Maintain a minimum defensive fleet
    const targetDefensiveFleet = 8;
    
    if (totalUnits < targetDefensiveFleet) {
      // Build cost-effective defensive units
      if (this.canAffordBuild(aiState.resources, 'cruiser')) {
        return {
          type: 'build',
          buildType: 'cruiser',
          buildQuantity: 1
        };
      }

      if (this.canAffordBuild(aiState.resources, 'frigate', 2)) {
        return {
          type: 'build',
          buildType: 'frigate',
          buildQuantity: 2
        };
      }

      if (this.canAffordBuild(aiState.resources, 'battleship')) {
        return {
          type: 'build',
          buildType: 'battleship',
          buildQuantity: 1
        };
      }
    }

    // If defensive fleet is adequate, scan for intelligence
    if (aiState.resources.energy >= 2500 && Math.random() < 0.3) {
      return {
        type: 'scan',
        scanType: 'deep'
      };
    }

    return { type: 'wait' };
  }


}