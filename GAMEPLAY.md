# Burn Rate - Gameplay Guide

Welcome to Burn Rate, a fast-paced strategy game where you command fleets and manage resources to defeat an AI opponent. Your goal is to either destroy the enemy's military forces or collapse their economy before they do the same to you.

## Table of Contents

- [Quick Start](#quick-start)
- [Game Objectives](#game-objectives)
- [Turn Structure](#turn-structure)
- [Complete Command Reference](#complete-command-reference)
- [Basic Strategy Tips](#basic-strategy-tips)
- [Example Gameplay Scenarios](#example-gameplay-scenarios)

## Quick Reference

### Victory Conditions
- **Military Victory**: Eliminate all enemy fleets (after being attacked)
- **Economic Victory**: Force enemy economy to collapse (negative income + no resources)

### Essential Commands
| Command | Syntax | Purpose |
|---------|--------|---------|
| `build` | `build <qty> <unit/structure>` | Build units or structures |
| `attack` | `attack <frigates> <cruisers> <battleships>` | Launch fleet attack |
| `scan` | `scan <basic/deep/advanced>` | Gather intelligence |
| `status` | `status` | View game state |
| `end` | `end` | End your turn |

### Unit Effectiveness (Rock-Paper-Scissors)
- **Frigates** > Cruisers > Battleships > **Frigates**

---

## Quick Start

### Starting a New Game

```bash
# Start with default settings
burn-rate

# Start with specific AI opponent
burn-rate --ai aggressor

# Start with more resources
burn-rate --resources 50000 50000

# Start in debug mode for detailed information
burn-rate --debug
```

### Your First Turn

1. Type `status` to see your current situation
2. Type `help` to see available commands
3. Build some units: `build 5 frigate`
4. End your turn: `end`

## Game Objectives

### Victory Conditions

**Military Victory**: Eliminate all enemy fleets after they have attacked you
- The enemy must have no ships in their home system or in transit
- They must have previously launched an attack against you

**Economic Victory**: Force the enemy economy to collapse
- Enemy has negative income (spending more than earning)
- Enemy has no resources left (0 metal and 0 energy)
- Both conditions must be met simultaneously

### Defeat Conditions

You lose if either victory condition is achieved against you first.

## Turn Structure

Each turn follows this sequence:

1. **Income Phase**: Receive resources from structures and base income
2. **Action Phase**: Execute your commands (build, attack, scan)
3. **AI Phase**: AI makes its decisions and actions
4. **Combat Phase**: Resolve fleet movements and battles
5. **Victory Check**: Check if anyone has won
6. **Next Turn**: Advance to the next turn

### Turn Timing

- **Fleet Movement**: Takes 1 turn to reach target, 1 turn for combat, 1 turn to return (3 turns total)
- **Construction**: Most units build in 1 turn, some take longer
- **Income**: Applied at the start of each turn

## Complete Command Reference

### Build Command

Build military units or economic structures.

**Syntax**: `build <quantity> <unit/structure>`

**Units Available**:

| Unit | Build Cost | Build Time | Upkeep | Effective Against | Weak Against |
|------|------------|------------|--------|-------------------|--------------|
| Frigate | 4M, 2E | 1 turn | 2M, 1E | Cruisers (1.5x) | Battleships (0.7x) |
| Cruiser | 10M, 6E | 2 turns | 5M, 3E | Battleships (1.5x) | Frigates (0.7x) |
| Battleship | 20M, 12E | 4 turns | 10M, 6E | Frigates (1.5x) | Cruisers (0.7x) |

**Structures Available**:

| Structure | Build Cost | Build Time | Income Bonus | Notes |
|-----------|------------|------------|--------------|-------|
| Reactor | 900M, 1200E | 1 turn | +500 Energy/turn | Cost scales exponentially |
| Mine | 1500M, 600E | 1 turn | +500 Metal/turn | Cost scales exponentially |

**Examples**:
```
build 10 frigate
build 5 cruiser
build 2 battleship
build 1 reactor
build 1 mine
```

**Notes**:
- Units have upkeep costs that reduce your income each turn
- Structure costs increase exponentially with each one built
- You must have enough resources to pay the full construction cost upfront

### Attack Command

Launch a fleet to attack the enemy home system.

**Syntax**: `attack <frigates> <cruisers> <battleships>`

**Examples**:
```
attack 20 10 5
attack 0 15 0
attack 50 0 0
```

**Combat Mechanics**:
- Fleets take 1 turn to reach the target
- Combat is resolved automatically using unit effectiveness
- Survivors return home after 2 additional turns
- Rock-paper-scissors effectiveness: Frigates > Cruisers > Battleships > Frigates

**Strategic Notes**:
- Sending fleets leaves your home system vulnerable to counter-attack
- Mixed fleet compositions are generally more effective
- Consider the enemy's known fleet composition when planning attacks

### Scan Command

Gather intelligence about the enemy.

**Syntax**: `scan <type>`

**Scan Types**:
- `basic` - Approximate total fleet size (Cost: 1000E, ±30% accuracy)
- `deep` - Detailed fleet composition and economic structures (Cost: 2500E, ±10% accuracy)
- `advanced` - Strategic intent analysis and fleet estimates (Cost: 5000E)

**Examples**:
```
scan basic
scan deep
scan advanced
```

**Intelligence Notes**:
- Fleets in transit are invisible to scans
- Scan accuracy decreases over time
- Advanced scans reveal AI strategic intentions

### Status Command

Display comprehensive game information.

**Syntax**: `status`

Shows:
- Current turn and game phase
- Your resources and income
- Fleet composition (home and in transit)
- Construction queue
- Recent combat events
- Victory condition status

### Help Command

Display available commands and syntax.

**Syntax**: `help`

### End Turn Command

Complete your turn and advance the game.

**Syntax**: `end` or `end_turn` or `endturn`

### Quit Command

Exit the game.

**Syntax**: `quit` or `exit`

## Basic Strategy Tips

### Economic Management

**Resource Balance**:
- Base income: 10,000 metal and 10,000 energy per turn
- Build mines to increase metal income
- Build reactors to increase energy income
- Monitor your net income (income minus upkeep)

**Economic Expansion**:
- Early economic structures pay for themselves quickly
- Each additional structure costs more (exponential scaling)
- Balance economic growth with military needs

### Fleet Composition

**Unit Effectiveness**:
- Frigates beat Cruisers (1.5x effectiveness)
- Cruisers beat Battleships (1.5x effectiveness)  
- Battleships beat Frigates (1.5x effectiveness)

**Balanced Fleets**:
- Mixed compositions are harder to counter
- Consider 3:2:1 ratio (Frigates:Cruisers:Battleships)
- Adapt composition based on enemy intelligence

### Combat Strategy

**Timing Attacks**:
- Attack when enemy fleets are away (vulnerable home system)
- Coordinate multiple waves for sustained pressure
- Consider the 3-turn attack cycle when planning

**Defensive Positioning**:
- Maintain home defense while attacking
- Use intelligence to predict enemy attacks
- Counter-attack when enemy fleets are in transit

### AI Archetypes

**Aggressor AI**:
- Focuses on military buildup and frequent attacks
- Vulnerable to economic warfare
- Expect early and sustained military pressure

**Economist AI**:
- Prioritizes economic expansion over military
- Builds strong defenses but attacks conservatively
- Becomes dangerous in late game with superior economy

**Trickster AI**:
- Uses deception and unpredictable strategies
- Builds unexpected unit compositions
- Adapts behavior based on your scanning frequency

**Hybrid AI**:
- Changes strategies every few turns
- Adapts to your actions and game state
- Most unpredictable and challenging opponent

### Game Phases

**Early Game (Turns 1-5)**:
- Focus on economic expansion
- Build basic military for defense
- Gather intelligence on enemy strategy

**Mid Game (Turns 6-15)**:
- Increase military pressure
- Exploit enemy weaknesses
- Maintain economic growth

**Late Game (Turns 16-25)**:
- Large-scale military operations
- Economic warfare becomes critical
- Victory conditions become achievable

**Endgame (Turns 25+)**:
- All-out warfare
- Resource management crucial
- Small mistakes can be decisive

## Example Gameplay Scenarios

### Scenario 1: Economic Rush
```
Turn 1: build 1 mine
Turn 2: build 1 reactor  
Turn 3: scan deep
Turn 4: build 10 frigate (with improved income)
Turn 5: attack 10 0 0
```

### Scenario 2: Military Pressure
```
Turn 1: build 8 frigate
Turn 2: attack 8 0 0
Turn 3: build 5 cruiser
Turn 4: scan basic
Turn 5: attack 0 5 0
```

### Scenario 3: Defensive Counter
```
Turn 1: scan deep
Turn 2: build counters based on enemy fleet
Turn 3: build 1 reactor
Turn 4: wait for enemy attack
Turn 5: counter-attack while enemy fleets return
```

Remember: Burn Rate rewards adaptability, timing, and resource management. Study your opponent, plan your economy, and strike when the moment is right!

---

## Related Documentation

- **[Installation Guide](INSTALL.md)** - Set up and install Burn Rate
- **Gameplay Guide** - You are here
- **[Game Mechanics](MECHANICS.md)** - Detailed system explanations and formulas

### Quick Navigation
- [Back to Top](#burn-rate---gameplay-guide)
- [Command Reference](#complete-command-reference)
- [Strategy Tips](#basic-strategy-tips)
- [Victory Conditions](#game-objectives)