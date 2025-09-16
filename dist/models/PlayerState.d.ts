import { FleetComposition } from './GameState.js';
import { Intelligence as IntelligenceData } from './Intelligence.js';
export type UnitType = 'frigate' | 'cruiser' | 'battleship';
export type StructureType = 'reactor' | 'mine';
export type BuildableType = UnitType | StructureType;
export interface Resources {
    metal: number;
    energy: number;
    metalIncome: number;
    energyIncome: number;
}
export interface BuildOrder {
    unitType: BuildableType;
    quantity: number;
    turnsRemaining: number;
    resourceDrainPerTurn: {
        metal: number;
        energy: number;
    };
}
export interface FleetMovement {
    composition: FleetComposition;
    target: string;
    arrivalTurn: number;
    returnTurn: number;
    missionType: 'outbound' | 'combat' | 'returning';
}
export interface Fleet {
    homeSystem: FleetComposition;
    inTransit: {
        outbound: FleetMovement[];
    };
}
export interface Economy {
    reactors: number;
    mines: number;
    constructionQueue: BuildOrder[];
}
export interface PlayerState {
    resources: Resources;
    fleet: Fleet;
    economy: Economy;
    intelligence: IntelligenceData;
}
//# sourceMappingURL=PlayerState.d.ts.map