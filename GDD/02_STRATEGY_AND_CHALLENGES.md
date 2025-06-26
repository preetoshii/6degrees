# Strategy and Challenges

## Growing the Word Graph Like a Tree

Building the Six Degrees word graph is the most technically and conceptually challenging part of this game's development. It's the creation of a living semantic ecosystem that mirrors how people actually think. When you simply dump a list of disconnected words and bolt on relationships afterward (as I initially tried), the result is a patchwork collage. Definitions feel awkward or forced, with words shoehorned into places they don't naturally belong. Cohesion breaks down, meaningful paths disappear, and the system fails to honor the player's intuition, strategies, or associations. Players quickly become disillusioned and abandon logical or poetic strategies in favor of random clicking, which feels more like a game of chance than a meaningful use of one's own associative thinking.

As such, the better approach is to **GROW** the word graph. Basically, we build every word by extending from what already exists, never by retrofitting or shoehorning. We start at the GOD WORD which has no parent ("Thing"), generate that word's children, then each child's children, and so on, exponentially.

This unidirectional root-to-leaf process, which mirrors real-life growth, ensures that:

1. **Integration Is Automatic**: Each new word slots into a coherent lineage rather than forcing you to manually link or justify every relationship retroactively.
2. **Paths Are Real**: This 'hidden consistency' allows the player to build intuition over how this underlying map works, because it follows natural organic patterns. This, in turn, allows the building of strategies, whether conscious or subconscious.
3. **Player Intuition Is Honored**: Whether you're scaling the hierarchy like a logician or leaping via poetic resonance—because the structure itself grew to reflect natural thought patterns.

But this is all well and good when we're thinking about parents and children, but what about acquaintances, traits, and roles?

## The Acquaintance Challenge (aka the Orphan Problem)

So as we mentioned, we want to build a beautiful, clean system for growing a semantic graph. It starts with a broad concept like "Thing," and then grows outward — parent to children, children become parents, and so on, exponentially. This approach is hierarchical, elegant, and very stable. It's like growing a tree in one direction: you always know where a node came from and where it sits in the larger structure.

But then comes Acquaintances. These are not part of the family tree structure of children and parents — they're based on how humans naturally associate ideas in the mind. When people think of "Yin," they inevitably think of "Yang." Not because "Yang" is a child or parent of "Yin," but because they co-exist in the same cultural or symbolic space. This is the kind of link that makes the game feel intuitive, human, and resonant (AKA The Poet's Strategy). It's what lets people feel like their minds are being seen.

The problem is: when you include an acquaintance like "Yang" in the definition for "Yin," you now have to create "Yang" as a node. But Yang doesn't yet exist. And worse — you didn't get to Yang through the normal parent-child growth process. So now you have an undefined word dangling off the side of your clean tree. And you're faced with a tricky decision: do you generate a new parent for Yang (which might create instability as you have to retroactively justify the new parent), or do you try to ADOPT Yang into a parent of the tree that already exists (which might not be semantically ideal)? Neither option is great — and the reason is that the structure wasn't designed to grow backward.

Acquaintances are essential for making the game feel alive, but they break the clean growth model unless we handle them carefully.

### The Solution? Finding Adoptive Parents

When a Thing Word generates an Acquaintance—so "9/11" generates Osama Bin Laden—it can leave us with a dangling node outside our tidy parent-child tree. Rather than inventing a new parent for "Osama Bin Laden" (which would force backwards growth and potentially threaten stability), we find an existing parent in our system to ADOPT every Acquaintance (Political Figures)

#### 1. Two-Phase Process
- **Phase One**: As we expand from the root ("Thing") through roughly 2,000 Thing Words, each thing word generates seven Acquaintances in its metadata — but none enter the tree yet.
- **Phase Two**: Once that core graph is complete, we revisit every unique Acquaintance term.

#### 2. Clean Adoption
- **Existing Node**: If the Acquaintance already exists as a Thing Word, we simply link to it—no new hierarchy is created.
- **New Node**: If it doesn't exist, we generate the Acquaintance exactly once and find an adoptive parent by asking the LLM to choose the most semantically precise category from our established list. 

At first glance, slapping a new Acquaintance under an existing parent sounds like the same retroactive patchwork we feared—but in practice, it may not be the case, because:

- **Rich Taxonomic Coverage**: With a mature tree of potentially ~2,000 Thing Words spanning a diverse range of parents, it seems rare to land on an orphan that truly lacks a parent.
- **Specificity-First Matching**: Our LLM prompt explicitly asks for the most precise parent available. Only when no close fit exists does the term fall back to a higher-level category. So worst case, there's still a relevant category even if it's not the most specific.
- **Constrained Choice**: By limiting the adoption to an established list, we eliminate the "anything goes" risk. The model can't invent random parents; it only picks from proven, player-tested categories.

By capturing Acquaintances early and adopting them only after the tree has matured, we preserve the forward-growing integrity of our taxonomy while still allowing the lateral, poetic connections that make the game feel alive and intuitive. Each new link then feels natural—whether you're scaling the hierarchy or following a resonant leap—because it's been slotted exactly where it belongs.

*This is a hypothesis that has yet to be tried.*

## How Are Traits Handled?

Traits in Six Degrees occupy a special "bridge" role—they connect Thing Words by shared qualities without becoming part of the strict parent–child hierarchy. Here's the end-to-end flow for traits:

### 1. Passive Collection During Growth
- As each Thing Word is added (parent → children), up to seven descriptive adjectives are logged in its metadata—e.g. "agile," "mysterious," "resilient."
- At this stage, traits remain inert strings alongside children and acquaintances; they do not create branches in the tree.

### 2. Synonym Normalization & Clustering
- Once the core graph (~2,000 words) is complete, we gather all raw trait labels and run a semantic-similarity pass:
- **Embedding Clustering**: Group labels whose embeddings exceed a similarity threshold.
- **Lexical Normalization**: Apply a synonym dictionary (e.g. WordNet) to merge obvious equivalents ("agile" ≈ "nimble").
- Within each cluster, we pick a single canonical label—the most frequent or clearest term.

### 3. Promotion to Trait Words
- We count occurrences of each canonical label. Only those appearing in two or more Thing Word metadata lists are elevated into standalone Trait Word nodes.
- This guarantee of ≥2 links prevents single-use—orphan—traits.

### 4. Trait Word Structure
- **No Parents or Children**: Traits exist outside the taxonomy tree.
- **Metadata**: A ranked list of all Thing Words that exhibit the trait.
- **Optional Lateral Links**: Traits may list related traits as acquaintances to each other.

### 5. Dynamic Definition Rendering
- When a player clicks a Trait Word, the game engine:
  - Retrieves and ranks all associated Thing Words by frequency.
  - Generates a natural-language description on the fly using those examples.
- As new Thing Words join the graph, their traits feed back into this pipeline—Trait definitions evolve automatically without manual intervention.




