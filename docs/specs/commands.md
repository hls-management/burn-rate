# Commands

Strict command grammar and examples for the CLI-style UI.

## Grammar (EBNF-ish)
- build := 'build' SP ( 'mine' | 'reactor' ) SP INT
- queue := 'queue' SP ( 'skiff' | 'frigate' | 'dreadnought' ) SP INT
- attack := 'attack' SP PLAYER SP COMPOSITION
- scan := 'scan' SP PLAYER SP ( 'basic' | 'deep' | 'advanced' )
- end := 'end'

- COMPOSITION := TYPE SP INT ( SP TYPE SP INT )*
- TYPE := 'skiff' | 'frigate' | 'dreadnought'
- PLAYER := 'p1' | 'p2' | 'p3' | 'p4' (human is p1)
- INT := non-negative integer without separators
- SP := single space (multiple spaces or tabs are invalid)

Commands are case-insensitive for keywords and types.

## Examples
- build mine 2
- build reactor 1
- queue skiff 200
- queue frigate 40
- queue dreadnought 5
- attack p2 skiff 150 frigate 20
- scan p3 basic
- scan p4 advanced
- end

## Validation Rules
- build: sufficient projected end-of-turn resources to pay escalating cost.
- queue: sufficient projected end-of-turn resources for costs and ability to sustain upkeep; integer counts only.
- attack: all referenced ships must be at home and unreserved; composition may omit types with zero.
- scan: consumes Energy at end-of-turn; reveals planet-only data for target.
- end: ends the turn; further input deferred until next turn state.

On invalid input, return an error with the expected next tokens and a short example.
