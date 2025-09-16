import { GameState, FleetComposition, CombatEvent } from '../models/GameState.js';
import { PlayerState } from '../models/PlayerState.js';
import { CommandExecutionResult } from '../ui/GameController.js';
import { WebErrorHandler } from './WebErrorHandler.js';

export interface WebDisplayConfig {
  containerId: string;
  showAnimations?: boolean;
  theme?: 'dark' | 'light';
  compactMode?: boolean;
  updateThrottleMs?: number;
}

export class WebDisplay {
  private config: WebDisplayConfig;
  private container: HTMLElement | null = null;
  private lastGameState: GameState | null = null;
  private updateQueue: Array<() => void> = [];
  private isUpdating: boolean = false;
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;

  constructor(config: WebDisplayConfig) {
    this.config = {
      updateThrottleMs: 16, // 60fps by default
      ...config
    };
    this.container = document.getElementById(config.containerId);
    
    if (!this.container) {
      const error = new Error(`Container element with id '${config.containerId}' not found`);
      WebErrorHandler.handleDOMError(error, `#${config.containerId}`, { operation: 'WebDisplay initialization' });
      throw error;
    }

    // Set up efficient update handling
    this.setupUpdateHandling();
  }

  /**
   * Sets up efficient update handling with throttling and batching
   */
  private setupUpdateHandling(): void {
    // Use requestAnimationFrame for smooth updates
    const processUpdateQueue = () => {
      if (this.updateQueue.length === 0) {
        this.isUpdating = false;
        this.animationFrameId = null;
        return;
      }

      const now = performance.now();
      if (now - this.lastUpdateTime < (this.config.updateThrottleMs || 16)) {
        this.animationFrameId = requestAnimationFrame(processUpdateQueue);
        return;
      }

      // Process all queued updates in a single frame
      const updates = [...this.updateQueue];
      this.updateQueue = [];
      
      updates.forEach(update => {
        try {
          update();
        } catch (error) {
          console.error('Update error:', error);
          if (error instanceof Error) {
            WebErrorHandler.handleDOMError(error, '.game-display', { operation: 'update queue processing' });
          }
        }
      });

      this.lastUpdateTime = now;
      
      if (this.updateQueue.length > 0) {
        this.animationFrameId = requestAnimationFrame(processUpdateQueue);
      } else {
        this.isUpdating = false;
        this.animationFrameId = null;
      }
    };

    // Start the update loop when needed
    this.startUpdateLoop = () => {
      if (!this.isUpdating) {
        this.isUpdating = true;
        this.animationFrameId = requestAnimationFrame(processUpdateQueue);
      }
    };
  }

  private startUpdateLoop!: () => void;

  /**
   * Queues an update for efficient batched processing
   */
  private queueUpdate(updateFn: () => void): void {
    this.updateQueue.push(updateFn);
    this.startUpdateLoop();
  }

  /**
   * Displays the main game state information with efficient updates
   */
  public displayGameState(gameState: GameState): void {
    if (!this.container) return;

    // Queue the update for efficient processing
    this.queueUpdate(() => {
      try {
        // Only update changed parts for efficiency
        this.updateChangedElements(gameState);
        
        // Store current state for next comparison
        this.lastGameState = { ...gameState };
        
      } catch (error) {
        console.error('Error displaying game state:', error);
        if (error instanceof Error) {
          WebErrorHandler.handleDOMError(error, '.game-display', { operation: 'displayGameState', gameState });
        }
        this.displayError('Failed to update game display');
      }
    });
  }

  /**
   * Updates only the elements that have changed since last update
   */
  private updateChangedElements(gameState: GameState): void {
    const lastState = this.lastGameState;

    // Always update turn and phase info (these change frequently)
    this.updateTurnInfo(gameState);

    // Update resources if changed
    if (!lastState || this.hasResourcesChanged(lastState.player.resources, gameState.player.resources)) {
      this.updateResourceDisplayWithAnimation(gameState.player.resources);
    }

    // Update fleet if changed
    if (!lastState || this.hasFleetChanged(lastState.player.fleet, gameState.player.fleet)) {
      this.updateFleetDisplayWithAnimation(gameState.player);
    }

    // Update attack panel fleet counts if home fleet changed
    if (!lastState || this.hasHomeFleetChanged(lastState.player.fleet.homeSystem, gameState.player.fleet.homeSystem)) {
      this.updateAttackPanelFleetCounts(gameState.player.fleet.homeSystem);
    }

    // Update game status indicators if changed
    if (!lastState || lastState.isGameOver !== gameState.isGameOver) {
      this.updateGameStatusIndicators(gameState);
    }
  }

  /**
   * Checks if resources have changed significantly
   */
  private hasResourcesChanged(oldResources: any, newResources: any): boolean {
    return oldResources.metal !== newResources.metal ||
           oldResources.energy !== newResources.energy ||
           oldResources.metalIncome !== newResources.metalIncome ||
           oldResources.energyIncome !== newResources.energyIncome;
  }

  /**
   * Checks if fleet composition has changed
   */
  private hasFleetChanged(oldFleet: any, newFleet: any): boolean {
    return this.hasHomeFleetChanged(oldFleet.homeSystem, newFleet.homeSystem) ||
           oldFleet.inTransit.outbound.length !== newFleet.inTransit.outbound.length;
  }

  /**
   * Checks if home fleet composition has changed
   */
  private hasHomeFleetChanged(oldHome: any, newHome: any): boolean {
    return oldHome.frigates !== newHome.frigates ||
           oldHome.cruisers !== newHome.cruisers ||
           oldHome.battleships !== newHome.battleships;
  }

  /**
   * Updates resource display with smooth animations
   */
  private updateResourceDisplayWithAnimation(resources: any): void {
    const resourcesDisplay = this.container?.querySelector('#resources-display');
    if (!resourcesDisplay) return;

    // Create new content
    const newContent = `
      <div class="resource-item metal-display ${resources.metal < 1000 ? 'warning' : ''}">
        <div class="resource-icon">⚙️</div>
        <div class="resource-info">
          <div class="resource-name">Metal</div>
          <div class="resource-amount metal-amount">${this.formatNumber(resources.metal)}</div>
          <div class="resource-income metal-income ${resources.metalIncome <= 0 ? 'stalled' : ''}">${this.formatIncome(resources.metalIncome)}/turn</div>
        </div>
      </div>
      <div class="resource-item energy-display ${resources.energy < 1000 ? 'warning' : ''}">
        <div class="resource-icon">⚡</div>
        <div class="resource-info">
          <div class="resource-name">Energy</div>
          <div class="resource-amount energy-amount">${this.formatNumber(resources.energy)}</div>
          <div class="resource-income energy-income ${resources.energyIncome <= 0 ? 'stalled' : ''}">${this.formatIncome(resources.energyIncome)}/turn</div>
        </div>
      </div>
    `;

    // Apply with animation if enabled
    if (this.config.showAnimations) {
      this.updateWithFadeTransition(resourcesDisplay, newContent);
    } else {
      resourcesDisplay.innerHTML = newContent;
    }
  }

  /**
   * Updates fleet display with smooth animations
   */
  private updateFleetDisplayWithAnimation(player: PlayerState): void {
    const fleetDisplay = this.container?.querySelector('#fleet-display');
    if (!fleetDisplay) return;

    const homeFleet = player.fleet.homeSystem;
    const totalHome = homeFleet.frigates + homeFleet.cruisers + homeFleet.battleships;
    
    const newContent = `
      <div class="fleet-summary">
        <div class="fleet-total">
          <strong>Home Fleet: ${this.formatNumber(totalHome)} ships</strong>
        </div>
        <div class="fleet-breakdown">
          <div class="unit-count">
            <span class="unit-icon">🚀</span>
            <span class="unit-name">Frigates:</span>
            <span class="frigates-count">${this.formatNumber(homeFleet.frigates)}</span>
          </div>
          <div class="unit-count">
            <span class="unit-icon">🛸</span>
            <span class="unit-name">Cruisers:</span>
            <span class="cruisers-count">${this.formatNumber(homeFleet.cruisers)}</span>
          </div>
          <div class="unit-count">
            <span class="unit-icon">🚁</span>
            <span class="unit-name">Battleships:</span>
            <span class="battleships-count">${this.formatNumber(homeFleet.battleships)}</span>
          </div>
        </div>
      </div>
      <div class="fleets-in-transit">
        <h5>Fleets in Transit</h5>
        <div class="transit-fleets">
          ${this.renderInTransitFleets(player.fleet.inTransit.outbound)}
        </div>
      </div>
      <div class="construction-queue">
        <h5>Construction Queue</h5>
        ${this.renderConstructionQueue(player.economy.constructionQueue)}
      </div>
      <div class="intelligence-panel">
        <h5>Intelligence</h5>
        ${this.renderIntelligenceInfo(player.intelligence)}
      </div>
    `;

    // Apply with animation if enabled
    if (this.config.showAnimations) {
      this.updateWithSlideTransition(fleetDisplay, newContent);
    } else {
      fleetDisplay.innerHTML = newContent;
    }
  }

  /**
   * Updates element content with fade transition
   */
  private updateWithFadeTransition(element: Element, newContent: string): void {
    element.classList.add('updating');
    
    setTimeout(() => {
      element.innerHTML = newContent;
      element.classList.remove('updating');
      element.classList.add('updated');
      
      setTimeout(() => {
        element.classList.remove('updated');
      }, 300);
    }, 150);
  }

  /**
   * Updates element content with slide transition
   */
  private updateWithSlideTransition(element: Element, newContent: string): void {
    element.classList.add('slide-out');
    
    setTimeout(() => {
      element.innerHTML = newContent;
      element.classList.remove('slide-out');
      element.classList.add('slide-in');
      
      setTimeout(() => {
        element.classList.remove('slide-in');
      }, 300);
    }, 150);
  }

  /**
   * Displays combat results and events with smooth animations
   */
  public displayCombatResults(events: CombatEvent[]): void {
    if (!this.container || events.length === 0) return;

    // Queue combat updates for smooth processing
    this.queueUpdate(() => {
      this.processCombatEvents(events);
    });
  }

  /**
   * Processes combat events with staggered animations
   */
  private processCombatEvents(events: CombatEvent[]): void {
    const combatEventsContainer = this.container?.querySelector('#combat-events');
    if (!combatEventsContainer) return;

    events.forEach((event, index) => {
      // Stagger the display of multiple events for better UX
      setTimeout(() => {
        this.displaySingleCombatEvent(event, combatEventsContainer);
      }, index * 500); // 500ms delay between events
    });

    // Limit log size to prevent memory issues
    setTimeout(() => {
      this.limitLogSize(combatEventsContainer, 50);
    }, events.length * 500 + 1000);
  }

  /**
   * Displays a single combat event with animation
   */
  private displaySingleCombatEvent(event: CombatEvent, container: Element): void {
    const eventElement = this.createCombatEventElement(event);
    
    if (this.config.showAnimations) {
      // Add with slide-in animation
      eventElement.classList.add('combat-event-entering');
      container.appendChild(eventElement);
      
      // Trigger animation
      setTimeout(() => {
        eventElement.classList.remove('combat-event-entering');
        eventElement.classList.add('combat-event-entered');
      }, 50);
      
      // Scroll to show latest event after animation
      setTimeout(() => {
        eventElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 300);
    } else {
      container.appendChild(eventElement);
      eventElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Displays error messages to the user
   */
  public displayError(message: string): void {
    this.showMessage(message, 'error');
  }

  /**
   * Displays success messages to the user
   */
  public displaySuccess(message: string): void {
    this.showMessage(message, 'success');
  }

  /**
   * Initializes the command interface in the existing HTML structure
   */
  public initializeCommandInterface(): void {
    if (!this.container) return;

    // Initialize tab functionality
    this.initializeCommandTabs();
    
    // Populate command panels
    this.populateCommandPanels();
  }

  /**
   * Updates resource display with current values (legacy method for compatibility)
   */
  public updateResourceDisplay(resources: any): void {
    this.queueUpdate(() => {
      this.updateResourceDisplayWithAnimation(resources);
    });
  }

  /**
   * Handles concurrent state changes by debouncing rapid updates
   */
  public handleConcurrentStateChange(gameState: GameState): void {
    // Cancel any pending updates for the same state
    this.debouncedDisplayGameState(gameState);
  }

  /**
   * Debounced version of displayGameState to handle rapid updates
   */
  private debouncedDisplayGameState = this.debounce((gameState: GameState) => {
    this.displayGameState(gameState);
  }, 50); // 50ms debounce

  /**
   * Debounce utility function
   */
  private debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  }

  /**
   * Handles user interaction feedback with immediate visual response
   */
  public handleUserInteractionFeedback(action: string, success: boolean): void {
    this.queueUpdate(() => {
      this.showInteractionFeedback(action, success);
    });
  }

  /**
   * Shows immediate visual feedback for user interactions
   */
  private showInteractionFeedback(action: string, success: boolean): void {
    const feedbackElement = document.createElement('div');
    feedbackElement.className = `interaction-feedback ${success ? 'success' : 'error'}`;
    feedbackElement.textContent = success ? `${action} successful` : `${action} failed`;
    
    // Position near the relevant UI element
    const actionButton = this.container?.querySelector(`[data-action="${action}"]`);
    if (actionButton) {
      const rect = actionButton.getBoundingClientRect();
      feedbackElement.style.position = 'fixed';
      feedbackElement.style.left = `${rect.left}px`;
      feedbackElement.style.top = `${rect.top - 30}px`;
      feedbackElement.style.zIndex = '1000';
    }
    
    document.body.appendChild(feedbackElement);
    
    // Animate and remove
    if (this.config.showAnimations) {
      feedbackElement.classList.add('feedback-entering');
      setTimeout(() => {
        feedbackElement.classList.add('feedback-leaving');
        setTimeout(() => {
          if (feedbackElement.parentNode) {
            feedbackElement.remove();
          }
        }, 300);
      }, 2000);
    } else {
      setTimeout(() => {
        if (feedbackElement.parentNode) {
          feedbackElement.remove();
        }
      }, 2000);
    }
  }

  /**
   * Optimizes DOM updates by using DocumentFragment for batch operations
   */
  private batchDOMUpdates(updates: Array<{ element: Element; content: string }>): void {
    const fragment = document.createDocumentFragment();
    
    updates.forEach(({ element, content }) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // Move all children to fragment
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }
      
      // Replace element content
      element.innerHTML = '';
      element.appendChild(fragment.cloneNode(true));
    });
  }

  /**
   * Cleans up resources and cancels pending updates
   */
  public cleanup(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.updateQueue = [];
    this.isUpdating = false;
    this.lastGameState = null;
  }  /**

   * Updates turn and phase information
   */
  private updateTurnInfo(gameState: GameState): void {
    this.updateElementText('.current-turn', gameState.turn.toString());
    this.updateElementText('.game-phase', gameState.gamePhase.toUpperCase());
    
    // Update phase indicator class
    const phaseIndicator = this.container?.querySelector('.phase-indicator');
    if (phaseIndicator) {
      phaseIndicator.className = `phase-indicator phase-${gameState.gamePhase}`;
    }
  }

  /**
   * Updates fleet display information
   */
  private updateFleetDisplay(player: PlayerState): void {
    const fleetDisplay = this.container?.querySelector('#fleet-display');
    if (!fleetDisplay) return;

    const homeFleet = player.fleet.homeSystem;
    const totalHome = homeFleet.frigates + homeFleet.cruisers + homeFleet.battleships;
    
    fleetDisplay.innerHTML = `
      <div class="fleet-summary">
        <div class="fleet-total">
          <strong>Home Fleet: ${this.formatNumber(totalHome)} ships</strong>
        </div>
        <div class="fleet-breakdown">
          <div class="unit-count">
            <span class="unit-icon">🚀</span>
            <span class="unit-name">Frigates:</span>
            <span class="frigates-count">${this.formatNumber(homeFleet.frigates)}</span>
          </div>
          <div class="unit-count">
            <span class="unit-icon">🛸</span>
            <span class="unit-name">Cruisers:</span>
            <span class="cruisers-count">${this.formatNumber(homeFleet.cruisers)}</span>
          </div>
          <div class="unit-count">
            <span class="unit-icon">🚁</span>
            <span class="unit-name">Battleships:</span>
            <span class="battleships-count">${this.formatNumber(homeFleet.battleships)}</span>
          </div>
        </div>
      </div>
      <div class="fleets-in-transit">
        <h5>Fleets in Transit</h5>
        <div class="transit-fleets">
          ${this.renderInTransitFleets(player.fleet.inTransit.outbound)}
        </div>
      </div>
      <div class="construction-queue">
        <h5>Construction Queue</h5>
        ${this.renderConstructionQueue(player.economy.constructionQueue)}
      </div>
      <div class="intelligence-panel">
        <h5>Intelligence</h5>
        ${this.renderIntelligenceInfo(player.intelligence)}
      </div>
    `;
  }



  private renderIntelligenceInfo(intelligence: any): string {
    if (intelligence.lastScanTurn === 0) {
      return '<div class="no-intel">No enemy scans performed</div>';
    }

    const turnsAgo = Math.max(0, intelligence.lastScanTurn);
    const knownFleet = intelligence.knownEnemyFleet;
    const totalKnown = knownFleet.frigates + knownFleet.cruisers + knownFleet.battleships;

    return `
      <div class="intel-summary">
        <div class="last-scan">Last scan: ${turnsAgo === 0 ? 'This turn' : `${turnsAgo} turns ago`}</div>
        ${totalKnown > 0 ? `
          <div class="known-fleet">
            <div class="fleet-title">Known Enemy Fleet (~${this.formatNumber(totalKnown)} ships):</div>
            <div class="fleet-breakdown">
              <div>🚀 Frigates: ~${this.formatNumber(knownFleet.frigates)}</div>
              <div>🛸 Cruisers: ~${this.formatNumber(knownFleet.cruisers)}</div>
              <div>🚁 Battleships: ~${this.formatNumber(knownFleet.battleships)}</div>
            </div>
            ${turnsAgo > 2 ? '<div class="intel-warning">⚠️ Intelligence data may be outdated</div>' : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Updates game status indicators
   */
  private updateGameStatusIndicators(gameState: GameState): void {
    // Update game over state
    this.toggleClass('.game-container', 'game-over', gameState.isGameOver);
    
    if (gameState.isGameOver) {
      this.showGameOverMessage(gameState);
    }
  }

  /**
   * Initializes command tabs functionality
   */
  private initializeCommandTabs(): void {
    const tabButtons = this.container?.querySelectorAll('.tab-button');
    if (!tabButtons) return;

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = (button as HTMLElement).dataset.tab;
        if (tabId) {
          this.switchTab(tabId);
        }
      });
    });
  }

  /**
   * Populates command panels with interactive forms
   */
  private populateCommandPanels(): void {
    // Populate build panel
    const buildPanel = this.container?.querySelector('#build-panel');
    if (buildPanel) {
      buildPanel.innerHTML = this.createBuildPanelContent();
      this.attachBuildPanelListeners(buildPanel);
    }

    // Populate attack panel
    const attackPanel = this.container?.querySelector('#attack-panel');
    if (attackPanel) {
      attackPanel.innerHTML = this.createAttackPanelContent();
      this.attachAttackPanelListeners(attackPanel);
    }

    // Populate scan panel
    const scanPanel = this.container?.querySelector('#scan-panel');
    if (scanPanel) {
      scanPanel.innerHTML = this.createScanPanelContent();
      this.attachScanPanelListeners(scanPanel);
    }
  } 
  /**
   * Creates build command panel content
   */
  private createBuildPanelContent(): string {
    return `
      <form data-action-type="build" class="build-form">
        <div class="form-section">
          <h3>Build Units</h3>
          <div class="build-options">
            <div class="build-option">
              <label>
                <input type="radio" name="buildType" value="frigate" checked>
                <span class="build-info">
                  <strong>Frigate</strong> (4 Metal, 2 Energy)
                  <small>Fast, effective vs Cruisers</small>
                </span>
              </label>
            </div>
            <div class="build-option">
              <label>
                <input type="radio" name="buildType" value="cruiser">
                <span class="build-info">
                  <strong>Cruiser</strong> (10 Metal, 6 Energy)
                  <small>Balanced, effective vs Battleships</small>
                </span>
              </label>
            </div>
            <div class="build-option">
              <label>
                <input type="radio" name="buildType" value="battleship">
                <span class="build-info">
                  <strong>Battleship</strong> (20 Metal, 12 Energy)
                  <small>Heavy, effective vs Frigates</small>
                </span>
              </label>
            </div>
          </div>
          <div class="quantity-input">
            <label for="unit-quantity">Quantity:</label>
            <input type="number" id="unit-quantity" name="quantity" value="1" min="1" max="1000">
          </div>
        </div>
        
        <div class="form-section">
          <h3>Build Structures</h3>
          <div class="build-options">
            <div class="build-option">
              <label>
                <input type="radio" name="buildType" value="reactor">
                <span class="build-info">
                  <strong>Reactor</strong> (900 Metal, 1200 Energy)
                  <small>+500 Energy/turn</small>
                </span>
              </label>
            </div>
            <div class="build-option">
              <label>
                <input type="radio" name="buildType" value="mine">
                <span class="build-info">
                  <strong>Mine</strong> (1500 Metal, 600 Energy)
                  <small>+500 Metal/turn</small>
                </span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="primary-button">Build</button>
          <div class="cost-display">
            <span class="total-cost">Total Cost: <span class="cost-amount">4 Metal, 2 Energy</span></span>
          </div>
        </div>
      </form>
    `;
  }

  /**
   * Attaches event listeners to build panel
   */
  private attachBuildPanelListeners(panel: Element): void {
    const form = panel.querySelector('form');
    if (form) {
      form.addEventListener('change', () => this.updateBuildCost(form));
      form.addEventListener('input', () => this.updateBuildCost(form));
    }
  }

  /**
   * Creates attack command panel content
   */
  private createAttackPanelContent(): string {
    return `
      <form data-action-type="attack" class="attack-form">
        <div class="form-section">
          <h3>Fleet Composition</h3>
          <div class="fleet-inputs">
            <div class="fleet-input">
              <label for="attack-frigates">Frigates:</label>
              <input type="number" id="attack-frigates" name="frigates" value="0" min="0">
              <span class="available">Available: <span class="frigates-available">0</span></span>
            </div>
            <div class="fleet-input">
              <label for="attack-cruisers">Cruisers:</label>
              <input type="number" id="attack-cruisers" name="cruisers" value="0" min="0">
              <span class="available">Available: <span class="cruisers-available">0</span></span>
            </div>
            <div class="fleet-input">
              <label for="attack-battleships">Battleships:</label>
              <input type="number" id="attack-battleships" name="battleships" value="0" min="0">
              <span class="available">Available: <span class="battleships-available">0</span></span>
            </div>
          </div>
          
          <div class="fleet-summary">
            <div class="total-ships">Total Ships: <span class="attack-total">0</span></div>
            <div class="fleet-effectiveness">
              <div class="effectiveness-tip">
                💡 Frigates > Cruisers > Battleships > Frigates
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h3>Target</h3>
          <div class="target-selection">
            <label>
              <input type="radio" name="target" value="enemy" checked>
              <span>Enemy Home System</span>
            </label>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="primary-button danger">Launch Attack</button>
          <div class="attack-info">
            <small>Fleet will arrive next turn and return in 3 turns</small>
          </div>
        </div>
      </form>
    `;
  }

  /**
   * Attaches event listeners to attack panel
   */
  private attachAttackPanelListeners(panel: Element): void {
    const form = panel.querySelector('form');
    if (form) {
      form.addEventListener('input', () => this.updateAttackTotal(form));
    }
  }

  /**
   * Updates available fleet counts in attack panel
   */
  public updateAttackPanelFleetCounts(homeFleet: any): void {
    if (!this.container) return;

    const attackPanel = this.container.querySelector('#attack-panel');
    if (!attackPanel) return;

    const frigatesAvailable = attackPanel.querySelector('.frigates-available');
    const cruisersAvailable = attackPanel.querySelector('.cruisers-available');
    const battleshipsAvailable = attackPanel.querySelector('.battleships-available');

    if (frigatesAvailable) frigatesAvailable.textContent = this.formatNumber(homeFleet.frigates);
    if (cruisersAvailable) cruisersAvailable.textContent = this.formatNumber(homeFleet.cruisers);
    if (battleshipsAvailable) battleshipsAvailable.textContent = this.formatNumber(homeFleet.battleships);
  }

  /**
   * Creates scan command panel content
   */
  private createScanPanelContent(): string {
    return `
      <form data-action-type="scan" class="scan-form">
        <div class="form-section">
          <h3>Intelligence Scans</h3>
          <div class="scan-options">
            <div class="scan-option">
              <label>
                <input type="radio" name="scanType" value="basic" checked>
                <span class="scan-info">
                  <strong>Basic Scan</strong> (1,000 Energy)
                  <small>Total enemy fleet count (±30% accuracy)</small>
                </span>
              </label>
            </div>
            <div class="scan-option">
              <label>
                <input type="radio" name="scanType" value="deep">
                <span class="scan-info">
                  <strong>Deep Scan</strong> (2,500 Energy)
                  <small>Unit composition + economy (±10% accuracy)</small>
                </span>
              </label>
            </div>
            <div class="scan-option">
              <label>
                <input type="radio" name="scanType" value="advanced">
                <span class="scan-info">
                  <strong>Advanced Scan</strong> (4,000 Energy)
                  <small>Strategic intent analysis</small>
                </span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="primary-button">Perform Scan</button>
          <div class="scan-cost">
            <span class="energy-cost">Cost: <span class="cost-amount">1,000 Energy</span></span>
          </div>
        </div>
      </form>
    `;
  }

  /**
   * Attaches event listeners to scan panel
   */
  private attachScanPanelListeners(panel: Element): void {
    const form = panel.querySelector('form');
    if (form) {
      form.addEventListener('change', () => this.updateScanCost(form));
    }
  }

  /**
   * Helper methods for DOM manipulation
   */
  private updateElementText(selector: string, text: string): void {
    const element = this.container?.querySelector(selector);
    if (element) {
      element.textContent = text;
    }
  }

  private toggleClass(selector: string, className: string, condition: boolean): void {
    const element = this.container?.querySelector(selector);
    if (element) {
      element.classList.toggle(className, condition);
    }
  }

  private showMessage(message: string, type: 'error' | 'success' | 'info' = 'info'): void {
    // Use the system messages container for displaying messages
    const systemLog = this.container?.querySelector('#system-log');
    if (!systemLog) return;

    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    
    // Add timestamp and icon based on type
    const timestamp = new Date().toLocaleTimeString();
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    
    messageElement.innerHTML = `
      <span class="message-time">${timestamp}</span>
      <span class="message-icon">${icon}</span>
      <span class="message-text">${message}</span>
    `;

    systemLog.appendChild(messageElement);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.remove();
      }
    }, 5000);

    // Add click to dismiss
    messageElement.addEventListener('click', () => {
      messageElement.remove();
    });

    // Scroll to show latest message
    messageElement.scrollIntoView({ behavior: 'smooth' });

    // Limit log size to prevent memory issues
    this.limitLogSize(systemLog, 20);
  }

  private switchTab(tabId: string): void {
    // Update tab buttons
    const tabButtons = this.container?.querySelectorAll('.tab-button');
    tabButtons?.forEach(button => {
      const htmlButton = button as HTMLElement;
      htmlButton.classList.toggle('active', htmlButton.dataset.tab === tabId);
    });

    // Update panels
    const panels = this.container?.querySelectorAll('.command-panel');
    panels?.forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabId}-panel`);
    });
  }

  private updateBuildCost(form: HTMLFormElement): void {
    const formData = new FormData(form);
    const buildType = formData.get('buildType') as string;
    const quantity = parseInt(formData.get('quantity') as string) || 1;

    const costs = this.getBuildCosts(buildType);
    const totalMetal = costs.metal * quantity;
    const totalEnergy = costs.energy * quantity;

    const costDisplay = form.querySelector('.cost-amount');
    if (costDisplay) {
      costDisplay.textContent = `${this.formatNumber(totalMetal)} Metal, ${this.formatNumber(totalEnergy)} Energy`;
    }
  }

  private updateAttackTotal(form: HTMLFormElement): void {
    const formData = new FormData(form);
    const frigates = parseInt(formData.get('frigates') as string) || 0;
    const cruisers = parseInt(formData.get('cruisers') as string) || 0;
    const battleships = parseInt(formData.get('battleships') as string) || 0;
    const total = frigates + cruisers + battleships;

    const totalDisplay = form.querySelector('.attack-total');
    if (totalDisplay) {
      totalDisplay.textContent = total.toString();
    }
  }

  private updateScanCost(form: HTMLFormElement): void {
    const formData = new FormData(form);
    const scanType = formData.get('scanType') as string;

    const costs = {
      basic: 1000,
      deep: 2500,
      advanced: 4000
    };

    const cost = costs[scanType as keyof typeof costs] || 1000;
    const costDisplay = form.querySelector('.cost-amount');
    if (costDisplay) {
      costDisplay.textContent = `${this.formatNumber(cost)} Energy`;
    }
  }

  private getBuildCosts(buildType: string): { metal: number; energy: number } {
    const costs = {
      frigate: { metal: 4, energy: 2 },
      cruiser: { metal: 10, energy: 6 },
      battleship: { metal: 20, energy: 12 },
      reactor: { metal: 900, energy: 1200 },
      mine: { metal: 1500, energy: 600 }
    };

    return costs[buildType as keyof typeof costs] || { metal: 0, energy: 0 };
  }

  private formatNumber(num: number): string {
    return num.toLocaleString();
  }

  private formatIncome(income: number): string {
    const sign = income >= 0 ? '+' : '';
    return `${sign}${this.formatNumber(income)}`;
  }

  private createCombatEventElement(event: CombatEvent): HTMLElement {
    const eventElement = document.createElement('div');
    eventElement.className = 'combat-event';
    
    const attackerName = event.attacker === 'player' ? 'YOUR' : 'ENEMY';
    const defenderName = event.attacker === 'player' ? 'ENEMY' : 'YOUR';
    
    eventElement.innerHTML = `
      <div class="combat-header">
        <span class="combat-turn">Turn ${event.turn}</span>
        <span class="combat-title">${attackerName} FLEET ATTACKS ${defenderName} SYSTEM</span>
      </div>
      <div class="combat-details">
        <div class="fleet-comparison">
          <div class="attacker-fleet">
            <strong>Attacker:</strong> ${this.formatFleetComposition(event.attackerFleet)}
          </div>
          <div class="defender-fleet">
            <strong>Defender:</strong> ${this.formatFleetComposition(event.defenderFleet)}
          </div>
        </div>
        <div class="combat-outcome ${event.outcome}">
          ${this.formatBattleOutcome(event.outcome)}
        </div>
        <div class="casualties">
          <div>Casualties: ${attackerName} lost ${this.getTotalShips(event.casualties.attacker)} ships, 
               ${defenderName} lost ${this.getTotalShips(event.casualties.defender)} ships</div>
        </div>
      </div>
    `;
    
    return eventElement;
  }

  private formatFleetComposition(fleet: FleetComposition): string {
    const total = fleet.frigates + fleet.cruisers + fleet.battleships;
    return `${total} ships (${fleet.frigates}F, ${fleet.cruisers}C, ${fleet.battleships}B)`;
  }

  private getTotalShips(fleet: FleetComposition): number {
    return fleet.frigates + fleet.cruisers + fleet.battleships;
  }

  private formatBattleOutcome(outcome: string): string {
    switch (outcome) {
      case 'decisive_attacker':
        return 'DECISIVE ATTACKER VICTORY';
      case 'decisive_defender':
        return 'DECISIVE DEFENDER VICTORY';
      case 'close_battle':
        return 'CLOSE BATTLE';
      default:
        return outcome.toUpperCase();
    }
  }

  private limitLogSize(container: Element, maxItems: number): void {
    const items = container.children;
    while (items.length > maxItems) {
      container.removeChild(items[0]);
    }
  }

  private renderInTransitFleets(outbound: any[]): string {
    if (outbound.length === 0) {
      return '<div class="no-transit">No fleets in transit</div>';
    }

    return outbound.map((movement, index) => {
      const totalShips = this.getTotalShips(movement.composition);
      return `
        <div class="transit-fleet">
          <span class="fleet-number">Fleet ${index + 1}:</span>
          <span class="fleet-size">${totalShips} ships</span>
          <span class="mission-type">${movement.missionType}</span>
          <span class="arrival-info">(arrives turn ${movement.arrivalTurn})</span>
        </div>
      `;
    }).join('');
  }

  private renderConstructionQueue(constructionQueue: any[]): string {
    if (constructionQueue.length === 0) {
      return '<div class="queue-empty">No construction in progress</div>';
    }

    return constructionQueue.map((order, index) => {
      const progress = this.getConstructionProgress(order);
      return `
        <div class="queue-item">
          <div class="queue-number">${index + 1}.</div>
          <div class="queue-details">
            <div class="queue-item-name">${order.quantity}x ${order.unitType}</div>
            <div class="queue-progress">${progress}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  private getConstructionProgress(order: any): string {
    const remaining = order.turnsRemaining;
    if (remaining === 1) {
      return 'Completes next turn';
    } else {
      return `${remaining} turns remaining`;
    }
  }



  private showGameOverMessage(gameState: GameState): void {
    const winner = gameState.winner;
    const victoryType = gameState.victoryType;
    
    const message = winner === 'player' ? 
      `🎉 VICTORY! You defeated the AI via ${victoryType} victory!` :
      `💀 DEFEAT! The AI defeated you via ${victoryType} victory!`;
    
    this.showMessage(message, winner === 'player' ? 'success' : 'error');
  }
}