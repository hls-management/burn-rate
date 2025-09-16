import { FleetComposition } from './GameState.js';
export type UnitType = 'frigate' | 'cruiser' | 'battleship';
export type MissionType = 'outbound' | 'combat' | 'returning';
export interface FleetMovement {
    composition: FleetComposition;
    target: string;
    arrivalTurn: number;
    returnTurn: number;
    missionType: MissionType;
}
export interface Fleet {
    homeSystem: FleetComposition;
    inTransit: {
        outbound: FleetMovement[];
    };
}
export interface UnitStats {
    buildTime: number;
    buildCost: {
        metal: number;
        energy: number;
    };
    upkeepCost: {
        metal: number;
        energy: number;
    };
    effectiveness: {
        vsFrigate: number;
        vsCruiser: number;
        vsBattleship: number;
    };
}
export declare const UNIT_STATS: Record<UnitType, UnitStats>;
/**
 * Fleet composition and management functions
 */
export interface FleetValidationResult {
    isValid: boolean;
    errors: string[];
}
/**
 * Validates a fleet composition for basic integrity
 */
export declare function validateFleetComposition(composition: FleetComposition): FleetValidationResult;
/**
 * Validates a fleet movement for timing and composition integrity
 */
export declare function validateFleetMovement(movement: FleetMovement, currentTurn: number): FleetValidationResult;
/**
 * Calculates the total number of ships in a fleet composition
 */
export declare function getTotalFleetSize(composition: FleetComposition): number;
/**
 * Calculates the total upkeep cost for a fleet composition
 */
export declare function calculateFleetUpkeep(composition: FleetComposition): {
    metal: number;
    energy: number;
};
/**
 * Calculates the total construction cost for a fleet composition
 */
export declare function calculateFleetBuildCost(composition: FleetComposition): {
    metal: number;
    energy: number;
};
/**
 * Adds two fleet compositions together
 */
export declare function addFleetCompositions(fleet1: FleetComposition, fleet2: FleetComposition): FleetComposition;
/**
 * Subtracts fleet2 from fleet1, ensuring no negative values
 */
export declare function subtractFleetCompositions(fleet1: FleetComposition, fleet2: FleetComposition): FleetComposition;
/**
 * Checks if fleet1 has at least as many ships as fleet2
 */
export declare function canAffordFleetComposition(available: FleetComposition, required: FleetComposition): boolean;
/**
 * Creates an empty fleet composition
 */
export declare function createEmptyFleet(): FleetComposition;
/**
 * Checks if a fleet composition is empty (no ships)
 */
export declare function isFleetEmpty(composition: FleetComposition): boolean;
/**
 * Generates a random factor for combat calculations (0.8-1.2x per unit type)
 */
export declare function generateRandomFactor(): number;
/**
 * Calculates combat strength for a specific unit type against enemy composition
 */
export declare function calculateUnitTypeStrength(unitCount: number, unitType: UnitType, enemyComposition: FleetComposition, randomFactor?: number): number;
/**
 * Calculates total fleet combat strength with individual random factors per unit type
 */
export declare function calculateFleetStrength(attacker: FleetComposition, defender: FleetComposition, randomFactors?: {
    frigate: number;
    cruiser: number;
    battleship: number;
}): number;
/**
 * Creates a fleet movement for attacking a target with 3-turn cycle
 */
export declare function createFleetMovement(composition: FleetComposition, target: string, currentTurn: number): FleetMovement;
/**
 * Checks if a fleet is currently in transit (invisible to scans)
 */
export declare function isFleetInTransit(movement: FleetMovement, currentTurn: number): boolean;
/**
 * Checks if a fleet can be recalled (only before departure)
 */
export declare function canRecallFleet(movement: FleetMovement, currentTurn: number): boolean;
/**
 * Updates fleet movement mission type based on current turn
 */
export declare function updateFleetMissionType(movement: FleetMovement, currentTurn: number): FleetMovement;
/**
 * Processes fleet movements for a turn, returning movements that need combat resolution
 */
export declare function processFleetMovements(movements: FleetMovement[], currentTurn: number): {
    updated: FleetMovement[];
    combatMovements: FleetMovement[];
    returning: FleetMovement[];
};
/**
 * Checks if a player's home system is vulnerable to counter-attack
 * (has fleets in transit and reduced home defense)
 */
export declare function isHomeSystemVulnerable(homeFleet: FleetComposition, outboundMovements: FleetMovement[], currentTurn: number): boolean;
/**
 * Calculates the counter-attack window for a fleet movement
 */
export declare function getCounterAttackWindow(movement: FleetMovement): {
    startTurn: number;
    endTurn: number;
    duration: number;
};
/**
 * Gets all fleets that are currently visible to scans (not in transit)
 */
export declare function getVisibleFleets(homeFleet: FleetComposition, outboundMovements: FleetMovement[], currentTurn: number): FleetComposition;
/**
 * Creates a returning fleet movement after combat
 */
export declare function createReturningFleet(survivors: FleetComposition, originalMovement: FleetMovement, currentTurn: number): FleetMovement | null;
/**

 * Combat Resolution Engine
 */
export interface CombatResult {
    outcome: 'decisive_attacker' | 'decisive_defender' | 'close_battle';
    attackerSurvivors: FleetComposition;
    defenderSurvivors: FleetComposition;
    attackerCasualties: FleetComposition;
    defenderCasualties: FleetComposition;
    strengthRatio: number;
}
/**
 * Determines battle outcome based on strength ratio
 */
export declare function determineBattleOutcome(attackerStrength: number, defenderStrength: number): 'decisive_attacker' | 'decisive_defender' | 'close_battle';
/**
 * Calculates casualties based on battle outcome
 */
export declare function calculateCasualties(fleet: FleetComposition, outcome: 'decisive_attacker' | 'decisive_defender' | 'close_battle', isWinner: boolean): {
    survivors: FleetComposition;
    casualties: FleetComposition;
};
/**
 * Resolves combat between two fleets
 */
export declare function resolveCombat(attacker: FleetComposition, defender: FleetComposition, randomFactors?: {
    attackerFactors: {
        frigate: number;
        cruiser: number;
        battleship: number;
    };
    defenderFactors: {
        frigate: number;
        cruiser: number;
        battleship: number;
    };
}): CombatResult;
/**
 * Checks if a player has been eliminated (no fleets remaining)
 */
export declare function checkFleetElimination(homeFleet: FleetComposition, outboundMovements: FleetMovement[]): boolean;
/**
 * Processes combat for a fleet movement and returns updated game state
 */
export declare function processCombatMovement(movement: FleetMovement, defenderHomeFleet: FleetComposition, currentTurn: number): {
    combatResult: CombatResult;
    returningFleet: FleetMovement | null;
    updatedDefenderFleet: FleetComposition;
};
/**
 * Checks victory conditions for the game
 */
export declare function checkVictoryConditions(playerHomeFleet: FleetComposition, playerOutboundMovements: FleetMovement[], aiHomeFleet: FleetComposition, aiOutboundMovements: FleetMovement[]): 'player_victory' | 'ai_victory' | 'ongoing';
//# sourceMappingURL=Fleet.d.ts.map