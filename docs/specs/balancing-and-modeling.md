# Balancing and Modeling

Outlines initial targets, assumptions, and open items to validate pacing and strategy diversity.

## Targets
- Typical game length: 10–20 turns (~5–10 minutes).
- No dominant strategy in first 10 turns among: eco rush, Skiff mass, Frigate pressure, Dreadnought tech.
- Early structures pay back in ~3–4 turns before escalation discourages over-investment.

## Initial Numbers (to simulate)
- Base income: 10,000 M/E per turn.
- Structures: +2,500/turn; cost = base × 1.35^n with base of 15,000 primary + 5,000 secondary resource; 1-turn build.
- Ships:
  - Skiff: 100 M, 100 E; upkeep 5/5; 1 turn
  - Frigate: 700 M, 500 E; upkeep 35/25; 2 turns
  - Dreadnought: 4,000 M, 2,500 E; upkeep 200/125; 3 turns
- Combat: RPS multipliers per Combat spec; ±12% variance.

## Modeling Questions
- Does Skiff mass overpower Dreadnoughts too efficiently given upkeep vs cost? Adjust multipliers or upkeep.
- Are Frigates sufficiently valuable as the mid-counter, or do they lag in cost-efficiency?
- Is the first Mine/Reactors payback aligned with intended timing windows for first attack?
- Do multi-turn missions create exploitable empty-home windows too frequently? Consider tweak to timeline or upkeep pressure.

## Levers
- Structure yield (+/- 500) and escalation factor (1.3–1.4).
- Upkeep per type (especially during construction 2× rule).
- Ship costs and build times (keep 1–2–3 turns cadence).
- RPS multipliers and variance range (10–15%).

## Success Criteria
- By turns 6–8, players can field either: ~60 Frigates, ~600 Skiffs, or ~15 Dreadnoughts only with dedicated focus (rough guidance); mixed comps perform better.
- Scans materially affect timing decisions; players can punish over-greed and empty-home states.

## Next Steps
- Implement a lightweight simulator to iterate on coefficients.
- Playtest against the three AI personas and adjust thresholds.

This document evolves with test results; changes will be reflected back into Economy/Ships/Combat specs as parameters firm up.
