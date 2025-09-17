# Scanning

Defines scan levels, costs, outputs, and constraints.

## Levels and Costs (Energy only)
- Basic Scan: 2,000 E
- Deep Scan: 6,000 E
- Advanced Scan: 12,000 E

Costs are paid at end-of-turn when the scan is committed. Scans are the only action whose information is produced the same turn they are issued (at end-of-turn).

## Information Revealed
- Basic:
  - Target’s at-home fleet counts by ship type (ships currently on missions are not shown).
- Deep:
  - Everything in Basic
  - Estimated income bands for Metal and Energy (Low/Medium/High)
  - Rough structure counts (bucketed ranges, e.g., 0, 1–3, 4–6, 7+)
- Advanced:
  - Everything in Deep
  - AI persona (Aggressive / Turtle / Skirmisher)
  - Next-turn intent hint (e.g., likely build economy / likely attack)

## Constraints
- Scans reveal planet-only information. Outbound or returning fleets are never shown.
- No cooldown; Energy cost is the limiter.
- Results are delivered at end-of-turn.

## Interaction with Other Systems
- Costs are accounted for during end-of-turn resolution before income is added (see Turns and Actions).
- Scan results are used to inform attack timing and composition decisions; they do not modify combat or economy directly.
