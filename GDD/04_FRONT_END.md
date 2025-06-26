# Front End

## 🎮 Front-End User Experience

### 1. Launch & Intro Screen

- **Splash / Title**
  - Display a clean "6 Degrees" logo or title.
  - Centered "Play Now" button invites the player to begin.

- **Settings / Difficulty (optional)**
  - If you support multiple step-counts (e.g. 4-, 6-, 8-degree puzzles), allow the player to choose here.
  - Store this value as the game's "X" (number of clicks from origin → destination).

### 2. Game Start

- **Generate Puzzle**
  - Pick a random destination word from the graph.
  - Walk exactly X hops away (parent/child/acquaintance/trait/role links) to select an origin word that is guaranteed to reach the destination in ≤ X clicks.

- **Show Origin Definition**
  - Navigate immediately to the origin word's "definition page."

### 3. Definition Page Layout

Each word (Thing, Trait or Role) has its own page template:

```
┌─────────────────────────────────────────┐
│ [Back ←]   DESTINATION: [Stop Sign]     │ ← always visible bar at top or side
│ Steps:  0 | Path: [Cat]                │ ← step counter + breadcrumb trail
├─────────────────────────────────────────┤
│              CAT                       │ ← Word title (large headline)
├─────────────────────────────────────────┤
│ PARENT: Animal                         │ ← clickable link
│ CHILDREN: Dog  • Bird • Fish • …       │ ← comma-separated or bullet list
│ TRAITS: Independent • Agile • Curious   │ ← clickable adjectives
│ ACQUAINTANCES: Mouse • Litter Box • …   │ ← poetic links
│ PURPOSES: Companion • Pet              │ ← roles/purposes
├─────────────────────────────────────────┤
│ [Footer or Sidebar: "Quit" | "Help"]   │
└─────────────────────────────────────────┘
```

#### Header / Sidebar
- **Destination Reminder**: Always show the goal word.
- **Step Counter**: "Steps: N" increments on each forward click.
- **Breadcrumb Trail**:
  - Shows each visited word in order.
  - Clicking any breadcrumb rewinds the game back to that point (resets step count and path accordingly).

#### Main Content
- **Word Title**: Large, centered.
- **Metadata Sections** (each with a clear label):
  1. Parent (single link)
  2. Children (list)
  3. Traits (list)
  4. Acquaintances (list)
  5. Purposes / Roles (if present)

#### Clickable Links
- All listed words are rendered as tappable/clickable.
- On hover (desktop) or focus (accessibility), show subtle highlighting.

### 4. Traversal & Rules

#### Click Behavior
- Clicking any metadata link (parent, child, trait, acquaintance, role) opens that word's definition page.
- Each forward click increments the step count by 1.
- No penalty for backtracking—clicking a breadcrumb simply restores the previous state.

#### No Hard Blocks
- The player may navigate up (to parents), down (to children), or laterally (via traits/acquaintances) in any order.

#### Cycle Handling
- The UI does not prevent clicking previously visited words. Instead, breadcrumb navigation lets players back out of loops if needed.

### 5. Winning the Game

#### Arrival
- When the player clicks the destination word, the game immediately transitions to a "Victory" screen.

#### Victory Screen

```
┌───────────────────────────────────┐
│          🎉 Hooray! 🎉           │
│ You reached [Stop Sign] in 6 steps │
│ Path: Cat → Night → Street → …    │
├───────────────────────────────────┤
│   [Share Your Score] [Play Again]  │
└───────────────────────────────────┘
```

- Show final step count, breadcrumb path, and two buttons:
  1. **Share Your Score** (opens OS-level share sheet / copy link)
  2. **Play Again** (restarts at the intro or immediately generates a new puzzle)















