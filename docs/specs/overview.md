# Burn-Rate — Game Overview

Burn-Rate is a single-planet, turn-based space strategy game with up to four players (one human, up to three AIs). The core loop balances building an economy, producing fleets, scouting, and timing multi-turn attacks. Games are paced to finish in roughly 10–20 turns (~5–10 minutes).

## Core Concepts
- Single home planet per player. No map, no travel distances.
- Two resources: Metal and Energy.
- Structures: Mines (increase Metal income), Reactors (increase Energy income). Structures are abstract: cannot be targeted or destroyed; soft-capped via escalating costs.
- Fleets: Three ship classes (Skiff, Frigate, Dreadnought) with a rock–paper–scissors relationship.
- Actions per turn: build structures, queue ships, perform scans, launch attacks, end turn. All processing resolves at end of turn.
- Attacks are multi-turn missions; launching removes ships from home defense after one full turn and they remain away until they return.
- Victory: If a player is attacked while having 0 ships at home at battle resolution, or if after combat they have 0 ships remaining at home, they lose. If both sides reach 0, the defender survives (attacker does not win).

## Pacing & Philosophy
- Early decisions emphasize tradeoffs between economy, upkeep, and fleet timing.
- Cost escalation and build upkeep discourage pure turtling or all-in spam.
- Randomness in combat adds uncertainty without requiring micro.
- Scans (paid in Energy) provide incomplete, planet-only intel to create bluff and timing play.

## High-Level Flow per Turn
1. Player issues commands (build, queue, attack, scan, end).
2. End-of-turn resolution (for all players simultaneously):
   - Resource income and upkeep
   - Structure completion
   - Ship production progress/completion
   - Fleet mission timeline updates (depart → battle → return → arrive)
   - Combat resolution for missions reaching battle timing
3. Start next turn with updated state. Ships on missions are absent from home defense until they arrive.

## Defaults & Initial Conditions
- Start state: 0 ships, 0 structures.
- Base income per turn: 10,000 Metal, 10,000 Energy.
- No hard turn limit (target finish: 10–20 turns).
- No fleet cap. No mission recall. Survivors of failed attacks retreat and return on the standard timeline.
- Strict command parser (well-defined grammar; helpful errors). Mobile-friendly CLI-like UI.

## Balance Snapshot (Provisional)
These values are initial and subject to modeling and playtest adjustments.
- Structures: +2,500/turn for their resource; 1-turn build; escalating costs (~×1.35 per prior structure).
- Ship costs and build times tuned so Dreadnoughts require 3 turns, Frigates 2, Skiffs 1.
- Upkeep: small on Skiffs, moderate on Frigates, high on Dreadnoughts; doubled per unit while under construction.
- Combat: rock–paper–scissors multipliers with ±12% variance applied at resolution.

See detailed specifications in sibling documents.
