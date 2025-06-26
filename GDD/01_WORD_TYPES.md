# Word Types

## Thing Words

### What It Is

- In Six Degrees, all primary nodes in the graph are called "Thing Words" — nouns that represent distinct entities, objects, systems, or concepts.
- These words are the most common in the game and serve as both origin and destination points in traversal.
- While all Thing Words share the same structural format, they may be be called "parent, child, sibling, or acquaintance" to describe how they relate to each other.
  - A thing word is called a **parent** when it represents the most precise broader category of a thing.
  - A thing word is called a **child** when it is a more specific example of another thing.
  - A thing word is called a **sibling** when it is a parallel member of the same category (purely used for thinking about the game development and design)
  - A thing word is called an **acquaintance** when it shares thematic, symbolic, or commonly associated meaning with another thing.

### Definition System

Every Thing Word includes the following metadata, with its own parent (1), children (3-5), traits (3-5), acquaintances (3-5), and purposes if they exist (1-3). The exact count within each range is determined by salience - selecting only the most commonly associated items in everyday human thought.

```json
{
  "word": "Cat",
  "type": "thing"
  "parent": "Animal",
  "children": [
    "Siamese",
    "Tabby",
    "Persian",
    "Maine Coon",
    "Bengal"
  ],
  "traits": [
    "independent",
    "agile",
    "curious",
    "nocturnal",
    "graceful"
  ],
  "acquaintances": [
    "Dog",
    "Mouse",
    "Litter Box",
    "Laser Pointer",
    "Fur"
  ],
  "purposes": [
    "Companion",
    "Pet"
  ]
}  
```

*Note: This example shows 5 items per category, which is the maximum. The actual count will be 3-5 based on salience.*

### Child

- Children are more specific examples, types, or subcategory 'thing words' generated from a parent
- Each child must satisfy the statement: "A [child] is a kind of [parent word]"
- In player traversal, Children support downward movement in abstraction and help players zoom into more concrete ideas
- They should be the MOST LIKELY thought of words that fit this criteria, ordered by cognitive salience (most commonly associated in everyday human thought)
- Generate 3-5 items, selecting only those with highest salience

**Examples:**
- **"Animal" → Children:** Dog, Cat, Bird, Fish, Horse (5 items - high salience category)
- **"Tool" → Children:** Hammer, Screwdriver, Wrench (3 items - focused category)
- **"Emotion" → Children:** Happy, Sad, Angry, Fear (4 items - core emotions)

### Parent

- The Parent is the single most appropriate broader category that a a child word belongs to
- Unlike children, which are generated based on their parents, parents are never generated from children, as generation is a one-way process.
- In player traversal, clicking on a parent supports "upward" movement in abstraction and help players zoom out to more general words
- The first parent, which has no parent of its own, is our God Word: "Thing"

**Examples:**
- **"Cat" → Parent:** Animal
- **"Sadness" → Parent:** Emotion
- **"Hammer" → Parent:** Tool
- **"Democracy" → Parent:** System

### Sibling

- Siblings are words that share the same parent — they are parallel members of the same category.
- For example, "Dog" and "Cat" would both be siblings if they were the direct children of "Mammal." (FYI not sure if this example stands with the real word graph)
- Unlike parents, children, and acquaintances, siblings are never explicitly listed in a word's metadata. Instead, they are inferred by moving up to a shared parent and then down into another child. This design encourages discovery and strategy: a player might wish to find a sibling in order to traverse 'horizontally', and may "zoom out" to a shared parent and then "zoom in" to a different child.
- The concept of siblings is mentioned here simply because it's useful for thinking about game development, design, and traversal strategy, but is not a direct part of a thing word's metadata.

**Examples:**
- "Dog" and "Cat" → Siblings (both potential children of "Mammal")
- "Hammer" and "Screwdriver" → Siblings (both potential children of "Tool")
- "Joy" and "Sadness" → Siblings (both potential children of "Emotion")
- "Democracy" and "Monarchy" → Siblings (both potential children of "System")

### Acquaintance

- Acquaintances are a type of Thing word generated based on lateral associations — thing words that most frequently co-occur in thought or experience, while not being a parent, sibling, children, roles, or synonyms. (Very important that acquaintances are explictly not these other types of words)
- Acquaintances are generated from the thing word and reflect intuitive, often emotional or symbolic associations — the kind of answer you might give to the question, "When I say X, you think…?" (as long as the answer is not a parent, sibling, children, roles, or synonyms). These connections arise from culture, metaphor, memory, story, or shared experience.
- A word's acquaintances often include symbolic opposites, poetic complements, or things that frequently co-occur in thought or experience ("9/11 and Osama Bin Laden")
- Acquaintances are a key part of the "Poet's Traversal Strategy," as they allow players to warp across conceptual space — following emotional resonance, metaphorical logic, or cultural symbolism rather than strict hierarchy. They enable surprising yet satisfying leaps between ideas that may not be categorically related, but feel meaningfully connected.
- They should be the MOST LIKELY thought of word that fits this crtieria, and put in order of most likely thought about (Not unlike the game of Jeopardy)

### Acquaintance Symmetry

- **One-Directional by Default**: Acquaintances are one-way edges. If "Romeo" lists "Juliet" as an acquaintance, this does NOT automatically create a reverse link from "Juliet" to "Romeo."
- **Salience-Based Generation**: Each word's acquaintances reflect what people think of when they hear that specific word. "Romeo" → "Juliet" because people think of Juliet when hearing Romeo, but "Juliet" might evoke "Tragedy" or "Balcony" more prominently than "Romeo."
- **Natural Bidirectional Emergence**: If both directions independently emerge during generation (e.g., both "Romeo" and "Juliet" list each other), this represents a strong, naturally symmetric association.
- **Edge Deduplication**: During Phase 3 (step 8.2), if the same acquaintance pair emerges naturally in both directions, the system preserves the semantic strength while avoiding redundant metadata storage. See Build Flow Phase 3 for implementation details.
- **Rationale**: Enforcing artificial symmetry would dilute signal quality and inflate noise in the graph. Letting associations emerge naturally preserves the authentic, salience-based nature of human associative thinking.

**Examples:**
- "9/11" → Acquaintances: Osama Bin Laden, Twin Towers, Airplane, Collapse, War on Terror (5 items)
- "Romeo" → Acquaintances: Juliet, Balcony, Poison, Tragedy (4 items)
- "Mirror" → Acquaintances: Reflection, Glass, Vanity (3 items)
- "Crown" → Acquaintances: King, Queen, Throne, Jewels (4 items)

## Trait Words

### What It Is

- Traits are adjectives — descriptive qualities like "agile," "loud," or "resilient"
- Trait words function as BRIDGES between thing words, by nature of things that share those traits.
- As they are pure qualitative bridges, they do not have parents or children.
- They should be the MOST LIKELY thought of words that fit this criteria, ordered by cognitive salience (most commonly associated in everyday human thought)
- Generate 3-5 items, selecting only those with highest salience

### Examples

- **"Cat" → Traits:** Independent, Agile, Curious, Nocturnal, Graceful (5 items)
- **"Ocean" → Traits:** Vast, Deep, Powerful, Mysterious (4 items)
- **"Book" → Traits:** Informative, Engaging, Portable (3 items)

### Definition System

The metadata of traits comprise of a list of thing words within whose metadata the trait is listed. Unlike thing words which have pre-set metadata, metadata of traits are dynamically generated from the word graph, (on load or on demand?). The metadata of Traits words are not pre-defined entities but emerge from the graph. In order to generate the metadata of a trait, the system will search the graph for all words that list this trait.

Because of this, during the initial graph build, traits are passively generated in each word's metadata alongside the other components, but are not defined during the initial stage. 
- Only traits that are shared by two or more defined words will be promoted in a later pass to become formal bridge-nodes with their own trait definitions

**Example:**
```json
{
  "word": "Agile",
  "type": "trait",
  "exemplars": [
    "Cat",
    "Sprinter",
    "Dancer",
    "Gymnast",
    "Falcon",
    "Fencer",
    "Parkour"
  ]
}
```

*(Each of those words shared betweem two or more thing words' definitions)*

**Note on Natural Language Definitions**: During beta, traits will have generated prose definitions that weave together their exemplars. For alpha testing, the UI will display the raw exemplar list directly.

## Role Words

### What It Is

- Role Words are functional or purpose-centered concepts that describe what a Thing is for, or what it does in the world.
- They can take two common forms:
  • Gerund Nouns (e.g. "Cutting," "Healing," "Teaching") — action-like roles
  • Abstract Nouns (e.g. "Companionship," "Protection," "Guidance") — value- or experience-based roles
- Role Words act as BRIDGES between Thing Words that fulfill similar purposes, even if they come from different branches of the taxonomy.
- Like Traits, Role Words are non-hierarchical: they do not have parents or children.
- However, unlike Traits, Role Words are defined by not only their EXEMPLARS, but also by their ACQUAINTANCES.
- **Critical Design Decision**: Not every Thing Word has roles. Roles are only generated when functional use is central to a word's identity.

### When Roles Are Generated

- **LLM-Based Decision**: For each Thing Word, an LLM determines whether roles are semantically appropriate on a case-by-case basis.
- **Semantic Salience**: Roles are only generated when the function or purpose of a Thing Word is a central part of its identity.
- **Decision Criteria**: The LLM asks: "Does this word represent an entity whose primary identity is defined by a function, service, or purpose in the world?"
- **Key Signals**: concrete tools, professions, social roles, systems with active effects.
- **Examples of Role-Worthy Words**: "Scissors" (cutting), "Guru" (guiding), "Dog" (companionship), "Therapist" (healing)
- **Examples of Non-Role-Worthy Words**: "Cloud" (abstract concept), "Beauty" (aesthetic quality), "Feather" (natural object without clear function)
- **Conditional Generation**: Roles are the only metadata type generated conditionally. Children, traits, and acquaintances are always generated for every Thing Word.
- **Rationale**: This approach avoids forcing roles onto concepts where purpose would feel artificial, keeping the graph clean and meaningful.

### Examples

- "Scissors" → Roles: Cutting, Trimming, Separating
- "Dog" → Roles: Companionship, Guarding, Herding
- "Therapist" → Roles: Guiding, Healing
- "Sword" → Roles: Fighting, Cutting, Protecting
- "Alarm Clock" → Roles: Waking, Alerting

### Role Format & Structure

- **Mixed Format Support**: Roles can be either gerund nouns ("Cutting," "Healing") or abstract nouns ("Companionship," "Protection")
- **Format Decision**: The LLM chooses whichever noun form feels most semantically appropriate for each Thing Word
- **Constraints**: 
  • Must be noun-like (no raw verbs like "cut" or "teach")
  • Must clearly reflect functional or purposeful use
  • Must be able to stand alone as a concept
- **Number of Roles**: 1-3 roles per Thing Word, selecting only the most salient functional purposes. Quality over quantity.
- **Selection Criteria**: The LLM is instructed to "List 1-3 salient roles — the ones most people intuitively think of first when they consider [WORD]. Order them by likelihood. Return only roles with high cognitive salience."
- **Salience-Based Ordering**: Roles are always ordered by cognitive salience (most likely to be thought of first) to enable safe, deterministic pruning.
- **Rationale**: This phrasing biases the model toward its strongest candidates, and because we truncate at 3 and then later canonicalize/promote only roles appearing in ≥2 words, the graph naturally favors the most cognitive "wins."

### Definition System

Role Word metadata is composed of:
• exemplars — Thing Words that listed the Role in their metadata
• acquaintances — symbolic, cultural, or experiential associations related to the role itself (3-5 items)

Role Words are seeded during Phase 1: when a Thing Word is created, the LLM evaluates whether it warrants roles at all. If so, it generates 1-3 salient Role Words to describe its purpose. These roles are initially stored as string literals within the Thing's metadata under a `purposes` array, alongside traits and acquaintances.

Then, in Phase 2.5, we promote each unique Role Word into its own node if it appears in two or more Thing Words. This ensures roles are real bridges, not one-off metadata fragments.

**Example:**
```json
{
  "word": "Cutting",
  "type": "role",
  "exemplars": [
    "Scissors",
    "Knife",
    "Scalpel",
    "Sword",
    "Chainsaw"
  ],
  "acquaintances": [
    "Sharpness",
    "Separation",
    "Precision",
    "Motion",
    "Blade"
  ]
}
```

**Note on Natural Language Definitions**: During beta, roles will have generated prose definitions that describe their function and exemplars. For alpha testing, the UI will display the raw metadata directly.

**Example:**
```json
{
  "word": "Companionship",
  "type": "role",
  "exemplars": [
    "Dog",
    "Friend",
    "Pet",
    "Caregiver"
  ],
  "acquaintances": [
    "Loyalty",
    "Presence",
    "Support",
    "Closeness",
    "Love"
  ]
}
```

// Natural language definition will be generated in Phase 4 (beta)

As with Traits, Role definitions grow richer as the graph expands. Role Words help players traverse via function, purpose, or effect—revealing why something exists, not just what it is.

### 🧠 Why This Matters

• Role Words introduce intent, use, and social function into the semantic map — enabling movement not just by category or trait, but by what things are for.
• Roles are especially important for tools, social beings, professions, and systems with an active function.
• But by requiring functional salience (i.e. only assigning Roles when they're central), the game avoids artificial or bloated metadata.
• Roles give players a new strategic traversal dimension: function.
• **Bidirectional consistency** ensures that clicking on a Role shows all Things that perform that function, and clicking on a Thing shows its Roles with confidence that the Role node truly connects back.

### 📐 Grammatical Distinction: Traits vs. Roles

**No Overlap By Design**: The grammatical structure of Traits and Roles ensures they never overlap:
- **Traits** are ALWAYS adjectives (descriptive qualities): "Sharp," "Heavy," "Bright," "Complex"
- **Roles** are ALWAYS nouns (gerunds or abstracts): "Cutting," "Weighing," "Illumination," "Analysis"

This fundamental grammatical difference means a word can never be both a Trait and a Role. Even when concepts seem related (e.g., "Sharp" as a trait vs. "Cutting" as a role), they remain distinct word types serving different navigational purposes in the graph.

### 📎 Notes

• Roles are only generated when the Thing Word is clearly purpose-centered.  
• Role Words do not have parents or children.  
• Their definitions are constructed from exemplars and acquaintances — not hierarchy.  
• They may have their own `acquaintances`, which are generated during Phase 2.5 promotion.
• This makes them feel consistent with the system while enabling a distinct mode of navigation.

### How Are Roles Handled?

Roles in Six Degrees describe the functional or intentional use of a Thing — what it does, or what it's for. They, like traits, serve as semantic bridges between otherwise unrelated Thing Words that share a common purpose, and they enable functional traversal through the graph. Unlike Traits, which describe inherent qualities, Roles are about external intent or effect.

1. **Selective Role Generation During Growth**
    - In Phase 1, every Thing Word is evaluated by an LLM to determine whether it warrants roles at all.
    - **Conditional Generation:** Roles are the only metadata type generated conditionally. Children, traits, and acquaintances are always generated for every Thing Word.
    - Only if a functional use is central to its meaning does the system generate 1-3 candidate Role labels.
    - These role strings are stored in the Thing's metadata under a `purposes` array, alongside traits and acquaintances.
    - Many Thing Words — like "Cloud" or "Beauty" — may have no roles at all, and that's fine.
    - **Decision Logging:** The LLM's internal rationale for returning NONE is not captured or persisted to avoid parsing complexity.

2. **Canonicalization & Filtering (Phase 2.5)**
    - After tree growth, all raw purpose strings are normalized:
        - Lowercased, singularized, deduplicated
        - Merged using embeddings and lexical synonym rules (e.g. "cutting" ≈ "slicing")
    - Any Role label found in ≥2 distinct Thing Words is promoted to become a Role Word.
    - Roles with only one source are discarded — this avoids cluttering the graph with overly narrow concepts.

3. **Role Word Structure**
    - Like Traits, Role Words are stand-alone bridge nodes. They have:
        - `exemplars`: all Thing Words that listed the Role in their metadata (populated during promotion)
        - `acquaintances`: 5-7 symbolic or functional associates of the Role (generated during promotion)
    - They do not have children or parents, and are not part of the parent-child hierarchy.

4. **Acquaintance Generation for Roles**
    - Role Words have their own symbolic or functional acquaintances (e.g. "Cutting" → Sharpness, Blade, Precision).
    - These are generated during Phase 2.5 promotion using the same LLM approach as Thing Word acquaintances.
    - Each Role Word gets 5-7 acquaintances that help ground it semantically and enable lateral traversal.

5. **Dynamic Definition Rendering**
    - Role definitions are written using:
        - Exemplars (e.g. "Scissors," "Razor," "Knife")
        - Acquaintances (e.g. "Separation," "Edge," "Blade")
    - These produce natural-language definitions like:

        > Cutting is a purposeful act of separating material using an edge or blade. It's a role performed by tools like scissors, razors, and knives—each designed for precision and sharpness.

    - Abstract or social Roles (e.g. "Companionship," "Healing") follow the same pattern, using emotionally resonant acquaintances:

        > Companionship is the role of offering presence, loyalty, and mutual connection. It's fulfilled by dogs, friends, and partners, often tied to ideas of warmth, trust, and shared life.

