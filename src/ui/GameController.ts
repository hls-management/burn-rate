import { GameEngine, TurnResult } from '../engine/GameEngine.js';
import { GameState, FleetComposition } from '../models/GameState.js';
import { PlayerState, BuildableType, UnitType, StructureType } from '../models/PlayerState.js';
import { ScanType, SCAN_COSTS } from '../models/Intelligence.js';
import { Command } from './InputHandler.js';
import { createStructureBuildOrder, createUnitBuildOrder } from '../models/Economy.js';
import { UNIT_STATS } from '../models/Fleet.js';

export interface CommandExecutionResult {
  success: boolean;
  message: string;
  gameStateChanged: boolean;
}

export class GameController {
  private gameEngine: GameEngine;
  private pendingPlayerActions: Command[] = [];

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
  }

  /**
   * Executes a player command and returns the result
   */
  public executeCommand(command: Command): CommandExecutionResult {
    try {
      switch (command.type) {
        case 'build':
          return this.executeBuildCommand(command);
        
        case 'attack':
          return this.executeAttackCommand(command);
        
        case 'scan':
          return this.executeScanCommand(command);
        
        case 'status':
        case 'help':
          // These are display-only commands, no game state change
          return {
            success: true,
            message: 'Information displayed',
            gameStateChanged: false
          };
        
        case 'end_turn':
          return this.executeEndTurn();
        
        default:
          return {
            success: false,
            message: `Unknown command type: ${command.type}`,
            gameStateChanged: false
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        gameStateChanged: false
      };
    }
  }

  /**
   * Executes a build command
   */
  private executeBuildCommand(command: Command): CommandExecutionResult {
    if (!command.buildType || !command.quantity) {
      return {
        success: false,
        message: 'Invalid build command: missing build type or quantity',
        gameStateChanged: false
      };
    }

    const gameState = this.gameEngine.getGameState();
    const player = gameState.player;
    
    // Calculate costs
    const costs = this.getBuildCosts(command.buildType);
    const totalMetalCost = costs.metal * command.quantity;
    const totalEnergyCost = costs.energy * command.quantity;

    // Validate resources
    if (player.resources.metal < totalMetalCost) {
      return {
        success: false,
        message: `Insufficient metal. Need: ${totalMetalCost.toLocaleString()}, Have: ${player.resources.metal.toLocaleString()}`,
        gameStateChanged: false
      };
    }

    if (player.resources.energy < totalEnergyCost) {
      return {
        success: false,
        message: `Insufficient energy. Need: ${totalEnergyCost.toLocaleString()}, Have: ${player.resources.energy.toLocaleString()}`,
        gameStateChanged: false
      };
    }

    // Create build order
    let buildOrder;
    try {
      if (command.buildType === 'reactor' || command.buildType === 'mine') {
        // Structure build order
        const currentCount = command.buildType === 'reactor' ? 
          player.economy.reactors : 
          player.economy.mines;
        
        buildOrder = createStructureBuildOrder(command.buildType, command.quantity, currentCount);
      } else {
        // Unit build order
        const unitStats = UNIT_STATS[command.buildType as UnitType];
        buildOrder = createUnitBuildOrder(command.buildType as UnitType, command.quantity, unitStats);
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to create build order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        gameStateChanged: false
      };
    }

    // Deduct resources immediately
    player.resources.metal -= totalMetalCost;
    player.resources.energy -= totalEnergyCost;

    // Add to construction queue
    player.economy.constructionQueue.push(buildOrder);

    // Add to pending actions for turn processing
    this.pendingPlayerActions.push(command);

    const itemName = command.buildType;
    return {
      success: true,
      message: `Started building ${command.quantity} ${itemName}(s). Cost: ${totalMetalCost} Metal, ${totalEnergyCost} Energy`,
      gameStateChanged: true
    };
  }

  /**
   * Executes an attack command
   */
  private executeAttackCommand(command: Command): CommandExecutionResult {
    if (!command.attackFleet || !command.target) {
      return {
        success: false,
        message: 'Invalid attack command: missing fleet composition or target',
        gameStateChanged: false
      };
    }

    const gameState = this.gameEngine.getGameState();
    const playerFleet = gameState.player.fleet.homeSystem;
    const attackFleet = command.attackFleet;

    // Validate fleet availability
    if (playerFleet.frigates < attackFleet.frigates) {
      return {
        success: false,
        message: `Insufficient frigates. Need: ${attackFleet.frigates}, Have: ${playerFleet.frigates}`,
        gameStateChanged: false
      };
    }

    if (playerFleet.cruisers < attackFleet.cruisers) {
      return {
        success: false,
        message: `Insufficient cruisers. Need: ${attackFleet.cruisers}, Have: ${playerFleet.cruisers}`,
        gameStateChanged: false
      };
    }

    if (playerFleet.battleships < attackFleet.battleships) {
      return {
        success: false,
        message: `Insufficient battleships. Need: ${attackFleet.battleships}, Have: ${playerFleet.battleships}`,
        gameStateChanged: false
      };
    }

    // Deduct fleet from home system
    playerFleet.frigates -= attackFleet.frigates;
    playerFleet.cruisers -= attackFleet.cruisers;
    playerFleet.battleships -= attackFleet.battleships;

    // Create fleet movement
    const movement = {
      composition: attackFleet,
      target: command.target,
      arrivalTurn: gameState.turn + 1, // Arrives next turn
      returnTurn: gameState.turn + 3,   // Returns in 3 turns
      missionType: 'outbound' as const
    };

    // Add to outbound movements
    gameState.player.fleet.inTransit.outbound.push(movement);

    // Add to pending actions for turn processing
    this.pendingPlayerActions.push(command);

    const totalShips = attackFleet.frigates + attackFleet.cruisers + attackFleet.battleships;
    return {
      success: true,
      message: `Fleet launched! ${totalShips} ships en route to ${command.target}. Arrival: Turn ${movement.arrivalTurn}, Return: Turn ${movement.returnTurn}`,
      gameStateChanged: true
    };
  }

  /**
   * Executes a scan command
   */
  private executeScanCommand(command: Command): CommandExecutionResult {
    if (!command.scanType) {
      return {
        success: false,
        message: 'Invalid scan command: missing scan type',
        gameStateChanged: false
      };
    }

    const gameState = this.gameEngine.getGameState();
    const player = gameState.player;
    const cost = SCAN_COSTS[command.scanType];

    // Validate energy cost
    if (player.resources.energy < cost.energy) {
      return {
        success: false,
        message: `Insufficient energy for ${command.scanType} scan. Need: ${cost.energy}, Have: ${player.resources.energy}`,
        gameStateChanged: false
      };
    }

    // Deduct energy cost
    player.resources.energy -= cost.energy;

    // Perform the scan using the intelligence engine
    try {
      // Get the intelligence engine from the game engine (we'll need to expose this)
      // For now, we'll simulate the scan result
      const scanResult = this.performScan(command.scanType, gameState);
      
      // Update player intelligence
      player.intelligence.lastScanTurn = gameState.turn;
      if (scanResult.fleetData) {
        player.intelligence.knownEnemyFleet = {
          frigates: scanResult.fleetData.frigates || 0,
          cruisers: scanResult.fleetData.cruisers || 0,
          battleships: scanResult.fleetData.battleships || 0
        };
      }

      // Add to pending actions for turn processing
      this.pendingPlayerActions.push(command);

      return {
        success: true,
        message: this.formatScanResult(command.scanType, scanResult),
        gameStateChanged: true
      };
    } catch (error) {
      return {
        success: false,
        message: `Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        gameStateChanged: false
      };
    }
  }

  /**
   * Executes end turn command
   */
  private executeEndTurn(): CommandExecutionResult {
    try {
      // Process the turn with all pending actions
      const turnResult = this.gameEngine.processTurn(this.pendingPlayerActions);
      
      // Clear pending actions
      this.pendingPlayerActions = [];

      if (turnResult.success) {
        let message = `Turn ${this.gameEngine.getCurrentTurn() - 1} completed.`;
        
        if (turnResult.combatEvents.length > 0) {
          message += ` ${turnResult.combatEvents.length} combat event(s) occurred.`;
        }
        
        if (turnResult.gameEnded) {
          message += ` Game Over! Winner: ${turnResult.winner}`;
        }

        return {
          success: true,
          message,
          gameStateChanged: true
        };
      } else {
        return {
          success: false,
          message: `Turn processing failed: ${turnResult.errors.join(', ')}`,
          gameStateChanged: false
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Turn processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        gameStateChanged: false
      };
    }
  }

  /**
   * Performs a scan and returns the result
   */
  private performScan(scanType: ScanType, gameState: GameState): any {
    const aiFleet = gameState.ai.fleet.homeSystem;
    const totalShips = aiFleet.frigates + aiFleet.cruisers + aiFleet.battleships;

    switch (scanType) {
      case 'basic':
        // Basic scan: total fleet count with ±30% accuracy
        const accuracy = 0.7 + (Math.random() - 0.5) * 0.6; // 0.4 to 1.0
        const reportedTotal = Math.max(0, Math.round(totalShips * accuracy));
        return {
          scanType: 'basic',
          fleetData: {
            frigates: reportedTotal,
            cruisers: 0,
            battleships: 0
          },
          message: `Enemy fleet detected: approximately ${reportedTotal} ships`
        };

      case 'deep':
        // Deep scan: unit composition with ±10% accuracy
        const applyAccuracy = (value: number): number => {
          const factor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
          return Math.max(0, Math.round(value * factor));
        };
        
        return {
          scanType: 'deep',
          fleetData: {
            frigates: applyAccuracy(aiFleet.frigates),
            cruisers: applyAccuracy(aiFleet.cruisers),
            battleships: applyAccuracy(aiFleet.battleships)
          },
          economicData: {
            reactors: gameState.ai.economy.reactors,
            mines: gameState.ai.economy.mines
          },
          message: `Detailed scan complete: ${applyAccuracy(aiFleet.frigates)} Frigates, ${applyAccuracy(aiFleet.cruisers)} Cruisers, ${applyAccuracy(aiFleet.battleships)} Battleships. Economic structures: ${gameState.ai.economy.reactors} Reactors, ${gameState.ai.economy.mines} Mines`
        };

      case 'advanced':
        // Advanced scan: strategic intent
        const intent = this.determineAIIntent(gameState);
        return {
          scanType: 'advanced',
          fleetData: {
            frigates: Math.floor(totalShips * 0.5),
            cruisers: Math.floor(totalShips * 0.3),
            battleships: Math.floor(totalShips * 0.2)
          },
          strategicIntent: intent,
          message: `Advanced scan reveals: ${intent}. Estimated fleet composition provided.`
        };

      default:
        throw new Error(`Unknown scan type: ${scanType}`);
    }
  }

  /**
   * Determines AI strategic intent for advanced scans
   */
  private determineAIIntent(gameState: GameState): string {
    const aiFleet = gameState.ai.fleet.homeSystem;
    const totalShips = aiFleet.frigates + aiFleet.cruisers + aiFleet.battleships;
    const aiIncome = gameState.ai.resources.metalIncome + gameState.ai.resources.energyIncome;
    const structures = gameState.ai.economy.reactors + gameState.ai.economy.mines;

    if (totalShips > 100) {
      return "AI is preparing for major offensive operations";
    } else if (structures > 3) {
      return "AI is focusing on economic expansion";
    } else if (aiIncome > 25000) {
      return "AI has strong economic foundation, likely planning military buildup";
    } else if (totalShips < 20) {
      return "AI appears to be in defensive posture";
    } else {
      return "AI strategy unclear - balanced military and economic development";
    }
  }

  /**
   * Formats scan results for display
   */
  private formatScanResult(scanType: ScanType, result: any): string {
    return result.message || `${scanType} scan completed`;
  }

  /**
   * Gets build costs for different unit/structure types
   */
  private getBuildCosts(buildType: BuildableType): { metal: number; energy: number } {
    const costs = {
      // Units (construction costs)
      frigate: { metal: 4, energy: 2 },
      cruiser: { metal: 10, energy: 6 },
      battleship: { metal: 20, energy: 12 },
      
      // Structures
      reactor: { metal: 900, energy: 1200 },
      mine: { metal: 1500, energy: 600 }
    };

    return costs[buildType];
  }

  /**
   * Gets pending player actions (for debugging)
   */
  public getPendingActions(): Command[] {
    return [...this.pendingPlayerActions];
  }

  /**
   * Clears pending actions (for testing)
   */
  public clearPendingActions(): void {
    this.pendingPlayerActions = [];
  }

  /**
   * Gets the game engine instance
   */
  public getGameEngine(): GameEngine {
    return this.gameEngine;
  }
}