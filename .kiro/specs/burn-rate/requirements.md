# Burn Rate - Requirements Document

## Introduction

Burn Rate is a single-player, turn-based web strategy game with roguelike elements featuring a CLI-esque interface. Players start with a finite pool of resources that continuously burn down each turn, with limited opportunities to gain more. The game combines resource depletion pressure with Planetarion-inspired fleet composition and intelligence gathering. Each run lasts 2-5 minutes with permadeath mechanics, emphasizing macro strategy over micro-management through procedural generation and risk-reward decision making.

## Requirements

### Requirement 1

**User Story:** As a player, I want to manage a dual-resource economy (metal and energy) with income rates that can be modified by construction and unit upkeep, so that I must balance economic growth with military production under time pressure.

#### Acceptance Criteria

1. WHEN the game starts THEN the system SHALL initialize both metal and energy with positive base income rates
2. WHEN a player constructs units THEN the system SHALL temporarily reduce income rates during the construction period
3. WHEN units are completed THEN the system SHALL apply permanent upkeep costs that reduce base income rates
4. WHEN a player builds economic structures THEN the system SHALL increase base income rates for the corresponding resource type
5. IF either resource income drops to zero or below THEN the system SHALL trigger economic stall conditions affecting unit production and operation

### Requirement 2

**User Story:** As a player, I want to scan opponents to gather intelligence about their fleet composition and economy, so that I can make informed strategic decisions about fleet composition and timing.

#### Acceptance Criteria

1. WHEN a player initiates a scan THEN the system SHALL consume scanning resources and provide intelligence data
2. WHEN a scan is performed THEN the system SHALL reveal partial information about enemy fleet strength with potential inaccuracies
3. WHEN a player chooses not to scan THEN the system SHALL force them to make decisions with incomplete information
4. IF a player invests in better scanning technology THEN the system SHALL provide more accurate intelligence
5. WHEN multiple scans are performed THEN the system SHALL provide progressively more detailed information

### Requirement 3

**User Story:** As a player, I want to build and compose fleets using rock-paper-scissors mechanics, so that I can counter enemy strategies and achieve tactical superiority.

#### Acceptance Criteria

1. WHEN a player builds frigates THEN the system SHALL make them effective against cruisers but vulnerable to battleships
2. WHEN a player builds cruisers THEN the system SHALL make them effective against battleships but vulnerable to frigates
3. WHEN a player builds battleships THEN the system SHALL make them effective against frigates but vulnerable to cruisers
4. WHEN fleets engage in combat THEN the system SHALL resolve battles using RPS matchups with semi-random outcomes
5. WHEN combat is resolved THEN the system SHALL apply damage based on fleet composition and matchup effectiveness

### Requirement 4

**User Story:** As a player, I want game sessions that naturally resolve quickly through escalating economic and military pressure, so that I experience intense strategic decision-making without artificial time limits.

#### Acceptance Criteria

1. WHEN a game progresses THEN the system SHALL create natural escalation through AI aggression and economic pressure
2. WHEN the AI detects player economic growth THEN the system SHALL respond with increased military pressure
3. WHEN economic stalls occur THEN the system SHALL create cascading effects that force rapid resolution
4. WHEN military engagements happen THEN the system SHALL create decisive outcomes that push toward game conclusion
5. WHEN a game ends THEN the system SHALL provide immediate feedback on performance and restart options

### Requirement 5

**User Story:** As a player, I want procedurally generated starting conditions and AI opponents, so that each run feels unique and requires different strategies.

#### Acceptance Criteria

1. WHEN a new game starts THEN the system SHALL randomly generate 2-4 asteroid fields with different resource yields
2. WHEN the AI is initialized THEN the system SHALL select a random behavior archetype (aggressor, economist, trickster, or hybrid)
3. WHEN the map is generated THEN the system SHALL ensure balanced but varied starting positions
4. WHEN a player restarts THEN the system SHALL generate completely new conditions
5. WHEN AI behavior is determined THEN the system SHALL consistently apply that archetype's decision-making patterns

### Requirement 6

**User Story:** As a player, I want permadeath mechanics with immediate restart capability, so that I can learn from failures and attempt new strategies quickly.

#### Acceptance Criteria

1. WHEN a player's economy collapses THEN the system SHALL immediately end the game with no save state
2. WHEN a player's fleet is destroyed THEN the system SHALL trigger game over with permadeath
3. WHEN a game ends THEN the system SHALL provide immediate restart options with new random conditions
4. WHEN a player achieves victory THEN the system SHALL record the win and offer a new challenge
5. IF a player loses THEN the system SHALL provide brief feedback on the cause of failure

### Requirement 7

**User Story:** As a player, I want a CLI-esque interface that provides clear information and fast input, so that I can make quick strategic decisions without interface friction.

#### Acceptance Criteria

1. WHEN the game displays information THEN the system SHALL use text-based layouts with clear hierarchical organization
2. WHEN a player needs to input commands THEN the system SHALL provide keyboard shortcuts and command-line style input
3. WHEN game state changes THEN the system SHALL update displays immediately with minimal visual effects
4. WHEN multiple options are available THEN the system SHALL display them in numbered or lettered lists for quick selection
5. WHEN critical information is displayed THEN the system SHALL highlight it using text formatting rather than complex graphics

### Requirement 8

**User Story:** As a player, I want victory conditions based on destroying the AI fleet, so that the game ends decisively when the enemy can no longer fight.

#### Acceptance Criteria

1. WHEN the AI's fleet is eliminated (0 ships at home and no fleets in transit) THEN the system SHALL trigger military victory for the player immediately
2. WHEN victory conditions are met THEN the system SHALL immediately end the game and display victory results
3. WHEN approaching victory conditions THEN the system SHALL provide feedback on progress toward fleet elimination
4. WHEN the AI detects impending defeat THEN the system SHALL allow for desperate last-stand behaviors