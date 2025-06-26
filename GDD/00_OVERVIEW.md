# Six Degrees - Game Overview

## About

Six Degrees is a game about word associations. It's a poetic-strategic exploration game where players traverse a network of interconnected words (like a Wiki) to reach a target word in the fewest steps possible. The game's structure is a hybrid between a logical taxonomy (like a tree of concepts) and a metaphorical social web (a network of associations). Each move is a click on a word within a definition, which reveals that word's own definition and related words. Every click forward counts as a step.

## Goal of the Game

The objective is simple: reach the destination word in the fewest possible steps. The fewer the steps, the better your score. Six Degrees is both a reflective puzzle and a meditative journey — a game that rewards thoughtful connections and 'scalable / zoomable' traversable logic.

## Core Gameplay Loop

1. The player is shown a starting word and a destination word.
2. Clicking the starting word opens its natural-language definition.
3. In the definition, certain words are clickable: these may be parents, children, acquaintances, traits, or roles.
4. Clicking on a linked word opens that word's definition.
5. Every click forward increments the player's step count.
6. The goal is to reach the destination word in the least number of steps possible.

### Polished Features

- Show visited path as a breadcrumb trail (Backtracking rewinds time: it removes the steps taken after that point, encouraging experimentation and puzzle-solving without penalty)
- Make it a "daily" game, with a new starting word and destination word each day. This is in sync globally, but allow a "Free Play" mode as well.
- Add a "Share" button once you finish to share a screenshot of your score with your friends, along with a link to the game, to encourage virality.
- Add a "Something missing in this definition?" button to allow players to suggest new words to add to the graph, to be used in later iteration of the game
- Add difficulty slider to allow players to choose how far away the starting word is from the destination word

## Envisioned Player Strategies

There are two core player archetypes:

### The Logician
- Navigates up to parent categories to access siblings
- Uses structured inference: "If cat is an animal, and dog is too, I can get to dog by going up to animal first"
- Values hierarchy, clarity, and precision

### The Poet
- Follows acquaintances, traits, and roles through contextual resonance
- Moves by metaphor, emotion, cultural vibe: "Apple reminds me of knowledge... or Steve Jobs"
- Values surprise, meaning, and personal logic

### Both Modes Can Succeed
Most players will mix both styles during a single game.

**Example Path: Destination = Stop Sign**
- **Logician's path (6 steps):** Cat → Animal → Human → Civilization → Rules → Traffic Sign → Stop Sign
- **Poet's path (6 steps):** Cat → Night → Street → City → Crosswalk → Red Light → Stop Sign

Both are valid. Both are beautiful. I hypothesise that making the best of both results in the highest score.

## Difficulty Tuning

Difficulty is tuned by controlling the number of steps the origin word is away from the destination.

**Path Generation Algorithm**:
1. Select a random destination word from the graph
2. Walk exactly X unique steps outward (no revisiting nodes) to find the origin word
3. Ensure origin ≠ destination; if the walk cycles back, continue until X distinct nodes traversed
4. Exclude trivial paths where origin is destination's direct parent/child (optional enhancement)
5. X = difficulty level (default: 6 to match the game title)

**Breadcrumb Behavior**:
- Each forward click adds the word to the breadcrumb trail
- Clicking any breadcrumb rewinds to that point: removes all subsequent steps and resets counter
- No penalty for backtracking - encourages experimentation

**Future Modes**:
- Easy (4 degrees)
- Normal (6 degrees) 
- Hard (8+ degrees)
- Expert (10+ with mandatory trait/role traversal)

