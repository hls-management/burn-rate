import { GameState, FleetComposition } from '../models/GameState.js';
import { BuildableType } from '../models/PlayerState.js';
import { ScanType } from '../models/Intelligence.js';
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
export declare class InputHandler {
    private readonly UNIT_TYPES;
    private readonly STRUCTURE_TYPES;
    private readonly SCAN_TYPES;
    /**
     * Processes a raw input string and returns a parsed command
     */
    processCommand(input: string, gameState: GameState): CommandResult;
    /**
     * Parses build commands: "build <quantity> <unit/structure>"
     */
    private parseBuildCommand;
    /**
     * Parses attack commands: "attack <frigates> <cruisers> <battleships>"
     */
    private parseAttackCommand;
    /**
     * Parses scan commands: "scan <type>"
     */
    private parseScanCommand;
    /**
     * Validates build command against current game state
     */
    private validateBuildCommand;
    /**
     * Validates attack command against current game state
     */
    private validateAttackCommand;
    /**
     * Validates scan command against current game state
     */
    private validateScanCommand;
    /**
     * Gets build costs for different unit/structure types
     */
    private getBuildCosts;
    /**
     * Gets upkeep costs for unit types
     */
    private getUpkeepCosts;
    /**
     * Provides command suggestions based on partial input
     */
    getCommandSuggestions(partialInput: string): string[];
    /**
     * Validates if a command string has correct syntax without game state validation
     */
    validateSyntax(input: string): {
        valid: boolean;
        error?: string;
    };
}
//# sourceMappingURL=InputHandler.d.ts.map