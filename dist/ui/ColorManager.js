/**
 * Color Manager utility class for consistent color coding across combat displays
 */
export class ColorManager {
    theme;
    colorsEnabled;
    colorSupported;
    constructor(enableColors = true) {
        this.theme = this.getDefaultTheme();
        this.colorSupported = this.detectColorSupport();
        this.colorsEnabled = enableColors && this.colorSupported;
    }
    /**
     * Returns the default color theme with ANSI color codes
     */
    getDefaultTheme() {
        return {
            victory: '\x1b[32m', // Green
            defeat: '\x1b[31m', // Red
            neutral: '\x1b[33m', // Yellow
            player: '\x1b[34m', // Blue
            enemy: '\x1b[35m', // Magenta
            frigate: '\x1b[36m', // Cyan
            cruiser: '\x1b[33m', // Yellow
            battleship: '\x1b[31m', // Red
            casualties: '\x1b[91m', // Bright red
            survivors: '\x1b[92m', // Bright green
            reset: '\x1b[0m' // Reset
        };
    }
    /**
     * Detects if the terminal supports color output
     */
    detectColorSupport() {
        // Check common environment variables that indicate color support
        const colorTerms = ['color', 'ansi', 'truecolor', '256color'];
        const term = process.env.TERM?.toLowerCase() || '';
        const colorTerm = process.env.COLORTERM?.toLowerCase() || '';
        // Check if TERM or COLORTERM contains color indicators
        const hasColorTerm = colorTerms.some(colorType => term.includes(colorType) || colorTerm.includes(colorType));
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
    colorize(text, colorType) {
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
    formatFleetComposition(fleet, showColors = true) {
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
    formatBattleOutcome(outcome, perspective) {
        if (!this.colorsEnabled) {
            return outcome.toUpperCase().replace('_', ' ');
        }
        let colorType;
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
    formatCasualties(casualties, total) {
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
    formatSurvivors(survivors) {
        const survivorText = `${survivors} ships`;
        if (!this.colorsEnabled) {
            return survivorText;
        }
        return this.colorize(survivorText, 'survivors');
    }
    /**
     * Formats player/AI identification with distinct colors
     */
    formatPlayerIdentifier(playerType, text) {
        if (!this.colorsEnabled) {
            return text;
        }
        const colorType = playerType === 'player' ? 'player' : 'enemy';
        return this.colorize(text, colorType);
    }
    /**
     * Creates a colored separator line
     */
    createSeparator(length = 60, char = '-') {
        const separator = char.repeat(length);
        if (!this.colorsEnabled) {
            return separator;
        }
        return this.colorize(separator, 'neutral');
    }
    /**
     * Enables or disables color output
     */
    setColorsEnabled(enabled) {
        this.colorsEnabled = enabled && this.colorSupported;
    }
    /**
     * Returns whether colors are currently enabled
     */
    areColorsEnabled() {
        return this.colorsEnabled;
    }
    /**
     * Returns whether the terminal supports colors
     */
    isColorSupported() {
        return this.colorSupported;
    }
    /**
     * Sets a custom color theme
     */
    setTheme(theme) {
        this.theme = { ...this.theme, ...theme };
    }
    /**
     * Gets the current color theme
     */
    getTheme() {
        return { ...this.theme };
    }
    /**
     * Resets to the default color theme
     */
    resetTheme() {
        this.theme = this.getDefaultTheme();
    }
}
/**
 * Default color manager instance
 */
export const defaultColorManager = new ColorManager();
//# sourceMappingURL=ColorManager.js.map