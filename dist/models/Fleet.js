export const UNIT_STATS = {
    frigate: {
        buildTime: 1,
        buildCost: { metal: 4, energy: 2 },
        upkeepCost: { metal: 2, energy: 1 },
        effectiveness: { vsFrigate: 1.0, vsCruiser: 1.5, vsBattleship: 0.7 }
    },
    cruiser: {
        buildTime: 2,
        buildCost: { metal: 10, energy: 6 },
        upkeepCost: { metal: 5, energy: 3 },
        effectiveness: { vsFrigate: 0.7, vsCruiser: 1.0, vsBattleship: 1.5 }
    },
    battleship: {
        buildTime: 4,
        buildCost: { metal: 20, energy: 12 },
        upkeepCost: { metal: 10, energy: 6 },
        effectiveness: { vsFrigate: 1.5, vsCruiser: 0.7, vsBattleship: 1.0 }
    }
};
/**
 * Validates a fleet composition for basic integrity
 */
export function validateFleetComposition(composition) {
    const errors = [];
    if (composition.frigates < 0) {
        errors.push('Frigate count cannot be negative');
    }
    if (composition.cruisers < 0) {
        errors.push('Cruiser count cannot be negative');
    }
    if (composition.battleships < 0) {
        errors.push('Battleship count cannot be negative');
    }
    // Check for reasonable upper bounds (prevent integer overflow scenarios)
    const maxUnits = 1000000;
    if (composition.frigates > maxUnits || composition.cruisers > maxUnits || composition.battleships > maxUnits) {
        errors.push('Unit counts exceed reasonable maximum');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Validates a fleet movement for timing and composition integrity
 */
export function validateFleetMovement(movement, currentTurn) {
    const errors = [];
    // Validate composition
    const compositionValidation = validateFleetComposition(movement.composition);
    if (!compositionValidation.isValid) {
        errors.push(...compositionValidation.errors);
    }
    // Validate timing
    if (movement.arrivalTurn <= currentTurn) {
        errors.push('Arrival turn must be in the future');
    }
    if (movement.returnTurn <= movement.arrivalTurn) {
        errors.push('Return turn must be after arrival turn');
    }
    // Validate mission type
    const validMissionTypes = ['outbound', 'combat', 'returning'];
    if (!validMissionTypes.includes(movement.missionType)) {
        errors.push(`Invalid mission type: ${movement.missionType}`);
    }
    // Validate target
    if (!movement.target || movement.target.trim().length === 0) {
        errors.push('Movement target cannot be empty');
    }
    // Validate fleet is not empty
    if (getTotalFleetSize(movement.composition) === 0) {
        errors.push('Cannot send empty fleet');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Calculates the total number of ships in a fleet composition
 */
export function getTotalFleetSize(composition) {
    return composition.frigates + composition.cruisers + composition.battleships;
}
/**
 * Calculates the total upkeep cost for a fleet composition
 */
export function calculateFleetUpkeep(composition) {
    const metalUpkeep = composition.frigates * UNIT_STATS.frigate.upkeepCost.metal +
        composition.cruisers * UNIT_STATS.cruiser.upkeepCost.metal +
        composition.battleships * UNIT_STATS.battleship.upkeepCost.metal;
    const energyUpkeep = composition.frigates * UNIT_STATS.frigate.upkeepCost.energy +
        composition.cruisers * UNIT_STATS.cruiser.upkeepCost.energy +
        composition.battleships * UNIT_STATS.battleship.upkeepCost.energy;
    return { metal: metalUpkeep, energy: energyUpkeep };
}
/**
 * Calculates the total construction cost for a fleet composition
 */
export function calculateFleetBuildCost(composition) {
    const metalCost = composition.frigates * UNIT_STATS.frigate.buildCost.metal +
        composition.cruisers * UNIT_STATS.cruiser.buildCost.metal +
        composition.battleships * UNIT_STATS.battleship.buildCost.metal;
    const energyCost = composition.frigates * UNIT_STATS.frigate.buildCost.energy +
        composition.cruisers * UNIT_STATS.cruiser.buildCost.energy +
        composition.battleships * UNIT_STATS.battleship.buildCost.energy;
    return { metal: metalCost, energy: energyCost };
}
/**
 * Adds two fleet compositions together
 */
export function addFleetCompositions(fleet1, fleet2) {
    return {
        frigates: fleet1.frigates + fleet2.frigates,
        cruisers: fleet1.cruisers + fleet2.cruisers,
        battleships: fleet1.battleships + fleet2.battleships
    };
}
/**
 * Subtracts fleet2 from fleet1, ensuring no negative values
 */
export function subtractFleetCompositions(fleet1, fleet2) {
    return {
        frigates: Math.max(0, fleet1.frigates - fleet2.frigates),
        cruisers: Math.max(0, fleet1.cruisers - fleet2.cruisers),
        battleships: Math.max(0, fleet1.battleships - fleet2.battleships)
    };
}
/**
 * Checks if fleet1 has at least as many ships as fleet2
 */
export function canAffordFleetComposition(available, required) {
    return available.frigates >= required.frigates &&
        available.cruisers >= required.cruisers &&
        available.battleships >= required.battleships;
}
/**
 * Creates an empty fleet composition
 */
export function createEmptyFleet() {
    return {
        frigates: 0,
        cruisers: 0,
        battleships: 0
    };
}
/**
 * Checks if a fleet composition is empty (no ships)
 */
export function isFleetEmpty(composition) {
    return getTotalFleetSize(composition) === 0;
}
/**
 * Generates a random factor for combat calculations (0.8-1.2x per unit type)
 */
export function generateRandomFactor() {
    return 0.8 + Math.random() * 0.4;
}
/**
 * Calculates combat strength for a specific unit type against enemy composition
 */
export function calculateUnitTypeStrength(unitCount, unitType, enemyComposition, randomFactor = generateRandomFactor()) {
    if (unitCount === 0)
        return 0;
    const stats = UNIT_STATS[unitType];
    // Calculate effectiveness against each enemy unit type
    const vsfrigates = unitCount * stats.effectiveness.vsFrigate * enemyComposition.frigates;
    const vsCruisers = unitCount * stats.effectiveness.vsCruiser * enemyComposition.cruisers;
    const vsBattleships = unitCount * stats.effectiveness.vsBattleship * enemyComposition.battleships;
    const baseStrength = vsfrigates + vsCruisers + vsBattleships;
    // Apply random factor per unit type
    return baseStrength * randomFactor;
}
/**
 * Calculates total fleet combat strength with individual random factors per unit type
 */
export function calculateFleetStrength(attacker, defender, randomFactors) {
    // Generate random factors if not provided (for testing determinism)
    const factors = randomFactors || {
        frigate: generateRandomFactor(),
        cruiser: generateRandomFactor(),
        battleship: generateRandomFactor()
    };
    const frigateStrength = calculateUnitTypeStrength(attacker.frigates, 'frigate', defender, factors.frigate);
    const cruiserStrength = calculateUnitTypeStrength(attacker.cruisers, 'cruiser', defender, factors.cruiser);
    const battleshipStrength = calculateUnitTypeStrength(attacker.battleships, 'battleship', defender, factors.battleship);
    return frigateStrength + cruiserStrength + battleshipStrength;
}
/**
 * Creates a fleet movement for attacking a target with 3-turn cycle
 */
export function createFleetMovement(composition, target, currentTurn) {
    return {
        composition,
        target,
        arrivalTurn: currentTurn + 1, // Takes 1 turn to reach target
        returnTurn: currentTurn + 3, // Takes 1 turn for combat + 1 turn to return
        missionType: 'outbound'
    };
}
/**
 * Checks if a fleet is currently in transit (invisible to scans)
 */
export function isFleetInTransit(movement, currentTurn) {
    return currentTurn >= movement.arrivalTurn - 1 && currentTurn < movement.returnTurn;
}
/**
 * Checks if a fleet can be recalled (only before departure)
 */
export function canRecallFleet(movement, currentTurn) {
    return currentTurn < movement.arrivalTurn - 1;
}
/**
 * Updates fleet movement mission type based on current turn
 */
export function updateFleetMissionType(movement, currentTurn) {
    let missionType;
    if (currentTurn < movement.arrivalTurn) {
        missionType = 'outbound';
    }
    else if (currentTurn === movement.arrivalTurn) {
        missionType = 'combat';
    }
    else {
        missionType = 'returning';
    }
    return {
        ...movement,
        missionType
    };
}
/**
 * Processes fleet movements for a turn, returning movements that need combat resolution
 */
export function processFleetMovements(movements, currentTurn) {
    const updated = [];
    const combatMovements = [];
    const returning = [];
    for (const movement of movements) {
        const updatedMovement = updateFleetMissionType(movement, currentTurn);
        if (updatedMovement.missionType === 'combat') {
            combatMovements.push(updatedMovement);
        }
        else if (updatedMovement.missionType === 'returning') {
            returning.push(updatedMovement);
        }
        else {
            updated.push(updatedMovement);
        }
    }
    return { updated, combatMovements, returning };
}
/**
 * Checks if a player's home system is vulnerable to counter-attack
 * (has fleets in transit and reduced home defense)
 */
export function isHomeSystemVulnerable(homeFleet, outboundMovements, currentTurn) {
    // Check if any fleets are in transit
    const fleetsInTransit = outboundMovements.some(movement => isFleetInTransit(movement, currentTurn));
    // Home system is vulnerable if fleets are in transit
    return fleetsInTransit;
}
/**
 * Calculates the counter-attack window for a fleet movement
 */
export function getCounterAttackWindow(movement) {
    const startTurn = movement.arrivalTurn - 1; // Fleet departs, home vulnerable
    const endTurn = movement.returnTurn - 1; // Fleet returns next turn
    const duration = endTurn - startTurn + 1;
    return { startTurn, endTurn, duration };
}
/**
 * Gets all fleets that are currently visible to scans (not in transit)
 */
export function getVisibleFleets(homeFleet, outboundMovements, currentTurn) {
    // Only home fleet is visible, in-transit fleets are invisible
    const fleetsInTransit = outboundMovements.filter(movement => isFleetInTransit(movement, currentTurn));
    // If no fleets in transit, return full home fleet
    if (fleetsInTransit.length === 0) {
        return homeFleet;
    }
    // Return only the home fleet (in-transit fleets are invisible)
    return homeFleet;
}
/**
 * Creates a returning fleet movement after combat
 */
export function createReturningFleet(survivors, originalMovement, currentTurn) {
    // If no survivors, no fleet returns
    if (getTotalFleetSize(survivors) === 0) {
        return null;
    }
    return {
        composition: survivors,
        target: 'home', // Returning home
        arrivalTurn: currentTurn + 1, // Takes 1 turn to return
        returnTurn: currentTurn + 1, // Arrives home immediately
        missionType: 'returning'
    };
}
/**
 * Determines battle outcome based on strength ratio
 */
export function determineBattleOutcome(attackerStrength, defenderStrength) {
    // If attacker has no strength, defender wins decisively
    if (attackerStrength === 0) {
        return 'decisive_defender';
    }
    // If defender has no strength, attacker wins decisively
    if (defenderStrength === 0) {
        return 'decisive_attacker';
    }
    const ratio = attackerStrength / defenderStrength;
    // Decisive victory if one side has 2x or more strength
    if (ratio >= 2.0) {
        return 'decisive_attacker';
    }
    else if (ratio <= 0.5) {
        return 'decisive_defender';
    }
    else {
        return 'close_battle';
    }
}
/**
 * Calculates casualties based on battle outcome
 */
export function calculateCasualties(fleet, outcome, isWinner) {
    let casualtyRate;
    if (outcome === 'close_battle') {
        // Close battles: 40-60% casualties for both sides
        casualtyRate = 0.4 + Math.random() * 0.2;
    }
    else {
        if (isWinner) {
            // Decisive winner: 10-30% casualties
            casualtyRate = 0.1 + Math.random() * 0.2;
        }
        else {
            // Decisive loser: 70-90% casualties
            casualtyRate = 0.7 + Math.random() * 0.2;
        }
    }
    const frigatesCasualties = Math.floor(fleet.frigates * casualtyRate);
    const cruisersCasualties = Math.floor(fleet.cruisers * casualtyRate);
    const battleshipsCasualties = Math.floor(fleet.battleships * casualtyRate);
    const casualties = {
        frigates: frigatesCasualties,
        cruisers: cruisersCasualties,
        battleships: battleshipsCasualties
    };
    const survivors = {
        frigates: fleet.frigates - frigatesCasualties,
        cruisers: fleet.cruisers - cruisersCasualties,
        battleships: fleet.battleships - battleshipsCasualties
    };
    return { survivors, casualties };
}
/**
 * Resolves combat between two fleets
 */
export function resolveCombat(attacker, defender, randomFactors) {
    // Calculate combat strengths
    const attackerStrength = calculateFleetStrength(attacker, defender, randomFactors?.attackerFactors);
    const defenderStrength = calculateFleetStrength(defender, attacker, randomFactors?.defenderFactors);
    // Determine battle outcome
    const outcome = determineBattleOutcome(attackerStrength, defenderStrength);
    // Calculate casualties
    const attackerResult = calculateCasualties(attacker, outcome, outcome === 'decisive_attacker');
    const defenderResult = calculateCasualties(defender, outcome, outcome === 'decisive_defender');
    const strengthRatio = defenderStrength > 0 ? attackerStrength / defenderStrength : Infinity;
    return {
        outcome,
        attackerSurvivors: attackerResult.survivors,
        defenderSurvivors: defenderResult.survivors,
        attackerCasualties: attackerResult.casualties,
        defenderCasualties: defenderResult.casualties,
        strengthRatio
    };
}
/**
 * Checks if a player has been eliminated (no fleets remaining)
 */
export function checkFleetElimination(homeFleet, outboundMovements) {
    // Check if home fleet is empty
    if (getTotalFleetSize(homeFleet) > 0) {
        return false;
    }
    // Check if any fleets are in transit
    for (const movement of outboundMovements) {
        if (getTotalFleetSize(movement.composition) > 0) {
            return false;
        }
    }
    // No fleets anywhere - player is eliminated
    return true;
}
/**
 * Processes combat for a fleet movement and returns updated game state
 */
export function processCombatMovement(movement, defenderHomeFleet, currentTurn) {
    // Resolve combat
    const combatResult = resolveCombat(movement.composition, defenderHomeFleet);
    // Create returning fleet from survivors
    const returningFleet = createReturningFleet(combatResult.attackerSurvivors, movement, currentTurn);
    // Update defender's home fleet with survivors
    const updatedDefenderFleet = combatResult.defenderSurvivors;
    return {
        combatResult,
        returningFleet,
        updatedDefenderFleet
    };
}
/**
 * Checks victory conditions for the game
 */
export function checkVictoryConditions(playerHomeFleet, playerOutboundMovements, aiHomeFleet, aiOutboundMovements) {
    const playerEliminated = checkFleetElimination(playerHomeFleet, playerOutboundMovements);
    const aiEliminated = checkFleetElimination(aiHomeFleet, aiOutboundMovements);
    if (playerEliminated && aiEliminated) {
        // Mutual elimination - could be a draw, but for simplicity, AI wins
        return 'ai_victory';
    }
    else if (playerEliminated) {
        return 'ai_victory';
    }
    else if (aiEliminated) {
        return 'player_victory';
    }
    else {
        return 'ongoing';
    }
}
//# sourceMappingURL=Fleet.js.map