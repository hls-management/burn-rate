import { GameConfigManager, GameSettings, WebGameConfig } from './GameConfigManager.js';
import { AIArchetype } from '../models/AI.js';

/**
 * Event types for settings panel interactions
 */
export interface SettingsPanelEvents {
  settingsChanged: (settings: GameSettings) => void;
  configChanged: (config: WebGameConfig) => void;
  newGameRequested: (config: WebGameConfig) => void;
  panelClosed: () => void;
}

/**
 * Manages the settings panel UI and user interactions
 */
export class SettingsPanel {
  private configManager: GameConfigManager;
  private container: HTMLElement;
  private isVisible: boolean = false;
  private eventHandlers: Partial<SettingsPanelEvents> = {};

  constructor(configManager: GameConfigManager, containerId: string = 'settings-panel') {
    this.configManager = configManager;
    this.container = this.createContainer(containerId);
    this.setupEventListeners();
  }

  /**
   * Shows the settings panel
   */
  public show(): void {
    this.isVisible = true;
    this.container.style.display = 'block';
    this.container.classList.add('visible');
    this.refreshContent();
  }

  /**
   * Hides the settings panel
   */
  public hide(): void {
    this.isVisible = false;
    this.container.classList.remove('visible');
    setTimeout(() => {
      if (!this.isVisible) {
        this.container.style.display = 'none';
      }
    }, 300); // Allow for CSS transition
    this.eventHandlers.panelClosed?.();
  }

  /**
   * Toggles the settings panel visibility
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Registers event handlers
   */
  public on<K extends keyof SettingsPanelEvents>(
    event: K,
    handler: SettingsPanelEvents[K]
  ): void {
    this.eventHandlers[event] = handler;
  }

  /**
   * Gets the settings panel container element
   */
  public getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * Creates the settings panel container and structure
   */
  private createContainer(containerId: string): HTMLElement {
    const container = document.createElement('div');
    container.id = containerId;
    container.className = 'settings-panel';
    container.style.display = 'none';

    container.innerHTML = `
      <div class="settings-overlay">
        <div class="settings-content">
          <div class="settings-header">
            <h2>Game Settings</h2>
            <button class="close-button" type="button">&times;</button>
          </div>
          
          <div class="settings-tabs">
            <button class="tab-button active" data-tab="gameplay">Gameplay</button>
            <button class="tab-button" data-tab="display">Display</button>
            <button class="tab-button" data-tab="new-game">New Game</button>
            <button class="tab-button" data-tab="advanced">Advanced</button>
          </div>

          <div class="settings-body">
            <!-- Gameplay Tab -->
            <div class="tab-content active" data-tab="gameplay">
              <div class="setting-group">
                <label class="setting-label">
                  <input type="checkbox" id="auto-save" />
                  <span>Auto-save game state</span>
                </label>
                <p class="setting-description">Automatically save your progress</p>
              </div>

              <div class="setting-group">
                <label class="setting-label">
                  <input type="checkbox" id="show-debug" />
                  <span>Show debug information</span>
                </label>
                <p class="setting-description">Display additional game state information</p>
              </div>

              <div class="setting-group">
                <label class="setting-label">
                  <input type="checkbox" id="sound-enabled" />
                  <span>Enable sound effects</span>
                </label>
                <p class="setting-description">Play audio feedback for game events</p>
              </div>

              <div class="setting-group">
                <label class="setting-label">
                  <span>Volume</span>
                  <input type="range" id="volume" min="0" max="1" step="0.1" />
                  <span class="volume-value">70%</span>
                </label>
              </div>
            </div>

            <!-- Display Tab -->
            <div class="tab-content" data-tab="display">
              <div class="setting-group">
                <label class="setting-label">
                  <span>Theme</span>
                  <select id="theme">
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </label>
                <p class="setting-description">Choose your preferred color scheme</p>
              </div>

              <div class="setting-group">
                <label class="setting-label">
                  <input type="checkbox" id="show-animations" />
                  <span>Enable animations</span>
                </label>
                <p class="setting-description">Show smooth transitions and effects</p>
              </div>
            </div>

            <!-- New Game Tab -->
            <div class="tab-content" data-tab="new-game">
              <div class="setting-group">
                <label class="setting-label">
                  <span>Game Preset</span>
                  <select id="game-preset">
                    <option value="">Custom Configuration</option>
                  </select>
                </label>
                <p class="setting-description">Choose a predefined game setup</p>
              </div>

              <div class="setting-group">
                <label class="setting-label">
                  <span>AI Opponent</span>
                  <select id="ai-archetype">
                  </select>
                </label>
                <p class="setting-description ai-description">AI behavior description</p>
              </div>

              <div class="setting-group">
                <label class="setting-label">
                  <span>Starting Resources</span>
                  <select id="resource-preset">
                  </select>
                </label>
                <div class="resource-inputs">
                  <label>
                    <span>Metal</span>
                    <input type="number" id="starting-metal" min="0" max="1000000" step="1000" />
                  </label>
                  <label>
                    <span>Energy</span>
                    <input type="number" id="starting-energy" min="0" max="1000000" step="1000" />
                  </label>
                </div>
              </div>

              <div class="setting-group">
                <label class="setting-label">
                  <span>Random Seed (optional)</span>
                  <div class="seed-input-group">
                    <input type="number" id="game-seed" min="0" placeholder="Leave empty for random" />
                    <button type="button" id="generate-seed">Generate</button>
                  </div>
                </label>
                <p class="setting-description">Use a specific seed for reproducible games</p>
              </div>

              <div class="new-game-actions">
                <button type="button" id="start-new-game" class="primary-button">Start New Game</button>
              </div>
            </div>

            <!-- Advanced Tab -->
            <div class="tab-content" data-tab="advanced">
              <div class="setting-group">
                <label class="setting-label">
                  <span>Export Settings</span>
                  <button type="button" id="export-config">Export Configuration</button>
                </label>
                <p class="setting-description">Save your settings to a file</p>
              </div>

              <div class="setting-group">
                <label class="setting-label">
                  <span>Import Settings</span>
                  <input type="file" id="import-config" accept=".json" />
                </label>
                <p class="setting-description">Load settings from a file</p>
              </div>

              <div class="setting-group">
                <button type="button" id="reset-defaults" class="secondary-button">Reset to Defaults</button>
                <p class="setting-description">Restore all settings to their default values</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    return container;
  }

  /**
   * Sets up event listeners for the settings panel
   */
  private setupEventListeners(): void {
    // Close button
    const closeButton = this.container.querySelector('.close-button');
    closeButton?.addEventListener('click', () => this.hide());

    // Overlay click to close
    const overlay = this.container.querySelector('.settings-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    });

    // Tab switching
    const tabButtons = this.container.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tabName = target.dataset.tab;
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });

    // Settings inputs
    this.setupSettingsInputs();
    this.setupNewGameInputs();
    this.setupAdvancedInputs();
  }

  /**
   * Sets up event listeners for settings inputs
   */
  private setupSettingsInputs(): void {
    const autoSave = this.container.querySelector('#auto-save') as HTMLInputElement;
    const showDebug = this.container.querySelector('#show-debug') as HTMLInputElement;
    const soundEnabled = this.container.querySelector('#sound-enabled') as HTMLInputElement;
    const volume = this.container.querySelector('#volume') as HTMLInputElement;
    const theme = this.container.querySelector('#theme') as HTMLSelectElement;
    const showAnimations = this.container.querySelector('#show-animations') as HTMLInputElement;

    const updateSettings = () => {
      const newSettings = {
        autoSave: autoSave.checked,
        showDebugInfo: showDebug.checked,
        soundEnabled: soundEnabled.checked,
        volume: parseFloat(volume.value),
        theme: theme.value as 'dark' | 'light',
        showAnimations: showAnimations.checked
      };

      this.configManager.updateSettings(newSettings);
      this.eventHandlers.settingsChanged?.(this.configManager.getSettings());
    };

    autoSave?.addEventListener('change', updateSettings);
    showDebug?.addEventListener('change', updateSettings);
    soundEnabled?.addEventListener('change', updateSettings);
    theme?.addEventListener('change', updateSettings);
    showAnimations?.addEventListener('change', updateSettings);

    volume?.addEventListener('input', () => {
      const volumeValue = this.container.querySelector('.volume-value');
      if (volumeValue) {
        volumeValue.textContent = `${Math.round(parseFloat(volume.value) * 100)}%`;
      }
      updateSettings();
    });
  }

  /**
   * Sets up event listeners for new game inputs
   */
  private setupNewGameInputs(): void {
    const gamePreset = this.container.querySelector('#game-preset') as HTMLSelectElement;
    const aiArchetype = this.container.querySelector('#ai-archetype') as HTMLSelectElement;
    const resourcePreset = this.container.querySelector('#resource-preset') as HTMLSelectElement;
    const startingMetal = this.container.querySelector('#starting-metal') as HTMLInputElement;
    const startingEnergy = this.container.querySelector('#starting-energy') as HTMLInputElement;
    const gameSeed = this.container.querySelector('#game-seed') as HTMLInputElement;
    const generateSeed = this.container.querySelector('#generate-seed') as HTMLButtonElement;
    const startNewGame = this.container.querySelector('#start-new-game') as HTMLButtonElement;

    // Game preset selection
    gamePreset?.addEventListener('change', () => {
      if (gamePreset.value) {
        const presets = this.configManager.getGamePresets();
        const selectedPreset = presets.find(p => p.name === gamePreset.value);
        if (selectedPreset) {
          this.applyPreset(selectedPreset.config);
        }
      }
    });

    // AI archetype selection
    aiArchetype?.addEventListener('change', () => {
      const description = this.container.querySelector('.ai-description');
      if (description) {
        const archetypes = this.configManager.getAIArchetypes();
        const selected = archetypes.find(a => a.value === aiArchetype.value);
        description.textContent = selected?.description || '';
      }
    });

    // Resource preset selection
    resourcePreset?.addEventListener('change', () => {
      if (resourcePreset.value) {
        const presets = this.configManager.getResourcePresets();
        const selected = presets.find(p => p.name === resourcePreset.value);
        if (selected) {
          startingMetal.value = selected.resources.metal.toString();
          startingEnergy.value = selected.resources.energy.toString();
        }
      }
    });

    // Generate random seed
    generateSeed?.addEventListener('click', () => {
      gameSeed.value = this.configManager.generateRandomSeed().toString();
    });

    // Start new game
    startNewGame?.addEventListener('click', () => {
      const config = this.configManager.createGameConfig({
        aiArchetype: aiArchetype.value as AIArchetype,
        startingResources: {
          metal: parseInt(startingMetal.value) || 10000,
          energy: parseInt(startingEnergy.value) || 10000
        },
        debugMode: this.configManager.getSettings().showDebugInfo,
        seed: gameSeed.value ? parseInt(gameSeed.value) : undefined
      });

      this.eventHandlers.newGameRequested?.(config);
      this.hide();
    });
  }

  /**
   * Sets up event listeners for advanced inputs
   */
  private setupAdvancedInputs(): void {
    const exportConfig = this.container.querySelector('#export-config') as HTMLButtonElement;
    const importConfig = this.container.querySelector('#import-config') as HTMLInputElement;
    const resetDefaults = this.container.querySelector('#reset-defaults') as HTMLButtonElement;

    // Export configuration
    exportConfig?.addEventListener('click', () => {
      const configData = this.configManager.exportConfig();
      const blob = new Blob([configData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `burn-rate-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // Import configuration
    importConfig?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const result = this.configManager.importConfig(content);
          
          if (result.success) {
            this.refreshContent();
            alert('Configuration imported successfully!');
          } else {
            alert(`Failed to import configuration: ${result.error}`);
          }
        };
        reader.readAsText(file);
      }
    });

    // Reset to defaults
    resetDefaults?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all settings to their default values?')) {
        this.configManager.resetToDefaults();
        this.refreshContent();
        this.eventHandlers.settingsChanged?.(this.configManager.getSettings());
      }
    });
  }

  /**
   * Switches to a different tab
   */
  private switchTab(tabName: string): void {
    // Update tab buttons
    const tabButtons = this.container.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.classList.toggle('active', (button as HTMLElement).dataset.tab === tabName);
    });

    // Update tab content
    const tabContents = this.container.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      content.classList.toggle('active', (content as HTMLElement).dataset.tab === tabName);
    });
  }

  /**
   * Applies a preset configuration to the form
   */
  private applyPreset(config: Partial<WebGameConfig>): void {
    if (config.aiArchetype) {
      const aiSelect = this.container.querySelector('#ai-archetype') as HTMLSelectElement;
      if (aiSelect) aiSelect.value = config.aiArchetype;
    }

    if (config.startingResources) {
      const metalInput = this.container.querySelector('#starting-metal') as HTMLInputElement;
      const energyInput = this.container.querySelector('#starting-energy') as HTMLInputElement;
      if (metalInput) metalInput.value = config.startingResources.metal.toString();
      if (energyInput) energyInput.value = config.startingResources.energy.toString();
    }

    // Trigger AI description update
    const aiSelect = this.container.querySelector('#ai-archetype') as HTMLSelectElement;
    if (aiSelect) {
      aiSelect.dispatchEvent(new Event('change'));
    }
  }

  /**
   * Refreshes the panel content with current settings
   */
  private refreshContent(): void {
    const settings = this.configManager.getSettings();
    const config = this.configManager.getConfig();

    // Update settings inputs
    const autoSave = this.container.querySelector('#auto-save') as HTMLInputElement;
    const showDebug = this.container.querySelector('#show-debug') as HTMLInputElement;
    const soundEnabled = this.container.querySelector('#sound-enabled') as HTMLInputElement;
    const volume = this.container.querySelector('#volume') as HTMLInputElement;
    const theme = this.container.querySelector('#theme') as HTMLSelectElement;
    const showAnimations = this.container.querySelector('#show-animations') as HTMLInputElement;

    if (autoSave) autoSave.checked = settings.autoSave;
    if (showDebug) showDebug.checked = settings.showDebugInfo;
    if (soundEnabled) soundEnabled.checked = settings.soundEnabled;
    if (volume) {
      volume.value = settings.volume.toString();
      const volumeValue = this.container.querySelector('.volume-value');
      if (volumeValue) volumeValue.textContent = `${Math.round(settings.volume * 100)}%`;
    }
    if (theme) theme.value = settings.theme;
    if (showAnimations) showAnimations.checked = settings.showAnimations;

    // Populate dropdowns
    this.populateDropdowns();
  }

  /**
   * Populates dropdown menus with options
   */
  private populateDropdowns(): void {
    // AI archetypes
    const aiSelect = this.container.querySelector('#ai-archetype') as HTMLSelectElement;
    if (aiSelect) {
      aiSelect.innerHTML = '';
      this.configManager.getAIArchetypes().forEach(archetype => {
        const option = document.createElement('option');
        option.value = archetype.value;
        option.textContent = archetype.name;
        aiSelect.appendChild(option);
      });
    }

    // Game presets
    const presetSelect = this.container.querySelector('#game-preset') as HTMLSelectElement;
    if (presetSelect) {
      // Keep the "Custom Configuration" option
      const customOption = presetSelect.querySelector('option[value=""]');
      presetSelect.innerHTML = '';
      if (customOption) presetSelect.appendChild(customOption);
      
      this.configManager.getGamePresets().forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.name;
        option.textContent = preset.name;
        option.title = preset.description;
        presetSelect.appendChild(option);
      });
    }

    // Resource presets
    const resourceSelect = this.container.querySelector('#resource-preset') as HTMLSelectElement;
    if (resourceSelect) {
      resourceSelect.innerHTML = '';
      this.configManager.getResourcePresets().forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.name;
        option.textContent = `${preset.name} (${preset.resources.metal.toLocaleString()}M / ${preset.resources.energy.toLocaleString()}E)`;
        resourceSelect.appendChild(option);
      });
    }
  }
}