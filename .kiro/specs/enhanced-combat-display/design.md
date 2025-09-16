# Enhanced Combat Display Design

## Overview

This design enhances the combat event display system in the CLI interface by implementing detailed, color-coded combat reports that provide players with comprehensive battle information. The enhancement focuses on improving the visual presentation and information density of combat events while maintaining the existing game flow.

## Architecture

The enhancement will modify the existing `GameDisplay` class to include:

1. **Color Management System**: A utility for consistent color coding across combat displays
2. **Enhanced Combat Formatter**: Expanded combat event formatting with detailed breakdowns
3. **Tactical Analysis Display**: Logic to show unit effectiveness and battle advantages
4. **Progressive Battle Display**: Support for showing battle phases and progression

### Component Integration

- **GameDisplay.ts**: Primary modification target for enhanced combat display methods
- **CLIInterface.ts**: Minor updates to ensure proper combat event display timing
- **Color Utility**: New utility module for consistent color management

## Components and Interfaces

### Color Management

```typescript
interface ColorTheme {
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
```

### Enhanced Combat Event Display

```typescript
interface CombatDisplayOptions {
  showTacticalAnalysis: boolean;
  showBattlePhases: boolean;
  useColors: boolean;
  detailedCasualties: boolean;
}

interface TacticalAdvantage {
  unitType: 'frigate' | 'cruiser' | 'battleship';
  advantage: 'strong' | 'weak' | 'neutral';
  explanation: string;
}
```

### Battle Phase Information

```typescript
interface BattlePhase {
  phase: 'opening' | 'main' | 'cleanup';
  description: string;
  advantage: 'attacker' | 'defender' | 'neutral';
}
```

## Data Models

### Enhanced Combat Event Processing

The existing `CombatEvent` interface will be extended with computed properties for display:

```typescript
interface EnhancedCombatDisplay {
  event: CombatEvent;
  tacticalAdvantages: TacticalAdvantage[];
  battlePhases: BattlePhase[];
  effectivenessRatios: {
    attackerEffectiveness: number;
    defenderEffectiveness: number;
  };
  casualtyPercentages: {
    attackerLossRate: number;
    defenderLossRate: number;
  };
}
```

### Color Utility Module

A new utility module will handle color management:

```typescript
class ColorManager {
  private theme: ColorTheme;
  private colorsEnabled: boolean;
  
  public colorize(text: string, colorType: keyof ColorTheme): string;
  public formatFleetComposition(fleet: FleetComposition): string;
  public formatBattleOutcome(outcome: string, perspective: 'attacker' | 'defender'): string;
}
```

## Error Handling

### Color Support Detection

- Detect terminal color support capabilities
- Gracefully fallback to plain text when colors are not supported
- Provide configuration option to disable colors

### Display Validation

- Validate combat event data before formatting
- Handle missing or incomplete combat information
- Ensure consistent formatting across different battle types

## Testing Strategy

### Unit Tests

1. **Color Utility Tests**
   - Test color code generation and application
   - Verify fallback behavior when colors are disabled
   - Test color theme consistency

2. **Combat Display Formatting Tests**
   - Test enhanced combat event formatting
   - Verify tactical analysis calculations
   - Test battle phase determination logic

3. **Integration Tests**
   - Test complete combat display flow
   - Verify color consistency across multiple combat events
   - Test display with various combat scenarios

### Visual Testing

1. **Manual CLI Testing**
   - Test color display in different terminal environments
   - Verify readability and visual hierarchy
   - Test with multiple simultaneous combat events

2. **Accessibility Testing**
   - Ensure information is accessible without color
   - Test with color-blind friendly alternatives
   - Verify text contrast and readability

## Implementation Details

### Color Scheme Design

The color scheme will follow these principles:
- **Semantic Colors**: Colors convey meaning (green=good, red=bad, yellow=neutral)
- **Consistency**: Same colors used for same concepts throughout
- **Accessibility**: High contrast and color-blind friendly options
- **Terminal Compatibility**: Use standard ANSI color codes for broad support

### Enhanced Combat Display Flow

1. **Combat Event Processing**: When `displayTurnResult` is called
2. **Tactical Analysis**: Calculate unit effectiveness and advantages
3. **Color Application**: Apply appropriate colors based on context
4. **Progressive Display**: Show battle information in logical phases
5. **Summary Display**: Provide clear outcome summary with visual emphasis

### Performance Considerations

- Color formatting should have minimal performance impact
- Cache color codes to avoid repeated string operations
- Optimize display formatting for multiple combat events
- Ensure responsive display even with complex battle scenarios

## Configuration Options

### Display Preferences

```typescript
interface CombatDisplayConfig {
  enableColors: boolean;
  showTacticalAnalysis: boolean;
  showBattlePhases: boolean;
  detailedCasualties: boolean;
  colorTheme: 'default' | 'high-contrast' | 'colorblind-friendly';
}
```

### Terminal Compatibility

- Auto-detect terminal color capabilities
- Provide manual override options
- Support for different color depth levels (16, 256, true color)
- Graceful degradation for limited terminals