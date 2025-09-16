import { GameState, FleetComposition, CombatEvent } from '../models/GameState.js';
import { PlayerState } from '../models/PlayerState.js';
import { TurnResult } from '../engine/GameEngine.js';
import { ColorManager } from './ColorManager.js';
import { TacticalAnalyzer } from './TacticalAnalyzer.js';
import { CLIConfig } from './CLIInterface.js';

export class GameDisplay {
  private config: CLIConfig;
  private colorManager: ColorManager;
  private tacticalAnalyzer: TacticalAnalyzer;

  constructor(config: CLIConfig = {}) {
    this.config = {
      // Set default combat display preferences
      combatDisplay: {
        showTacticalAnalysis: true,
        showBattlePhases: true,
        detailedCasualties: true,
        useEnhancedFormatting: true,
        ...config.combatDisplay
      },
      ...config
    };
    this.colorManager = new ColorManager(config.useColors !== false);
    this.tacticalAnalyzer = new TacticalAnalyzer();
  }

  /**
   * Displays the main game state information
   */
  public displayGameState(gameState: GameState): void {
    console.log('\n' + '='.repeat(60));
    console.log(`TURN ${gameState.turn} | PHASE: ${gameState.gamePhase.toUpperCase()}`);
    console.log('='.repeat(60));

    // Display player resources and income
    this.displayPlayerResources(gameState.player);
    
    // Display fleet information
    this.displayFleetStatus(gameState.player);
    
    // Display construction queue
    this.displayConstructionQueue(gameState.player);
    
    // Display intelligence information
    this.displayIntelligence(gameState.player);
    
    console.log('-'.repeat(60));
  }

  /**
   * Displays player resources and income
   */
  private displayPlayerResources(player: PlayerState): void {
    const resources = player.resources;
    const netMetal = resources.metalIncome;
    const netEnergy = resources.energyIncome;
    
    console.log('\nRESOURCES:');
    console.log(`Metal:  ${this.formatNumber(resources.metal)} (${this.formatIncome(netMetal)}/turn)`);
    console.log(`Energy: ${this.formatNumber(resources.energy)} (${this.formatIncome(netEnergy)}/turn)`);
    
    // Warn about economic stall
    if (netMetal <= 0 || netEnergy <= 0) {
      console.log('⚠️  WARNING: Economy stalled! Income is zero or negative.');
    }
  }

  /**
   * Displays fleet status including home and in-transit fleets
   */
  private displayFleetStatus(player: PlayerState): void {
    const homeFleet = player.fleet.homeSystem;
    const totalHome = homeFleet.frigates + homeFleet.cruisers + homeFleet.battleships;
    
    console.log('\nFLEET STATUS:');
    console.log(`Home Fleet (${totalHome} ships):`);
    console.log(`  Frigates:    ${this.formatNumber(homeFleet.frigates)}`);
    console.log(`  Cruisers:    ${this.formatNumber(homeFleet.cruisers)}`);
    console.log(`  Battleships: ${this.formatNumber(homeFleet.battleships)}`);
    
    // Display in-transit fleets
    const inTransit = player.fleet.inTransit.outbound;
    if (inTransit.length > 0) {
      console.log('\nFLEETS IN TRANSIT:');
      inTransit.forEach((movement, index) => {
        const totalShips = movement.composition.frigates + movement.composition.cruisers + movement.composition.battleships;
        const status = this.getFleetMovementStatus(movement);
        console.log(`  Fleet ${index + 1}: ${totalShips} ships - ${status}`);
      });
    }
  }

  /**
   * Displays construction queue
   */
  private displayConstructionQueue(player: PlayerState): void {
    const queue = player.economy.constructionQueue;
    
    if (queue.length > 0) {
      console.log('\nCONSTRUCTION QUEUE:');
      queue.forEach((order, index) => {
        const progress = this.getConstructionProgress(order);
        console.log(`  ${index + 1}. ${order.quantity}x ${order.unitType} - ${progress}`);
      });
    }
    
    // Display economic structures
    const structures = player.economy;
    if (structures.reactors > 0 || structures.mines > 0) {
      console.log('\nECONOMIC STRUCTURES:');
      if (structures.reactors > 0) {
        console.log(`  Reactors: ${structures.reactors} (+${structures.reactors * 500} Energy/turn)`);
      }
      if (structures.mines > 0) {
        console.log(`  Mines: ${structures.mines} (+${structures.mines * 500} Metal/turn)`);
      }
    }
  }

  /**
   * Displays intelligence information
   */
  private displayIntelligence(player: PlayerState): void {
    const intel = player.intelligence;
    
    if (intel.lastScanTurn > 0) {
      const turnsAgo = Math.max(0, intel.lastScanTurn);
      console.log('\nINTELLIGENCE:');
      console.log(`Last scan: ${turnsAgo === 0 ? 'This turn' : `${turnsAgo} turns ago`}`);
      
      const knownFleet = intel.knownEnemyFleet;
      const totalKnown = knownFleet.frigates + knownFleet.cruisers + knownFleet.battleships;
      
      if (totalKnown > 0) {
        console.log(`Known enemy fleet (~${this.formatNumber(totalKnown)} ships):`);
        console.log(`  Frigates:    ~${this.formatNumber(knownFleet.frigates)}`);
        console.log(`  Cruisers:    ~${this.formatNumber(knownFleet.cruisers)}`);
        console.log(`  Battleships: ~${this.formatNumber(knownFleet.battleships)}`);
        
        if (turnsAgo > 2) {
          console.log('⚠️  Intelligence data may be outdated');
        }
      }
    } else {
      console.log('\nINTELLIGENCE: No enemy scans performed');
    }
  }

  /**
   * Displays detailed game status
   */
  public displayDetailedStatus(gameState: GameState, stats: any): void {
    console.log('\n' + '='.repeat(60));
    console.log('DETAILED GAME STATUS');
    console.log('='.repeat(60));
    
    // Game information
    console.log(`Turn: ${gameState.turn}`);
    console.log(`Phase: ${gameState.gamePhase}`);
    console.log(`Combat Events: ${stats.combatEvents}`);
    
    // Player vs AI comparison
    console.log('\nPLAYER vs AI COMPARISON:');
    console.log('                    Player      AI');
    console.log(`Fleet Size:         ${this.padNumber(stats.playerStats.totalFleetSize)}      ${stats.aiStats.totalFleetSize}`);
    console.log(`Metal Income:       ${this.padNumber(stats.playerStats.netIncome.metal)}      ${stats.aiStats.netIncome.metal}`);
    console.log(`Energy Income:      ${this.padNumber(stats.playerStats.netIncome.energy)}      ${stats.aiStats.netIncome.energy}`);
    console.log(`Structures:         ${this.padNumber(stats.playerStats.economicStructures)}      ${stats.aiStats.economicStructures}`);
    
    // Recent combat log
    if (gameState.combatLog.length > 0) {
      console.log('\nRECENT COMBAT:');
      const recentCombat = gameState.combatLog.slice(-3); // Last 3 combat events
      recentCombat.forEach((event, index) => {
        console.log(`  Turn ${event.turn}: ${event.attacker.toUpperCase()} attacked - ${event.outcome}`);
      });
    }
  }

  /**
   * Displays help information
   */
  public displayHelp(): void {
    console.log('\n' + '='.repeat(60));
    console.log('AVAILABLE COMMANDS');
    console.log('='.repeat(60));
    
    console.log('\nBUILD COMMANDS:');
    console.log('  build <quantity> <unit>     - Build units (frigate, cruiser, battleship)');
    console.log('  build <quantity> <structure> - Build structures (reactor, mine)');
    console.log('  Examples: "build 10 frigate", "build 1 reactor"');
    
    console.log('\nATTACK COMMANDS:');
    console.log('  attack <frigates> <cruisers> <battleships> - Launch attack');
    console.log('  Example: "attack 50 20 10" (sends 50 frigates, 20 cruisers, 10 battleships)');
    
    console.log('\nSCAN COMMANDS:');
    console.log('  scan basic    - Basic scan (1,000 Energy) - Total fleet count');
    console.log('  scan deep     - Deep scan (2,500 Energy) - Unit composition + economy');
    console.log('  scan advanced - Advanced scan (4,000 Energy) - Strategic intent');
    
    console.log('\nGAME COMMANDS:');
    console.log('  status        - Show detailed game status');
    console.log('  help          - Show this help message');
    console.log('  end           - End current turn');
    console.log('  quit          - Quit the game');
    
    console.log('\nUNIT EFFECTIVENESS (Rock-Paper-Scissors):');
    console.log('  Frigates > Cruisers > Battleships > Frigates');
    console.log('  Build time: Frigate (1 turn), Cruiser (2 turns), Battleship (4 turns)');
    
    console.log('\nECONOMIC STRUCTURES:');
    console.log('  Reactor: +500 Energy/turn (Cost: 900 Metal, 1,200 Energy)');
    console.log('  Mine: +500 Metal/turn (Cost: 1,500 Metal, 600 Energy)');
  }

  /**
   * Displays turn result including combat events with enhanced formatting
   */
  public displayTurnResult(turnResult: TurnResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('TURN RESULT');
    console.log('='.repeat(60));
    
    // Display errors first if any
    if (turnResult.errors.length > 0) {
      console.log('\nERRORS:');
      turnResult.errors.forEach(error => {
        console.log(`❌ ${error}`);
      });
    }
    
    // Display combat events before other turn summary information (Requirement 4.2)
    if (turnResult.combatEvents && turnResult.combatEvents.length > 0) {
      console.log('\nCOMBAT EVENTS:');
      
      // Display all combat events that occurred during the turn (Requirement 4.1)
      turnResult.combatEvents.forEach((event, index) => {
        try {
          if (index > 0) {
            // Add separator between multiple combat events
            console.log(this.colorManager.createSeparator(60, '='));
          }
          
          // Use enhanced combat display if configured
          if (this.config.combatDisplay?.useEnhancedFormatting !== false) {
            this.displayCombatEvent(event);
          } else {
            this.displayBasicCombatEvent(event);
          }
        } catch (error) {
          console.log(`\n⚠️  Error displaying combat event ${index + 1}:`);
          console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.log('   Skipping to next event...\n');
        }
      });
    } else {
      // Display "No combat this turn" message (Requirement 4.3)
      try {
        const noCombatMessage = this.colorManager.colorize('No combat this turn.', 'neutral');
        console.log(`\n${noCombatMessage}`);
      } catch (error) {
        console.log('\nNo combat this turn.');
      }
    }
    
    // Display other turn summary information after combat events
    this.displayTurnSummary(turnResult);
    
    // Display game over information if applicable
    if (turnResult.gameEnded) {
      console.log(`\n🎯 GAME OVER! Winner: ${turnResult.winner?.toUpperCase()}`);
      console.log(`Victory Type: ${turnResult.victoryType?.toUpperCase()}`);
    }
    
    console.log('\nPress Enter to continue...');
  }

  /**
   * Displays basic combat event information without enhanced formatting
   */
  private displayBasicCombatEvent(event: CombatEvent): void {
    try {
      // Validate basic event structure
      if (!event || typeof event !== 'object') {
        throw new Error('Invalid combat event data');
      }

      const attackerName = event.attacker === 'player' ? 'YOUR' : 'ENEMY';
      const defenderName = event.attacker === 'player' ? 'ENEMY' : 'YOUR';
      
      console.log(`\n${attackerName} FLEET ATTACKS ${defenderName} SYSTEM:`);
      
      // Basic fleet composition display with error handling
      const attackerTotal = this.calculateFleetTotal(event.attackerFleet);
      const defenderTotal = this.calculateFleetTotal(event.defenderFleet);
      
      console.log(`  Attacker: ${attackerTotal} ships`);
      console.log(`  Defender: ${defenderTotal} ships`);
      
      // Basic outcome display
      const outcome = typeof event.outcome === 'string' ? event.outcome : 'unknown';
      console.log(`  Result: ${this.formatBattleOutcome(outcome)}`);
      
      // Basic casualty information with error handling
      const attackerCasualties = this.calculateFleetTotal(event.casualties?.attacker);
      const defenderCasualties = this.calculateFleetTotal(event.casualties?.defender);
      
      if (attackerCasualties > 0 || defenderCasualties > 0) {
        console.log(`  Casualties: ${attackerName} lost ${attackerCasualties}, ${defenderName} lost ${defenderCasualties}`);
      }
      
      // Basic survivor information with error handling
      const attackerSurvivors = this.calculateFleetTotal(event.survivors?.attacker);
      const defenderSurvivors = this.calculateFleetTotal(event.survivors?.defender);
      
      if (attackerSurvivors > 0) {
        console.log(`  ${attackerName} survivors: ${attackerSurvivors} ships returning home`);
      }
      if (defenderSurvivors > 0) {
        console.log(`  ${defenderName} survivors: ${defenderSurvivors} ships remain in system`);
      }
    } catch (error) {
      console.log('\n⚠️  Error in basic combat display, using fallback:');
      console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      this.displayBasicCombatEventFallback(event);
    }
  }

  /**
   * Displays turn summary information
   */
  private displayTurnSummary(turnResult: TurnResult): void {
    try {
      // Validate turn result and combat events
      if (!turnResult || !Array.isArray(turnResult.combatEvents)) {
        console.log('\nTurn Summary: No valid combat data available');
        return;
      }

      // Display summary of turn events
      const eventCount = turnResult.combatEvents.length;
      if (eventCount > 0) {
        console.log(`\nTurn Summary: ${eventCount} combat engagement(s) resolved`);
        
        // Count victories and defeats with error handling
        let playerVictories = 0;
        let playerDefeats = 0;
        
        turnResult.combatEvents.forEach((event, index) => {
          try {
            if (!event || typeof event !== 'object') {
              console.warn(`  Warning: Invalid combat event ${index + 1} in summary`);
              return;
            }

            const attacker = event.attacker;
            const outcome = typeof event.outcome === 'string' ? event.outcome : '';
            
            const playerWon = (attacker === 'player' && (outcome === 'decisive_attacker' || outcome.includes('attacker'))) ||
                             (attacker !== 'player' && (outcome === 'decisive_defender' || outcome.includes('defender')));
            
            if (playerWon) {
              playerVictories++;
            } else if (outcome !== 'close_battle' && outcome !== '') {
              playerDefeats++;
            }
          } catch (error) {
            console.warn(`  Warning: Error processing combat event ${index + 1} in summary:`, error instanceof Error ? error.message : 'Unknown error');
          }
        });
        
        // Display victory/defeat counts with error handling
        try {
          if (playerVictories > 0) {
            console.log(`  Player victories: ${this.colorManager.colorize(playerVictories.toString(), 'victory')}`);
          }
          if (playerDefeats > 0) {
            console.log(`  Player defeats: ${this.colorManager.colorize(playerDefeats.toString(), 'defeat')}`);
          }
          
          const closeBattles = eventCount - playerVictories - playerDefeats;
          if (closeBattles > 0) {
            console.log(`  Close battles: ${this.colorManager.colorize(closeBattles.toString(), 'neutral')}`);
          }
        } catch (error) {
          console.log(`  Player victories: ${playerVictories}`);
          console.log(`  Player defeats: ${playerDefeats}`);
          console.log(`  Close battles: ${eventCount - playerVictories - playerDefeats}`);
        }
      }
    } catch (error) {
      console.log('\nTurn Summary: Error generating summary -', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Validates combat event data before display
   */
  private validateCombatEvent(event: CombatEvent): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate basic event structure
    if (!event || typeof event !== 'object') {
      errors.push('Combat event is null or not an object');
      return { isValid: false, errors };
    }

    // Validate required fields
    if (typeof event.turn !== 'number' || event.turn < 1) {
      errors.push('Invalid turn number');
    }

    if (event.attacker !== 'player' && event.attacker !== 'ai') {
      errors.push('Invalid attacker type');
    }

    if (!event.outcome || typeof event.outcome !== 'string') {
      errors.push('Missing or invalid battle outcome');
    }

    // Validate fleet compositions
    const attackerFleetValidation = this.validateFleetComposition(event.attackerFleet, 'attacker fleet');
    const defenderFleetValidation = this.validateFleetComposition(event.defenderFleet, 'defender fleet');
    
    errors.push(...attackerFleetValidation.errors);
    errors.push(...defenderFleetValidation.errors);

    // Validate casualties
    const attackerCasualtiesValidation = this.validateFleetComposition(event.casualties?.attacker, 'attacker casualties');
    const defenderCasualtiesValidation = this.validateFleetComposition(event.casualties?.defender, 'defender casualties');
    
    errors.push(...attackerCasualtiesValidation.errors);
    errors.push(...defenderCasualtiesValidation.errors);

    // Validate survivors
    const attackerSurvivorsValidation = this.validateFleetComposition(event.survivors?.attacker, 'attacker survivors');
    const defenderSurvivorsValidation = this.validateFleetComposition(event.survivors?.defender, 'defender survivors');
    
    errors.push(...attackerSurvivorsValidation.errors);
    errors.push(...defenderSurvivorsValidation.errors);

    // Validate mathematical consistency (original = casualties + survivors)
    if (errors.length === 0) {
      const attackerOriginalTotal = (event.attackerFleet?.frigates || 0) + (event.attackerFleet?.cruisers || 0) + (event.attackerFleet?.battleships || 0);
      const attackerCasualtiesTotal = (event.casualties?.attacker?.frigates || 0) + (event.casualties?.attacker?.cruisers || 0) + (event.casualties?.attacker?.battleships || 0);
      const attackerSurvivorsTotal = (event.survivors?.attacker?.frigates || 0) + (event.survivors?.attacker?.cruisers || 0) + (event.survivors?.attacker?.battleships || 0);
      
      if (attackerOriginalTotal !== attackerCasualtiesTotal + attackerSurvivorsTotal) {
        errors.push(`Attacker fleet math inconsistency: ${attackerOriginalTotal} original ≠ ${attackerCasualtiesTotal} casualties + ${attackerSurvivorsTotal} survivors`);
      }

      const defenderOriginalTotal = (event.defenderFleet?.frigates || 0) + (event.defenderFleet?.cruisers || 0) + (event.defenderFleet?.battleships || 0);
      const defenderCasualtiesTotal = (event.casualties?.defender?.frigates || 0) + (event.casualties?.defender?.cruisers || 0) + (event.casualties?.defender?.battleships || 0);
      const defenderSurvivorsTotal = (event.survivors?.defender?.frigates || 0) + (event.survivors?.defender?.cruisers || 0) + (event.survivors?.defender?.battleships || 0);
      
      if (defenderOriginalTotal !== defenderCasualtiesTotal + defenderSurvivorsTotal) {
        errors.push(`Defender fleet math inconsistency: ${defenderOriginalTotal} original ≠ ${defenderCasualtiesTotal} casualties + ${defenderSurvivorsTotal} survivors`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates fleet composition data
   */
  private validateFleetComposition(fleet: FleetComposition | undefined, context: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!fleet) {
      errors.push(`Missing ${context} data`);
      return { isValid: false, errors };
    }

    if (typeof fleet !== 'object') {
      errors.push(`Invalid ${context} data type`);
      return { isValid: false, errors };
    }

    // Validate individual ship counts
    const shipTypes = ['frigates', 'cruisers', 'battleships'] as const;
    
    for (const shipType of shipTypes) {
      const count = fleet[shipType];
      if (typeof count !== 'number' || isNaN(count) || !isFinite(count) || count < 0) {
        errors.push(`Invalid ${shipType} count in ${context}: ${count}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Creates a safe fallback combat event for display when validation fails
   */
  private createFallbackCombatEvent(originalEvent: any): CombatEvent {
    return {
      turn: typeof originalEvent?.turn === 'number' ? originalEvent.turn : 0,
      attacker: originalEvent?.attacker === 'player' || originalEvent?.attacker === 'ai' ? originalEvent.attacker : 'ai',
      attackerFleet: this.createSafeFleetComposition(originalEvent?.attackerFleet),
      defenderFleet: this.createSafeFleetComposition(originalEvent?.defenderFleet),
      outcome: typeof originalEvent?.outcome === 'string' ? originalEvent.outcome : 'unknown_outcome',
      casualties: {
        attacker: this.createSafeFleetComposition(originalEvent?.casualties?.attacker),
        defender: this.createSafeFleetComposition(originalEvent?.casualties?.defender)
      },
      survivors: {
        attacker: this.createSafeFleetComposition(originalEvent?.survivors?.attacker),
        defender: this.createSafeFleetComposition(originalEvent?.survivors?.defender)
      }
    };
  }

  /**
   * Creates a safe fleet composition with validated values
   */
  private createSafeFleetComposition(fleet: any): FleetComposition {
    return {
      frigates: this.validateShipCount(fleet?.frigates),
      cruisers: this.validateShipCount(fleet?.cruisers),
      battleships: this.validateShipCount(fleet?.battleships)
    };
  }

  /**
   * Validates and sanitizes ship count values
   */
  private validateShipCount(count: any): number {
    if (typeof count === 'number' && isFinite(count) && count >= 0) {
      return Math.floor(count);
    }
    return 0;
  }

  /**
   * Displays a single combat event with enhanced formatting and tactical analysis
   */
  private displayCombatEvent(event: CombatEvent): void {
    // Validate combat event data before display
    const validation = this.validateCombatEvent(event);
    
    if (!validation.isValid) {
      console.log('\n⚠️  Combat Event Display Error:');
      validation.errors.forEach(error => {
        console.log(`   ${error}`);
      });
      
      // Attempt to display with fallback data
      console.log('   Attempting to display with corrected data...\n');
      
      try {
        const fallbackEvent = this.createFallbackCombatEvent(event);
        const fallbackValidation = this.validateCombatEvent(fallbackEvent);
        
        if (fallbackValidation.isValid) {
          event = fallbackEvent;
        } else {
          console.log('   Unable to create valid fallback data. Displaying basic combat summary.\n');
          this.displayBasicCombatEventFallback(event);
          return;
        }
      } catch (error) {
        console.log('   Critical error in combat display. Skipping event.\n');
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        return;
      }
    }

    try {
      const attackerName = event.attacker === 'player' ? 'YOUR' : 'ENEMY';
      const defenderName = event.attacker === 'player' ? 'ENEMY' : 'YOUR';
      const attackerType = event.attacker === 'player' ? 'player' : 'ai';
      const defenderType = event.attacker === 'player' ? 'ai' : 'player';
      
      // Create enhanced combat display with tactical analysis
      const enhancedDisplay = this.tacticalAnalyzer.createEnhancedCombatDisplay(event);
    
    // Display battle header with colors
    const attackerHeader = this.colorManager.formatPlayerIdentifier(attackerType, attackerName);
    const defenderHeader = this.colorManager.formatPlayerIdentifier(defenderType, defenderName);
    console.log(`\n${attackerHeader} FLEET ATTACKS ${defenderHeader} SYSTEM:`);
    
    // Display detailed fleet compositions with color coding
    this.displayDetailedFleetComposition('Attacker', event.attackerFleet, attackerType);
    this.displayDetailedFleetComposition('Defender', event.defenderFleet, defenderType);
    
    // Display tactical analysis if configured and available
    if (this.config.combatDisplay?.showTacticalAnalysis !== false && enhancedDisplay.tacticalAdvantages.length > 0) {
      console.log('\n  Tactical Analysis:');
      enhancedDisplay.tacticalAdvantages.forEach(advantage => {
        const advantageColor = advantage.advantage === 'strong' ? 'victory' : 
                              advantage.advantage === 'weak' ? 'defeat' : 'neutral';
        const advantageText = this.colorManager.colorize(
          `${advantage.advantage.toUpperCase()}`, 
          advantageColor
        );
        console.log(`    ${advantage.unitType.charAt(0).toUpperCase() + advantage.unitType.slice(1)}s: ${advantageText} (${advantage.effectivenessRatio.toFixed(1)}x effectiveness)`);
      });
    }

    // Display battle phase progression if configured and available
    if (this.config.combatDisplay?.showBattlePhases !== false && enhancedDisplay.battlePhases.length > 0) {
      console.log('\n  Battle Progression:');
      enhancedDisplay.battlePhases.forEach((phase, index) => {
        this.displayBattlePhase(phase, index + 1);
      });
    }
    
    // Display battle outcome with enhanced formatting
    const perspective = event.attacker === 'player' ? 'attacker' : 'defender';
    const outcomeText = this.colorManager.formatBattleOutcome(event.outcome, perspective);
    console.log(`\n  Battle Result: ${outcomeText}`);
    
    // Add battle explanation based on outcome
    this.displayBattleExplanation(event.outcome, enhancedDisplay.effectivenessRatios);
    
    // Display casualty information (enhanced or basic based on configuration)
    if (this.config.combatDisplay?.detailedCasualties !== false) {
      this.displayEnhancedCasualties(event, enhancedDisplay.casualtyPercentages, attackerName, defenderName);
    } else {
      this.displayBasicCasualties(event, attackerName, defenderName);
    }
    
    // Display survivors with enhanced formatting
    this.displayEnhancedSurvivors(event, attackerName, defenderName, attackerType, defenderType);
    
      // Add visual separator
      console.log(this.colorManager.createSeparator(50, '·'));
    } catch (error) {
      console.log('⚠️  Error during enhanced combat display, falling back to basic display:');
      console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      
      try {
        this.displayBasicCombatEvent(event);
      } catch (fallbackError) {
        console.log('⚠️  Critical error in combat display fallback:');
        console.log(`   ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}\n`);
        this.displayBasicCombatEventFallback(event);
      }
    }
  }

  /**
   * Displays minimal combat information when all other display methods fail
   */
  private displayBasicCombatEventFallback(event: any): void {
    try {
      console.log('\n--- COMBAT EVENT (BASIC DISPLAY) ---');
      
      const turn = typeof event?.turn === 'number' ? event.turn : 'Unknown';
      const attacker = event?.attacker === 'player' ? 'Player' : 
                     event?.attacker === 'ai' ? 'AI' : 'Unknown';
      const outcome = typeof event?.outcome === 'string' ? event.outcome : 'Unknown';
      
      console.log(`Turn: ${turn}`);
      console.log(`Attacker: ${attacker}`);
      console.log(`Outcome: ${outcome}`);
      
      // Try to display basic fleet information if available
      if (event?.attackerFleet) {
        const attackerTotal = this.calculateFleetTotal(event.attackerFleet);
        console.log(`Attacker Fleet: ${attackerTotal} ships`);
      }
      
      if (event?.defenderFleet) {
        const defenderTotal = this.calculateFleetTotal(event.defenderFleet);
        console.log(`Defender Fleet: ${defenderTotal} ships`);
      }
      
      console.log('--- END COMBAT EVENT ---\n');
    } catch (error) {
      console.log('\n--- COMBAT EVENT DATA CORRUPTED ---');
      console.log('Unable to display combat information due to data corruption.');
      console.log('--- END COMBAT EVENT ---\n');
    }
  }

  /**
   * Safely calculates total fleet size with error handling
   */
  private calculateFleetTotal(fleet: any): number {
    try {
      if (!fleet || typeof fleet !== 'object') {
        return 0;
      }
      
      const frigates = typeof fleet.frigates === 'number' && isFinite(fleet.frigates) ? Math.max(0, fleet.frigates) : 0;
      const cruisers = typeof fleet.cruisers === 'number' && isFinite(fleet.cruisers) ? Math.max(0, fleet.cruisers) : 0;
      const battleships = typeof fleet.battleships === 'number' && isFinite(fleet.battleships) ? Math.max(0, fleet.battleships) : 0;
      
      return Math.floor(frigates + cruisers + battleships);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Safely formats battle outcome with error handling
   */
  private formatBattleOutcome(outcome: string): string {
    try {
      if (typeof outcome !== 'string') {
        return 'UNKNOWN OUTCOME';
      }
      return outcome.toUpperCase().replace(/_/g, ' ');
    } catch (error) {
      return 'UNKNOWN OUTCOME';
    }
  }

  /**
   * Displays detailed fleet composition with color coding
   */
  private displayDetailedFleetComposition(
    label: string, 
    fleet: FleetComposition, 
    playerType: 'player' | 'ai'
  ): void {
    const total = fleet.frigates + fleet.cruisers + fleet.battleships;
    const coloredLabel = this.colorManager.formatPlayerIdentifier(playerType, label);
    const coloredComposition = this.colorManager.formatFleetComposition(fleet);
    
    console.log(`  ${coloredLabel}: ${total} ships (${coloredComposition})`);
  }

  /**
   * Displays a single battle phase with appropriate formatting and colors
   */
  private displayBattlePhase(phase: import('./TacticalAnalyzer.js').BattlePhase, phaseNumber: number): void {
    // Create phase header with visual separator
    const phaseHeader = `Phase ${phaseNumber}: ${phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1)}`;
    const phaseSeparator = this.colorManager.createSeparator(30, '·');
    
    console.log(`    ${phaseSeparator}`);
    console.log(`    ${this.colorManager.colorize(phaseHeader, 'neutral')}`);
    
    // Display phase description
    console.log(`    ${phase.description}`);
    
    // Display phase advantage with appropriate coloring
    const advantageText = this.formatPhaseAdvantage(phase.advantage);
    console.log(`    Advantage: ${advantageText}`);
    
    // Display strength ratio if meaningful
    if (phase.strengthRatio !== Infinity && phase.strengthRatio > 0) {
      const ratioText = this.formatStrengthRatio(phase.strengthRatio);
      console.log(`    Force Ratio: ${ratioText}`);
    }
  }

  /**
   * Formats phase advantage with appropriate colors
   */
  private formatPhaseAdvantage(advantage: 'attacker' | 'defender' | 'neutral'): string {
    let colorType: keyof import('./ColorManager.js').ColorTheme;
    let displayText: string;
    
    switch (advantage) {
      case 'attacker':
        colorType = 'player'; // Use player color for attacker advantage
        displayText = 'ATTACKER';
        break;
      case 'defender':
        colorType = 'enemy'; // Use enemy color for defender advantage
        displayText = 'DEFENDER';
        break;
      case 'neutral':
        colorType = 'neutral';
        displayText = 'BALANCED';
        break;
    }
    
    return this.colorManager.colorize(displayText, colorType);
  }

  /**
   * Formats strength ratio with contextual information
   */
  private formatStrengthRatio(ratio: number): string {
    let ratioText: string;
    let colorType: keyof import('./ColorManager.js').ColorTheme;
    
    if (ratio >= 2.0) {
      ratioText = `${ratio.toFixed(1)}:1 (Overwhelming Attacker)`;
      colorType = 'victory';
    } else if (ratio >= 1.5) {
      ratioText = `${ratio.toFixed(1)}:1 (Strong Attacker)`;
      colorType = 'victory';
    } else if (ratio >= 1.2) {
      ratioText = `${ratio.toFixed(1)}:1 (Slight Attacker)`;
      colorType = 'neutral';
    } else if (ratio >= 0.8) {
      ratioText = `${ratio.toFixed(1)}:1 (Balanced)`;
      colorType = 'neutral';
    } else if (ratio >= 0.5) {
      ratioText = `${ratio.toFixed(1)}:1 (Slight Defender)`;
      colorType = 'neutral';
    } else {
      ratioText = `${ratio.toFixed(1)}:1 (Strong Defender)`;
      colorType = 'defeat';
    }
    
    return this.colorManager.colorize(ratioText, colorType);
  }

  /**
   * Displays battle explanation based on outcome and effectiveness ratios
   */
  private displayBattleExplanation(
    outcome: string, 
    effectivenessRatios: { attackerEffectiveness: number; defenderEffectiveness: number }
  ): void {
    let explanation: string;
    
    switch (outcome) {
      case 'decisive_attacker':
        if (effectivenessRatios.attackerEffectiveness > 1.5) {
          explanation = 'Attacker achieved overwhelming tactical superiority';
        } else {
          explanation = 'Attacker overwhelmed defender through superior numbers';
        }
        break;
      case 'decisive_defender':
        if (effectivenessRatios.defenderEffectiveness > 1.5) {
          explanation = 'Defender exploited tactical advantages for decisive victory';
        } else {
          explanation = 'Defender successfully repelled attack with superior positioning';
        }
        break;
      case 'close_battle':
        explanation = 'Evenly matched forces resulted in heavy casualties on both sides';
        break;
      default:
        explanation = 'Battle concluded with significant losses';
    }
    
    console.log(`    ${explanation}`);
  }

  /**
   * Displays basic casualty information without detailed analysis
   */
  private displayBasicCasualties(
    event: CombatEvent,
    attackerName: string,
    defenderName: string
  ): void {
    const attackerCasualties = event.casualties.attacker.frigates + event.casualties.attacker.cruisers + event.casualties.attacker.battleships;
    const defenderCasualties = event.casualties.defender.frigates + event.casualties.defender.cruisers + event.casualties.defender.battleships;
    
    if (attackerCasualties > 0 || defenderCasualties > 0) {
      console.log('\n  Casualties:');
      if (attackerCasualties > 0) {
        console.log(`    ${attackerName}: ${attackerCasualties} ships lost`);
      }
      if (defenderCasualties > 0) {
        console.log(`    ${defenderName}: ${defenderCasualties} ships lost`);
      }
    }
  }

  /**
   * Displays enhanced casualty information with percentages and color coding
   */
  private displayEnhancedCasualties(
    event: CombatEvent,
    casualtyPercentages: { attackerLossRate: number; defenderLossRate: number },
    attackerName: string,
    defenderName: string
  ): void {
    const attackerTotal = event.attackerFleet.frigates + event.attackerFleet.cruisers + event.attackerFleet.battleships;
    const defenderTotal = event.defenderFleet.frigates + event.defenderFleet.cruisers + event.defenderFleet.battleships;
    
    const attackerCasualties = event.casualties.attacker.frigates + event.casualties.attacker.cruisers + event.casualties.attacker.battleships;
    const defenderCasualties = event.casualties.defender.frigates + event.casualties.defender.cruisers + event.casualties.defender.battleships;
    
    console.log('\n  Casualties:');
    
    // Attacker casualties with enhanced percentage display
    const attackerPercentage = Math.round(casualtyPercentages.attackerLossRate * 100);
    const attackerCasualtyText = this.colorManager.formatCasualties(attackerCasualties, attackerTotal);
    const attackerSeverity = this.getCasualtySeverity(casualtyPercentages.attackerLossRate);
    const attackerSeverityText = this.colorManager.colorize(`[${attackerSeverity}]`, this.getCasualtySeverityColor(casualtyPercentages.attackerLossRate));
    console.log(`    ${attackerName}: ${attackerCasualtyText} ${attackerSeverityText}`);
    
    // Defender casualties with enhanced percentage display
    const defenderPercentage = Math.round(casualtyPercentages.defenderLossRate * 100);
    const defenderCasualtyText = this.colorManager.formatCasualties(defenderCasualties, defenderTotal);
    const defenderSeverity = this.getCasualtySeverity(casualtyPercentages.defenderLossRate);
    const defenderSeverityText = this.colorManager.colorize(`[${defenderSeverity}]`, this.getCasualtySeverityColor(casualtyPercentages.defenderLossRate));
    console.log(`    ${defenderName}: ${defenderCasualtyText} ${defenderSeverityText}`);
    
    // Show detailed breakdown with tactical context
    if (attackerCasualties > 0) {
      const attackerBreakdown = this.formatCasualtyBreakdown(event.casualties.attacker);
      if (attackerBreakdown) {
        console.log(`      Breakdown: ${attackerBreakdown}`);
        
        // Add tactical context for heavy losses
        if (casualtyPercentages.attackerLossRate > 0.6) {
          const tacticalContext = this.getCasualtyTacticalContext(event.casualties.attacker, event.attackerFleet);
          if (tacticalContext) {
            console.log(`      ${this.colorManager.colorize('Impact:', 'neutral')} ${tacticalContext}`);
          }
        }
      }
    }
    
    if (defenderCasualties > 0) {
      const defenderBreakdown = this.formatCasualtyBreakdown(event.casualties.defender);
      if (defenderBreakdown) {
        console.log(`      Breakdown: ${defenderBreakdown}`);
        
        // Add tactical context for heavy losses
        if (casualtyPercentages.defenderLossRate > 0.6) {
          const tacticalContext = this.getCasualtyTacticalContext(event.casualties.defender, event.defenderFleet);
          if (tacticalContext) {
            console.log(`      ${this.colorManager.colorize('Impact:', 'neutral')} ${tacticalContext}`);
          }
        }
      }
    }
    
    // Show comparative loss analysis
    if (attackerCasualties > 0 || defenderCasualties > 0) {
      this.displayComparativeLossAnalysis(casualtyPercentages, attackerName, defenderName);
    }
  }

  /**
   * Displays enhanced survivor information with tactical context and color coding
   */
  private displayEnhancedSurvivors(
    event: CombatEvent,
    attackerName: string,
    defenderName: string,
    attackerType: 'player' | 'ai',
    defenderType: 'player' | 'ai'
  ): void {
    const attackerSurvivors = event.survivors.attacker.frigates + event.survivors.attacker.cruisers + event.survivors.attacker.battleships;
    const defenderSurvivors = event.survivors.defender.frigates + event.survivors.defender.cruisers + event.survivors.defender.battleships;
    const attackerOriginal = event.attackerFleet.frigates + event.attackerFleet.cruisers + event.attackerFleet.battleships;
    const defenderOriginal = event.defenderFleet.frigates + event.defenderFleet.cruisers + event.defenderFleet.battleships;
    
    if (attackerSurvivors > 0 || defenderSurvivors > 0) {
      console.log('\n  Survivors:');
      
      if (attackerSurvivors > 0) {
        const survivorText = this.colorManager.formatSurvivors(attackerSurvivors);
        const playerLabel = this.colorManager.formatPlayerIdentifier(attackerType, attackerName);
        const survivalRate = Math.round((attackerSurvivors / attackerOriginal) * 100);
        const survivalRateText = this.colorManager.colorize(`${survivalRate}% survival`, this.getSurvivalRateColor(survivalRate));
        
        console.log(`    ${playerLabel}: ${survivorText} returning home (${survivalRateText})`);
        
        const survivorComposition = this.colorManager.formatFleetComposition(event.survivors.attacker);
        console.log(`      Composition: ${survivorComposition}`);
        
        // Add tactical context for survivors
        const tacticalContext = this.getSurvivorTacticalContext(event.survivors.attacker, event.attackerFleet, 'attacker');
        if (tacticalContext) {
          console.log(`      ${this.colorManager.colorize('Status:', 'neutral')} ${tacticalContext}`);
        }
        
        // Add return journey information
        console.log(`      ${this.colorManager.colorize('Return ETA:', 'neutral')} Next turn`);
      }
      
      if (defenderSurvivors > 0) {
        const survivorText = this.colorManager.formatSurvivors(defenderSurvivors);
        const playerLabel = this.colorManager.formatPlayerIdentifier(defenderType, defenderName);
        const survivalRate = Math.round((defenderSurvivors / defenderOriginal) * 100);
        const survivalRateText = this.colorManager.colorize(`${survivalRate}% survival`, this.getSurvivalRateColor(survivalRate));
        
        console.log(`    ${playerLabel}: ${survivorText} remain in system (${survivalRateText})`);
        
        const survivorComposition = this.colorManager.formatFleetComposition(event.survivors.defender);
        console.log(`      Composition: ${survivorComposition}`);
        
        // Add tactical context for survivors
        const tacticalContext = this.getSurvivorTacticalContext(event.survivors.defender, event.defenderFleet, 'defender');
        if (tacticalContext) {
          console.log(`      ${this.colorManager.colorize('Status:', 'neutral')} ${tacticalContext}`);
        }
        
        // Add defensive capability assessment
        const defensiveStrength = this.assessDefensiveStrength(event.survivors.defender);
        if (defensiveStrength) {
          console.log(`      ${this.colorManager.colorize('Defense:', 'neutral')} ${defensiveStrength}`);
        }
      }
    } else {
      const totalAnnihilationText = this.colorManager.colorize('Total fleet annihilation - no survivors', 'casualties');
      console.log(`\n  ${totalAnnihilationText}`);
      
      // Add tactical implications of total loss
      if (event.outcome === 'decisive_attacker' || event.outcome === 'decisive_defender') {
        console.log(`    ${this.colorManager.colorize('Impact:', 'neutral')} Complete tactical dominance achieved`);
      } else {
        console.log(`    ${this.colorManager.colorize('Impact:', 'neutral')} Mutual destruction in fierce engagement`);
      }
    }
  }

  /**
   * Formats casualty breakdown by unit type
   */
  private formatCasualtyBreakdown(casualties: FleetComposition): string {
    const parts: string[] = [];
    
    if (casualties.frigates > 0) {
      parts.push(this.colorManager.colorize(`${casualties.frigates}F`, 'frigate'));
    }
    if (casualties.cruisers > 0) {
      parts.push(this.colorManager.colorize(`${casualties.cruisers}C`, 'cruiser'));
    }
    if (casualties.battleships > 0) {
      parts.push(this.colorManager.colorize(`${casualties.battleships}B`, 'battleship'));
    }
    
    return parts.join(', ');
  }

  /**
   * Gets casualty severity description based on loss rate
   */
  private getCasualtySeverity(lossRate: number): string {
    if (lossRate >= 0.8) return 'DEVASTATING';
    if (lossRate >= 0.6) return 'HEAVY';
    if (lossRate >= 0.4) return 'MODERATE';
    if (lossRate >= 0.2) return 'LIGHT';
    if (lossRate > 0) return 'MINIMAL';
    return 'NONE';
  }

  /**
   * Gets color for casualty severity
   */
  private getCasualtySeverityColor(lossRate: number): keyof import('./ColorManager.js').ColorTheme {
    if (lossRate >= 0.6) return 'casualties';
    if (lossRate >= 0.4) return 'defeat';
    if (lossRate >= 0.2) return 'neutral';
    return 'victory';
  }

  /**
   * Gets tactical context for casualties based on unit types lost
   */
  private getCasualtyTacticalContext(casualties: FleetComposition, originalFleet: FleetComposition): string | null {
    const totalCasualties = casualties.frigates + casualties.cruisers + casualties.battleships;
    const totalOriginal = originalFleet.frigates + originalFleet.cruisers + originalFleet.battleships;
    
    if (totalCasualties === 0 || totalOriginal === 0) return null;
    
    // Analyze which unit types suffered the most
    const frigateRate = originalFleet.frigates > 0 ? casualties.frigates / originalFleet.frigates : 0;
    const cruiserRate = originalFleet.cruisers > 0 ? casualties.cruisers / originalFleet.cruisers : 0;
    const battleshipRate = originalFleet.battleships > 0 ? casualties.battleships / originalFleet.battleships : 0;
    
    const maxRate = Math.max(frigateRate, cruiserRate, battleshipRate);
    
    if (maxRate === frigateRate && frigateRate > 0.7) {
      return 'Frigate screen decimated, vulnerable to cruiser attacks';
    } else if (maxRate === cruiserRate && cruiserRate > 0.7) {
      return 'Cruiser force crippled, reduced anti-battleship capability';
    } else if (maxRate === battleshipRate && battleshipRate > 0.7) {
      return 'Heavy units eliminated, lost primary striking power';
    } else if (totalCasualties / totalOriginal > 0.8) {
      return 'Fleet combat effectiveness severely compromised';
    }
    
    return null;
  }

  /**
   * Displays comparative loss analysis between attacker and defender
   */
  private displayComparativeLossAnalysis(
    casualtyPercentages: { attackerLossRate: number; defenderLossRate: number },
    attackerName: string,
    defenderName: string
  ): void {
    const attackerRate = casualtyPercentages.attackerLossRate;
    const defenderRate = casualtyPercentages.defenderLossRate;
    
    if (Math.abs(attackerRate - defenderRate) < 0.1) {
      console.log(`    ${this.colorManager.colorize('Analysis:', 'neutral')} Evenly matched losses - pyrrhic engagement`);
    } else if (attackerRate > defenderRate * 1.5) {
      const advantage = Math.round((attackerRate / defenderRate) * 100);
      console.log(`    ${this.colorManager.colorize('Analysis:', 'neutral')} ${defenderName} achieved ${advantage}% better casualty ratio`);
    } else if (defenderRate > attackerRate * 1.5) {
      const advantage = Math.round((defenderRate / attackerRate) * 100);
      console.log(`    ${this.colorManager.colorize('Analysis:', 'neutral')} ${attackerName} achieved ${advantage}% better casualty ratio`);
    }
  }

  /**
   * Gets color for survival rate display
   */
  private getSurvivalRateColor(survivalRate: number): keyof import('./ColorManager.js').ColorTheme {
    if (survivalRate >= 70) return 'victory';
    if (survivalRate >= 50) return 'neutral';
    if (survivalRate >= 30) return 'defeat';
    return 'casualties';
  }

  /**
   * Gets tactical context for survivors
   */
  private getSurvivorTacticalContext(
    survivors: FleetComposition, 
    originalFleet: FleetComposition, 
    role: 'attacker' | 'defender'
  ): string | null {
    const totalSurvivors = survivors.frigates + survivors.cruisers + survivors.battleships;
    const totalOriginal = originalFleet.frigates + originalFleet.cruisers + originalFleet.battleships;
    
    if (totalSurvivors === 0 || totalOriginal === 0) return null;
    
    const survivalRate = totalSurvivors / totalOriginal;
    
    // Analyze fleet composition balance of survivors
    const frigateRatio = totalSurvivors > 0 ? survivors.frigates / totalSurvivors : 0;
    const cruiserRatio = totalSurvivors > 0 ? survivors.cruisers / totalSurvivors : 0;
    const battleshipRatio = totalSurvivors > 0 ? survivors.battleships / totalSurvivors : 0;
    
    if (survivalRate > 0.8) {
      return role === 'attacker' ? 'Overwhelming victory, minimal losses' : 'Successfully repelled attack';
    } else if (survivalRate > 0.6) {
      return role === 'attacker' ? 'Successful assault with acceptable losses' : 'Defended with moderate casualties';
    } else if (survivalRate > 0.4) {
      return 'Bloodied but combat effective';
    } else if (survivalRate > 0.2) {
      if (frigateRatio > 0.7) {
        return 'Mostly light units survived, limited striking power';
      } else if (battleshipRatio > 0.5) {
        return 'Heavy units intact but lacking escort';
      } else {
        return 'Severely weakened, requires reinforcement';
      }
    } else {
      return 'Barely escaped annihilation';
    }
  }

  /**
   * Assesses defensive strength of surviving fleet
   */
  private assessDefensiveStrength(survivors: FleetComposition): string | null {
    const total = survivors.frigates + survivors.cruisers + survivors.battleships;
    
    if (total === 0) return null;
    
    if (total >= 50) {
      return 'Strong defensive capability maintained';
    } else if (total >= 20) {
      return 'Moderate defensive capability';
    } else if (total >= 10) {
      return 'Limited defensive capability';
    } else {
      return 'Minimal defensive capability - vulnerable to follow-up attacks';
    }
  }

  /**
   * Displays game over screen
   */
  public displayGameOver(gameState: GameState): void {
    console.log('\n' + '='.repeat(60));
    console.log('GAME OVER');
    console.log('='.repeat(60));
    
    const winner = gameState.winner;
    const victoryType = gameState.victoryType;
    
    if (winner === 'player') {
      console.log('🎉 VICTORY! You have defeated the AI!');
    } else {
      console.log('💀 DEFEAT! The AI has defeated you!');
    }
    
    console.log(`\nVictory Type: ${victoryType?.toUpperCase()}`);
    console.log(`Game Length: ${gameState.turn} turns`);
    console.log(`Final Phase: ${gameState.gamePhase}`);
    
    if (victoryType === 'military') {
      console.log('\nThe enemy fleet has been completely eliminated!');
    } else if (victoryType === 'economic') {
      console.log('\nThe enemy economy has collapsed!');
    }
    
    console.log('\nType "quit" to exit or start a new game.');
  }

  /**
   * Displays error messages
   */
  public displayError(message: string): void {
    console.log(`❌ Error: ${message}`);
  }

  /**
   * Helper methods for formatting
   */
  private formatNumber(num: number): string {
    return num.toLocaleString();
  }

  private formatIncome(income: number): string {
    const sign = income >= 0 ? '+' : '';
    return `${sign}${this.formatNumber(income)}`;
  }

  private padNumber(num: number, width: number = 8): string {
    return num.toString().padStart(width);
  }

  private getFleetMovementStatus(movement: any): string {
    // This would need to be implemented based on the actual FleetMovement interface
    return `${movement.missionType} (arrives turn ${movement.arrivalTurn})`;
  }

  private getConstructionProgress(order: any): string {
    const remaining = order.turnsRemaining;
    if (remaining === 1) {
      return 'Completes next turn';
    } else {
      return `${remaining} turns remaining`;
    }
  }


}