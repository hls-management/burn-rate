# Burn Rate - Design Document

## Overview

Burn Rate is a web-based turn-based strategy game that creates intense 2-5 minute sessions through natural economic and military escalation. The game features a dual-resource economy (Metal/Energy) where players must balance immediate military needs against long-term economic sustainability while gathering intelligence about AI opponents through a risk-reward scanning system.

The core design philosophy centers on meaningful choices under pressure: every decision has opportunity costs, and the AI responds dynamically to player actions, creating natural escalation that drives games to quick resolution without artificial timers.

## Architecture

### Core Game Loop
```
Turn Start → Resource Income → Player Actions → AI Response → Combat Resolution → Victory Check → Next Turn
```

### System Components
- **Game State Manager**: Handles turn progression, victory conditions, and game initialization
- **Economy Engine**: Manages dual-resource system with income, construction costs, and upkeep
- **Fleet Manager**: Handles unit creation, composition, and combat resolution
- **Intelligence System**: Manages scanning mechanics and information revelation
- **AI Controller**: Implements different AI archetypes with dynamic response patterns
- **Procedural Generator**: Creates randomized starting conditions and map layouts
- **UI Controller**: Manages CLI-style interface and player input

## Components and Interfaces

### Economy Engine

**Core Mechanics:**
- **Base Income**: Starting rates provide sustainable foundation (Metal: +10,000/turn, Energy: +10,000/turn)
- **Construction Impact**: Building units temporarily reduces income during construction phase
- **Upkeep System**: Completed units apply permanent income reduction
- **Economic Structures**: Reactors and mining operations provide income boosts
- **Unit Scale**: Fleets measured in hundreds to thousands of ships for meaningful economic impact

**Economic Structures:**
- **Mining Operations**: Cost 1,500 Metal, 600 Energy to build, provide +500 Metal income per turn
- **Reactors**: Cost 900 Metal, 1,200 Energy to build, provide +500 Energy income per turn
- **Construction Time**: Economic structures take 1 turn to build and come online immediately
- **Upkeep**: Economic structures have no ongoing upkeep costs
- **Exponential Scaling**: Each additional structure of the same type costs progressively more
  - First structure: Base cost, pays for itself in 3-4 turns
  - Second structure: 1.5x base cost, pays for itself in 5-6 turns
  - Third structure: 2.2x base cost, pays for itself in 8-10 turns
  - Formula: Cost = Base Cost × (1 + 0.5 × Structure Count)^1.2

**Economic Balance Framework:**
```
Construction Phase: Base Income - Construction Drain = Temporary Income
Completion Phase: (Base Income + Economic Bonuses) - Unit Upkeep = Steady Income
Stall Condition: When Steady Income ≤ 0, no new production can begin
```

**Critical Thresholds:**
- **Stall Point**: When income approaches zero, unit production halts
- **Growth Point**: Surplus income enables rapid expansion

### Fleet Combat System

**Unit Types & Relationships:**
- **Frigates**: Fast, cheap, 1 turn build time, effective vs Cruisers, vulnerable to Battleships
- **Cruisers**: Balanced, moderate cost, 2 turn build time, effective vs Battleships, vulnerable to Frigates  
- **Battleships**: Expensive, powerful, 4 turn build time, effective vs Frigates, vulnerable to Cruisers

**Economic Costs:**
- **Frigate Upkeep**: 2 Metal, 1 Energy per turn per unit
- **Cruiser Upkeep**: 5 Metal, 3 Energy per turn per unit
- **Battleship Upkeep**: 10 Metal, 6 Energy per turn per unit

**Construction Mechanics:**
- **Construction Drain**: While building, units consume double their upkeep cost per turn
- **Frigate Construction**: 4 Metal, 2 Energy per turn for 1 turn
- **Cruiser Construction**: 10 Metal, 6 Energy per turn for 2 turns  
- **Battleship Construction**: 20 Metal, 12 Energy per turn for 4 turns
- **Completion**: Once built, units switch to normal upkeep costs

**Travel Mechanics:**
- **Turn 1 (Departure)**: Fleet leaves home system and becomes invisible to enemy scans
- **Turn 2 (Arrival & Combat)**: Fleet arrives at target system, combat occurs immediately
- **Turn 3 (Return)**: Survivors take 1 turn to return home, creating counter-attack windows
- **In Transit**: Fleets cannot defend home system or be recalled once committed
- **Strategic Implications**: Attacking requires 3-turn commitment with extended vulnerability

**Combat Resolution:**
```
Fleet Strength = Σ(Unit Count × Effectiveness Multiplier × Random Factor)
Effectiveness Multiplier: 1.5x advantage, 1.0x neutral, 0.7x disadvantage
Random Factor: 0.8-1.2x per unit type
```

**Battle Outcomes:**
- Decisive victories eliminate 70-90% of losing fleet
- Close battles result in 40-60% casualties for both sides
- Survivors begin 1-turn return journey, leaving attacker's home system vulnerable to counter-attack

### Intelligence System

**Scanning Mechanics:**
- **Basic Scan**: Costs 1,000 Energy, reveals total fleet count only ("~500 ships detected")
- **Deep Scan**: Costs 2,500 Energy, reveals unit composition breakdown and economic infrastructure count
- **Advanced Scan**: Costs 4,000 Energy, reveals AI strategic intent and planned actions (less precise numbers)

**Travel Impact on Intelligence:**
- **Home System Scans**: Only detect fleets currently in their home system
- **In-Transit Fleets**: Become completely invisible to all scan types
- **Intelligence Gaps**: Players must decide when to attack based on potentially outdated scan data
- **Timing Windows**: Optimal attack timing requires predicting enemy fleet movements

**Tiered Intelligence Quality:**
- **Basic Scans**: Raw numbers only, ±30% accuracy on total fleet count
- **Deep Scans**: Precise unit breakdown and economic status, ±10% accuracy on composition
- **Advanced Scans**: Strategic insights ("AI planning major offensive next 2 turns") but vague numbers
- All scans show "last updated" timestamp to indicate data freshness

**Misinformation System:**
- 20% chance of receiving outdated information
- AI "Trickster" archetype can deploy decoy signatures
- Multiple scans of same target improve accuracy
- In-transit fleets create natural intelligence blackouts

### AI Behavior Archetypes

**Aggressor:**
- Prioritizes early military production (80% of turns)
- Responds to player economic growth with immediate attacks
- 20% chance to turtle defensively for 1 turn (adaptive behavior)
- Vulnerable to economic warfare and late-game strategies

**Economist:**
- Focuses on economic expansion early (75% of turns)
- Builds overwhelming late-game advantage
- 25% chance to build military units when threatened
- Vulnerable to early military pressure

**Trickster:**
- Uses deception and misdirection (70% of turns)
- Deploys decoy units and false intelligence
- 30% chance to play straightforward when player stops scanning
- Adapts strategy based on player scanning behavior

**Hybrid:**
- Balances military and economic development (60% predictable)
- Responds proportionally to player actions
- 40% chance to deviate from balanced approach each turn
- Most unpredictable but lacks specialized advantages

## Victory Conditions

**Total Fleet Elimination**: The game ends when one player's fleet is completely destroyed (0 ships in home system and no fleets in transit). The surviving player wins immediately.

**Strategic Implications**: 
- Players must balance offensive operations with home defense
- Economic stalls become critical vulnerabilities if they prevent rebuilding destroyed fleets
- The 3-turn attack cycle creates windows where counter-attacks can achieve decisive victories

## Data Models

### Game State
```typescript
interface GameState {
  turn: number;
  player: PlayerState;
  ai: AIState;
  combatLog: CombatEvent[];
  gamePhase: 'early' | 'mid' | 'late' | 'endgame';
}
```

### Player/AI State
```typescript
interface PlayerState {
  resources: {
    metal: number;
    energy: number;
    metalIncome: number;
    energyIncome: number;
  };
  fleet: {
    homeSystem: {
      frigates: number;
      cruisers: number;
      battleships: number;
    };
    inTransit: {
      outbound: FleetMovement[];
    };
  };
  economy: {
    reactors: number;
    mines: number;
    constructionQueue: BuildOrder[];
  };
}

interface BuildOrder {
  unitType: 'frigate' | 'cruiser' | 'battleship' | 'reactor' | 'mine';
  quantity: number;
  turnsRemaining: number;
  resourceDrainPerTurn: {
    metal: number;
    energy: number;
  };
}

  intelligence: {
    lastScanTurn: number;
    knownEnemyFleet: FleetComposition;
    scanAccuracy: number;
  };
}

interface FleetMovement {
  composition: FleetComposition;
  target: string;
  arrivalTurn: number;
  returnTurn: number;
  missionType: 'outbound' | 'combat' | 'returning';
}
```



## Error Handling

### Economic Failures
- **Resource Stall**: When income drops to zero or below, halt all new production and display warning
- **Invalid Builds**: Prevent construction when insufficient resources or income, show clear feedback
- **Resource Management**: Players must balance existing upkeep costs against available income

### Combat Errors
- **Fleet Validation**: Ensure fleet compositions are valid before combat resolution
- **Combat State**: Handle edge cases where fleets are destroyed mid-calculation

### AI Failures
- **Decision Timeout**: If AI cannot make decision within reasonable time, default to defensive posture
- **Invalid AI Actions**: Validate all AI moves against game rules, log violations for debugging
- **Archetype Consistency**: Ensure AI behavior remains consistent with selected archetype

### UI/Input Errors
- **Invalid Commands**: Provide clear feedback for unrecognized or impossible actions
- **State Desync**: Implement state validation to catch UI/game state mismatches
- **Input Validation**: Sanitize all player inputs and provide helpful error messages

## Testing Strategy

### Unit Testing
- **Economy Engine**: Test income calculations, construction costs, upkeep mechanics
- **Combat System**: Verify RPS relationships, damage calculations, random factors
- **AI Behavior**: Test each archetype's decision-making patterns and responses
- **Procedural Generation**: Ensure balanced starting conditions across multiple seeds

### Integration Testing
- **Game Flow**: Test complete turn cycles from start to finish
- **Victory Conditions**: Verify all win/loss scenarios trigger correctly
- **Save/Load**: Test game state persistence and restoration
- **Cross-System**: Test interactions between economy, combat, and intelligence systems

### Balance Testing
- **Economic Viability**: Ensure all strategies have viable paths to victory
- **Time Pressure**: Verify games naturally resolve within 2-5 minute target
- **AI Challenge**: Test that each AI archetype provides appropriate difficulty
- **Replayability**: Validate that procedural generation creates varied experiences

### Performance Testing
- **Turn Processing**: Ensure turn resolution completes within 100ms
- **Memory Usage**: Monitor for memory leaks during extended play sessions
- **UI Responsiveness**: Verify interface remains responsive during calculations
- **Scalability**: Test with maximum unit counts and complex fleet compositions