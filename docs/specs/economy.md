# Economy

Defines resources, base income, structures, escalating costs, and upkeep rules.

## Resources
- Metal (M)
- Energy (E)

Both are produced per turn and consumed by structures, ship production, upkeep, and scans.

## Base Income
- 10,000 M/turn
- 10,000 E/turn

## Structures
- Mine: +2,500 M/turn; build time 1 turn; cannot be destroyed; abstract.
- Reactor: +2,500 E/turn; build time 1 turn; cannot be destroyed; abstract.

### Cost Escalation
Costs increase with the number already owned (soft cap). For the nth structure (where n is the current count before building), cost is:
- Mine: (15,000 M + 5,000 E) × 1.35^n
- Reactor: (15,000 E + 5,000 M) × 1.35^n

Values are rounded to the nearest integer at time of payment.

### Timing
- Paying the cost occurs at end-of-turn when committed.
- The new structure completes at end-of-turn (build time 1), but its income applies starting next turn.

## Upkeep
Ships incur upkeep each turn. Units under construction pay doubled upkeep each turn they remain in production.
- Skiff: 5 M + 5 E per turn
- Frigate: 35 M + 25 E per turn
- Dreadnought: 200 M + 125 E per turn

Upkeep is charged during end-of-turn income resolution. While building, upkeep is doubled for that unit until it completes.

## Scans
Scans consume Energy only at end-of-turn (see Scanning spec for costs and effects).
