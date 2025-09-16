/**
 * Help system for providing user guidance and tutorials
 */
export interface HelpContent {
  title: string;
  content: string;
  category: 'gameplay' | 'interface' | 'strategy' | 'tutorial';
  tags?: string[];
  relatedTopics?: string[];
}

export interface TooltipConfig {
  element: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: 'highlight' | 'click' | 'input' | 'wait';
  nextCondition?: () => boolean;
}

export interface HelpSystemConfig {
  containerId: string;
  enableTooltips?: boolean;
  enableTutorial?: boolean;
  showHelpButton?: boolean;
  tutorialAutoStart?: boolean;
}

/**
 * Comprehensive help system with modals, tooltips, and tutorials
 */
export class HelpSystem {
  private config: HelpSystemConfig;
  private container: HTMLElement | null = null;
  private helpModal: HTMLElement | null = null;
  private tooltips: Map<string, HTMLElement> = new Map();
  private currentTutorial: TutorialStep[] = [];
  private currentTutorialStep: number = 0;
  private tutorialOverlay: HTMLElement | null = null;
  private isHelpModalOpen: boolean = false;
  private isTutorialActive: boolean = false;

  constructor(config: HelpSystemConfig) {
    this.config = {
      enableTooltips: true,
      enableTutorial: true,
      showHelpButton: true,
      tutorialAutoStart: false,
      ...config
    };

    this.container = document.getElementById(config.containerId);
    if (!this.container) {
      console.warn(`Help system: Container element with id '${config.containerId}' not found`);
      return;
    }

    this.initialize();
  }

  /**
   * Initializes the help system
   */
  private initialize(): void {
    this.createHelpButton();
    this.createHelpModal();
    this.setupTooltips();
    this.setupKeyboardShortcuts();

    if (this.config.tutorialAutoStart && this.isFirstVisit()) {
      setTimeout(() => this.startTutorial(), 1000);
    }
  }

  /**
   * Creates the help button in the interface
   */
  private createHelpButton(): void {
    if (!this.config.showHelpButton || !this.container) return;

    const helpButton = document.createElement('button');
    helpButton.id = 'help-button';
    helpButton.className = 'help-button';
    helpButton.innerHTML = '❓';
    helpButton.title = 'Help & Tutorial (Press H)';
    helpButton.setAttribute('aria-label', 'Open help system');

    helpButton.addEventListener('click', () => this.showHelpModal());

    // Add to container or find existing help button location
    const existingHelpBtn = this.container.querySelector('#help-btn');
    if (existingHelpBtn) {
      existingHelpBtn.replaceWith(helpButton);
    } else {
      this.container.appendChild(helpButton);
    }
  }

  /**
   * Creates the main help modal
   */
  private createHelpModal(): void {
    if (!this.container) return;

    this.helpModal = document.createElement('div');
    this.helpModal.id = 'help-modal';
    this.helpModal.className = 'help-modal-overlay';
    this.helpModal.style.display = 'none';

    this.helpModal.innerHTML = `
      <div class="help-modal-content">
        <div class="help-modal-header">
          <h2>Burn Rate - Help & Guide</h2>
          <button class="help-modal-close" aria-label="Close help">&times;</button>
        </div>
        <div class="help-modal-body">
          <div class="help-navigation">
            <button class="help-nav-btn active" data-category="tutorial">Tutorial</button>
            <button class="help-nav-btn" data-category="gameplay">Gameplay</button>
            <button class="help-nav-btn" data-category="interface">Interface</button>
            <button class="help-nav-btn" data-category="strategy">Strategy</button>
          </div>
          <div class="help-content-area">
            <div id="help-content-tutorial" class="help-content-section active">
              ${this.getTutorialContent()}
            </div>
            <div id="help-content-gameplay" class="help-content-section">
              ${this.getGameplayContent()}
            </div>
            <div id="help-content-interface" class="help-content-section">
              ${this.getInterfaceContent()}
            </div>
            <div id="help-content-strategy" class="help-content-section">
              ${this.getStrategyContent()}
            </div>
          </div>
        </div>
        <div class="help-modal-footer">
          <button class="help-start-tutorial-btn">Start Interactive Tutorial</button>
          <button class="help-close-btn">Close</button>
        </div>
      </div>
    `;

    // Add event listeners
    this.setupHelpModalEvents();

    document.body.appendChild(this.helpModal);
  }

  /**
   * Sets up event listeners for the help modal
   */
  private setupHelpModalEvents(): void {
    if (!this.helpModal) return;

    // Close button
    const closeBtn = this.helpModal.querySelector('.help-modal-close');
    const closeFooterBtn = this.helpModal.querySelector('.help-close-btn');
    
    closeBtn?.addEventListener('click', () => this.hideHelpModal());
    closeFooterBtn?.addEventListener('click', () => this.hideHelpModal());

    // Navigation buttons
    const navButtons = this.helpModal.querySelectorAll('.help-nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = (e.target as HTMLElement).dataset.category;
        if (category) {
          this.switchHelpCategory(category);
        }
      });
    });

    // Tutorial start button
    const tutorialBtn = this.helpModal.querySelector('.help-start-tutorial-btn');
    tutorialBtn?.addEventListener('click', () => {
      this.hideHelpModal();
      this.startTutorial();
    });

    // Close on overlay click
    this.helpModal.addEventListener('click', (e) => {
      if (e.target === this.helpModal) {
        this.hideHelpModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isHelpModalOpen) {
        this.hideHelpModal();
      }
    });
  }

  /**
   * Shows the help modal
   */
  public showHelpModal(): void {
    if (!this.helpModal) return;

    this.helpModal.style.display = 'flex';
    this.isHelpModalOpen = true;
    
    // Focus management for accessibility
    const firstFocusable = this.helpModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      (firstFocusable as HTMLElement).focus();
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Hides the help modal
   */
  public hideHelpModal(): void {
    if (!this.helpModal) return;

    this.helpModal.style.display = 'none';
    this.isHelpModalOpen = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
  }

  /**
   * Switches help category in the modal
   */
  private switchHelpCategory(category: string): void {
    if (!this.helpModal) return;

    // Update navigation buttons
    const navButtons = this.helpModal.querySelectorAll('.help-nav-btn');
    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-category') === category);
    });

    // Update content sections
    const contentSections = this.helpModal.querySelectorAll('.help-content-section');
    contentSections.forEach(section => {
      section.classList.toggle('active', section.id === `help-content-${category}`);
    });
  }

  /**
   * Sets up tooltips for interface elements
   */
  private setupTooltips(): void {
    if (!this.config.enableTooltips) return;

    const tooltipConfigs: TooltipConfig[] = [
      {
        element: '#build-panel',
        content: 'Build units and structures to expand your fleet and economy. Each unit type has different strengths and costs.',
        position: 'top'
      },
      {
        element: '#attack-panel',
        content: 'Launch attacks against enemy systems. Consider unit composition - Frigates beat Cruisers, Cruisers beat Battleships, Battleships beat Frigates.',
        position: 'top'
      },
      {
        element: '#scan-panel',
        content: 'Gather intelligence about enemy forces and economy. Higher-tier scans provide more accurate information.',
        position: 'top'
      },
      {
        element: '#end-turn-btn',
        content: 'End your turn to process all actions and advance to the next turn. Use Ctrl+Enter as a shortcut.',
        position: 'top'
      },
      {
        element: '#resources-display',
        content: 'Your current resources and income. Metal and Energy are needed for construction. Watch for resource shortages!',
        position: 'bottom'
      },
      {
        element: '#fleet-display',
        content: 'Your current fleet composition and construction queue. Plan your fleet balance carefully.',
        position: 'bottom'
      }
    ];

    tooltipConfigs.forEach(config => this.createTooltip(config));
  }

  /**
   * Creates a tooltip for a specific element
   */
  private createTooltip(config: TooltipConfig): void {
    const targetElement = document.querySelector(config.element);
    if (!targetElement) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'help-tooltip';
    tooltip.innerHTML = config.content;
    tooltip.style.position = 'absolute';
    tooltip.style.display = 'none';
    tooltip.style.zIndex = '10000';

    document.body.appendChild(tooltip);
    this.tooltips.set(config.element, tooltip);

    const showTooltip = () => {
      const rect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      // Position tooltip based on config
      switch (config.position || 'top') {
        case 'top':
          tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
          tooltip.style.top = `${rect.top - tooltipRect.height - 8}px`;
          break;
        case 'bottom':
          tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
          tooltip.style.top = `${rect.bottom + 8}px`;
          break;
        case 'left':
          tooltip.style.left = `${rect.left - tooltipRect.width - 8}px`;
          tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
          break;
        case 'right':
          tooltip.style.left = `${rect.right + 8}px`;
          tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
          break;
      }

      tooltip.style.display = 'block';
    };

    const hideTooltip = () => {
      tooltip.style.display = 'none';
    };

    // Add event listeners based on trigger
    const trigger = config.trigger || 'hover';
    if (trigger === 'hover') {
      targetElement.addEventListener('mouseenter', showTooltip);
      targetElement.addEventListener('mouseleave', hideTooltip);
    } else if (trigger === 'click') {
      targetElement.addEventListener('click', showTooltip);
      document.addEventListener('click', (e) => {
        if (!targetElement.contains(e.target as Node) && !tooltip.contains(e.target as Node)) {
          hideTooltip();
        }
      });
    }
  }

  /**
   * Starts the interactive tutorial
   */
  public startTutorial(): void {
    if (!this.config.enableTutorial || this.isTutorialActive) return;

    this.currentTutorial = this.getTutorialSteps();
    this.currentTutorialStep = 0;
    this.isTutorialActive = true;

    this.createTutorialOverlay();
    this.showTutorialStep();
  }

  /**
   * Creates the tutorial overlay
   */
  private createTutorialOverlay(): void {
    this.tutorialOverlay = document.createElement('div');
    this.tutorialOverlay.id = 'tutorial-overlay';
    this.tutorialOverlay.className = 'tutorial-overlay';

    this.tutorialOverlay.innerHTML = `
      <div class="tutorial-backdrop"></div>
      <div class="tutorial-popup">
        <div class="tutorial-header">
          <h3 class="tutorial-title"></h3>
          <button class="tutorial-close" aria-label="Close tutorial">&times;</button>
        </div>
        <div class="tutorial-content"></div>
        <div class="tutorial-footer">
          <div class="tutorial-progress">
            <span class="tutorial-step-counter"></span>
          </div>
          <div class="tutorial-actions">
            <button class="tutorial-prev-btn">Previous</button>
            <button class="tutorial-next-btn">Next</button>
            <button class="tutorial-skip-btn">Skip Tutorial</button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const closeBtn = this.tutorialOverlay.querySelector('.tutorial-close');
    const skipBtn = this.tutorialOverlay.querySelector('.tutorial-skip-btn');
    const prevBtn = this.tutorialOverlay.querySelector('.tutorial-prev-btn');
    const nextBtn = this.tutorialOverlay.querySelector('.tutorial-next-btn');

    closeBtn?.addEventListener('click', () => this.endTutorial());
    skipBtn?.addEventListener('click', () => this.endTutorial());
    prevBtn?.addEventListener('click', () => this.previousTutorialStep());
    nextBtn?.addEventListener('click', () => this.nextTutorialStep());

    document.body.appendChild(this.tutorialOverlay);
  }

  /**
   * Shows the current tutorial step
   */
  private showTutorialStep(): void {
    if (!this.tutorialOverlay || !this.currentTutorial.length) return;

    const step = this.currentTutorial[this.currentTutorialStep];
    if (!step) return;

    // Update tutorial content
    const title = this.tutorialOverlay.querySelector('.tutorial-title');
    const content = this.tutorialOverlay.querySelector('.tutorial-content');
    const counter = this.tutorialOverlay.querySelector('.tutorial-step-counter');
    const prevBtn = this.tutorialOverlay.querySelector('.tutorial-prev-btn') as HTMLButtonElement;
    const nextBtn = this.tutorialOverlay.querySelector('.tutorial-next-btn') as HTMLButtonElement;

    if (title) title.textContent = step.title;
    if (content) content.innerHTML = step.content;
    if (counter) counter.textContent = `Step ${this.currentTutorialStep + 1} of ${this.currentTutorial.length}`;

    // Update button states
    if (prevBtn) prevBtn.disabled = this.currentTutorialStep === 0;
    if (nextBtn) {
      nextBtn.textContent = this.currentTutorialStep === this.currentTutorial.length - 1 ? 'Finish' : 'Next';
    }

    // Highlight target element if specified
    if (step.target) {
      this.highlightElement(step.target);
    }

    // Position tutorial popup
    this.positionTutorialPopup(step);
  }

  /**
   * Highlights a target element during tutorial
   */
  private highlightElement(selector: string): void {
    // Remove previous highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });

    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('tutorial-highlight');
    }
  }

  /**
   * Positions the tutorial popup relative to target element
   */
  private positionTutorialPopup(step: TutorialStep): void {
    if (!this.tutorialOverlay) return;

    const popup = this.tutorialOverlay.querySelector('.tutorial-popup') as HTMLElement;
    if (!popup) return;

    if (step.target) {
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const position = step.position || 'bottom';

        switch (position) {
          case 'top':
            popup.style.left = `${rect.left + rect.width / 2}px`;
            popup.style.top = `${rect.top - 20}px`;
            popup.style.transform = 'translate(-50%, -100%)';
            break;
          case 'bottom':
            popup.style.left = `${rect.left + rect.width / 2}px`;
            popup.style.top = `${rect.bottom + 20}px`;
            popup.style.transform = 'translate(-50%, 0)';
            break;
          case 'left':
            popup.style.left = `${rect.left - 20}px`;
            popup.style.top = `${rect.top + rect.height / 2}px`;
            popup.style.transform = 'translate(-100%, -50%)';
            break;
          case 'right':
            popup.style.left = `${rect.right + 20}px`;
            popup.style.top = `${rect.top + rect.height / 2}px`;
            popup.style.transform = 'translate(0, -50%)';
            break;
        }
      }
    } else {
      // Center popup if no target
      popup.style.left = '50%';
      popup.style.top = '50%';
      popup.style.transform = 'translate(-50%, -50%)';
    }
  }

  /**
   * Moves to the next tutorial step
   */
  private nextTutorialStep(): void {
    if (this.currentTutorialStep < this.currentTutorial.length - 1) {
      this.currentTutorialStep++;
      this.showTutorialStep();
    } else {
      this.endTutorial();
    }
  }

  /**
   * Moves to the previous tutorial step
   */
  private previousTutorialStep(): void {
    if (this.currentTutorialStep > 0) {
      this.currentTutorialStep--;
      this.showTutorialStep();
    }
  }

  /**
   * Ends the tutorial
   */
  private endTutorial(): void {
    if (this.tutorialOverlay) {
      this.tutorialOverlay.remove();
      this.tutorialOverlay = null;
    }

    // Remove highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });

    this.isTutorialActive = false;
    this.markTutorialCompleted();
  }

  /**
   * Sets up keyboard shortcuts for help system
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'h':
          if (!this.isTutorialActive) {
            e.preventDefault();
            this.showHelpModal();
          }
          break;
        case 'f1':
          e.preventDefault();
          this.showHelpModal();
          break;
      }
    });
  }

  /**
   * Checks if this is the user's first visit
   */
  private isFirstVisit(): boolean {
    try {
      return !localStorage.getItem('burn-rate-tutorial-completed');
    } catch (e) {
      return true;
    }
  }

  /**
   * Marks tutorial as completed
   */
  private markTutorialCompleted(): void {
    try {
      localStorage.setItem('burn-rate-tutorial-completed', 'true');
    } catch (e) {
      // Ignore storage errors
    }
  }

  /**
   * Gets tutorial content for the help modal
   */
  private getTutorialContent(): string {
    return `
      <div class="help-section">
        <h3>Welcome to Burn Rate!</h3>
        <p>Burn Rate is a fast-paced strategy game where you build fleets, manage resources, and compete against AI opponents to achieve victory.</p>
        
        <h4>Quick Start</h4>
        <ol>
          <li><strong>Build Units:</strong> Use the Build tab to construct ships and structures</li>
          <li><strong>Manage Resources:</strong> Watch your Metal and Energy levels</li>
          <li><strong>Attack:</strong> Use the Attack tab to launch fleets against enemies</li>
          <li><strong>Gather Intel:</strong> Use the Scan tab to learn about enemy forces</li>
          <li><strong>End Turn:</strong> Click "End Turn" or press Ctrl+Enter to advance</li>
        </ol>

        <h4>Victory Conditions</h4>
        <ul>
          <li><strong>Military Victory:</strong> Destroy all enemy fleets and structures</li>
          <li><strong>Economic Victory:</strong> Achieve massive resource production</li>
          <li><strong>Time Victory:</strong> Have the strongest position when time runs out</li>
        </ul>

        <div class="help-tip">
          💡 <strong>Tip:</strong> Start the interactive tutorial below to learn the game step-by-step!
        </div>
      </div>
    `;
  }

  /**
   * Gets gameplay content for the help modal
   */
  private getGameplayContent(): string {
    return `
      <div class="help-section">
        <h3>Core Gameplay</h3>
        
        <h4>Unit Types</h4>
        <div class="unit-guide">
          <div class="unit-item">
            <strong>🚀 Frigate</strong> (4 Metal, 2 Energy)
            <p>Fast, cheap units effective against Cruisers. Good for early game and swarm tactics.</p>
          </div>
          <div class="unit-item">
            <strong>🛸 Cruiser</strong> (10 Metal, 6 Energy)
            <p>Balanced units effective against Battleships. The backbone of most fleets.</p>
          </div>
          <div class="unit-item">
            <strong>🚁 Battleship</strong> (20 Metal, 12 Energy)
            <p>Heavy units effective against Frigates. Expensive but powerful.</p>
          </div>
        </div>

        <h4>Rock-Paper-Scissors Combat</h4>
        <div class="combat-guide">
          <p><strong>Frigates</strong> beat <strong>Cruisers</strong></p>
          <p><strong>Cruisers</strong> beat <strong>Battleships</strong></p>
          <p><strong>Battleships</strong> beat <strong>Frigates</strong></p>
        </div>

        <h4>Structures</h4>
        <div class="structure-guide">
          <div class="structure-item">
            <strong>⚡ Reactor</strong> (900 Metal, 1200 Energy)
            <p>Provides +500 Energy per turn. Essential for large fleets.</p>
          </div>
          <div class="structure-item">
            <strong>⛏️ Mine</strong> (1500 Metal, 600 Energy)
            <p>Provides +500 Metal per turn. Needed for construction.</p>
          </div>
        </div>

        <h4>Intelligence</h4>
        <p>Use scans to gather information about enemy forces:</p>
        <ul>
          <li><strong>Basic Scan:</strong> Total fleet count (±30% accuracy)</li>
          <li><strong>Deep Scan:</strong> Unit composition + economy (±10% accuracy)</li>
          <li><strong>Advanced Scan:</strong> Strategic analysis and predictions</li>
        </ul>
      </div>
    `;
  }

  /**
   * Gets interface content for the help modal
   */
  private getInterfaceContent(): string {
    return `
      <div class="help-section">
        <h3>Interface Guide</h3>
        
        <h4>Main Panels</h4>
        <ul>
          <li><strong>Resources Panel:</strong> Shows current Metal, Energy, and income rates</li>
          <li><strong>Fleet Panel:</strong> Displays your ships, construction queue, and intelligence</li>
          <li><strong>Command Tabs:</strong> Switch between Build, Attack, and Scan actions</li>
        </ul>

        <h4>Keyboard Shortcuts</h4>
        <div class="shortcuts-guide">
          <div class="shortcut-item">
            <kbd>H</kbd> or <kbd>F1</kbd> - Open this help system
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>Enter</kbd> - End turn
          </div>
          <div class="shortcut-item">
            <kbd>S</kbd> - Show game status
          </div>
          <div class="shortcut-item">
            <kbd>Esc</kbd> - Close modals and dialogs
          </div>
        </div>

        <h4>Visual Indicators</h4>
        <ul>
          <li><strong>Red text/borders:</strong> Low resources or warnings</li>
          <li><strong>Green highlights:</strong> Successful actions</li>
          <li><strong>Yellow highlights:</strong> Important information</li>
          <li><strong>Pulsing elements:</strong> Require attention</li>
        </ul>

        <h4>Responsive Design</h4>
        <p>The interface adapts to different screen sizes. On smaller screens, some panels may collapse or stack vertically for better usability.</p>
      </div>
    `;
  }

  /**
   * Gets strategy content for the help modal
   */
  private getStrategyContent(): string {
    return `
      <div class="help-section">
        <h3>Strategy Guide</h3>
        
        <h4>Early Game (Turns 1-10)</h4>
        <ul>
          <li>Focus on economic growth - build Reactors and Mines</li>
          <li>Construct a small defensive fleet</li>
          <li>Use Basic Scans to assess enemy strength</li>
          <li>Avoid large attacks until you have economic advantage</li>
        </ul>

        <h4>Mid Game (Turns 11-25)</h4>
        <ul>
          <li>Expand your fleet with balanced unit composition</li>
          <li>Launch probing attacks to test enemy defenses</li>
          <li>Use Deep Scans for detailed intelligence</li>
          <li>Consider specializing in one unit type for mass production</li>
        </ul>

        <h4>Late Game (Turns 26+)</h4>
        <ul>
          <li>Launch decisive attacks with overwhelming force</li>
          <li>Use Advanced Scans to predict enemy moves</li>
          <li>Focus on victory conditions - military or economic</li>
          <li>Don't let the AI catch up economically</li>
        </ul>

        <h4>AI Archetypes</h4>
        <div class="ai-guide">
          <div class="ai-item">
            <strong>Aggressor:</strong> Attacks early and often. Build defenses quickly.
          </div>
          <div class="ai-item">
            <strong>Economist:</strong> Focuses on resource growth. Don't let them get ahead economically.
          </div>
          <div class="ai-item">
            <strong>Trickster:</strong> Unpredictable strategy. Use frequent scans to track their plans.
          </div>
          <div class="ai-item">
            <strong>Hybrid:</strong> Balanced approach. Adapt your strategy based on their actions.
          </div>
        </div>

        <h4>Pro Tips</h4>
        <div class="pro-tips">
          <div class="tip-item">
            💡 Always maintain positive resource income
          </div>
          <div class="tip-item">
            💡 Counter the enemy's main unit type with its weakness
          </div>
          <div class="tip-item">
            💡 Time your attacks when enemy fleets are away
          </div>
          <div class="tip-item">
            💡 Economic victory is often easier than military victory
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gets tutorial steps for the interactive tutorial
   */
  private getTutorialSteps(): TutorialStep[] {
    return [
      {
        id: 'welcome',
        title: 'Welcome to Burn Rate!',
        content: `
          <p>Welcome to Burn Rate, a fast-paced strategy game!</p>
          <p>In this tutorial, you'll learn the basics of building fleets, managing resources, and achieving victory.</p>
          <p>Let's start by exploring the interface.</p>
        `
      },
      {
        id: 'resources',
        title: 'Resources Overview',
        content: `
          <p>This panel shows your current resources:</p>
          <ul>
            <li><strong>Metal:</strong> Used for construction</li>
            <li><strong>Energy:</strong> Powers your operations</li>
            <li><strong>Income:</strong> Resources gained per turn</li>
          </ul>
          <p>Keep an eye on these numbers - you need positive income to grow!</p>
        `,
        target: '#resources-display',
        position: 'bottom'
      },
      {
        id: 'fleet',
        title: 'Fleet Information',
        content: `
          <p>This panel shows your fleet status:</p>
          <ul>
            <li><strong>Home Fleet:</strong> Ships defending your base</li>
            <li><strong>In Transit:</strong> Fleets traveling to/from combat</li>
            <li><strong>Construction Queue:</strong> Units being built</li>
          </ul>
          <p>You start with a small defensive fleet.</p>
        `,
        target: '#fleet-display',
        position: 'bottom'
      },
      {
        id: 'build-tab',
        title: 'Building Units',
        content: `
          <p>Click the Build tab to construct new units and structures.</p>
          <p>You can build:</p>
          <ul>
            <li><strong>Ships:</strong> Frigates, Cruisers, Battleships</li>
            <li><strong>Structures:</strong> Reactors (energy), Mines (metal)</li>
          </ul>
          <p>Try building a Frigate - it's cheap and effective!</p>
        `,
        target: '[data-tab="build"]',
        position: 'bottom'
      },
      {
        id: 'attack-tab',
        title: 'Launching Attacks',
        content: `
          <p>The Attack tab lets you send fleets to attack enemies.</p>
          <p>Remember the combat triangle:</p>
          <ul>
            <li>Frigates beat Cruisers</li>
            <li>Cruisers beat Battleships</li>
            <li>Battleships beat Frigates</li>
          </ul>
          <p>Don't attack yet - build up your forces first!</p>
        `,
        target: '[data-tab="attack"]',
        position: 'bottom'
      },
      {
        id: 'scan-tab',
        title: 'Gathering Intelligence',
        content: `
          <p>The Scan tab helps you spy on enemy forces.</p>
          <p>Different scan types provide different information:</p>
          <ul>
            <li><strong>Basic:</strong> Fleet size (rough estimate)</li>
            <li><strong>Deep:</strong> Unit composition and economy</li>
            <li><strong>Advanced:</strong> Strategic analysis</li>
          </ul>
          <p>Intelligence is crucial for planning attacks!</p>
        `,
        target: '[data-tab="scan"]',
        position: 'bottom'
      },
      {
        id: 'end-turn',
        title: 'Ending Your Turn',
        content: `
          <p>When you're done with your actions, click "End Turn" to advance the game.</p>
          <p>You can also use the keyboard shortcut <kbd>Ctrl+Enter</kbd>.</p>
          <p>The AI will then take its turn, and you'll see the results.</p>
        `,
        target: '#end-turn-btn',
        position: 'top'
      },
      {
        id: 'strategy',
        title: 'Basic Strategy',
        content: `
          <p>Here's a simple strategy to get started:</p>
          <ol>
            <li>Build economic structures (Reactors, Mines)</li>
            <li>Construct a balanced fleet</li>
            <li>Use scans to assess enemy strength</li>
            <li>Attack when you have an advantage</li>
          </ol>
          <p>Remember: economic growth often leads to military victory!</p>
        `
      },
      {
        id: 'complete',
        title: 'Tutorial Complete!',
        content: `
          <p>Congratulations! You've completed the tutorial.</p>
          <p>You now know the basics of Burn Rate. Here are some final tips:</p>
          <ul>
            <li>Press <kbd>H</kbd> anytime to open the help system</li>
            <li>Experiment with different strategies</li>
            <li>Watch your resource income carefully</li>
            <li>Have fun and good luck!</li>
          </ul>
        `
      }
    ];
  }

  /**
   * Cleans up the help system
   */
  public cleanup(): void {
    // Remove tooltips
    this.tooltips.forEach(tooltip => tooltip.remove());
    this.tooltips.clear();

    // Remove modals and overlays
    if (this.helpModal) {
      this.helpModal.remove();
      this.helpModal = null;
    }

    if (this.tutorialOverlay) {
      this.tutorialOverlay.remove();
      this.tutorialOverlay = null;
    }

    // Remove highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });

    // Restore body scroll
    document.body.style.overflow = '';
  }
}