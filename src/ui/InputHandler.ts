import { GameState, FleetComposition } from '../models/GameState.js';
import { BuildableType, UnitType, StructureType } from '../models/PlayerState.js';
import { ScanType, SCAN_COSTS } from '../models/Intelligence.js';

export interface Command {
  type: 'build' | 'attack' | 'scan' | 'status' | 'help' | 'end_turn' | 'quit';
  buildType?: BuildableType;
  quantity?: number;
  attackFleet?: FleetComposition;
  target?: string;
  scanType?: ScanType;
}

export interface CommandResult {
  success: boolean;
  command?: Command;
  error?: string;
}

export class InputHandler {
  private readonly UNIT_TYPES: UnitType[] = ['frigate', 'cruiser', 'battleship'];
  private readonly STRUCTURE_TYPES: StructureType[] = ['reactor', 'mine'];
  private readonly SCAN_TYPES: ScanType[] = ['basic', 'deep', 'advanced'];

  /**
   * Processes a raw input string and returns a parsed command
   */
  public processCommand(input: string, gameState: GameState): CommandResult {
    const trimmed = input.trim();
    
    if (!trimmed) {
      return { success: false, error: 'No command entered' };
    }
    
    const tokens = trimmed.toLowerCase().split(/\s+/);
    const commandType = tokens[0];

    try {
      switch (commandType) {
        case 'build':
          return this.parseBuildCommand(tokens, gameState);
        
        case 'attack':
          return this.parseAttackCommand(tokens, gameState);
        
        case 'scan':
          return this.parseScanCommand(tokens, gameState);
        
        case 'status':
          return { success: true, command: { type: 'status' } };
        
        case 'help':
          return { success: true, command: { type: 'help' } };
        
        case 'end':
        case 'endturn':
        case 'end_turn':
          return { success: true, command: { type: 'end_turn' } };
        
        case 'quit':
        case 'exit':
          return { success: true, command: { type: 'quit' } };
        
        default:
          return { success: false, error: `Unknown command: ${commandType}. Type 'help' for available commands.` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Command parsing failed' 
      };
    }
  }

  /**
   * Parses build commands: "build <quantity> <unit/structure>"
   */
  private parseBuildCommand(tokens: string[], gameState: GameState): CommandResult {
    if (tokens.length !== 3) {
      return { 
        success: false, 
        error: 'Build command format: "build <quantity> <unit/structure>"\nExample: "build 10 frigate" or "build 1 reactor"' 
      };
    }

    // Parse quantity
    const quantityStr = tokens[1];
    const quantity = parseInt(quantityStr, 10);
    
    if (isNaN(quantity) || quantity <= 0) {
      return { success: false, error: 'Quantity must be a positive number' };
    }

    if (quantity > 10000) {
      return { success: false, error: 'Quantity too large (maximum: 10,000)' };
    }

    // Parse build type
    const buildTypeStr = tokens[2];
    let buildType: BuildableType;

    if (this.UNIT_TYPES.includes(buildTypeStr as UnitType)) {
      buildType = buildTypeStr as UnitType;
    } else if (this.STRUCTURE_TYPES.includes(buildTypeStr as StructureType)) {
      buildType = buildTypeStr as StructureType;
    } else {
      const validTypes = [...this.UNIT_TYPES, ...this.STRUCTURE_TYPES].join(', ');
      return { 
        success: false, 
        error: `Invalid build type: ${buildTypeStr}. Valid types: ${validTypes}` 
      };
    }

    // Validate resources
    const validationResult = this.validateBuildCommand(buildType, quantity, gameState);
    if (!validationResult.success) {
      return validationResult;
    }

    return {
      success: true,
      command: {
        type: 'build',
        buildType,
        quantity
      }
    };
  }

  /**
   * Parses attack commands: "attack <frigates> <cruisers> <battleships>"
   */
  private parseAttackCommand(tokens: string[], gameState: GameState): CommandResult {
    if (tokens.length !== 4) {
      return { 
        success: false, 
        error: 'Attack command format: "attack <frigates> <cruisers> <battleships>"\nExample: "attack 50 20 10"' 
      };
    }

    // Parse fleet composition
    const frigates = parseInt(tokens[1], 10);
    const cruisers = parseInt(tokens[2], 10);
    const battleships = parseInt(tokens[3], 10);

    if (isNaN(frigates) || isNaN(cruisers) || isNaN(battleships)) {
      return { success: false, error: 'Fleet numbers must be valid integers' };
    }

    if (frigates < 0 || cruisers < 0 || battleships < 0) {
      return { success: false, error: 'Fleet numbers cannot be negative' };
    }

    const totalShips = frigates + cruisers + battleships;
    if (totalShips === 0) {
      return { success: false, error: 'Cannot attack with empty fleet' };
    }

    const attackFleet: FleetComposition = { frigates, cruisers, battleships };

    // Validate fleet availability
    const validationResult = this.validateAttackCommand(attackFleet, gameState);
    if (!validationResult.success) {
      return validationResult;
    }

    return {
      success: true,
      command: {
        type: 'attack',
        attackFleet,
        target: 'ai_system' // Default target for now
      }
    };
  }

  /**
   * Parses scan commands: "scan <type>"
   */
  private parseScanCommand(tokens: string[], gameState: GameState): CommandResult {
    if (tokens.length !== 2) {
      return { 
        success: false, 
        error: 'Scan command format: "scan <type>"\nValid types: basic, deep, advanced' 
      };
    }

    const scanTypeStr = tokens[1];
    
    if (!this.SCAN_TYPES.includes(scanTypeStr as ScanType)) {
      return { 
        success: false, 
        error: `Invalid scan type: ${scanTypeStr}. Valid types: ${this.SCAN_TYPES.join(', ')}` 
      };
    }

    const scanType = scanTypeStr as ScanType;

    // Validate energy cost
    const validationResult = this.validateScanCommand(scanType, gameState);
    if (!validationResult.success) {
      return validationResult;
    }

    return {
      success: true,
      command: {
        type: 'scan',
        scanType
      }
    };
  }

  /**
   * Validates build command against current game state
   */
  private validateBuildCommand(buildType: BuildableType, quantity: number, gameState: GameState): CommandResult {
    const player = gameState.player;
    const costs = this.getBuildCosts(buildType);
    
    const totalMetalCost = costs.metal * quantity;
    const totalEnergyCost = costs.energy * quantity;

    // Check if player has enough resources
    if (player.resources.metal < totalMetalCost) {
      return { 
        success: false, 
        error: `Insufficient metal. Need: ${totalMetalCost.toLocaleString()}, Have: ${player.resources.metal.toLocaleString()}` 
      };
    }

    if (player.resources.energy < totalEnergyCost) {
      return { 
        success: false, 
        error: `Insufficient energy. Need: ${totalEnergyCost.toLocaleString()}, Have: ${player.resources.energy.toLocaleString()}` 
      };
    }

    // Check if economy can support the upkeep (for units)
    if (this.UNIT_TYPES.includes(buildType as UnitType)) {
      const upkeepCosts = this.getUpkeepCosts(buildType as UnitType);
      const totalMetalUpkeep = upkeepCosts.metal * quantity;
      const totalEnergyUpkeep = upkeepCosts.energy * quantity;
      
      const projectedMetalIncome = player.resources.metalIncome - totalMetalUpkeep;
      const projectedEnergyIncome = player.resources.energyIncome - totalEnergyUpkeep;
      
      if (projectedMetalIncome < 0 || projectedEnergyIncome < 0) {
        return { 
          success: false, 
          error: `Building ${quantity} ${buildType}(s) would cause economic stall. Upkeep: ${totalMetalUpkeep} Metal, ${totalEnergyUpkeep} Energy per turn` 
        };
      }
    }

    return { success: true };
  }

  /**
   * Validates attack command against current game state
   */
  private validateAttackCommand(attackFleet: FleetComposition, gameState: GameState): CommandResult {
    const playerFleet = gameState.player.fleet.homeSystem;

    // Check if player has enough ships
    if (playerFleet.frigates < attackFleet.frigates) {
      return { 
        success: false, 
        error: `Insufficient frigates. Need: ${attackFleet.frigates}, Have: ${playerFleet.frigates}` 
      };
    }

    if (playerFleet.cruisers < attackFleet.cruisers) {
      return { 
        success: false, 
        error: `Insufficient cruisers. Need: ${attackFleet.cruisers}, Have: ${playerFleet.cruisers}` 
      };
    }

    if (playerFleet.battleships < attackFleet.battleships) {
      return { 
        success: false, 
        error: `Insufficient battleships. Need: ${attackFleet.battleships}, Have: ${playerFleet.battleships}` 
      };
    }

    return { success: true };
  }

  /**
   * Validates scan command against current game state
   */
  private validateScanCommand(scanType: ScanType, gameState: GameState): CommandResult {
    const player = gameState.player;
    const cost = SCAN_COSTS[scanType];

    if (player.resources.energy < cost.energy) {
      return { 
        success: false, 
        error: `Insufficient energy for ${scanType} scan. Need: ${cost.energy}, Have: ${player.resources.energy}` 
      };
    }

    return { success: true };
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
   * Gets upkeep costs for unit types
   */
  private getUpkeepCosts(unitType: UnitType): { metal: number; energy: number } {
    const upkeepCosts = {
      frigate: { metal: 2, energy: 1 },
      cruiser: { metal: 5, energy: 3 },
      battleship: { metal: 10, energy: 6 }
    };

    return upkeepCosts[unitType];
  }

  /**
   * Provides command suggestions based on partial input
   */
  public getCommandSuggestions(partialInput: string): string[] {
    const commands = ['build', 'attack', 'scan', 'status', 'help', 'end', 'quit'];
    const partial = partialInput.toLowerCase().trim();
    
    return commands.filter(cmd => cmd.startsWith(partial));
  }

  /**
   * Validates if a command string has correct syntax without game state validation
   */
  public validateSyntax(input: string): { valid: boolean; error?: string } {
    const tokens = input.toLowerCase().trim().split(/\s+/);
    
    if (tokens.length === 0) {
      return { valid: false, error: 'No command entered' };
    }

    const commandType = tokens[0];

    switch (commandType) {
      case 'build':
        if (tokens.length !== 3) {
          return { valid: false, error: 'Build command requires: build <quantity> <unit/structure>' };
        }
        if (isNaN(parseInt(tokens[1], 10))) {
          return { valid: false, error: 'Quantity must be a number' };
        }
        break;

      case 'attack':
        if (tokens.length !== 4) {
          return { valid: false, error: 'Attack command requires: attack <frigates> <cruisers> <battleships>' };
        }
        for (let i = 1; i < 4; i++) {
          if (isNaN(parseInt(tokens[i], 10))) {
            return { valid: false, error: 'Fleet numbers must be integers' };
          }
        }
        break;

      case 'scan':
        if (tokens.length !== 2) {
          return { valid: false, error: 'Scan command requires: scan <type>' };
        }
        if (!this.SCAN_TYPES.includes(tokens[1] as ScanType)) {
          return { valid: false, error: `Invalid scan type. Valid types: ${this.SCAN_TYPES.join(', ')}` };
        }
        break;

      case 'status':
      case 'help':
      case 'end':
      case 'endturn':
      case 'end_turn':
      case 'quit':
      case 'exit':
        // These commands don't need additional parameters
        break;

      default:
        return { valid: false, error: `Unknown command: ${commandType}` };
    }

    return { valid: true };
  }
}