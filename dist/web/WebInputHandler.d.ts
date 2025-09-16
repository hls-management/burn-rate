import { InputHandler, Command, CommandResult } from '../ui/InputHandler.js';
import { GameState } from '../models/GameState.js';
export interface FormValidationResult {
    success: boolean;
    errors: string[];
    warnings: string[];
}
export interface WebCommandData {
    buildType?: string;
    quantity?: string;
    frigates?: string;
    cruisers?: string;
    battleships?: string;
    target?: string;
    scanType?: string;
}
export declare class WebInputHandler {
    private inputHandler;
    constructor(inputHandler: InputHandler);
    /**
     * Handles build form submission and converts to game command
     */
    handleBuildForm(formData: FormData, gameState: GameState): CommandResult;
    /**
     * Handles attack form submission and converts to game command
     */
    handleAttackForm(formData: FormData, gameState: GameState): CommandResult;
    /**
     * Handles scan form submission and converts to game command
     */
    handleScanForm(formData: FormData, gameState: GameState): CommandResult;
    /**
     * Validates build form data
     */
    validateBuildForm(data: WebCommandData): FormValidationResult; /**
    
   * Validates attack form data
     */
    validateAttackForm(data: WebCommandData): FormValidationResult;
    /**
     * Validates scan form data
     */
    validateScanForm(data: WebCommandData): FormValidationResult;
    /**
     * Validates input against current game state and resources
     */
    validateInput(command: Command, gameState: GameState): FormValidationResult;
    /**
     * Converts web form data to command format
     */
    convertFormDataToCommand(formData: FormData, commandType: string): Command | null;
    /**
     * Gets real-time validation feedback for forms
     */
    getValidationFeedback(data: WebCommandData, commandType: string, gameState: GameState): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
        suggestions: string[];
    };
    /**
     * Private validation methods
     */
    private validateBuildCommand;
    private validateAttackCommand;
    private validateScanCommand;
    private validateBuildResources;
    private validateAttackFleet;
    private validateScanResources;
    private getBuildValidationFeedback;
    private getAttackValidationFeedback;
    private getScanValidationFeedback;
    /**
     * Helper methods
     */
    private getBuildCosts;
    private getUpkeepCosts;
    private isUnitType;
    /**
     * Handles simple command buttons (end turn, help, status, etc.)
     */
    handleSimpleCommand(commandType: string): CommandResult;
    /**
     * Gets the underlying InputHandler instance
     */
    getInputHandler(): InputHandler;
    /**
     * Sanitizes and validates raw form input data
     */
    sanitizeFormData(formData: FormData): {
        [key: string]: string;
    };
    /**
     * Validates form data structure and required fields
     */
    validateFormStructure(formData: FormData, requiredFields: string[]): FormValidationResult;
    /**
     * Provides command suggestions for auto-completion
     */
    getCommandSuggestions(commandType: string, gameState: GameState): string[];
    /**
     * Handles batch command validation (for queued commands)
     */
    validateBatchCommands(commands: Command[], gameState: GameState): {
        validCommands: Command[];
        invalidCommands: {
            command: Command;
            error: string;
        }[];
        warnings: string[];
    };
    /**
     * Simulates command execution for batch validation
     */
    private simulateCommandExecution;
    /**
     * Gets detailed cost breakdown for a command
     */
    getCommandCostBreakdown(command: Command): {
        immediate: {
            metal: number;
            energy: number;
        };
        ongoing: {
            metal: number;
            energy: number;
        };
        description: string;
    };
}
//# sourceMappingURL=WebInputHandler.d.ts.map