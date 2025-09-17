# AI Personas

Defines three hard-coded AI personas for v1 and their baseline behaviors.

## Personas
- Aggressive
  - Early priority on Frigates; minimal economy beyond first 1–2 structures.
  - Frequent Basic scans to find empty windows.
  - Launches attacks when enemy at-home power is low, even at moderate risk.
- Turtle
  - Prioritizes economy (Mines/Reactors) for first several turns.
  - Builds Dreadnoughts midgame; avoids attacks unless significantly favored.
  - Uses Deep scans intermittently; rarely Advanced.
- Skirmisher
  - Heavy Skiff production, constant pressure with small to mid raids.
  - Uses Basic scans often; Advanced occasionally to read personas.
  - Exploits windows when enemy fleets are away.

## Decision Heuristics (Baseline)
- Economy vs Military ratio targets per persona and phase (early/mid/late) with simple thresholding on resource bank, upkeep headroom, and existing structure count.
- Attack decisions based on estimated effective power (own outbound + enemy at-home from last scan), factoring mission timeline risk.
- Scan frequency governed by Energy availability and uncertainty about enemy state (time since last scan, variance in outcomes).

## Difficulty Tuning Knobs
- Resource advantage multipliers (off by default in v1).
- Risk tolerance and randomness in decision thresholds.
- Scan aggressiveness and timing windows.

These are initial behaviors; further refinement and modeling will adjust thresholds and timings.
