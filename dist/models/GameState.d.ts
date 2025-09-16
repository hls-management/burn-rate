import { PlayerState } from './PlayerState.js';
export type GamePhase = 'early' | 'mid' | 'late' | 'endgame';
export interface CombatEvent {
    turn: number;
    attacker: 'player' | 'ai';
    attackerFleet: FleetComposition;
    defenderFleet: FleetComposition;
    outcome: 'decisive_attacker' | 'decisive_defender' | 'close_battle';
    casualties: {
        attacker: FleetComposition;
        defender: FleetComposition;
    };
    survivors: {
        attacker: FleetComposition;
        defender: FleetComposition;
    };
}
export interface FleetComposition {
    frigates: number;
    cruisers: number;
    battleships: number;
}
export interface GameState {
    turn: number;
    player: PlayerState;
    ai: PlayerState;
    combatLog: CombatEvent[];
    gamePhase: GamePhase;
    isGameOver: boolean;
    winner?: 'player' | 'ai';
    victoryType?: 'military' | 'economic';
    playerHasBeenAttacked?: boolean;
    aiHasBeenAttacked?: boolean;
}
//# sourceMappingURL=GameState.d.ts.map