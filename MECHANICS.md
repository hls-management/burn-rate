# Burn Rate - Game Mechanics

Burn Rate is a turn-based strategy game featuring economic management, fleet combat, and intelligence warfare. Players must balance resource production, military expansion, and strategic intelligence to achieve victory through either military dominance or economic superiority.

## Table of Contents

- [Economic System](#economic-system)
- [Fleet System](#fleet-system)
- [Combat System](#combat-system)
- [Intelligence System](#intelligence-system)
- [AI Archetypes and Behaviors](#ai-archetypes-and-behaviors)
- [Victory Conditions](#victory-conditions)
- [Game Phases and Progression](#game-phases-and-progression)
- [Advanced Mechanics](#advanced-mechanics)

## Quick Reference

### Resource Overview
- **Base Income**: 10,000 Metal + 10,000 Energy per turn
- **Structures**: Reactors (+500 Energy), Mines (+500 Metal)
- **Unit Upkeep**: Reduces net income each turn

### Unit Stats Summary
| Unit | Cost | Build Time | Upkeep | Strong vs | Weak vs |
|------|------|------------|--------|-----------|---------|
| Frigate | 4M, 2E | 1 turn | 2M, 1E | Cruiser | Battleship |
| Cruiser | 10M, 6E | 2 turns | 5M, 3E | Battleship | Frigate |
| Battleship | 20M, 12E | 4 turns | 10M, 6E | Frigate | Cruiser |

### Victory Conditions
- **Military**: Eliminate all enemy fleets (after enemy has attacked)
- **Economic**: Enemy has negative income AND zero resources (after turn 10)

---

## Overview

## Economic System

### Base Resources

The game economy revolves around two primary resources:

- **Metal**: Used for construction and unit production
- **Energy**: Used for construction, unit production, and intelligence operations

#### Base Income
Every player receives a guaranteed base income each turn:
- **10,000 Metal** per turn
- **10,000 Energy** per turn

### Economic Structures

Players can build two types of economic structures to boost their income:

#### Reactors
- **Build Cost**: 900 Metal + 1,200 Energy
- **Build Time**: 1 turn
- **Income Bonus**: +500 Energy per turn
- **Scaling Cost**: Cost increases exponentially with each reactor built

#### Mines
- **Build Cost**: 1,500 Metal + 600 Energy  
- **Build Time**: 1 turn
- **Income Bonus**: +500 Metal per turn
- **Scaling Cost**: Cost increases exponentially with each mine built

#### Cost Scaling Formula
Structure costs increase exponentially based on the number already built:
```
Cost = Base Cost × (1 + 0.5 × Structure Count)^1.2
```

**Example Scaling:**
- 1st Reactor: 900M + 1,200E
- 2nd Reactor: 1,215M + 1,620E  
- 3rd Reactor: 1,593M + 2,124E
- 5th Reactor: 2,531M + 3,375E

### Construction System

#### Construction Queue
- All construction (units and structures) goes through a construction queue
- Multiple items can be built simultaneously
- Each item has a build time and resource drain per turn
- Construction continues even if resources run low, but new orders cannot be started

#### Resource Management
- **Income Calculation**: Base Income + Structure Bonuses - Construction Drain - Fleet Upkeep
- **Economic Stall**: When net income ≤ 0, no new construction can begin
- **Negative Resources**: Resources cannot go below 0

#### Payback Analysis
The game calculates payback time for economic investments:
- **Reactor Payback**: Energy Cost ÷ 500 Energy/turn
- **Mine Payback**: Metal Cost ÷ 500 Metal/turn
- Structures become less viable as payback time exceeds 10-15 turns

## Fleet System

### Unit Types and Statistics

The game features three unit types in a rock-paper-scissors combat system:

### Complete Unit Statistics

| Unit Type | Build Cost | Build Time | Upkeep Cost | vs Frigate | vs Cruiser | vs Battleship |
|-----------|------------|------------|-------------|------------|------------|---------------|
| **Frigate** | 4M, 2E | 1 turn | 2M, 1E | 1.0x | **1.5x** | 0.7x |
| **Cruiser** | 10M, 6E | 2 turns | 5M, 3E | 0.7x | 1.0x | **1.5x** |
| **Battleship** | 20M, 12E | 4 turns | 10M, 6E | **1.5x** | 0.7x | 1.0x |

**Legend**: Bold values indicate effectiveness advantage (1.5x damage)

### Fleet Operations

#### Attack Cycle
Fleet attacks follow a 3-turn cycle:
1. **Turn 1**: Fleet departs home system (becomes invisible to scans)
2. **Turn 2**: Fleet arrives and engages in combat
3. **Turn 3**: Surviving ships return to home system

#### Fleet Visibility
- **Home Fleets**: Always visible to enemy scans
- **In-Transit Fleets**: Invisible to all scans while traveling
- **Vulnerability Window**: Home system is vulnerable to counter-attack while fleets are away

#### Fleet Management
- Players can send multiple fleets simultaneously
- Fleets can be recalled only before departure (Turn 1)
- Fleet composition affects combat effectiveness and upkeep costs

## Combat System

### Combat Resolution

Combat uses a strength-based system with random factors:

#### Strength Calculation
1. **Unit Effectiveness**: Each unit type calculates damage against enemy composition
2. **Random Factors**: Each unit type gets a random multiplier (0.8x - 1.2x)
3. **Total Strength**: Sum of all unit type contributions

#### Battle Outcomes
Based on strength ratio between attacker and defender:
- **Decisive Victory**: 2:1 or greater strength advantage
- **Close Battle**: Strength ratio between 0.5:1 and 2:1
- **Decisive Defeat**: Less than 0.5:1 strength ratio

#### Casualty Rates
Casualties depend on battle outcome:
- **Decisive Winner**: 10-30% casualties
- **Decisive Loser**: 70-90% casualties  
- **Close Battle**: 40-60% casualties for both sides

### Strategic Combat Considerations

#### Counter-Attack Opportunities
- Attacking fleets create vulnerability windows at home
- Optimal timing can exploit enemy fleet movements
- Intelligence gathering helps identify attack opportunities

#### Fleet Composition Strategy
- **Frigate Swarms**: Effective against cruiser-heavy fleets, vulnerable to battleships
- **Cruiser Balanced**: Good all-around performance, counters battleships
- **Battleship Walls**: Devastating against frigates, vulnerable to cruisers
- **Mixed Fleets**: Balanced approach with fewer hard counters

## Intelligence System

### Scanning Operations

Players can gather intelligence through three types of scans:

### Scanning Options Summary

| Scan Type | Energy Cost | Accuracy | Information Provided | Best Use Case |
|-----------|-------------|----------|---------------------|---------------|
| **Basic** | 1,000E | ±30% | Total fleet size | Quick threat assessment |
| **Deep** | 2,500E | ±10% | Fleet composition + structures | Tactical planning |
| **Advanced** | 4,000E | Variable | Strategic intent + construction | Long-term strategy |

### Intelligence Mechanics

#### Data Aging
- Scan accuracy decreases by 10% per turn
- Old intelligence becomes unreliable for tactical decisions
- Fresh scans are crucial before major operations

#### Misinformation
- 20% base chance for scans to return false information
- Misinformation applies ±50% variation to reported numbers
- Advanced scans are more resistant to misinformation

#### Intelligence Gaps
- In-transit fleets are invisible to all scans
- Players must estimate potential threats during vulnerability windows
- Confidence in intelligence decreases over time

## AI Archetypes and Behaviors

### AI Archetype Summary

| AI Type | Military Focus | Economic Focus | Key Behavior | Counter Strategy |
|---------|----------------|----------------|--------------|------------------|
| **Aggressor** | 80% | 20% | Constant attacks, frigate swarms | Economic warfare, defensive play |
| **Economist** | 25% | 75% | Structure building, 2:1 attack ratio | Early pressure, military victory |
| **Trickster** | 40% | 30% | Unpredictable builds, misdirection | Consistent scanning, adaptability |
| **Hybrid** | Variable | Variable | Strategy changes every 2-4 turns | Flexible response, exploit transitions |

### Detailed AI Behaviors

#### Aggressor AI
- **Military Focus**: 80% of decisions favor military expansion
- **Economic Focus**: 20% for basic economic needs
- **Behavior**: 
  - Builds fast, aggressive units (frigates preferred)
  - Attacks with 60-80% of available fleet
  - Adapts to defensive play when heavily threatened
- **Strategy**: Overwhelm through constant pressure and superior numbers

#### Economist AI  
- **Military Focus**: 25% for defensive purposes
- **Economic Focus**: 75% prioritizing income growth
- **Behavior**:
  - Builds economic structures until 25,000+ income
  - Maintains minimum defensive fleet (8 units)
  - Only attacks with overwhelming 2:1 advantage
- **Strategy**: Economic victory through superior resource generation

#### Trickster AI
- **Military Focus**: 40% with unpredictable unit choices
- **Economic Focus**: 30% for balanced development  
- **Deception Focus**: 70% chance for misdirection tactics
- **Behavior**:
  - Builds unexpected unit counters
  - Uses scanning as misdirection
  - Plays optimally when not being observed
- **Strategy**: Confusion and misdirection to create tactical advantages

#### Hybrid AI
- **Adaptive Strategy**: Changes approach every 2-4 turns
- **Strategy Types**: Aggressive, Economic, Defensive, Opportunistic
- **Behavior**:
  - Reacts to player actions and game state
  - 40% chance to deviate from current strategy each turn
  - Balances all aspects based on current needs
- **Strategy**: Flexible adaptation to counter player strategies

## Victory Conditions

### Military Victory
Achieved by eliminating all enemy fleets after the enemy has been attacked:
- **Condition**: Enemy has zero ships in home system and no fleets in transit
- **Requirement**: Enemy must have been attacked at least once
- **Timing**: Can occur any turn after combat

### Economic Victory  
Achieved by forcing enemy economic collapse:
- **Condition**: Enemy has negative income AND zero resources
- **Timing**: Only checked after turn 10 (prevents early game victories)
- **Mechanism**: Sustained economic pressure forces resource depletion

### Victory Mechanics
- **Attack Tracking**: Game tracks whether each player has been attacked
- **Resource Recovery**: Destroyed ships return 50% of their build cost
- **Mutual Elimination**: If both players are eliminated, AI wins by default

## Game Phases and Progression

### Game Phase Overview

| Phase | Turns | Focus | Key Characteristics | Recommended Strategy |
|-------|-------|-------|-------------------|---------------------|
| **Early** | 1-10 | Foundation | Base income dominates, small fleets | Balance growth with defense |
| **Mid** | 11-25 | Expansion | Structure scaling, larger battles | Establish advantage |
| **Late** | 25+ | Decisive Action | Massive battles, victory pursuit | Execute winning strategy |

### Detailed Phase Breakdown

#### Early Game (Turns 1-10)
- **Focus**: Economic foundation and basic military
- **Characteristics**: 
  - Base income dominates economy
  - Small fleet skirmishes
  - Economic victory disabled
- **Strategy**: Balance growth with defense

#### Mid Game (Turns 11-25)
- **Focus**: Economic expansion and fleet buildup
- **Characteristics**:
  - Structure scaling becomes significant
  - Larger fleet engagements
  - Intelligence becomes crucial
- **Strategy**: Establish economic or military advantage

#### Late Game (Turns 25+)
- **Focus**: Decisive military action or economic dominance
- **Characteristics**:
  - Massive fleet battles
  - Economic advantages compound
  - Victory conditions actively pursued
- **Strategy**: Execute winning strategy while preventing enemy victory

## Advanced Mechanics

### Economic Efficiency
The game tracks several efficiency metrics:
- **Metal/Energy Efficiency**: Net income vs base income ratio
- **Structure Efficiency**: Income bonus vs base income ratio  
- **Fleet Efficiency**: Fleet size vs upkeep cost ratio
- **Overall Efficiency**: Combined metric for economic health

### Strategic Timing
- **Construction Timing**: Coordinate builds with attack cycles
- **Attack Windows**: Exploit enemy vulnerability periods
- **Economic Cycles**: Time structure builds for maximum impact
- **Intelligence Cycles**: Regular scanning for tactical awareness

### Resource Management
- **Stockpiling**: Accumulate resources for major operations
- **Drain Management**: Balance construction with income sustainability
- **Emergency Reserves**: Maintain resources for unexpected threats
- **Investment Priorities**: Choose between military and economic growth

This comprehensive mechanics system creates deep strategic gameplay where players must master economic management, tactical combat, and intelligence warfare to achieve victory.

---

## Related Documentation

- **[Installation Guide](INSTALL.md)** - Set up and install Burn Rate
- **[Gameplay Guide](GAMEPLAY.md)** - Commands, strategy, and how to play
- **Game Mechanics** - You are here

### Quick Navigation
- [Back to Top](#burn-rate---game-mechanics)
- [Economic System](#economic-system)
- [Combat System](#combat-system)
- [AI Behaviors](#ai-archetypes-and-behaviors)
- [Victory Conditions](#victory-conditions)