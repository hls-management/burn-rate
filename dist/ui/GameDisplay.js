import { ColorManager } from './ColorManager.js';
import { TacticalAnalyzer } from './TacticalAnalyzer.js';
export class GameDisplay {
    config;
    colorManager;
    tacticalAnalyzer;
    constructor(config = {}) {
        this.config = config;
        this.colorManager = new ColorManager(config.useColors !== false);
        this.tacticalAnalyzer = new TacticalAnalyzer();
    }
    /**
     * Displays the main game state information
     */
    displayGameState(gameState) {
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
    displayPlayerResources(player) {
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
    displayFleetStatus(player) {
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
    displayConstructionQueue(player) {
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
    displayIntelligence(player) {
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
        }
        else {
            console.log('\nINTELLIGENCE: No enemy scans performed');
        }
    }
    /**
     * Displays detailed game status
     */
    displayDetailedStatus(gameState, stats) {
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
    displayHelp() {
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
     * Displays turn result including combat events
     */
    displayTurnResult(turnResult) {
        console.log('\n' + '='.repeat(60));
        console.log('TURN RESULT');
        console.log('='.repeat(60));
        if (turnResult.errors.length > 0) {
            console.log('\nERRORS:');
            turnResult.errors.forEach(error => {
                console.log(`❌ ${error}`);
            });
        }
        if (turnResult.combatEvents.length > 0) {
            console.log('\nCOMBAT EVENTS:');
            turnResult.combatEvents.forEach(event => {
                this.displayCombatEvent(event);
            });
        }
        else {
            console.log('\nNo combat this turn.');
        }
        if (turnResult.gameEnded) {
            console.log(`\n🎯 GAME OVER! Winner: ${turnResult.winner?.toUpperCase()}`);
            console.log(`Victory Type: ${turnResult.victoryType?.toUpperCase()}`);
        }
        console.log('\nPress Enter to continue...');
    }
    /**
     * Displays a single combat event with enhanced formatting and tactical analysis
     */
    displayCombatEvent(event) {
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
        // Display tactical analysis if available
        if (enhancedDisplay.tacticalAdvantages.length > 0) {
            console.log('\n  Tactical Analysis:');
            enhancedDisplay.tacticalAdvantages.forEach(advantage => {
                const advantageColor = advantage.advantage === 'strong' ? 'victory' :
                    advantage.advantage === 'weak' ? 'defeat' : 'neutral';
                const advantageText = this.colorManager.colorize(`${advantage.advantage.toUpperCase()}`, advantageColor);
                console.log(`    ${advantage.unitType.charAt(0).toUpperCase() + advantage.unitType.slice(1)}s: ${advantageText} (${advantage.effectivenessRatio.toFixed(1)}x effectiveness)`);
            });
        }
        // Display battle phase progression
        if (enhancedDisplay.battlePhases.length > 0) {
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
        // Display enhanced casualty information
        this.displayEnhancedCasualties(event, enhancedDisplay.casualtyPercentages, attackerName, defenderName);
        // Display survivors with enhanced formatting
        this.displayEnhancedSurvivors(event, attackerName, defenderName, attackerType, defenderType);
        // Add visual separator
        console.log(this.colorManager.createSeparator(50, '·'));
    }
    /**
     * Displays detailed fleet composition with color coding
     */
    displayDetailedFleetComposition(label, fleet, playerType) {
        const total = fleet.frigates + fleet.cruisers + fleet.battleships;
        const coloredLabel = this.colorManager.formatPlayerIdentifier(playerType, label);
        const coloredComposition = this.colorManager.formatFleetComposition(fleet);
        console.log(`  ${coloredLabel}: ${total} ships (${coloredComposition})`);
    }
    /**
     * Displays a single battle phase with appropriate formatting and colors
     */
    displayBattlePhase(phase, phaseNumber) {
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
    formatPhaseAdvantage(advantage) {
        let colorType;
        let displayText;
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
    formatStrengthRatio(ratio) {
        let ratioText;
        let colorType;
        if (ratio >= 2.0) {
            ratioText = `${ratio.toFixed(1)}:1 (Overwhelming Attacker)`;
            colorType = 'victory';
        }
        else if (ratio >= 1.5) {
            ratioText = `${ratio.toFixed(1)}:1 (Strong Attacker)`;
            colorType = 'victory';
        }
        else if (ratio >= 1.2) {
            ratioText = `${ratio.toFixed(1)}:1 (Slight Attacker)`;
            colorType = 'neutral';
        }
        else if (ratio >= 0.8) {
            ratioText = `${ratio.toFixed(1)}:1 (Balanced)`;
            colorType = 'neutral';
        }
        else if (ratio >= 0.5) {
            ratioText = `${ratio.toFixed(1)}:1 (Slight Defender)`;
            colorType = 'neutral';
        }
        else {
            ratioText = `${ratio.toFixed(1)}:1 (Strong Defender)`;
            colorType = 'defeat';
        }
        return this.colorManager.colorize(ratioText, colorType);
    }
    /**
     * Displays battle explanation based on outcome and effectiveness ratios
     */
    displayBattleExplanation(outcome, effectivenessRatios) {
        let explanation;
        switch (outcome) {
            case 'decisive_attacker':
                if (effectivenessRatios.attackerEffectiveness > 1.5) {
                    explanation = 'Attacker achieved overwhelming tactical superiority';
                }
                else {
                    explanation = 'Attacker overwhelmed defender through superior numbers';
                }
                break;
            case 'decisive_defender':
                if (effectivenessRatios.defenderEffectiveness > 1.5) {
                    explanation = 'Defender exploited tactical advantages for decisive victory';
                }
                else {
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
     * Displays enhanced casualty information with percentages and color coding
     */
    displayEnhancedCasualties(event, casualtyPercentages, attackerName, defenderName) {
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
    displayEnhancedSurvivors(event, attackerName, defenderName, attackerType, defenderType) {
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
        }
        else {
            const totalAnnihilationText = this.colorManager.colorize('Total fleet annihilation - no survivors', 'casualties');
            console.log(`\n  ${totalAnnihilationText}`);
            // Add tactical implications of total loss
            if (event.outcome === 'decisive_attacker' || event.outcome === 'decisive_defender') {
                console.log(`    ${this.colorManager.colorize('Impact:', 'neutral')} Complete tactical dominance achieved`);
            }
            else {
                console.log(`    ${this.colorManager.colorize('Impact:', 'neutral')} Mutual destruction in fierce engagement`);
            }
        }
    }
    /**
     * Formats casualty breakdown by unit type
     */
    formatCasualtyBreakdown(casualties) {
        const parts = [];
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
    getCasualtySeverity(lossRate) {
        if (lossRate >= 0.8)
            return 'DEVASTATING';
        if (lossRate >= 0.6)
            return 'HEAVY';
        if (lossRate >= 0.4)
            return 'MODERATE';
        if (lossRate >= 0.2)
            return 'LIGHT';
        if (lossRate > 0)
            return 'MINIMAL';
        return 'NONE';
    }
    /**
     * Gets color for casualty severity
     */
    getCasualtySeverityColor(lossRate) {
        if (lossRate >= 0.6)
            return 'casualties';
        if (lossRate >= 0.4)
            return 'defeat';
        if (lossRate >= 0.2)
            return 'neutral';
        return 'victory';
    }
    /**
     * Gets tactical context for casualties based on unit types lost
     */
    getCasualtyTacticalContext(casualties, originalFleet) {
        const totalCasualties = casualties.frigates + casualties.cruisers + casualties.battleships;
        const totalOriginal = originalFleet.frigates + originalFleet.cruisers + originalFleet.battleships;
        if (totalCasualties === 0 || totalOriginal === 0)
            return null;
        // Analyze which unit types suffered the most
        const frigateRate = originalFleet.frigates > 0 ? casualties.frigates / originalFleet.frigates : 0;
        const cruiserRate = originalFleet.cruisers > 0 ? casualties.cruisers / originalFleet.cruisers : 0;
        const battleshipRate = originalFleet.battleships > 0 ? casualties.battleships / originalFleet.battleships : 0;
        const maxRate = Math.max(frigateRate, cruiserRate, battleshipRate);
        if (maxRate === frigateRate && frigateRate > 0.7) {
            return 'Frigate screen decimated, vulnerable to cruiser attacks';
        }
        else if (maxRate === cruiserRate && cruiserRate > 0.7) {
            return 'Cruiser force crippled, reduced anti-battleship capability';
        }
        else if (maxRate === battleshipRate && battleshipRate > 0.7) {
            return 'Heavy units eliminated, lost primary striking power';
        }
        else if (totalCasualties / totalOriginal > 0.8) {
            return 'Fleet combat effectiveness severely compromised';
        }
        return null;
    }
    /**
     * Displays comparative loss analysis between attacker and defender
     */
    displayComparativeLossAnalysis(casualtyPercentages, attackerName, defenderName) {
        const attackerRate = casualtyPercentages.attackerLossRate;
        const defenderRate = casualtyPercentages.defenderLossRate;
        if (Math.abs(attackerRate - defenderRate) < 0.1) {
            console.log(`    ${this.colorManager.colorize('Analysis:', 'neutral')} Evenly matched losses - pyrrhic engagement`);
        }
        else if (attackerRate > defenderRate * 1.5) {
            const advantage = Math.round((attackerRate / defenderRate) * 100);
            console.log(`    ${this.colorManager.colorize('Analysis:', 'neutral')} ${defenderName} achieved ${advantage}% better casualty ratio`);
        }
        else if (defenderRate > attackerRate * 1.5) {
            const advantage = Math.round((defenderRate / attackerRate) * 100);
            console.log(`    ${this.colorManager.colorize('Analysis:', 'neutral')} ${attackerName} achieved ${advantage}% better casualty ratio`);
        }
    }
    /**
     * Gets color for survival rate display
     */
    getSurvivalRateColor(survivalRate) {
        if (survivalRate >= 70)
            return 'victory';
        if (survivalRate >= 50)
            return 'neutral';
        if (survivalRate >= 30)
            return 'defeat';
        return 'casualties';
    }
    /**
     * Gets tactical context for survivors
     */
    getSurvivorTacticalContext(survivors, originalFleet, role) {
        const totalSurvivors = survivors.frigates + survivors.cruisers + survivors.battleships;
        const totalOriginal = originalFleet.frigates + originalFleet.cruisers + originalFleet.battleships;
        if (totalSurvivors === 0 || totalOriginal === 0)
            return null;
        const survivalRate = totalSurvivors / totalOriginal;
        // Analyze fleet composition balance of survivors
        const frigateRatio = totalSurvivors > 0 ? survivors.frigates / totalSurvivors : 0;
        const cruiserRatio = totalSurvivors > 0 ? survivors.cruisers / totalSurvivors : 0;
        const battleshipRatio = totalSurvivors > 0 ? survivors.battleships / totalSurvivors : 0;
        if (survivalRate > 0.8) {
            return role === 'attacker' ? 'Overwhelming victory, minimal losses' : 'Successfully repelled attack';
        }
        else if (survivalRate > 0.6) {
            return role === 'attacker' ? 'Successful assault with acceptable losses' : 'Defended with moderate casualties';
        }
        else if (survivalRate > 0.4) {
            return 'Bloodied but combat effective';
        }
        else if (survivalRate > 0.2) {
            if (frigateRatio > 0.7) {
                return 'Mostly light units survived, limited striking power';
            }
            else if (battleshipRatio > 0.5) {
                return 'Heavy units intact but lacking escort';
            }
            else {
                return 'Severely weakened, requires reinforcement';
            }
        }
        else {
            return 'Barely escaped annihilation';
        }
    }
    /**
     * Assesses defensive strength of surviving fleet
     */
    assessDefensiveStrength(survivors) {
        const total = survivors.frigates + survivors.cruisers + survivors.battleships;
        if (total === 0)
            return null;
        if (total >= 50) {
            return 'Strong defensive capability maintained';
        }
        else if (total >= 20) {
            return 'Moderate defensive capability';
        }
        else if (total >= 10) {
            return 'Limited defensive capability';
        }
        else {
            return 'Minimal defensive capability - vulnerable to follow-up attacks';
        }
    }
    /**
     * Displays game over screen
     */
    displayGameOver(gameState) {
        console.log('\n' + '='.repeat(60));
        console.log('GAME OVER');
        console.log('='.repeat(60));
        const winner = gameState.winner;
        const victoryType = gameState.victoryType;
        if (winner === 'player') {
            console.log('🎉 VICTORY! You have defeated the AI!');
        }
        else {
            console.log('💀 DEFEAT! The AI has defeated you!');
        }
        console.log(`\nVictory Type: ${victoryType?.toUpperCase()}`);
        console.log(`Game Length: ${gameState.turn} turns`);
        console.log(`Final Phase: ${gameState.gamePhase}`);
        if (victoryType === 'military') {
            console.log('\nThe enemy fleet has been completely eliminated!');
        }
        else if (victoryType === 'economic') {
            console.log('\nThe enemy economy has collapsed!');
        }
        console.log('\nType "quit" to exit or start a new game.');
    }
    /**
     * Displays error messages
     */
    displayError(message) {
        console.log(`❌ Error: ${message}`);
    }
    /**
     * Helper methods for formatting
     */
    formatNumber(num) {
        return num.toLocaleString();
    }
    formatIncome(income) {
        const sign = income >= 0 ? '+' : '';
        return `${sign}${this.formatNumber(income)}`;
    }
    padNumber(num, width = 8) {
        return num.toString().padStart(width);
    }
    getFleetMovementStatus(movement) {
        // This would need to be implemented based on the actual FleetMovement interface
        return `${movement.missionType} (arrives turn ${movement.arrivalTurn})`;
    }
    getConstructionProgress(order) {
        const remaining = order.turnsRemaining;
        if (remaining === 1) {
            return 'Completes next turn';
        }
        else {
            return `${remaining} turns remaining`;
        }
    }
    formatBattleOutcome(outcome) {
        switch (outcome) {
            case 'decisive_attacker':
                return 'DECISIVE ATTACKER VICTORY';
            case 'decisive_defender':
                return 'DECISIVE DEFENDER VICTORY';
            case 'close_battle':
                return 'CLOSE BATTLE';
            default:
                return outcome.toUpperCase();
        }
    }
}
//# sourceMappingURL=GameDisplay.js.map