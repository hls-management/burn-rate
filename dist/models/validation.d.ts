import { GameState, GamePhase, PlayerState, Resources, Fleet, Economy } from './index.js';
/**
 * Validation functions for game state management and data integrity
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
/**
 * Validates a complete GameState object
 */
export declare function validateGameState(gameState: GameState): ValidationResult;
/**
 * Validates game phase transitions based on turn number
 */
export declare function validateGamePhase(phase: GamePhase, turn: number): ValidationResult;
/**
 * Validates PlayerState for data integrity
 */
export declare function validatePlayerState(playerState: PlayerState): ValidationResult;
/**
 * Validates resource values and income rates
 */
export declare function validateResources(resources: Resources): ValidationResult;
/**
 * Validates fleet composition and movement data
 */
export declare function validateFleet(fleet: Fleet): ValidationResult;
/**
 * Validates economy state including structures and construction queue
 */
export declare function validateEconomy(economy: Economy): ValidationResult;
/**
 * Validates state transitions between turns
 */
export declare function validateStateTransition(previousState: GameState, newState: GameState): ValidationResult;
/**
 * Creates a new GameState with validated initial values
 */
export declare function createInitialGameState(playerState: PlayerState, aiState: PlayerState): GameState;
/**
 * Determines the appropriate game phase based on turn number
 */
export declare function determineGamePhase(turn: number): GamePhase;
//# sourceMappingURL=validation.d.ts.map