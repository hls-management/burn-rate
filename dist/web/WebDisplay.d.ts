import { GameState, CombatEvent } from '../models/GameState.js';
export interface WebDisplayConfig {
    containerId: string;
    showAnimations?: boolean;
    theme?: 'dark' | 'light';
    compactMode?: boolean;
}
export declare class WebDisplay {
    private config;
    private container;
    constructor(config: WebDisplayConfig);
    /**
     * Displays the main game state information
     */
    displayGameState(gameState: GameState): void;
    /**
     * Displays combat results and events
     */
    displayCombatResults(events: CombatEvent[]): void;
    /**
     * Displays error messages to the user
     */
    displayError(message: string): void;
    /**
     * Displays success messages to the user
     */
    displaySuccess(message: string): void;
    /**
     * Initializes the command interface in the existing HTML structure
     */
    initializeCommandInterface(): void;
    /**
     * Updates resource display with current values
     */
    updateResourceDisplay(resources: any): void; /**
  
     * Updates turn and phase information
     */
    private updateTurnInfo;
    /**
     * Updates fleet display information
     */
    private updateFleetDisplay;
    private renderIntelligenceInfo;
    /**
     * Updates game status indicators
     */
    private updateGameStatusIndicators;
    /**
     * Initializes command tabs functionality
     */
    private initializeCommandTabs;
    /**
     * Populates command panels with interactive forms
     */
    private populateCommandPanels;
    /**
     * Creates build command panel content
     */
    private createBuildPanelContent;
    /**
     * Attaches event listeners to build panel
     */
    private attachBuildPanelListeners;
    /**
     * Creates attack command panel content
     */
    private createAttackPanelContent;
    /**
     * Attaches event listeners to attack panel
     */
    private attachAttackPanelListeners;
    /**
     * Updates available fleet counts in attack panel
     */
    updateAttackPanelFleetCounts(homeFleet: any): void;
    /**
     * Creates scan command panel content
     */
    private createScanPanelContent;
    /**
     * Attaches event listeners to scan panel
     */
    private attachScanPanelListeners;
    /**
     * Helper methods for DOM manipulation
     */
    private updateElementText;
    private toggleClass;
    private showMessage;
    private switchTab;
    private updateBuildCost;
    private updateAttackTotal;
    private updateScanCost;
    private getBuildCosts;
    private formatNumber;
    private formatIncome;
    private createCombatEventElement;
    private formatFleetComposition;
    private getTotalShips;
    private formatBattleOutcome;
    private limitLogSize;
    private renderInTransitFleets;
    private renderConstructionQueue;
    private getConstructionProgress;
    private showGameOverMessage;
}
//# sourceMappingURL=WebDisplay.d.ts.map