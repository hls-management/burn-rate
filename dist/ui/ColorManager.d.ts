import { FleetComposition } from '../models/GameState.js';
/**
 * Color theme interface defining ANSI color codes for different UI elements
 */
export interface ColorTheme {
    victory: string;
    defeat: string;
    neutral: string;
    player: string;
    enemy: string;
    frigate: string;
    cruiser: string;
    battleship: string;
    casualties: string;
    survivors: string;
    reset: string;
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
export declare class ColorManager {
    private theme;
    private colorsEnabled;
    private colorSupported;
    constructor(enableColors?: boolean);
    /**
     * Returns the default color theme with ANSI color codes
     */
    private getDefaultTheme;
    /**
     * Validates and sanitizes numeric values with optional bounds checking
     */
    private validateNumericValue;
    /**
     * Detects if the terminal supports color output
     */
    private detectColorSupport;
    /**
     * Applies color to text if colors are enabled
     */
    colorize(text: string, colorType: keyof ColorTheme): string;
    /**
     * Formats fleet composition with color coding for unit types
     */
    formatFleetComposition(fleet: FleetComposition, showColors?: boolean): string;
    /**
     * Formats battle outcome with appropriate colors
     */
    formatBattleOutcome(outcome: string, perspective: 'attacker' | 'defender'): string;
    /**
     * Formats casualty information with warning colors
     */
    formatCasualties(casualties: number, total: number): string;
    /**
     * Formats survivor information with positive colors
     */
    formatSurvivors(survivors: number): string;
    /**
     * Formats player/AI identification with distinct colors
     */
    formatPlayerIdentifier(playerType: 'player' | 'ai', text: string): string;
    /**
     * Creates a colored separator line
     */
    createSeparator(length?: number, char?: string): string;
    /**
     * Enables or disables color output
     */
    setColorsEnabled(enabled: boolean): void;
    /**
     * Returns whether colors are currently enabled
     */
    areColorsEnabled(): boolean;
    /**
     * Returns whether the terminal supports colors
     */
    isColorSupported(): boolean;
    /**
     * Sets a custom color theme
     */
    setTheme(theme: Partial<ColorTheme>): void;
    /**
     * Gets the current color theme
     */
    getTheme(): ColorTheme;
    /**
     * Resets to the default color theme
     */
    resetTheme(): void;
}
/**
 * Default color manager instance
 */
export declare const defaultColorManager: ColorManager;
//# sourceMappingURL=ColorManager.d.ts.map