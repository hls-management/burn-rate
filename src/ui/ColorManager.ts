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
    if (!this.colorsEnabled) {
      return text;
    }
    
    const colorCode = this.theme[colorType];
    const resetCode = this.theme.reset;
    
    return `${colorCode}${text}${resetCode}`;
  }

  /**
   * Formats fleet composition with color coding for unit types
   */
  public formatFleetComposition(fleet: FleetComposition, showColors: boolean = true): string {
    if (!showColors || !this.colorsEnabled) {
      return `${fleet.frigates}F, ${fleet.cruisers}C, ${fleet.battleships}B`;
    }
    
    const frigateText = this.colorize(`${fleet.frigates}F`, 'frigate');
    const cruiserText = this.colorize(`${fleet.cruisers}C`, 'cruiser');
    const battleshipText = this.colorize(`${fleet.battleships}B`, 'battleship');
    
    return `${frigateText}, ${cruiserText}, ${battleshipText}`;
  }

  /**
   * Formats battle outcome with appropriate colors
   */
  public formatBattleOutcome(outcome: string, perspective: 'attacker' | 'defender'): string {
    if (!this.colorsEnabled) {
      return outcome.toUpperCase().replace('_', ' ');
    }
    
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
        colorType = 'neutral';
    }
    
    return this.colorize(outcome.toUpperCase().replace('_', ' '), colorType);
  }

  /**
   * Formats casualty information with warning colors
   */
  public formatCasualties(casualties: number, total: number): string {
    const percentage = total > 0 ? Math.round((casualties / total) * 100) : 0;
    const casualtyText = `${casualties} ships (${percentage}%)`;
    
    if (!this.colorsEnabled) {
      return casualtyText;
    }
    
    return this.colorize(casualtyText, 'casualties');
  }

  /**
   * Formats survivor information with positive colors
   */
  public formatSurvivors(survivors: number): string {
    const survivorText = `${survivors} ships`;
    
    if (!this.colorsEnabled) {
      return survivorText;
    }
    
    return this.colorize(survivorText, 'survivors');
  }

  /**
   * Formats player/AI identification with distinct colors
   */
  public formatPlayerIdentifier(playerType: 'player' | 'ai', text: string): string {
    if (!this.colorsEnabled) {
      return text;
    }
    
    const colorType = playerType === 'player' ? 'player' : 'enemy';
    return this.colorize(text, colorType);
  }

  /**
   * Creates a colored separator line
   */
  public createSeparator(length: number = 60, char: string = '-'): string {
    const separator = char.repeat(length);
    
    if (!this.colorsEnabled) {
      return separator;
    }
    
    return this.colorize(separator, 'neutral');
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