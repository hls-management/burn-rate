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
export function validateGameState(gameState: GameState): ValidationResult {
  const errors: string[] = [];

  // Validate turn number
  if (gameState.turn < 1) {
    errors.push('Turn number must be at least 1');
  }

  // Validate game phase consistency with turn number
  const phaseValidation = validateGamePhase(gameState.gamePhase, gameState.turn);
  if (!phaseValidation.isValid) {
    errors.push(...phaseValidation.errors);
  }

  // Validate player state
  const playerValidation = validatePlayerState(gameState.player);
  if (!playerValidation.isValid) {
    errors.push(...playerValidation.errors.map(err => `Player: ${err}`));
  }

  // Validate AI state
  const aiValidation = validatePlayerState(gameState.ai);
  if (!aiValidation.isValid) {
    errors.push(...aiValidation.errors.map(err => `AI: ${err}`));
  }

  // Validate game over conditions
  if (gameState.isGameOver) {
    if (!gameState.winner) {
      errors.push('Game over state requires a winner');
    }
    if (!gameState.victoryType) {
      errors.push('Game over state requires a victory type');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates game phase transitions based on turn number
 */
export function validateGamePhase(phase: GamePhase, turn: number): ValidationResult {
  const errors: string[] = [];

  // Define phase boundaries based on typical game progression
  if (turn <= 5 && phase !== 'early') {
    errors.push(`Turn ${turn} should be in 'early' phase, but is '${phase}'`);
  } else if (turn > 5 && turn <= 15 && phase !== 'mid') {
    errors.push(`Turn ${turn} should be in 'mid' phase, but is '${phase}'`);
  } else if (turn > 15 && turn <= 25 && phase !== 'late') {
    errors.push(`Turn ${turn} should be in 'late' phase, but is '${phase}'`);
  } else if (turn > 25 && phase !== 'endgame') {
    errors.push(`Turn ${turn} should be in 'endgame' phase, but is '${phase}'`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates PlayerState for data integrity
 */
export function validatePlayerState(playerState: PlayerState): ValidationResult {
  const errors: string[] = [];

  // Validate resources
  const resourceValidation = validateResources(playerState.resources);
  if (!resourceValidation.isValid) {
    errors.push(...resourceValidation.errors);
  }

  // Validate fleet
  const fleetValidation = validateFleet(playerState.fleet);
  if (!fleetValidation.isValid) {
    errors.push(...fleetValidation.errors);
  }

  // Validate economy
  const economyValidation = validateEconomy(playerState.economy);
  if (!economyValidation.isValid) {
    errors.push(...economyValidation.errors);
  }

  // Validate intelligence data
  if (playerState.intelligence.lastScanTurn < 0) {
    errors.push('Last scan turn cannot be negative');
  }

  if (playerState.intelligence.scanAccuracy < 0 || playerState.intelligence.scanAccuracy > 1) {
    errors.push('Scan accuracy must be between 0 and 1');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates resource values and income rates
 */
export function validateResources(resources: Resources): ValidationResult {
  const errors: string[] = [];

  // Resources can be negative (debt), but should have reasonable bounds
  if (resources.metal < -100000) {
    errors.push('Metal resources are unreasonably negative');
  }

  if (resources.energy < -100000) {
    errors.push('Energy resources are unreasonably negative');
  }

  // Income rates can be negative (indicating net loss)
  if (resources.metalIncome < -50000) {
    errors.push('Metal income is unreasonably negative');
  }

  if (resources.energyIncome < -50000) {
    errors.push('Energy income is unreasonably negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates fleet composition and movement data
 */
export function validateFleet(fleet: Fleet): ValidationResult {
  const errors: string[] = [];

  // Validate home system fleet counts
  if (fleet.homeSystem.frigates < 0) {
    errors.push('Frigate count cannot be negative');
  }
  if (fleet.homeSystem.cruisers < 0) {
    errors.push('Cruiser count cannot be negative');
  }
  if (fleet.homeSystem.battleships < 0) {
    errors.push('Battleship count cannot be negative');
  }

  // Validate in-transit fleets
  for (const movement of fleet.inTransit.outbound) {
    if (movement.composition.frigates < 0 || movement.composition.cruisers < 0 || movement.composition.battleships < 0) {
      errors.push('In-transit fleet composition cannot have negative values');
    }

    if (movement.arrivalTurn <= 0) {
      errors.push('Arrival turn must be positive');
    }

    if (movement.returnTurn <= movement.arrivalTurn) {
      errors.push('Return turn must be after arrival turn');
    }

    if (!['outbound', 'combat', 'returning'].includes(movement.missionType)) {
      errors.push(`Invalid mission type: ${movement.missionType}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates economy state including structures and construction queue
 */
export function validateEconomy(economy: Economy): ValidationResult {
  const errors: string[] = [];

  // Validate structure counts
  if (economy.reactors < 0) {
    errors.push('Reactor count cannot be negative');
  }

  if (economy.mines < 0) {
    errors.push('Mine count cannot be negative');
  }

  // Validate construction queue
  for (const buildOrder of economy.constructionQueue) {
    if (buildOrder.quantity <= 0) {
      errors.push('Build order quantity must be positive');
    }

    if (buildOrder.turnsRemaining < 0) {
      errors.push('Turns remaining cannot be negative');
    }

    if (buildOrder.resourceDrainPerTurn.metal < 0 || buildOrder.resourceDrainPerTurn.energy < 0) {
      errors.push('Resource drain per turn cannot be negative');
    }

    const validTypes = ['frigate', 'cruiser', 'battleship', 'reactor', 'mine'];
    if (!validTypes.includes(buildOrder.unitType)) {
      errors.push(`Invalid unit type in build order: ${buildOrder.unitType}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates state transitions between turns
 */
export function validateStateTransition(previousState: GameState, newState: GameState): ValidationResult {
  const errors: string[] = [];

  // Turn must increment by exactly 1
  if (newState.turn !== previousState.turn + 1) {
    errors.push(`Turn must increment by 1, got ${previousState.turn} -> ${newState.turn}`);
  }

  // Game phase can only progress forward or stay the same
  const phaseOrder: GamePhase[] = ['early', 'mid', 'late', 'endgame'];
  const prevPhaseIndex = phaseOrder.indexOf(previousState.gamePhase);
  const newPhaseIndex = phaseOrder.indexOf(newState.gamePhase);

  if (newPhaseIndex < prevPhaseIndex) {
    errors.push(`Game phase cannot regress from ${previousState.gamePhase} to ${newState.gamePhase}`);
  }

  // Once game is over, it cannot become active again
  if (previousState.isGameOver && !newState.isGameOver) {
    errors.push('Game cannot become active after being over');
  }

  // Winner cannot change once set
  if (previousState.winner && newState.winner && previousState.winner !== newState.winner) {
    errors.push('Winner cannot change once determined');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Creates a new GameState with validated initial values
 */
export function createInitialGameState(playerState: PlayerState, aiState: PlayerState): GameState {
  const gameState: GameState = {
    turn: 1,
    player: playerState,
    ai: aiState,
    combatLog: [],
    gamePhase: 'early',
    isGameOver: false
  };

  const validation = validateGameState(gameState);
  if (!validation.isValid) {
    throw new Error(`Invalid initial game state: ${validation.errors.join(', ')}`);
  }

  return gameState;
}

/**
 * Determines the appropriate game phase based on turn number
 */
export function determineGamePhase(turn: number): GamePhase {
  if (turn <= 5) return 'early';
  if (turn <= 15) return 'mid';
  if (turn <= 25) return 'late';
  return 'endgame';
}