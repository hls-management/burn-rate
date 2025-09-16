export * from './GameState.js';
export * from './PlayerState.js';
export * from './validation.js';
export { UNIT_STATS, validateFleetComposition, validateFleetMovement, getTotalFleetSize, calculateFleetUpkeep, calculateFleetBuildCost, addFleetCompositions, subtractFleetCompositions, canAffordFleetComposition, createEmptyFleet, isFleetEmpty, calculateFleetStrength, createFleetMovement } from './Fleet.js';
export { STRUCTURE_STATS, BASE_INCOME, validateBuildOrder, validateConstructionQueue, calculateStructureCost, calculateStructureIncome, calculateConstructionDrain, calculateNetIncome, createStructureBuildOrder, createUnitBuildOrder, processConstructionQueue, canAffordBuildOrder, canSustainBuildOrder, calculateStructurePaybackTime, isStructureViable, createEmptyEconomy, getTotalStructures } from './Economy.js';
export { SCAN_COSTS } from './Intelligence.js';
export type { FleetValidationResult } from './Fleet.js';
export type { EconomyValidationResult } from './Economy.js';
export type { ScanType, ScanResult, ScanCosts } from './Intelligence.js';
//# sourceMappingURL=index.d.ts.map