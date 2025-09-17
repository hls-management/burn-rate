# Turns and Actions

This document specifies the allowed player actions, the strict processing order at end of turn, and the multi-turn mission timeline for attacks.

## Player Actions (per turn)
- build <mine|reactor> <count>
- queue <skiff|frigate|dreadnought> <count>
- attack <player> [composition pairs...] (e.g., `attack p2 skiff 150 frigate 20`)
- scan <player> <basic|deep|advanced>
- end

Actions can be issued in any order during the turn, but they have no effect until end-of-turn resolution, with the exception that the UI displays projected income and upkeep immediately based on current commitments.

## Processing Order (End of Turn)
For all players simultaneously, the following steps are resolved in order:
1. Apply build costs for structures committed this turn (structures complete at the end of this step if their build time is 1 turn; their income applies starting next turn).
2. Apply ship queue costs for new production orders; initialize or advance production progress on all queued items. Units under construction pay 2× upkeep for this step.
3. Calculate resource income (base income + completed structures’ yields) and subtract ship upkeep (including doubled upkeep for under-construction units accounted in step 2).
4. Complete ship builds whose production progress meets or exceeds required build time; completed ships join the home garrison immediately after income resolution.
5. Advance fleet missions:
   - Newly declared attacks transition to “departed” state; ships leave home and are no longer available for defense starting next turn (see timeline below).
   - Missions scheduled for battle this turn resolve combat (see Combat spec) at this point.
   - Missions scheduled to arrive home this turn rejoin the home garrison.
6. Check victory: any player with 0 ships at home at their battle resolution and losing the battle is eliminated; if both sides reach 0, defender survives.

## Attack Mission Timeline
When an attack is declared on turn T:
- Turn T: mission created (no immediate departure until after end-of-turn processing). Ships are still present for defense this turn.
- Turn T+1 (after EoT processing): ships are off-planet (absent from home defense). No combat yet.
- Turn T+2 (after EoT processing): battle resolves at the defender’s planet.
- Turn T+3 (after EoT processing): returning in transit.
- Turn T+4 (after EoT processing): attackers arrive home and rejoin home garrison.

Notes:
- No mission recall.
- Multiple concurrent attack missions are allowed (no cap). Each reserves its declared ships when the mission is created; those ships leave at the T→T+1 transition.
- Survivors of failed attacks retreat and follow the standard return timeline.

## Command Semantics
- Commands are validated strictly; on error the command is rejected with a clear message.
- Builds and queues are accepted only if sufficient resources exist to pay costs at end-of-turn. The UI shows projected post-cost resources and upkeep.
- Attacks can only send ships currently at home and not already reserved by another mission.
- Scans consume Energy immediately at end-of-turn and reveal only planet-only information for the target (see Scanning spec).

## Turn Boundaries
All players commit actions for the turn; then one global end-of-turn resolution applies the steps above simultaneously to all players. This removes initiative advantages and focuses strategy on timing and scouting rather than action order.
