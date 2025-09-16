# Design Document

## Overview

The user documentation system for Burn Rate will consist of three comprehensive markdown documents that provide complete guidance for players at all skill levels. The documentation will be structured to support both quick reference and deep learning, with clear navigation and consistent formatting throughout.

## Architecture

### Document Structure
The documentation will be organized into three main files:
- `INSTALL.md` - Installation and setup instructions
- `GAMEPLAY.md` - How to play guide with commands and basic strategy
- `MECHANICS.md` - Detailed game mechanics and advanced strategy

### Content Organization
Each document will follow a hierarchical structure with:
- Clear section headers for navigation
- Consistent formatting and terminology
- Code blocks for commands and examples
- Tables for quick reference data
- Progressive complexity from basic to advanced concepts

## Components and Interfaces

### Installation Documentation (`INSTALL.md`)
**Purpose**: Guide users through setup process
**Sections**:
- Prerequisites (Node.js, npm requirements)
- Installation steps (clone, install, build)
- Verification procedures (test commands)
- Troubleshooting common issues
- Platform-specific notes

### Gameplay Documentation (`GAMEPLAY.md`)
**Purpose**: Teach players how to play the game
**Sections**:
- Quick start guide
- Game objectives and victory conditions
- Turn structure and phases
- Complete command reference with syntax
- Basic strategy tips
- Example gameplay scenarios

### Mechanics Documentation (`MECHANICS.md`)
**Purpose**: Explain underlying game systems
**Sections**:
- Economic system (resources, income, structures)
- Fleet system (units, combat, movement)
- Intelligence system (scanning, misinformation)
- AI archetypes and behaviors
- Victory condition details
- Game phase progression
- Advanced strategy concepts

## Data Models

### Command Reference Structure
```markdown
### Command Name
**Syntax**: `command [required] <optional>`
**Description**: What the command does
**Examples**: 
- `example 1`
- `example 2`
**Notes**: Additional information
```

### Unit Statistics Tables
```markdown
| Unit Type | Build Cost | Build Time | Upkeep | Effectiveness |
|-----------|------------|------------|--------|---------------|
| Frigate   | 4M, 2E     | 1 turn     | 2M, 1E | vs Cruiser: 1.5x |
```

### Game Mechanics Explanations
- Resource flow diagrams (text-based)
- Combat resolution examples
- Economic formulas and calculations
- Turn sequence breakdowns

## Error Handling

### Documentation Accessibility
- Clear language avoiding technical jargon
- Progressive disclosure of complexity
- Multiple examples for each concept
- Cross-references between related sections

### User Support
- Troubleshooting sections in each document
- Common error scenarios and solutions
- Links to relevant sections for context
- FAQ-style problem resolution

## Testing Strategy

### Content Validation
- Verify all commands and examples work correctly
- Test installation instructions on clean environment
- Validate all game mechanics explanations against code
- Ensure consistency in terminology and formatting

### User Experience Testing
- Review documentation flow for new players
- Verify quick reference sections are complete
- Test navigation between sections
- Ensure examples are clear and helpful

### Maintenance Strategy
- Keep documentation synchronized with code changes
- Regular review of user feedback and common questions
- Update examples and strategies based on gameplay data
- Version control for documentation changes

## Implementation Approach

### Content Research
Based on code analysis, the documentation will cover:

**Economic System**:
- Base income: 10,000 metal and energy per turn
- Structure costs with exponential scaling
- Construction queue mechanics
- Income vs upkeep balance

**Fleet System**:
- Three unit types: Frigates, Cruisers, Battleships
- Rock-paper-scissors effectiveness system
- 3-turn attack cycle (depart, combat, return)
- Fleet visibility and intelligence mechanics

**Combat System**:
- Strength calculation based on unit effectiveness
- Random factors for battle outcomes
- Casualty rates based on battle results
- Counter-attack opportunities

**AI Archetypes**:
- Aggressor: Focus on military expansion
- Economist: Focus on economic growth
- Trickster: Deception and intelligence warfare
- Hybrid: Balanced approach

**Victory Conditions**:
- Military: Eliminate all enemy fleets (after being attacked)
- Economic: Force enemy economy to collapse (negative income + no resources)

### Documentation Standards
- Use consistent markdown formatting
- Include code blocks for all commands
- Provide multiple examples for complex concepts
- Cross-reference related sections
- Use tables for statistical data
- Include visual separators for readability