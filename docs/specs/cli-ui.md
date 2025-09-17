# CLI-Style Web UI

Specifies the terminal-style interface, interaction model, and mobile support.

## Goals
- Fast, keyboard-first command input with strict parsing and helpful errors.
- Text/ASCII-only presentation; leverage existing styles in styles/style-guide.css.
- Mobile-friendly via large input, on-screen suggestions, and tap targets.

## Components
- Terminal viewport with scrollback history of system messages and player commands.
- Single command input line with command history navigation.
- Suggestion bar: context-aware suggestions (commands and valid next tokens) as tappable chips.
- Minimal HUD lines for current Metal/Energy, projected income/upkeep, and mission statuses.

## Interactions
- Autocomplete offers next-token suggestions, but parser remains strict; invalid commands are rejected.
- On commit of builds/queues, show projected income/upkeep immediately.
- Errors are descriptive and include short examples.

## Mobile Support
- Input always visible with adequate tap targets for suggestions.
- Avoid horizontal scrolling; wrap lines gracefully.
- Performance budget for low-end devices (text-only, no heavy libraries).

## Accessibility
- Clear focus styles, predictable keyboard navigation.
- Color choices inherit from existing style guide.

## Persistence
- No saves in v1; session state is ephemeral.

See Commands spec for grammar and examples.
