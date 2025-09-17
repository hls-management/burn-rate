# Combat

Specifies combat resolution, rock–paper–scissors (RPS) relationships, randomness, and victory checks.

## Principles
- One aggregate, simultaneous exchange per battle for speed and clarity.
- RPS multipliers reward correct composition without requiring micromanagement.
- Randomness introduces uncertainty while keeping outcomes broadly predictable.

## RPS Multipliers (attacker effectiveness)
- Skiff vs Dreadnought: ×1.8
- Skiff vs Frigate: ×0.6
- Skiff vs Skiff: ×1.0

- Frigate vs Skiff: ×1.6
- Frigate vs Dreadnought: ×0.6
- Frigate vs Frigate: ×1.0

- Dreadnought vs Frigate: ×1.5
- Dreadnought vs Skiff: ×0.7
- Dreadnought vs Dreadnought: ×1.0

Values are provisional and subject to balancing.

## Effective Power
Each side’s effective power is the sum of contributions from each ship type against the enemy composition using the multipliers above.

A per-battle variance of ±12% is applied independently to each side’s effective power (uniform or normal RNG, TBD), then casualties are computed.

## Casualties
- Total damage dealt by a side equals its randomized effective power.
- Damage is allocated proportionally across enemy ship types weighted by counters (e.g., Skiff damage biases against Dreadnoughts). Round to integers with unbiased stochastic rounding if needed.
- Ships destroyed are removed from their owner’s home garrison (defender) or attacking fleet (attacker).

## Resolution Order (per battle)
1. Compute effective powers with RPS and apply randomness.
2. Allocate casualties to both sides simultaneously.
3. Remove destroyed ships.
4. Determine outcome:
   - If defender has 0 ships at home after casualties and attacker has >0, defender loses immediately.
   - If both attacker and defender reach 0, defender survives (attacker does not win).
   - Otherwise, if defender retains ships, attacker fails; surviving attackers retreat.

## Mission Outcomes
- Successful wipe: Attacker wins; defender eliminated.
- Failed attack: Surviving attackers retreat and follow return timeline; if all attackers destroyed, no return.

## Timing
- Battles occur at end-of-turn for missions scheduled for battle that turn (see Turns and Actions spec).

## Edge Cases
- If an attack reaches a defender with 0 ships at home at battle resolution, defender loses immediately.
- No interception; no partial skirmishes outside scheduled battle timing.

Further distribution rules and RNG details may be refined during balancing and modeling.
