import { FleetComposition } from '../models/GameState.js';

/**
 * Color theme interface defining ANSI color codes for different UI elements
 */
export interface ColorTheme {
  victory: string;      // Green for victories
  defeat: string;       // Red for defeats
  neutral: string;      // Yellow for close battles
  player: string;       // Blue for player actions
  enemy: string;        // Magenta for AI actions
  frigate: string;      // Cyan for frigates
  cruiser: string;      // Yellow for cruisers
  battleship: string;   // Red for battleships
  casualties: string;   // Bright red for losses
  survivors: string;    // Green for remaining forces
  reset: string;        // Reset color code
}

/**
 * Configuration options for combat display
 */
export interface CombatDisplayOptions {
  showTacticalAnalysis: boolean;
  showBattlePhases: boolean;
  useColors: boolean;
  detailedCasualties: boolean;
}

/**
 * Color Manager utility class for consistent color coding across combat displays
 */
export class ColorManager {
  private theme: ColorTheme;
  private colorsEnabled: boolean;
  private colorSupported: boolean;

  constructor(enableColors: boolean = true) {
    this.theme = this.getDefaultTheme();
    this.colorSupported = this.detectColorSupport();
    this.colorsEnabled = enableColors && this.colorSupported;
  }

  /**
   * Returns the default color theme with ANSI color codes
   */
  private getDefaultTheme(): ColorTheme {
    return {
      victory: '\x1b[32m',      // Green
      defeat: '\x1b[31m',       // Red
      neutral: '\x1b[33m',      // Yellow
      player: '\x1b[34m',       // Blue
      enemy: '\x1b[35m',        // Magenta
      frigate: '\x1b[36m',      // Cyan
      cruiser: '\x1b[33m',      // Yellow
      battleship: '\x1b[31m',   // Red
      casualties: '\x1b[91m',   // Bright red
      survivors: '\x1b[92m',    // Bright green
      reset: '\x1b[0m'          // Reset
    };
  }

  /**
   * Validates and sanitizes numeric values with optional bounds checking
   */
  private validateNumericValue(value: any, fieldName: string, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      console.warn(`ColorManager.validateNumericValue: Invalid ${fieldName} value '${value}', using 0`);
      return 0;
    }

    if (value < min) {
      console.warn(`ColorManager.validateNumericValue: ${fieldName} value ${value} below minimum ${min}, using ${min}`);
      return min;
    }

    if (value > max) {
      console.warn(`ColorManager.validateNumericValue: ${fieldName} value ${value} above maximum ${max}, using ${max}`);
      return max;
    }

    return Math.floor(value); // Ensure integer values
  }

  /**
   * Detects if the terminal supports color output
   */
  private detectColorSupport(): boolean {
    // Check common environment variables that indicate color support
    const colorTerms = ['color', 'ansi', 'truecolor', '256color'];
    const term = process.env.TERM?.toLowerCase() || '';
    const colorTerm = process.env.COLORTERM?.toLowerCase() || '';
    
    // Check if TERM or COLORTERM contains color indicators
    const hasColorTerm = colorTerms.some(colorType => 
      term.includes(colorType) || colorTerm.includes(colorType)
    );
    
    // Check for explicit color support variables
    const forceColor = process.env.FORCE_COLOR;
    const noColor = process.env.NO_COLOR;
    
    // Explicit disable takes precedence
    if (noColor) {
      return false;
    }
    
    // Explicit enable
    if (forceColor) {
      return true;
    }
    
    // Check if we're in a TTY and have color term
    const isTTY = process.stdout.isTTY;
    
    return isTTY && (hasColorTerm || term !== 'dumb');
  }

  /**
   * Applies color to text if colors are enabled
   */
  public colorize(text: string, colorType: keyof ColorTheme): string {
    // Validate input parameters
    if (typeof text !== 'string') {
      console.warn('ColorManager.colorize: text parameter must be a string, received:', typeof text);
      return String(text || '');
    }

    if (!this.colorsEnabled) {
      return text;
    }

    try {
      const colorCode = this.theme[colorType];
      const resetCode = this.theme.reset;
      
      // Validate color codes exist
      if (!colorCode || !resetCode) {
        console.warn(`ColorManager.colorize: Missing color code for type '${colorType}', falling back to plain text`);
        return text;
      }
      
      return `${colorCode}${text}${resetCode}`;
    } catch (error) {
      console.warn('ColorManager.colorize: Error applying colors, falling back to plain text:', error);
      return text;
    }
  }

  /**
   * Formats fleet composition with color coding for unit types
   */
  public formatFleetComposition(fleet: FleetComposition, showColors: boolean = true): string {
    // Validate fleet composition data
    if (!fleet || typeof fleet !== 'object') {
      console.warn('ColorManager.formatFleetComposition: Invalid fleet composition data, using defaults');
      fleet = { frigates: 0, cruisers: 0, battleships: 0 };
    }

    // Ensure numeric values and handle invalid data
    const frigates = this.validateNumericValue(fleet.frigates, 'frigates');
    const cruisers = this.validateNumericValue(fleet.cruisers, 'cruisers');
    const battleships = this.validateNumericValue(fleet.battleships, 'battleships');

    if (!showColors || !this.colorsEnabled) {
      return `${frigates}F, ${cruisers}C, ${battleships}B`;
    }
    
    try {
      const frigateText = this.colorize(`${frigates}F`, 'frigate');
      const cruiserText = this.colorize(`${cruisers}C`, 'cruiser');
      const battleshipText = this.colorize(`${battleships}B`, 'battleship');
      
      return `${frigateText}, ${cruiserText}, ${battleshipText}`;
    } catch (error) {
      console.warn('ColorManager.formatFleetComposition: Error formatting with colors, falling back to plain text:', error);
      return `${frigates}F, ${cruisers}C, ${battleships}B`;
    }
  }

  /**
   * Formats battle outcome with appropriate colors
   */
  public formatBattleOutcome(outcome: string, perspective: 'attacker' | 'defender'): string {
    // Validate input parameters
    if (typeof outcome !== 'string') {
      console.warn('ColorManager.formatBattleOutcome: Invalid outcome type, using default');
      outcome = 'unknown_outcome';
    }

    if (perspective !== 'attacker' && perspective !== 'defender') {
      console.warn('ColorManager.formatBattleOutcome: Invalid perspective, defaulting to attacker');
      perspective = 'attacker';
    }

    const formattedOutcome = outcome.toUpperCase().replace(/_/g, ' ');

    if (!this.colorsEnabled) {
      return formattedOutcome;
    }
    
    try {
      let colorType: keyof ColorTheme;
      
      switch (outcome) {
        case 'decisive_attacker':
          colorType = perspective === 'attacker' ? 'victory' : 'defeat';
          break;
        case 'decisive_defender':
          colorType = perspective === 'defender' ? 'victory' : 'defeat';
          break;
        case 'close_battle':
          colorType = 'neutral';
          break;
        default:
          console.warn(`ColorManager.formatBattleOutcome: Unknown outcome '${outcome}', using neutral color`);
          colorType = 'neutral';
      }
      
      return this.colorize(formattedOutcome, colorType);
    } catch (error) {
      console.warn('ColorManager.formatBattleOutcome: Error formatting outcome, falling back to plain text:', error);
      return formattedOutcome;
    }
  }

  /**
   * Formats casualty information with warning colors
   */
  public formatCasualties(casualties: number, total: number): string {
    // Validate and sanitize input values
    const validCasualties = this.validateNumericValue(casualties, 'casualties');
    const validTotal = this.validateNumericValue(total, 'total');
    
    const percentage = validTotal > 0 ? Math.round((validCasualties / validTotal) * 100) : 0;
    const casualtyText = `${validCasualties} ships (${percentage}%)`;
    
    if (!this.colorsEnabled) {
      return casualtyText;
    }
    
    try {
      return this.colorize(casualtyText, 'casualties');
    } catch (error) {
      console.warn('ColorManager.formatCasualties: Error formatting casualties, falling back to plain text:', error);
      return casualtyText;
    }
  }

  /**
   * Formats survivor information with positive colors
   */
  public formatSurvivors(survivors: number): string {
    // Validate and sanitize input value
    const validSurvivors = this.validateNumericValue(survivors, 'survivors');
    const survivorText = `${validSurvivors} ships`;
    
    if (!this.colorsEnabled) {
      return survivorText;
    }
    
    try {
      return this.colorize(survivorText, 'survivors');
    } catch (error) {
      console.warn('ColorManager.formatSurvivors: Error formatting survivors, falling back to plain text:', error);
      return survivorText;
    }
  }

  /**
   * Formats player/AI identification with distinct colors
   */
  public formatPlayerIdentifier(playerType: 'player' | 'ai', text: string): string {
    // Validate input parameters
    if (typeof text !== 'string') {
      console.warn('ColorManager.formatPlayerIdentifier: text parameter must be a string');
      text = String(text || '');
    }

    if (playerType !== 'player' && playerType !== 'ai') {
      console.warn('ColorManager.formatPlayerIdentifier: Invalid playerType, defaulting to player');
      playerType = 'player';
    }

    if (!this.colorsEnabled) {
      return text;
    }
    
    try {
      const colorType = playerType === 'player' ? 'player' : 'enemy';
      return this.colorize(text, colorType);
    } catch (error) {
      console.warn('ColorManager.formatPlayerIdentifier: Error formatting identifier, falling back to plain text:', error);
      return text;
    }
  }

  /**
   * Creates a colored separator line
   */
  public createSeparator(length: number = 60, char: string = '-'): string {
    // Validate and sanitize input parameters
    const validLength = this.validateNumericValue(length, 'length', 1, 200);
    
    if (typeof char !== 'string' || char.length === 0) {
      console.warn('ColorManager.createSeparator: Invalid character, using default');
      char = '-';
    }

    // Use only the first character to prevent excessive memory usage
    const safeChar = char.charAt(0);
    
    try {
      const separator = safeChar.repeat(validLength);
      
      if (!this.colorsEnabled) {
        return separator;
      }
      
      return this.colorize(separator, 'neutral');
    } catch (error) {
      console.warn('ColorManager.createSeparator: Error creating separator, falling back to simple separator:', error);
      return '-'.repeat(Math.min(validLength, 60));
    }
  }

  /**
   * Enables or disables color output
   */
  public setColorsEnabled(enabled: boolean): void {
    this.colorsEnabled = enabled && this.colorSupported;
  }

  /**
   * Returns whether colors are currently enabled
   */
  public areColorsEnabled(): boolean {
    return this.colorsEnabled;
  }

  /**
   * Returns whether the terminal supports colors
   */
  public isColorSupported(): boolean {
    return this.colorSupported;
  }

  /**
   * Sets a custom color theme
   */
  public setTheme(theme: Partial<ColorTheme>): void {
    this.theme = { ...this.theme, ...theme };
  }

  /**
   * Gets the current color theme
   */
  public getTheme(): ColorTheme {
    return { ...this.theme };
  }

  /**
   * Resets to the default color theme
   */
  public resetTheme(): void {
    this.theme = this.getDefaultTheme();
  }
}

/**
 * Default color manager instance
 */
export const defaultColorManager = new ColorManager();