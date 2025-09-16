import { GameState, FleetComposition } from '../models/GameState.js';
import { BuildableType, UnitType, StructureType } from '../models/PlayerState.js';
import { ScanType, SCAN_COSTS } from '../models/Intelligence.js';
import { WebInputHandler } from './WebInputHandler.js';

export interface CommandInterfaceConfig {
  containerId: string;
  onCommandSubmit: (command: any) => Promise<void>;
  onValidationUpdate?: (validation: any) => void;
}

export class CommandInterface {
  private container: HTMLElement;
  private webInputHandler: WebInputHandler;
  private config: CommandInterfaceConfig;
  private currentGameState: GameState | null = null;

  // Form elements
  private buildForm: HTMLFormElement | null = null;
  private attackForm: HTMLFormElement | null = null;
  private scanForm: HTMLFormElement | null = null;
  private endTurnBtn: HTMLButtonElement | null = null;

  // Build form elements
  private buildTypeSelect: HTMLSelectElement | null = null;
  private buildQuantityInput: HTMLInputElement | null = null;
  private buildCostDisplay: HTMLElement | null = null;
  private buildValidation: HTMLElement | null = null;
  private buildMaxBtn: HTMLButtonElement | null = null;

  // Attack form elements
  private attackFrigatesInput: HTMLInputElement | null = null;
  private attackCruisersInput: HTMLInputElement | null = null;
  private attackBattleshipsInput: HTMLInputElement | null = null;
  private attackTotalShips: HTMLElement | null = null;
  private attackFleetPower: HTMLElement | null = null;
  private attackValidation: HTMLElement | null = null;
  private attackAllBtn: HTMLButtonElement | null = null;
  private attackClearBtn: HTMLButtonElement | null = null;

  // Available fleet displays
  private frigatesAvailable: HTMLElement | null = null;
  private cruisersAvailable: HTMLElement | null = null;
  private battleshipsAvailable: HTMLElement | null = null;

  // Scan form elements
  private scanValidation: HTMLElement | null = null;
  private lastScanInfo: HTMLElement | null = null;
  private scanDataAge: HTMLElement | null = null;

  // Tab elements
  private tabButtons: NodeListOf<HTMLButtonElement> | null = null;
  private commandPanels: NodeListOf<HTMLElement> | null = null;

  constructor(webInputHandler: WebInputHandler, config: CommandInterfaceConfig) {
    this.webInputHandler = webInputHandler;
    this.config = config;
    
    const container = document.getElementById(config.containerId);
    if (!container) {
      throw new Error(`Container element with id '${config.containerId}' not found`);
    }
    this.container = container;
  }

  /**
   * Initializes the command interface
   */
  public initialize(): void {
    this.findElements();
    this.setupEventListeners();
    this.setupTabSwitching();
    this.initializeFormDefaults();
  }

  /**
   * Updates the interface with current game state
   */
  public updateGameState(gameState: GameState): void {
    this.currentGameState = gameState;
    this.updateResourceDisplays();
    this.updateFleetAvailability();
    this.updateIntelligenceInfo();
    this.validateAllForms();
  }

  /**
   * Finds all necessary DOM elements
   */
  private findElements(): void {
    // Forms
    this.buildForm = this.container.querySelector('#build-form');
    this.attackForm = this.container.querySelector('#attack-form');
    this.scanForm = this.container.querySelector('#scan-form');
    this.endTurnBtn = this.container.querySelector('#end-turn-btn');

    // Build form elements
    this.buildTypeSelect = this.container.querySelector('#build-type');
    this.buildQuantityInput = this.container.querySelector('#build-quantity');
    this.buildCostDisplay = this.container.querySelector('#build-cost-display');
    this.buildValidation = this.container.querySelector('#build-validation');
    this.buildMaxBtn = this.container.querySelector('#build-max-btn');

    // Attack form elements
    this.attackFrigatesInput = this.container.querySelector('#attack-frigates');
    this.attackCruisersInput = this.container.querySelector('#attack-cruisers');
    this.attackBattleshipsInput = this.container.querySelector('#attack-battleships');
    this.attackTotalShips = this.container.querySelector('#attack-total-ships');
    this.attackFleetPower = this.container.querySelector('#attack-fleet-power');
    this.attackValidation = this.container.querySelector('#attack-validation');
    this.attackAllBtn = this.container.querySelector('#attack-all-btn');
    this.attackClearBtn = this.container.querySelector('#attack-clear-btn');

    // Available fleet displays
    this.frigatesAvailable = this.container.querySelector('#frigates-available');
    this.cruisersAvailable = this.container.querySelector('#cruisers-available');
    this.battleshipsAvailable = this.container.querySelector('#battleships-available');

    // Scan form elements
    this.scanValidation = this.container.querySelector('#scan-validation');
    this.lastScanInfo = this.container.querySelector('#last-scan-info');
    this.scanDataAge = this.container.querySelector('#scan-data-age');

    // Tab elements
    this.tabButtons = this.container.querySelectorAll('.tab-button');
    this.commandPanels = this.container.querySelectorAll('.command-panel');
  }

  /**
   * Sets up event listeners for all interactive elements
   */
  private setupEventListeners(): void {
    // Form submissions
    if (this.buildForm) {
      this.buildForm.addEventListener('submit', this.handleBuildSubmit.bind(this));
    }
    if (this.attackForm) {
      this.attackForm.addEventListener('submit', this.handleAttackSubmit.bind(this));
    }
    if (this.scanForm) {
      this.scanForm.addEventListener('submit', this.handleScanSubmit.bind(this));
    }

    // End turn button
    if (this.endTurnBtn) {
      this.endTurnBtn.addEventListener('click', this.handleEndTurn.bind(this));
    }

    // Build form interactions
    if (this.buildTypeSelect) {
      this.buildTypeSelect.addEventListener('change', this.updateBuildCosts.bind(this));
    }
    if (this.buildQuantityInput) {
      this.buildQuantityInput.addEventListener('input', this.updateBuildCosts.bind(this));
      this.buildQuantityInput.addEventListener('input', this.validateBuildForm.bind(this));
    }
    if (this.buildMaxBtn) {
      this.buildMaxBtn.addEventListener('click', this.setBuildMaxAffordable.bind(this));
    }

    // Attack form interactions
    const attackInputs = [this.attackFrigatesInput, this.attackCruisersInput, this.attackBattleshipsInput];
    attackInputs.forEach(input => {
      if (input) {
        input.addEventListener('input', this.updateAttackSummary.bind(this));
        input.addEventListener('input', this.validateAttackForm.bind(this));
      }
    });

    if (this.attackAllBtn) {
      this.attackAllBtn.addEventListener('click', this.setAttackAllShips.bind(this));
    }
    if (this.attackClearBtn) {
      this.attackClearBtn.addEventListener('click', this.clearAttackForm.bind(this));
    }

    // Scan form interactions
    const scanRadios = this.container.querySelectorAll('input[name="scanType"]');
    scanRadios.forEach(radio => {
      radio.addEventListener('change', this.validateScanForm.bind(this));
    });
  }

  /**
   * Sets up tab switching functionality
   */
  private setupTabSwitching(): void {
    if (!this.tabButtons || !this.commandPanels) return;

    this.tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        if (!targetTab) return;

        // Update tab buttons
        this.tabButtons!.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update panels
        this.commandPanels!.forEach(panel => {
          panel.classList.remove('active');
          if (panel.id === `${targetTab}-panel`) {
            panel.classList.add('active');
          }
        });
      });
    });
  }

  /**
   * Initializes form default values
   */
  private initializeFormDefaults(): void {
    this.updateBuildCosts();
    this.updateAttackSummary();
  }

  /**
   * Handles build form submission
   */
  private async handleBuildSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.buildForm || !this.currentGameState) return;

    const formData = new FormData(this.buildForm);
    const result = this.webInputHandler.handleBuildForm(formData, this.currentGameState);

    if (result.success && result.command) {
      await this.config.onCommandSubmit(result.command);
    } else {
      this.displayValidationError('build', result.error || 'Build command failed');
    }
  }

  /**
   * Handles attack form submission
   */
  private async handleAttackSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.attackForm || !this.currentGameState) return;

    const formData = new FormData(this.attackForm);
    const result = this.webInputHandler.handleAttackForm(formData, this.currentGameState);

    if (result.success && result.command) {
      await this.config.onCommandSubmit(result.command);
    } else {
      this.displayValidationError('attack', result.error || 'Attack command failed');
    }
  }

  /**
   * Handles scan form submission
   */
  private async handleScanSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.scanForm || !this.currentGameState) return;

    const formData = new FormData(this.scanForm);
    const result = this.webInputHandler.handleScanForm(formData, this.currentGameState);

    if (result.success && result.command) {
      await this.config.onCommandSubmit(result.command);
    } else {
      this.displayValidationError('scan', result.error || 'Scan command failed');
    }
  }

  /**
   * Handles end turn button click
   */
  private async handleEndTurn(): Promise<void> {
    const command = { type: 'end_turn' };
    await this.config.onCommandSubmit(command);
  }

  /**
   * Updates build cost display based on current selection
   */
  private updateBuildCosts(): void {
    if (!this.buildTypeSelect || !this.buildQuantityInput || !this.buildCostDisplay) return;

    const buildType = this.buildTypeSelect.value as BuildableType;
    const quantity = parseInt(this.buildQuantityInput.value) || 1;

    const costs = this.getBuildCosts(buildType);
    const totalMetal = costs.metal * quantity;
    const totalEnergy = costs.energy * quantity;

    this.buildCostDisplay.textContent = `Cost: ${totalMetal.toLocaleString()} Metal, ${totalEnergy.toLocaleString()} Energy`;

    // Update upkeep info for units
    if (this.isUnitType(buildType)) {
      const upkeep = this.getUpkeepCosts(buildType as UnitType);
      const totalMetalUpkeep = upkeep.metal * quantity;
      const totalEnergyUpkeep = upkeep.energy * quantity;
      
      this.buildCostDisplay.textContent += ` | Upkeep: ${totalMetalUpkeep.toLocaleString()} Metal, ${totalEnergyUpkeep.toLocaleString()} Energy/turn`;
    }
  }

  /**
   * Sets build quantity to maximum affordable
   */
  private setBuildMaxAffordable(): void {
    if (!this.buildTypeSelect || !this.buildQuantityInput || !this.currentGameState) return;

    const buildType = this.buildTypeSelect.value as BuildableType;
    const costs = this.getBuildCosts(buildType);
    const player = this.currentGameState.player;

    const maxByMetal = Math.floor(player.resources.metal / costs.metal);
    const maxByEnergy = Math.floor(player.resources.energy / costs.energy);
    const maxAffordable = Math.min(maxByMetal, maxByEnergy);

    this.buildQuantityInput.value = Math.max(1, maxAffordable).toString();
    this.updateBuildCosts();
    this.validateBuildForm();
  }

  /**
   * Updates attack fleet summary
   */
  private updateAttackSummary(): void {
    if (!this.attackFrigatesInput || !this.attackCruisersInput || !this.attackBattleshipsInput) return;
    if (!this.attackTotalShips || !this.attackFleetPower) return;

    const frigates = parseInt(this.attackFrigatesInput.value) || 0;
    const cruisers = parseInt(this.attackCruisersInput.value) || 0;
    const battleships = parseInt(this.attackBattleshipsInput.value) || 0;

    const totalShips = frigates + cruisers + battleships;
    const fleetPower = this.calculateFleetPower({ frigates, cruisers, battleships });

    this.attackTotalShips.textContent = totalShips.toLocaleString();
    this.attackFleetPower.textContent = fleetPower.toLocaleString();
  }

  /**
   * Sets attack form to use all available ships
   */
  private setAttackAllShips(): void {
    if (!this.currentGameState) return;
    if (!this.attackFrigatesInput || !this.attackCruisersInput || !this.attackBattleshipsInput) return;

    const fleet = this.currentGameState.player.fleet.homeSystem;
    this.attackFrigatesInput.value = fleet.frigates.toString();
    this.attackCruisersInput.value = fleet.cruisers.toString();
    this.attackBattleshipsInput.value = fleet.battleships.toString();

    this.updateAttackSummary();
    this.validateAttackForm();
  }

  /**
   * Clears attack form
   */
  private clearAttackForm(): void {
    if (!this.attackFrigatesInput || !this.attackCruisersInput || !this.attackBattleshipsInput) return;

    this.attackFrigatesInput.value = '0';
    this.attackCruisersInput.value = '0';
    this.attackBattleshipsInput.value = '0';

    this.updateAttackSummary();
    this.validateAttackForm();
  }

  /**
   * Updates resource displays in forms
   */
  private updateResourceDisplays(): void {
    if (!this.currentGameState) return;

    // Update build form validation
    this.validateBuildForm();
    
    // Update scan form validation
    this.validateScanForm();
  }

  /**
   * Updates fleet availability displays
   */
  private updateFleetAvailability(): void {
    if (!this.currentGameState) return;
    if (!this.frigatesAvailable || !this.cruisersAvailable || !this.battleshipsAvailable) return;

    const fleet = this.currentGameState.player.fleet.homeSystem;
    this.frigatesAvailable.textContent = `Available: ${fleet.frigates.toLocaleString()}`;
    this.cruisersAvailable.textContent = `Available: ${fleet.cruisers.toLocaleString()}`;
    this.battleshipsAvailable.textContent = `Available: ${fleet.battleships.toLocaleString()}`;

    // Update max values for inputs
    if (this.attackFrigatesInput) {
      this.attackFrigatesInput.max = fleet.frigates.toString();
    }
    if (this.attackCruisersInput) {
      this.attackCruisersInput.max = fleet.cruisers.toString();
    }
    if (this.attackBattleshipsInput) {
      this.attackBattleshipsInput.max = fleet.battleships.toString();
    }
  }

  /**
   * Updates intelligence information display
   */
  private updateIntelligenceInfo(): void {
    if (!this.currentGameState) return;
    if (!this.lastScanInfo || !this.scanDataAge) return;

    const intel = this.currentGameState.player.intelligence;
    
    if (intel.lastScanTurn > 0) {
      this.lastScanInfo.textContent = `Turn ${intel.lastScanTurn}`;
      const dataAge = this.currentGameState.turn - intel.lastScanTurn;
      this.scanDataAge.textContent = dataAge === 0 ? 'Current' : `${dataAge} turns old`;
    } else {
      this.lastScanInfo.textContent = 'Never';
      this.scanDataAge.textContent = 'N/A';
    }
  }

  /**
   * Validates build form and displays feedback
   */
  private validateBuildForm(): void {
    if (!this.buildForm || !this.currentGameState || !this.buildValidation) return;

    const formData = new FormData(this.buildForm);
    const result = this.webInputHandler.handleBuildForm(formData, this.currentGameState);

    if (result.success) {
      this.buildValidation.textContent = '';
      this.buildValidation.className = 'validation-feedback';
    } else {
      this.buildValidation.textContent = result.error || 'Invalid build configuration';
      this.buildValidation.className = 'validation-feedback error';
    }
  }

  /**
   * Validates attack form and displays feedback
   */
  private validateAttackForm(): void {
    if (!this.attackForm || !this.currentGameState || !this.attackValidation) return;

    const formData = new FormData(this.attackForm);
    const result = this.webInputHandler.handleAttackForm(formData, this.currentGameState);

    if (result.success) {
      this.attackValidation.textContent = '';
      this.attackValidation.className = 'validation-feedback';
    } else {
      this.attackValidation.textContent = result.error || 'Invalid attack configuration';
      this.attackValidation.className = 'validation-feedback error';
    }
  }

  /**
   * Validates scan form and displays feedback
   */
  private validateScanForm(): void {
    if (!this.scanForm || !this.currentGameState || !this.scanValidation) return;

    const formData = new FormData(this.scanForm);
    const result = this.webInputHandler.handleScanForm(formData, this.currentGameState);

    if (result.success) {
      this.scanValidation.textContent = '';
      this.scanValidation.className = 'validation-feedback';
    } else {
      this.scanValidation.textContent = result.error || 'Invalid scan configuration';
      this.scanValidation.className = 'validation-feedback error';
    }
  }

  /**
   * Validates all forms
   */
  private validateAllForms(): void {
    this.validateBuildForm();
    this.validateAttackForm();
    this.validateScanForm();
  }

  /**
   * Displays validation error for a specific form
   */
  private displayValidationError(formType: string, error: string): void {
    let validationElement: HTMLElement | null = null;

    switch (formType) {
      case 'build':
        validationElement = this.buildValidation;
        break;
      case 'attack':
        validationElement = this.attackValidation;
        break;
      case 'scan':
        validationElement = this.scanValidation;
        break;
    }

    if (validationElement) {
      validationElement.textContent = error;
      validationElement.className = 'validation-feedback error';
    }
  }

  /**
   * Helper methods
   */
  private getBuildCosts(buildType: BuildableType): { metal: number; energy: number } {
    const costs = {
      frigate: { metal: 4, energy: 2 },
      cruiser: { metal: 10, energy: 6 },
      battleship: { metal: 20, energy: 12 },
      reactor: { metal: 900, energy: 1200 },
      mine: { metal: 1500, energy: 600 }
    };
    return costs[buildType] || { metal: 0, energy: 0 };
  }

  private getUpkeepCosts(unitType: UnitType): { metal: number; energy: number } {
    const upkeepCosts = {
      frigate: { metal: 2, energy: 1 },
      cruiser: { metal: 5, energy: 3 },
      battleship: { metal: 10, energy: 6 }
    };
    return upkeepCosts[unitType] || { metal: 0, energy: 0 };
  }

  private isUnitType(buildType: string): boolean {
    return ['frigate', 'cruiser', 'battleship'].includes(buildType);
  }

  private calculateFleetPower(fleet: FleetComposition): number {
    // Simple fleet power calculation (can be made more sophisticated)
    return fleet.frigates * 1 + fleet.cruisers * 3 + fleet.battleships * 8;
  }

  /**
   * Public methods for external control
   */
  public switchToTab(tabName: string): void {
    const targetButton = this.container.querySelector(`[data-tab="${tabName}"]`) as HTMLButtonElement;
    if (targetButton) {
      targetButton.click();
    }
  }

  public resetForms(): void {
    if (this.buildForm) this.buildForm.reset();
    if (this.attackForm) this.attackForm.reset();
    if (this.scanForm) this.scanForm.reset();
    
    this.initializeFormDefaults();
  }

  public setFormEnabled(enabled: boolean): void {
    const forms = [this.buildForm, this.attackForm, this.scanForm];
    forms.forEach(form => {
      if (form) {
        const inputs = form.querySelectorAll('input, select, button');
        inputs.forEach(input => {
          (input as HTMLInputElement | HTMLSelectElement | HTMLButtonElement).disabled = !enabled;
        });
      }
    });

    if (this.endTurnBtn) {
      this.endTurnBtn.disabled = !enabled;
    }
  }

  public getActiveTab(): string | null {
    const activeButton = this.container.querySelector('.tab-button.active') as HTMLButtonElement;
    return activeButton?.dataset.tab || null;
  }
}