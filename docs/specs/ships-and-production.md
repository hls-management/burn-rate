# Ships and Production

Defines ship classes, costs, upkeep, build times, and production rules.

## Ship Classes
- Skiff (small): fast to build, cheap, strong in aggregate versus Dreadnoughts, weak versus Frigates.
- Frigate (medium): generalist/counter to Skiffs, vulnerable to Dreadnoughts.
- Dreadnought (large): heavy unit, counters Frigates, vulnerable to massed Skiffs.

## Costs and Build Times
- Skiff: 100 M, 100 E; build time 1 turn
- Frigate: 700 M, 500 E; build time 2 turns
- Dreadnought: 4,000 M, 2,500 E; build time 3 turns

## Upkeep (per unit per turn)
- Skiff: 5 M + 5 E
- Frigate: 35 M + 25 E
- Dreadnought: 200 M + 125 E

While under construction, each unit pays 2× its upkeep each end-of-turn until it completes.

## Production Rules
- Queues: Players may queue any integer number of units per type, limited by available resources at end-of-turn to pay initial costs and sustain upkeep.
- Payment timing: Costs for new queue entries are paid at end-of-turn when committed.
- Progress: Each unit advances 1 build-turn per global end-of-turn. Upon reaching its required build time, it completes and joins the home garrison after income resolution.
- Concurrency: Production across ship types is parallel; there is no yard capacity limit.
- Cancellation: No undo/cancel in v1.
- Availability: Only completed ships at home can be assigned to new attack missions.

## Start State
- Players start with 0 ships and 0 structures.

See Combat spec for combat interactions and RPS multipliers.
