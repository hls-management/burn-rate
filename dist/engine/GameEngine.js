import { EconomyEngine } from './EconomyEngine.js';
import { AIEngine } from './AIEngine.js';
import { IntelligenceEngine } from './IntelligenceEngine.js';
import { processFleetMovements, processCombatMovement, checkFleetElimination, UNIT_STATS, calculateFleetUpkeep } from '../models/Fleet.js';
import { createStructureBuildOrder, createUnitBuildOrder } from '../models/Economy.js';
export class GameEngine {
    gameState;
    economyEngine;
    aiEngine;
    intelligenceEngine;
    constructor(config = {}) {
        this.economyEngine = new EconomyEngine();
        this.aiEngine = new AIEngine(config.aiArchetype || 'hybrid');
        this.intelligenceEngine = new IntelligenceEngine();
        this.gameState = this.initializeGameState(config);
    }
    /**
     * Initializes a new game state with default values
     */
    initializeGameState(config) {
        const startingResources = config.startingResources || { metal: 10000, energy: 10000 };
        const createInitialPlayerState = () => ({
            resources: {
                metal: startingResources.metal,
                energy: startingResources.energy,
                metalIncome: 10000, // Base income
                energyIncome: 10000 // Base income
            },
            fleet: {
                homeSystem: {
                    frigates: 50, // Start with decent fleet
                    cruisers: 20, // Balanced composition
                    battleships: 10 // Some heavy units
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
                scanHistory: [],
                misinformationChance: 0.2
            }
        });
        return {
            turn: 1,
            player: createInitialPlayerState(),
            ai: createInitialPlayerState(),
            combatLog: [],
            gamePhase: 'early',
            isGameOver: false,
            playerHasBeenAttacked: false,
            aiHasBeenAttacked: false
        };
    }
    /**
     * Processes a complete game turn following the turn sequence:
     * Start → Income → Actions → AI → Combat → Victory → Next
     */
    processTurn(playerActions) {
        const errors = [];
        const combatEvents = [];
        try {
            // 1. Start Phase - Process turn start
            // 2. Income Phase - Calculate and apply resource income
            this.processIncomePhase();
            // 3. Actions Phase - Process player actions (handled externally, state already updated)
            // Player actions are processed before calling this method
            // 4. AI Phase - Process AI decision and actions
            const aiDecision = this.processAIPhase();
            // 5. Combat Phase - Resolve all fleet movements and combat
            const combatResults = this.processCombatPhase();
            combatEvents.push(...combatResults);
            // 6. Victory Phase - Check for game end conditions
            const victoryResult = this.checkVictoryConditions();
            // 7. Next Phase - Prepare for next turn
            if (!victoryResult.gameEnded) {
                this.prepareNextTurn();
                // Update game phase after turn increment
                this.updateGamePhase();
            }
            return {
                success: true,
                combatEvents,
                gameEnded: victoryResult.gameEnded,
                winner: victoryResult.winner,
                victoryType: victoryResult.victoryType,
                errors
            };
        }
        catch (error) {
            errors.push(`Turn processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                success: false,
                combatEvents,
                gameEnded: false,
                errors
            };
        }
    }
    /**
     * Updates the game phase based on turn number and game state
     */
    updateGamePhase() {
        const turn = this.gameState.turn;
        if (turn <= 5) {
            this.gameState.gamePhase = 'early';
        }
        else if (turn <= 15) {
            this.gameState.gamePhase = 'mid';
        }
        else if (turn <= 25) {
            this.gameState.gamePhase = 'late';
        }
        else {
            this.gameState.gamePhase = 'endgame';
        }
    }
    /**
     * Processes the income phase for both player and AI
     */
    processIncomePhase() {
        // Process player income
        this.economyEngine.calculateIncome(this.gameState.player);
        this.economyEngine.processConstruction(this.gameState.player);
        // Process AI income
        this.economyEngine.calculateIncome(this.gameState.ai);
        this.economyEngine.processConstruction(this.gameState.ai);
        // Age intelligence data
        this.intelligenceEngine.ageIntelligenceData(this.gameState.player, this.gameState.turn);
        this.intelligenceEngine.ageIntelligenceData(this.gameState.ai, this.gameState.turn);
    }
    /**
     * Processes AI decision making and actions
     */
    processAIPhase() {
        const aiDecision = this.aiEngine.processTurn(this.gameState);
        // Apply AI decision to game state
        this.applyAIDecision(aiDecision);
        return aiDecision;
    }
    /**
     * Applies AI decision to the game state
     */
    applyAIDecision(decision) {
        switch (decision.type) {
            case 'build':
                if (decision.buildType && decision.buildQuantity) {
                    this.applyAIBuildDecision(decision.buildType, decision.buildQuantity);
                }
                break;
            case 'attack':
                if (decision.attackFleet && decision.attackTarget) {
                    this.applyAIAttackDecision(decision.attackFleet, decision.attackTarget);
                }
                break;
            case 'scan':
                if (decision.scanType) {
                    this.applyAIScanDecision(decision.scanType);
                }
                break;
            case 'wait':
                // AI does nothing this turn
                break;
        }
    }
    /**
     * Applies AI build decision
     */
    applyAIBuildDecision(buildType, quantity) {
        // Create appropriate build order based on type
        let buildOrder;
        if (buildType === 'reactor' || buildType === 'mine') {
            // Structure build order
            const currentCount = buildType === 'reactor' ?
                this.gameState.ai.economy.reactors :
                this.gameState.ai.economy.mines;
            buildOrder = this.createStructureBuildOrderInternal(buildType, quantity, currentCount);
        }
        else {
            // Unit build order
            buildOrder = this.createUnitBuildOrderInternal(buildType, quantity);
        }
        // Add to AI construction queue
        this.economyEngine.addBuildOrder(this.gameState.ai, buildOrder);
    }
    /**
     * Applies AI attack decision
     */
    applyAIAttackDecision(attackFleet, target) {
        // Validate AI has the fleet to send
        const aiFleet = this.gameState.ai.fleet.homeSystem;
        if (aiFleet.frigates >= attackFleet.frigates &&
            aiFleet.cruisers >= attackFleet.cruisers &&
            aiFleet.battleships >= attackFleet.battleships) {
            // Deduct fleet from home system
            aiFleet.frigates -= attackFleet.frigates;
            aiFleet.cruisers -= attackFleet.cruisers;
            aiFleet.battleships -= attackFleet.battleships;
            // Create fleet movement
            const movement = {
                composition: attackFleet,
                target,
                arrivalTurn: this.gameState.turn + 1,
                returnTurn: this.gameState.turn + 3,
                missionType: 'outbound'
            };
            // Add to outbound movements
            this.gameState.ai.fleet.inTransit.outbound.push(movement);
        }
    }
    /**
     * Applies AI scan decision
     */
    applyAIScanDecision(scanType) {
        this.intelligenceEngine.performScan(this.gameState.ai, this.gameState.player, scanType, this.gameState.turn);
    }
    /**
     * Creates a structure build order with exponential cost scaling
     */
    createStructureBuildOrderInternal(structureType, quantity, currentCount) {
        return createStructureBuildOrder(structureType, quantity, currentCount);
    }
    /**
     * Creates a unit build order
     */
    createUnitBuildOrderInternal(unitType, quantity) {
        const unitStats = UNIT_STATS[unitType];
        return createUnitBuildOrder(unitType, quantity, unitStats);
    }
    /**
     * Processes combat phase - resolves all fleet movements and combat
     */
    processCombatPhase() {
        const combatEvents = [];
        // Process player fleet movements
        const playerCombatEvents = this.processPlayerFleetMovements();
        combatEvents.push(...playerCombatEvents);
        // Process AI fleet movements
        const aiCombatEvents = this.processAIFleetMovements();
        combatEvents.push(...aiCombatEvents);
        // Store combat events in game state
        this.gameState.combatLog.push(...combatEvents);
        return combatEvents;
    }
    /**
     * Processes player fleet movements and combat
     */
    processPlayerFleetMovements() {
        const combatEvents = [];
        const playerMovements = this.gameState.player.fleet.inTransit.outbound;
        const { updated, combatMovements, returning } = processFleetMovements(playerMovements, this.gameState.turn);
        // Update player movements
        this.gameState.player.fleet.inTransit.outbound = updated;
        // Process combat movements
        for (const movement of combatMovements) {
            const combatResult = processCombatMovement(movement, this.gameState.ai.fleet.homeSystem, this.gameState.turn);
            // Update AI home fleet with combat results
            this.gameState.ai.fleet.homeSystem = combatResult.updatedDefenderFleet;
            // Add returning fleet if any survivors
            if (combatResult.returningFleet) {
                this.gameState.player.fleet.inTransit.outbound.push(combatResult.returningFleet);
            }
            // Mark AI as having been attacked
            this.gameState.aiHasBeenAttacked = true;
            // Return operational costs for destroyed ships to both players
            this.returnOperationalCosts(this.gameState.player, combatResult.combatResult.attackerCasualties);
            this.returnOperationalCosts(this.gameState.ai, combatResult.combatResult.defenderCasualties);
            // Create combat event
            const combatEvent = {
                turn: this.gameState.turn,
                attacker: 'player',
                attackerFleet: movement.composition,
                defenderFleet: this.gameState.ai.fleet.homeSystem,
                outcome: combatResult.combatResult.outcome,
                casualties: {
                    attacker: combatResult.combatResult.attackerCasualties,
                    defender: combatResult.combatResult.defenderCasualties
                },
                survivors: {
                    attacker: combatResult.combatResult.attackerSurvivors,
                    defender: combatResult.combatResult.defenderSurvivors
                }
            };
            combatEvents.push(combatEvent);
        }
        // Process returning fleets
        for (const returningFleet of returning) {
            if (returningFleet.arrivalTurn <= this.gameState.turn) {
                // Fleet has returned home
                const homeFleet = this.gameState.player.fleet.homeSystem;
                homeFleet.frigates += returningFleet.composition.frigates;
                homeFleet.cruisers += returningFleet.composition.cruisers;
                homeFleet.battleships += returningFleet.composition.battleships;
            }
            else {
                // Fleet still returning
                this.gameState.player.fleet.inTransit.outbound.push(returningFleet);
            }
        }
        return combatEvents;
    }
    /**
     * Processes AI fleet movements and combat
     */
    processAIFleetMovements() {
        const combatEvents = [];
        const aiMovements = this.gameState.ai.fleet.inTransit.outbound;
        const { updated, combatMovements, returning } = processFleetMovements(aiMovements, this.gameState.turn);
        // Update AI movements
        this.gameState.ai.fleet.inTransit.outbound = updated;
        // Process combat movements
        for (const movement of combatMovements) {
            const combatResult = processCombatMovement(movement, this.gameState.player.fleet.homeSystem, this.gameState.turn);
            // Update player home fleet with combat results
            this.gameState.player.fleet.homeSystem = combatResult.updatedDefenderFleet;
            // Add returning fleet if any survivors
            if (combatResult.returningFleet) {
                this.gameState.ai.fleet.inTransit.outbound.push(combatResult.returningFleet);
            }
            // Mark player as having been attacked
            this.gameState.playerHasBeenAttacked = true;
            // Return operational costs for destroyed ships to both players
            this.returnOperationalCosts(this.gameState.ai, combatResult.combatResult.attackerCasualties);
            this.returnOperationalCosts(this.gameState.player, combatResult.combatResult.defenderCasualties);
            // Create combat event
            const combatEvent = {
                turn: this.gameState.turn,
                attacker: 'ai',
                attackerFleet: movement.composition,
                defenderFleet: this.gameState.player.fleet.homeSystem,
                outcome: combatResult.combatResult.outcome,
                casualties: {
                    attacker: combatResult.combatResult.attackerCasualties,
                    defender: combatResult.combatResult.defenderCasualties
                },
                survivors: {
                    attacker: combatResult.combatResult.attackerSurvivors,
                    defender: combatResult.combatResult.defenderSurvivors
                }
            };
            combatEvents.push(combatEvent);
        }
        // Process returning fleets
        for (const returningFleet of returning) {
            if (returningFleet.arrivalTurn <= this.gameState.turn) {
                // Fleet has returned home
                const homeFleet = this.gameState.ai.fleet.homeSystem;
                homeFleet.frigates += returningFleet.composition.frigates;
                homeFleet.cruisers += returningFleet.composition.cruisers;
                homeFleet.battleships += returningFleet.composition.battleships;
            }
            else {
                // Fleet still returning
                this.gameState.ai.fleet.inTransit.outbound.push(returningFleet);
            }
        }
        return combatEvents;
    }
    /**
     * Checks victory conditions and updates game state
     */
    checkVictoryConditions() {
        // Check for economic victory first (more definitive)
        const playerEconomicCollapse = this.isPlayerEconomicallyEliminated(this.gameState.player);
        const aiEconomicCollapse = this.isPlayerEconomicallyEliminated(this.gameState.ai);
        if (playerEconomicCollapse && !aiEconomicCollapse) {
            this.gameState.isGameOver = true;
            this.gameState.winner = 'ai';
            this.gameState.victoryType = 'economic';
            return { gameEnded: true, winner: 'ai', victoryType: 'economic' };
        }
        else if (aiEconomicCollapse && !playerEconomicCollapse) {
            this.gameState.isGameOver = true;
            this.gameState.winner = 'player';
            this.gameState.victoryType = 'economic';
            return { gameEnded: true, winner: 'player', victoryType: 'economic' };
        }
        else if (playerEconomicCollapse && aiEconomicCollapse) {
            // Both economies collapsed - AI wins by default
            this.gameState.isGameOver = true;
            this.gameState.winner = 'ai';
            this.gameState.victoryType = 'economic';
            return { gameEnded: true, winner: 'ai', victoryType: 'economic' };
        }
        // Check for military victory (only if no economic victory)
        const playerMilitaryEliminated = this.isPlayerMilitarilyEliminated(this.gameState.player);
        const aiMilitaryEliminated = this.isPlayerMilitarilyEliminated(this.gameState.ai);
        if (playerMilitaryEliminated && !aiMilitaryEliminated) {
            this.gameState.isGameOver = true;
            this.gameState.winner = 'ai';
            this.gameState.victoryType = 'military';
            return { gameEnded: true, winner: 'ai', victoryType: 'military' };
        }
        else if (aiMilitaryEliminated && !playerMilitaryEliminated) {
            this.gameState.isGameOver = true;
            this.gameState.winner = 'player';
            this.gameState.victoryType = 'military';
            return { gameEnded: true, winner: 'player', victoryType: 'military' };
        }
        else if (playerMilitaryEliminated && aiMilitaryEliminated) {
            // Both militarily eliminated - AI wins by default
            this.gameState.isGameOver = true;
            this.gameState.winner = 'ai';
            this.gameState.victoryType = 'military';
            return { gameEnded: true, winner: 'ai', victoryType: 'military' };
        }
        return { gameEnded: false };
    }
    /**
     * Determines if a player is economically eliminated
     * A player is economically eliminated if:
     * 1. Their economy is stalled (income <= 0)
     * 2. They have no resources left
     * 3. They cannot recover (no way to generate positive income)
     */
    isPlayerEconomicallyEliminated(player) {
        const isStalled = this.economyEngine.isEconomyStalled(player);
        const hasNoResources = player.resources.metal <= 0 && player.resources.energy <= 0;
        // Only consider economically eliminated if both stalled AND no resources
        return isStalled && hasNoResources;
    }
    /**
     * Determines if a player is militarily eliminated
     * A player is militarily eliminated if:
     * 1. They have no fleets (home or in transit)
     * 2. They have been attacked (victory condition requirement)
     */
    isPlayerMilitarilyEliminated(player) {
        // Check if player has any fleets
        const hasFleets = !checkFleetElimination(player.fleet.homeSystem, player.fleet.inTransit.outbound);
        if (hasFleets) {
            return false; // Has fleets, not eliminated
        }
        // No fleets - check if they have been attacked (new victory condition)
        const hasBeenAttacked = player === this.gameState.player ?
            (this.gameState.playerHasBeenAttacked || false) :
            (this.gameState.aiHasBeenAttacked || false);
        // Victory condition: 0 fleet AND has been attacked
        return hasBeenAttacked;
    }
    /**
     * Returns operational costs to player when ships are destroyed
     * This helps the economy recover from losses
     */
    returnOperationalCosts(player, casualties) {
        const upkeepCosts = calculateFleetUpkeep(casualties);
        // Return the upkeep costs to the player's resources
        player.resources.metal += upkeepCosts.metal;
        player.resources.energy += upkeepCosts.energy;
    }
    /**
     * Prepares for the next turn
     */
    prepareNextTurn() {
        this.gameState.turn += 1;
    }
    /**
     * Gets the current game state (read-only copy)
     */
    getGameState() {
        return { ...this.gameState };
    }
    /**
     * Gets the current turn number
     */
    getCurrentTurn() {
        return this.gameState.turn;
    }
    /**
     * Gets the current game phase
     */
    getGamePhase() {
        return this.gameState.gamePhase;
    }
    /**
     * Checks if the game is over
     */
    isGameOver() {
        return this.gameState.isGameOver;
    }
    /**
     * Gets the winner if the game is over
     */
    getWinner() {
        return this.gameState.winner;
    }
    /**
     * Gets the victory type if the game is over
     */
    getVictoryType() {
        return this.gameState.victoryType;
    }
    /**
     * Gets the combat log
     */
    getCombatLog() {
        return [...this.gameState.combatLog];
    }
    /**
     * Resets the game to initial state
     */
    resetGame(config = {}) {
        this.gameState = this.initializeGameState(config);
        this.aiEngine = new AIEngine(config.aiArchetype || 'hybrid');
    }
    /**
     * Validates the current game state for consistency
     */
    validateGameState() {
        const errors = [];
        // Validate turn number
        if (this.gameState.turn < 1) {
            errors.push('Turn number must be positive');
        }
        // Validate resources are not negative
        if (this.gameState.player.resources.metal < 0 || this.gameState.player.resources.energy < 0) {
            errors.push('Player resources cannot be negative');
        }
        if (this.gameState.ai.resources.metal < 0 || this.gameState.ai.resources.energy < 0) {
            errors.push('AI resources cannot be negative');
        }
        // Validate fleet compositions
        const playerFleet = this.gameState.player.fleet.homeSystem;
        const aiFleet = this.gameState.ai.fleet.homeSystem;
        if (playerFleet.frigates < 0 || playerFleet.cruisers < 0 || playerFleet.battleships < 0) {
            errors.push('Player fleet counts cannot be negative');
        }
        if (aiFleet.frigates < 0 || aiFleet.cruisers < 0 || aiFleet.battleships < 0) {
            errors.push('AI fleet counts cannot be negative');
        }
        // Validate game over state consistency
        if (this.gameState.isGameOver && !this.gameState.winner) {
            errors.push('Game is over but no winner is set');
        }
        if (this.gameState.winner && !this.gameState.isGameOver) {
            errors.push('Winner is set but game is not over');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Gets detailed game statistics
     */
    getGameStatistics() {
        const playerFleet = this.gameState.player.fleet.homeSystem;
        const aiFleet = this.gameState.ai.fleet.homeSystem;
        return {
            turn: this.gameState.turn,
            gamePhase: this.gameState.gamePhase,
            playerStats: {
                totalFleetSize: playerFleet.frigates + playerFleet.cruisers + playerFleet.battleships,
                netIncome: this.economyEngine.getNetIncome(this.gameState.player),
                economicStructures: this.gameState.player.economy.reactors + this.gameState.player.economy.mines
            },
            aiStats: {
                totalFleetSize: aiFleet.frigates + aiFleet.cruisers + aiFleet.battleships,
                netIncome: this.economyEngine.getNetIncome(this.gameState.ai),
                economicStructures: this.gameState.ai.economy.reactors + this.gameState.ai.economy.mines
            },
            combatEvents: this.gameState.combatLog.length
        };
    }
}
//# sourceMappingURL=GameEngine.js.map