# Build Flow

## Robustness & Configuration

**Error Handling**:
- All LLM calls include automatic retry loops (2-3 attempts) with exponential backoff
- Network failures trigger immediate retry with jittered delay
- Malformed responses beyond retry threshold: log warning and skip item (with notification)
- Orphan adoption failures: try next best candidates from shortlist; ultimate fallback to high-level parent (e.g., "Thing") with warning

**Comprehensive Error Specifications**:

1. **LLM API Errors**:
   - HTTP 429 (Rate Limit): Exponential backoff starting at 1s, max 10s, with jitter
   - HTTP 500-503 (Server Error): Retry 3x with 2s delays
   - Timeout (>30s): Retry once, then log and skip
   - Invalid API Key: Fatal error, halt pipeline with clear message
   - Response Format Errors: Retry with refined prompt, then skip if persistent

2. **Data Validation Errors**:
   - Missing required fields: Log specific field, use defaults where safe
   - Invalid word types: Log and skip entry
   - Circular parent-child relationships: Detect and break cycle, log for review
   - Duplicate words: Merge metadata, prefer existing entry
   - Orphaned references: Queue for Phase 3 adoption

3. **File System Errors**:
   - Write failures: Retry 3x, then write to backup location
   - Read failures: Check backup locations, use cached version if available
   - Corrupted JSON: Attempt repair, restore from last valid checkpoint
   - Disk space issues: Alert and pause pipeline

4. **Pipeline State Errors**:
   - Incomplete stage flags: Resume from last completed stage
   - Missing checkpoint data: Rebuild from previous valid state
   - Concurrent modification: Use file locking, queue conflicting operations

5. **Logging & Monitoring**:
   - Error categories: API, Validation, FileSystem, State, Logic
   - Log levels: ERROR (failures), WARN (recoverable), INFO (progress)
   - Log format: `[timestamp] [level] [category] [phase] [word] message`
   - Aggregate metrics: Success rate per phase, retry counts, skip counts
   - Alert thresholds: >5% skip rate, >10% retry rate, any fatal errors

6. **Recovery Strategies**:
   - Checkpoint after each completed word (not just phase completion)
   - Maintain rolling backups of master files (keep last 3 versions)
   - Graceful degradation: Continue with partial data rather than full stop
   - Manual intervention points: Clear documentation of fix procedures
   - Diagnostic commands: Verify graph integrity, find orphans, check cycles

**Central Configuration**:
All build parameters are driven by a single `config.json` file:
```json
{
  "targetWordCount": 2000,
  "itemCounts": {
    "children": { "min": 3, "max": 5 },
    "traits": { "min": 3, "max": 5 },
    "acquaintances": { "min": 3, "max": 5 },
    "roles": { "min": 1, "max": 3 }
  },
  "retryConfig": {
    "maxAttempts": 3,
    "baseDelayMs": 1000,
    "maxDelayMs": 10000
  },
  "embeddingThreshold": 0.8,
  "promotionThreshold": 2
}
```

**Note on Natural Language Definitions**: Phase 4 (Natural Language Generation) is designed as the long-term end-state that will generate polished, wiki-style definitions for all words. For alpha playtesting, the game will display raw metadata links directly. Natural language generation is deferred until beta but will be mandatory for the final release.

*I know this section seems very specific, but this is the overall idea for how to actually build all this. In practice, perhaps there are some things that need to be tweaked, or a few mistakes in here, or maybe it's not fully robust enough. But this is a good reference for the overall idea I'm thinking about for how to build flow, and at the very least, maybe it can serve as inspiration for the true strategy that might develop in the process of building it. Don't take it as gospel, use your own intelligence to really ensure everything will work, but use this as solid inspiration of how we might go about this.*

---

## 🌳 Phase 1: Core Tree Growth

**Goal**: Grow a cohesive parent→child taxonomy of main Thing Words (parents & children), while logging raw traits & acquaintances (no promotions yet).

### 1. Initialize Artifacts

- **🎲 master_words.json** ← 
  ```json
  [
    {
      "word": "Thing",
      "type": "thing",
      "parent": null,
      "children": [],
      "traits": [],
      "acquaintances": [],
      "stages": {
        "childrenDone": false,
        "rawLogged": false
      }
    }
  ]
  ```
- **📝 raw_traits.csv** ← empty (columns: word,trait)
- **📝 raw_acquaintances.csv** ← empty (columns: word,acquaintance)

**File Locations (per implementation structure):**
- `data/processed/master_words.json`
- `data/raw/raw_traits.csv`
- `data/raw/raw_acquaintances.csv`
- `data/raw/raw_purposes.csv`

### 2. BFS Expansion Loop

- **⏳ targetCount** ← 2000
- **➡️ queue** ← ["Thing"]

**Configuration-driven parameters:**
- `targetCount` from config file (e.g., 10 for test-sample.json, 2000 for full-run.json)
- `childrenPerNode`, `traitsPerNode`, `acquaintancesPerNode`, `rolesPerNode` from config
- `dryRun` mode for testing without API calls

**While (queue not empty) AND (master_words.json.length < targetCount):**

a. **Dequeue** → currentWord
b. **Lookup record** = master_words.json.find(w==currentWord)
   - If record.stages.childrenDone == true → continue
c. **Build exclusion lists:**
   - parentTerm = record.parent
   - childTerms = record.children
   - traitTerms = raw_traits.csv.filter(w==currentWord).map(t)
   - synonymTerms = synonyms_of(currentWord)  # e.g. WordNet lookup

d. **Generate via four separate LLM calls (GPT-4 Turbo):**

1) **Children Prompt**
   ```
   "List 3-5 common subtypes of [currentWord], ranked by commonality.
   Return exactly that many comma-separated nouns only."
   ```
   ↪️ Retry up to 2× if count not in range 3-5 or format invalid.

2) **Traits Prompt**
   ```
   "List 3-5 adjectives most people associate with [currentWord], ranked by frequency.
   Return exactly that many comma-separated words only."
   ```
   ↪️ Retry if needed.

3) **Acquaintances Prompt**
   ```
   "List 3-5 nouns that co-occur with [currentWord] in thought/experience,
   excluding [parentTerm], [childTerms], [traitTerms], [synonymTerms].
   Return exactly that many comma-separated nouns only."
   ```
   ↪️ Retry if exclusions appear or count not in range 3-5.

4) **Roles Prompt**
   ```
   "Determine if [currentWord] has a clear functional purpose or role. If yes, list 1-3 role words (gerund or abstract nouns) that describe what [currentWord] does or is for. If no clear purpose, return NONE.
   Return comma-separated nouns or NONE only."
   ```
   ↪️ Retry if format invalid.

   **Enhanced Prompt Guidance:**
   ```
   "Does [currentWord] represent an entity whose primary identity is defined by a function, service, or purpose in the world? Key signals: concrete tools, professions, social roles, systems with active effects. If yes, list the three most salient roles — the ones most people intuitively think of first when they consider [currentWord]. Order them by likelihood. If no clear purpose, return NONE."
   ```

d.1. **Exclusion-List Validation** (After each LLM call)
- For acquaintances generation, verify no excluded terms appear in the response
- Excluded terms: parent, children, traits, synonyms
- If violation detected: append "do not include [excludedTerm]" clause to prompt and retry once
- If still invalid: drop the excluded term and log warning
- Rationale: Prevents semantic pollution that could cascade downstream and break graph integrity

e. **Mark children as done**
- record.stages.childrenDone = true
- Persist master_words.json

f. **Normalize & Deduplicate Children**
For each childCandidate:
- norm = lowercase(singularize(childCandidate))
- if (!master_words.json.find(w ⇒ normalize(w.word)==norm)):
  - append newRecord {
      word: childCandidate, type:"thing", parent:currentWord,
      children:[], traits:[], acquaintances:[],
      stages:{ childrenDone:false, rawLogged:false }
    }
  - enqueue childCandidate
- if (childCandidate ∉ record.children):
  - record.children.push(childCandidate)

f.1. **Cross-Reference Validation** (After metadata assembly)
- Verify all referenced words exist in the graph:
  - Children: If missing, enqueue for generation
  - Traits/Acquaintances/Roles: If missing, drop and warn
- This prevents broken JSON links and UI errors from missing nodes
- Rationale: Ensures all metadata references point to valid, existing nodes

g. **Write Raw Metadata**
- append (currentWord, trait) → raw_traits.csv
- append (currentWord, acq) → raw_acquaintances.csv
- append (currentWord, role) → raw_purposes.csv (if role != NONE)

h. **Mark raw logging as done**
- record.stages.rawLogged = true
- Persist master_words.json

i. **Throttle & Back-off**
- Sleep 50–100 ms between calls
- On HTTP 429 → exponential back-off

### 3. Output after Phase 1

✅ **master_words.json** (~2 000 entries), each:
```json
{
  "word": "Cat",
  "type": "thing",
  "parent": "Animal",
  "children": ["Siamese","Tabby",…],   # 3-5 items
  "traits": [],                      # placeholders
  "purposes": [],                    # placeholders
  "stages": {
    "childrenDone": true,
    "rawLogged": true
  }
}
```

✅ **raw_traits.csv** & **raw_acquaintances.csv** & **raw_purposes.csv** capture every (word,trait)/(word,acq)/(word,role) pair

---

### 🛠 TECH: Model, Why & Cost Estimate

- **Model**: **GPT-4 Turbo**
  - Crisp list-only output, massive 128K token window, ~½ GPT-4o cost
- **Cost Estimate**: ~6,000 calls × ~100 tokens ≈ 600,000 tokens → ≈$2.40 total for Phase 1

---

### 🔄 Resumable & Idempotent Processing

- All state lives in master_words.json under each node's `stages` flags.
- On crash/restart, rebuild queue from any words where either flag == false.
- No separate "seen" set needed—JSON is the single source of truth.

### 🚑 Crash Recovery & Re-Runs

- Safe to re-run; uncompleted nodes pick up exactly where they left off.
- A small "reset" script can clear all `stages` flags if you want a fresh run.

### ✅ Benefits

- Guarantees no half-finished nodes are skipped or re-processed.
- Workflow state & data remain tightly coupled.
- Fully crash-safe, retry-safe, and transparent to any maintainer.

---

### 🔗 Linking Strategy (applies from Phase 1 onward)

- Front-end should dynamically render any word found in a node's:
  - parent
  - children
  - traits
  - acquaintances
  - purposes
  as a clickable link in the definition.
- These are guaranteed to exist in the metadata regardless of whether the node has received a Phase 4 natural-language definition or is still showing raw JSON metadata.
- This eliminates the need to insert markup or hyperlinks into the raw text returned by the model.
- **Acquaintance Directionality**: Acquaintances are one-directional by default (A→B doesn't imply B→A). Natural bidirectional associations emerge independently and are deduplicated during Phase 3.

---

## 🧬 Phase 2: Trait Synonym Normalization & Promotion

**Goal**: Collapse redundant raw adjectives into canonical Trait Words, then promote only those shared by ≥ 2 Thing Words — all in a resumable, idempotent pass.

### 1. Load Raw Traits
- **📝 Read** `raw_traits.csv` → list of `(word, rawTrait)` pairs.

### 2. Ensure Stage Flag
- **🔖 In** `master_words.json`, every node must have:
  ```json
  "stages": { …, "traitsPromoted": false }
  ```

### 3. Preprocess & Cluster Labels

a. **Label Cleanup**
   - Lowercase, strip punctuation, singularize/pluralize.
   - Build unique set `allRawTraits`.

b. **Embedding Clustering**
   - Compute embeddings for each label (e.g. `text-embedding-ada-002`).
   - Run agglomerative clustering at similarity threshold ~0.8.

c. **Synonym Merge**
   - Within each cluster, use WordNet or a custom map to merge obvious equivalents.

### 4. Select Canonical Labels
- **🔄 For each cluster:**
  - Choose the label with highest raw frequency (tie → shortest) → `canonicalTrait`.
  - Build map `rawToCanonical[rawTrait] = canonicalTrait`.

### 5. Normalize & Attach
- **🔄 For each** `(word, rawTrait)` in `raw_traits.csv`:
  - `canonical = rawToCanonical[rawTrait]`
  - Append `(word, canonical)` to an in-memory list or `traits_normalized.csv`.

### 6. Count & Promote Traits
- **➡️ Group** normalized pairs by `canonical`, count **distinct** words:
  - If count ≥ 2 **and** for all exemplar nodes `stages.traitsPromoted == false`:
    a. Add a Trait node in `traits_master.json`:
       ```json
       {
         "word": "<canonicalTrait>",
         "type": "trait",
         "exemplars": [/* sorted list of Thing Words */],
         "related_traits": []
       }
       ```
    b. For each exemplar in `master_words.json`, push `<canonicalTrait>` into its `traits` array.
    c. Set each exemplar's `stages.traitsPromoted = true`.

### 7. Persist & Resume Safety
- After each cluster promotion, write out updated `traits_master.json` and `master_words.json`.
- On restart, skip any Thing Word where `stages.traitsPromoted == true`.

### 8. Output after Phase 2
✅ `traits_master.json` — final Trait Word definitions.
✅ Updated `master_words.json` — all Thing Words now list canonical traits.

---

### 🛠 TECH: Approach, Why & Cost Estimate

- **Embedding Model**
  - Model: `text-embedding-ada-002`
  - Why: Fast, cost-efficient semantic vectors ideal for clustering hundreds of short labels.
  - Cost: $0.0004 per 1K tokens → ~500 labels × 1 token ≈ 500 tokens → **$0.0002** total.

- **Clustering & Synonym Merge**
  - Library: scikit-learn's AgglomerativeClustering (no API cost).
  - Synonym map via WordNet or custom dictionary (zero extra cost).

- **LLM Calls**
  - **None required** in Phase 2—everything runs locally after embeddings.
  - (Optional) GPT-4 Turbo validation: ~100 tokens/cluster × ~50 clusters ≈ 5 000 tokens → **$0.02**.

- **Total Cost Estimate**
  - Embeddings pass: **$0.0002**
  - Optional cluster-validation: **$0.02**
  - **Grand Total:** < $0.05

---

### 🔍 Key Essentials
1. **Idempotency via `traitsPromoted` flags**
2. **Embedding-based clustering** (threshold ~0.8)
3. **Promote only traits ≥ 2 exemplars**
4. **Persistent writes after each promotion**
5. **Resumable on crash/restart**

These steps ensure Phase 2 is reliable, repeatable, and crash-safe.

---

## 🎭 Phase 2.5: Role Normalization & Promotion

**Goal**: Convert raw role strings into canonical Role Words, promote only those shared by ≥ 2 Thing Words, and generate acquaintances for each promoted role — all in a resumable, idempotent pass.

### 1. Load Raw Roles
- **📝 Read** `raw_purposes.csv` → list of `(word, rawRole)` pairs.

### 2. Ensure Stage Flag
- **🔖 In** `master_words.json`, every node must have:
  ```json
  "stages": { …, "rolesPromoted": false }
  ```

### 3. Preprocess & Cluster Labels

a. **Label Cleanup**
   - Lowercase, strip punctuation, singularize/pluralize.
   - Build unique set `allRawRoles`.

b. **Embedding Clustering**
   - Compute embeddings for each label (e.g. `text-embedding-ada-002`).
   - Run agglomerative clustering at similarity threshold ~0.8.

c. **Synonym Merge**
   - Within each cluster, use WordNet or a custom map to merge obvious equivalents ("cutting" ≈ "slicing").

### 4. Select Canonical Labels
- **🔄 For each cluster:**
  - Choose the label with highest raw frequency (tie → shortest) → `canonicalRole`.
  - Build map `rawToCanonical[rawRole] = canonicalRole`.

### 5. Normalize & Attach
- **🔄 For each** `(word, rawRole)` in `raw_purposes.csv`:
  - `canonical = rawToCanonical[rawRole]`
  - Append `(word, canonical)` to an in-memory list or `roles_normalized.csv`.

### 6. Count & Promote Roles
- **➡️ Group** normalized pairs by `canonical`, count **distinct** words:
  - If count ≥ 2 **and** for all exemplar nodes `stages.rolesPromoted == false`:
    a. Add a Role node in `roles_master.json`:
       ```json
       {
         "word": "<canonicalRole>",
         "type": "role",
         "exemplars": [/* sorted list of Thing Words */],
         "acquaintances": []
       }
       ```
    b. Populate the Role node's exemplars array with all Thing Words that listed this role (from the normalized list).
    c. For each exemplar in `master_words.json`, push `<canonicalRole>` into its `purposes` array.
    d. Set each exemplar's `stages.rolesPromoted = true`.

### 7. Generate Role Acquaintances
- **🔄 For each promoted Role Word:**
  - Use LLM to generate 3-5 acquaintances that co-occur with the role concept.
  - Store these in the Role Word's `acquaintances` array.
  - These acquaintances will be processed in Phase 3 (Acquaintance Adoption).

### 8. Persist & Resume Safety
- After each cluster promotion, write out updated `roles_master.json` and `master_words.json`.
- On restart, skip any Thing Word where `stages.rolesPromoted == true`.

### 9. Output after Phase 2.5
✅ `roles_master.json` — final Role Word definitions with acquaintances.
✅ Updated `master_words.json` — all Thing Words now list canonical roles.

---

### 🛠 TECH: Approach, Why & Cost Estimate

- **Embedding Model**
  - Model: `text-embedding-ada-002`
  - Why: Fast, cost-efficient semantic vectors ideal for clustering role labels.
  - Cost: $0.0004 per 1K tokens → ~200 labels × 1 token ≈ 200 tokens → **$0.0001** total.

- **Clustering & Synonym Merge**
  - Library: scikit-learn's AgglomerativeClustering (no API cost).
  - Synonym map via WordNet or custom dictionary (zero extra cost).

- **LLM Calls for Acquaintances**
  - Model: GPT-4 Turbo
  - Purpose: Generate 3-5 acquaintances per promoted Role Word.
  - Cost: ~100 tokens/role × ~100 roles ≈ 10 000 tokens → **$0.04**.

- **Total Cost Estimate**
  - Embeddings pass: **$0.0001**
  - LLM acquaintance generation: **$0.04**
  - **Grand Total:** ~$0.04

---

### 🔍 Key Essentials
1. **Idempotency via `rolesPromoted` flags**
2. **Embedding-based clustering** (threshold ~0.8)
3. **Promote only roles ≥ 2 exemplars**
4. **Generate acquaintances during promotion**
5. **Persistent writes after each promotion**
6. **Resumable on crash/restart**

These steps ensure Phase 2.5 is reliable, repeatable, and crash-safe.

---

## 🤝 Phase 3: Acquaintance Adoption & Integration

**Goal**: Ensure every "Acquaintance" word hangs from the main taxonomy rather than dangle as an orphan, while preserving the natural, organic hierarchy we built in Phase 1. We use an embeddings-to-shortlist + LLM final vote approach to guarantee both high coverage and semantic precision.

### 1. Load Raw Acquaintances
- **📝 Read** `raw_acquaintances.csv` → list of `(sourceWord, acqTerm)` pairs.
- **Rationale**: Having all logged pairs in memory lets us see which Thing Words reference each acquaintance.

### 2. Build Unique Acquaintance Set
- **🎯** `allAcqs = unique(acqTerm)`
- **Rationale**: Deduplicating here avoids redundant work—each new term only needs a parent assigned once.

### 3. Seed Orphan Placeholders
For each `acq` in `allAcqs`:
- If `acq` already exists in `master_words.json` → skip.
- Else → append placeholder node to `master_words.json`:
  ```json
  {
    "word": "<acq>",
    "type": "thing",
    "parent": null,
    "children": [],
    "traits": [],
    "acquaintances": [],
    "stages": { /* inherit or initialize flags */ }
  }
  ```
- **Rationale**: Placeholders let us assign parents in bulk before wiring up lateral links.

### 4. Prepare Embeddings Search
- `parentCandidates = master_words.json.map(w ⇒ w.word + " — parent:" + w.parent + "; children:" + w.children.slice(0,3).join(", "))`
- Compute embeddings for each extended candidate string **and** for each raw `acq` term using `text-embedding-ada-002`.
- **Rationale**: Embedding the word plus minimal context (parent, a few children) biases similarity toward true categories.

### 5. Build Shortlists via Nearest Neighbors
For each orphan `acq`:
a. Compute cosine similarity vs. all `parentCandidates`.
b. Select top 20 most similar candidates → `shortlist[acq]`.
- **Rationale**: A top-20 shortlist almost always contains the correct parent—cuts LLM calls by ~95%.

### 6. LLM-Guided Final Parent Selection
For each `acq` + its `shortlist`:
- Prompt GPT-4 Turbo:
  ```
  I have 20 potential parent categories for "[acq]":
  • cand1, cand2, …, cand20

  Which single category best serves as the parent for "[acq]"?
  Reply with exactly one choice from the list.
  ```
- If response ∉ shortlist → retry once.
- Assign `chosenParent = response`.
- **Rationale**: LLM picks the most precise fit from a semantically-filtered set—minimizing hallucination.

#### 6.a. Cycle Detection & Prevention
- Before assigning `chosenParent`, perform cycle detection:
  ```javascript
  function isDescendant(potentialParent, node):
    current = potentialParent
    while current.parent:
      if current.parent === node: return true
      current = current.parent
    return false
  ```
- If `isDescendant(chosenParent, acq)` returns true:
  - Remove `chosenParent` from shortlist
  - Re-prompt LLM with remaining candidates
  - If shortlist exhausted, fall back to safe high-level parent (e.g., "Thing")

**Comprehensive Fallback Strategy**:
1. If initial LLM choice fails validation → try next best candidates from shortlist
2. If top candidates create cycles → remove and retry with remaining shortlist items
3. If validation fails → try relaxing criteria and re-evaluate shortlist
4. If all shortlist candidates exhausted → expand search to top 30-40 candidates
5. Ultimate fallback → assign to "Thing" with detailed warning log for manual review
- This prevents circular hierarchies (A→B→C→A) that would break tree traversal algorithms.
- **Rationale**: Maintains acyclic graph structure essential for difficulty tuning, analytics, and debugging.

#### 6.b. Parent-Child Validation
- After LLM selects a parent, run a secondary validation check:
  ```
  "Is [orphan] a kind of [parent]? Answer yes or no only."
  ```
- If validation fails (answer = "no"), try next best candidate from shortlist.
- Continue through shortlist until valid parent found or list exhausted.
- Log all failed attempts for pattern analysis and model improvement.
- This lightweight check catches edge-case misclassifications due to polysemy or fuzzy category boundaries.
- Example failure cases: "Mercury" (planet vs. metal vs. deity), "Democracy" under "Food".
- **Rationale**: Prevents semantic violations that could disrupt traversal and confuse players.

### 7. Persist Parent Assignments (Bidirectional)
- Update each orphan node's `parent = chosenParent` in `master_words.json`.
- Then locate the `chosenParent` node and push `acq` into its `children` array (if not already present).
- Write out updated JSON.
- **Rationale**: Ensures bidirectional consistency—parents know their children and vice versa.

### 8. Attach Acquaintance Edges
For each `(sourceWord, acq)` in `raw_acquaintances.csv`:
- Locate `sourceWord` node → push `acq` onto its `acquaintances` array (if missing).
- Persist `master_words.json`.
- **Rationale**: Now every Thing Word correctly references its lateral connections.

#### 8.1. Cross-Reference Validation (After acquaintance adoption)
- Re-validate all acquaintance references point to real nodes
- Any missing references should be logged for manual review
- This ensures no broken links exist after the adoption process
- **Rationale**: Prevents UI errors from references to non-existent nodes

#### 8.2. De-dupe & Merge Existing Edges
- Before creating an A→B acquaintance link, check whether B's acquaintances already contains A (and/or A's acquaintances contains B).
- If so, skip creating a new edge—treat it as a naturally symmetric association that has already emerged.
- This prevents redundant metadata (e.g. both "Romeo→Juliet" and "Juliet→Romeo" only materializing once), while still allowing true bidirectional pairs that both sides generated independently.
- **Rationale**: Preserves the natural strength of mutual associations without artificial inflation.

### 9. (Optional) Prune Duplicate Acquaintances
- Cluster near-identical nodes (e.g. "Color" vs. "Colour"), merge them, rewrite links.
- **Rationale**: Keeps graph clean—skip unless obvious duplicates appear.

### 10. Output after Phase 3
✅ `master_words.json` updated:
- Every orphan "Thing Word" has a valid `parent`.
- Every original Thing Word's `acquaintances` array is filled.
- Every adopted child is correctly listed in its parent's `children` array.
- Natural bidirectional associations are preserved without redundancy.
- All parent-child relationships have been validated for semantic correctness.

### 11. Graph Connectivity Validation (Final integrity check)
- Run BFS from root "Thing" using only parent→child relationships
- Log any unvisited nodes for manual inspection
- Does not auto-fix—just identifies unreachable islands
- **Rationale**: Guarantees no completely orphaned subgraphs exist
- **Implementation**: Simple breadth-first search with visited set tracking

---

### 🛠 TECH: Hybrid Approach, Why & Cost

- **Embeddings Pass**
  - Model: `text-embedding-ada-002`
  - Purpose: Build a shortlist >95% likely to include true parent.
  - Cost: ~$0.0004 per 1K tokens → 2 000 candidates + contexts ≈$0.002 total.

- **Nearest-Neighbor Search**
  - Library: Faiss or `sklearn.neighbors` (no API cost).
  - Purpose: Quickly retrieve top-K similar candidates per orphan.

- **LLM Final Vote**
  - Model: GPT-4 Turbo
  - Prompt size: ~100 tokens/orphan → 2 000 orphans → 200 000 tokens.
  - Cost: 200 000 tokens × $0.004/token ≈ **$0.80**.
  - **Additional cost for cycle detection retries**: ~10% of orphans may need retry → 200 retries × 100 tokens ≈ 20 000 tokens → **$0.08**.

- **LLM Validation**
  - Model: GPT-4 Turbo
  - Purpose: Verify parent-child semantic correctness.
  - Cost: ~20 tokens/orphan × 2 000 orphans ≈ 40 000 tokens → **$0.16**.

- **Total Phase 3 Estimate**
  - Embeddings: ~$0.002
  - LLM calls: ~$0.80
  - Cycle detection retries: ~$0.08
  - Validation: ~$0.16
  - **Grand Total:** ~$1.04

---

### 🔍 Why This Matters

1. **Semantic Integrity**
   - Context-aware embeddings bias toward valid parent categories.
   - LLM then picks the exact best fit—avoiding misclassification.
   - Validation step catches edge-case misclassifications due to polysemy or fuzzy boundaries.

2. **Full Graph Connectivity**
   - No more dangling words—all links traverse cleanly.
   - New acquaintances adopt into the structure naturally.

3. **Bidirectional Consistency**
   - Parents point to their new children.
   - Definitions and UI reflect a fully wired web.

4. **Idempotency & Crash Safety**
   - Skip any orphan whose `parent != null`.
   - Clear stages logic ensures safe restarts with no duplicated work.

5. **Quality Assurance**
   - Lightweight validation prevents semantic violations that could disrupt traversal.
   - Catches edge cases like "Mercury" (planet vs. metal vs. deity) or "Democracy" under "Food".
   - **Cycle detection prevents circular hierarchies that would break tree traversal algorithms and analytics.**

With this hybrid approach, your taxonomy remains coherent, intuitive, and fully connected—ready for the player's logical and poetic journeys.

---

## 🔗 Phase 3.5: Build Unified Index

**Goal**: Create a unified index of all words (Thing, Trait, Role) for frontend navigation and deduplication validation.

### 1. Load All Word Collections
- **📝 Read** `master_words.json`, `traits_master.json`, and `roles_master.json` into memory.
- Collect all word entries from each file with their types and metadata.

### 2. Build Unified Index
- **🔄 Create** `unified_master.json` with structure:
  ```json
  {
    "all_words": {
      "Cat": {
        "type": "thing",
        "file": "master_words.json",
        "metadata": { /* full thing word data */ }
      },
      "Agile": {
        "type": "trait",
        "file": "traits_master.json",
        "metadata": { /* full trait word data */ }
      },
      "Cutting": {
        "type": "role",
        "file": "roles_master.json",
        "metadata": { /* full role word data */ }
      }
    },
    "stats": {
      "total_words": 2500,
      "thing_words": 2000,
      "trait_words": 300,
      "role_words": 200
    }
  }
  ```

### 3. Deduplication Validation
- Check for any word that appears in multiple files with different types.
- Log any duplicates for manual review (e.g., "Cutting" as both Thing and Role).
- This ensures data integrity and prevents frontend confusion.

### 4. Frontend Optimization
- Create a lightweight index file for fast lookups:
  ```json
  {
    "Cat": "thing",
    "Agile": "trait",
    "Cutting": "role"
  }
  ```
- This enables O(1) word existence checks without loading full metadata.

### 5. Output after Phase 3.5
✅ `unified_master.json` — complete index of all words with full metadata
✅ `word_index.json` — lightweight lookup table for frontend performance
✅ Deduplication report — any cross-type duplicates logged for review

---

### 🛠 TECH: Approach, Why & Cost

- **No LLM Calls Required** — purely data processing operation
- **Local Processing** — reads existing JSON files and creates new indexes
- **Cost**: ~$0.00 (no API calls)
- **Performance**: Fast file I/O operations only

---

### 🔍 Why This Matters

1. **Frontend Performance**
   - Single file lookup instead of searching across 3 separate files
   - O(1) word existence checks for clickable links

2. **Data Integrity**
   - Prevents accidental duplicates across word types
   - Ensures each word has a single, unambiguous identity

3. **Developer Experience**
   - Simplified frontend integration
   - Clear separation between build process and runtime data

4. **Game Navigation**
   - Players can click any word regardless of its type
   - Unified traversal experience across all word categories

This phase bridges the gap between the modular build process and the unified frontend experience, ensuring optimal performance and data consistency.

---

## Future Considerations

### Homonym & Word Sense Disambiguation
**TODO**: Establish a homonym-resolution strategy in a later iteration. Potential approaches:
- Lexical context analysis to differentiate word senses (e.g., "Bank" - financial vs river)
- Manual override lists for known ambiguous terms
- Separate nodes for distinct meanings with disambiguation suffixes
- Accept some ambiguity as natural part of human language

### Additional Quality Controls
- Automated graph analysis to detect isolated subgraphs
- Semantic validation of parent-child relationships using additional LLM checks
- Player telemetry to identify confusing or broken paths
- Version control and rollback capabilities for graph updates

---

## 🗣️ Phase 4: Natural-Language Definition Pass

**🔄 Beta Feature - Mandatory for Final Release, Optional for Alpha Testing**

*This phase will generate human-readable, wiki-style definitions for all Thing, Trait, and Role words. During alpha playtesting, the UI will display raw metadata links directly without prose definitions.*

**Goal**: Turn each word's structured metadata (parent, children, traits, acquaintances, purposes) into a clean, human-readable definition that feels organic and engaging to players. This adds personality and immersion while preserving all navigational affordances.

### 1. Gather All Nodes
- **🔍 Load** `master_words.json` and `traits_master.json` into memory.
- Includes all Thing Words and promoted Trait Words.

### 2. Prepare Prompt Template
- **✏️ Use** a system + user prompt (see: `prompts/Natural Language.txt`) that:
  - Accepts a full metadata object for each word
  - Generates a sentence wikipedia-esque definition
  - References the word's parent category
  - Weaves in up to X children, Y traits, and Z acquaintances (as the dev, you can decide how many of each to include)
  - Ends with: "Use no additional terms beyond what's given."
- This ensures coverage of every key relationship while minimizing hallucination or drift.

### 3. Batch & Generate
- **⚡️ Process** definitions in batches of 10–20 words per API call:
  - Send prompt + batch of JSON nodes to GPT-4 Turbo
  - Receive a list of `{ word, definition }` responses
  - Validate structure before saving
- Batching reduces per-call overhead and keeps costs predictable.

### 4. Validate Output
- **✔️ For each** generated definition:
  - Confirm the main word appears in its own definition
  - Optionally run a keyword coverage script to ensure presence of required metadata (parent, ≥1 trait, etc.)
  - Spot-check ~10% of definitions for quality
- Prevents silent errors or unusable definitions from slipping into the final UI.

### 5. Persist Definitions
- **💾 Write** to `definitions_master.json` in this format:
  ```json
  [
    {
      "word": "Cat",
      "definition": "Cats are agile mammals known for their independence and graceful movements. They are often kept as pets and associated with traits like curiosity and nocturnality. Related ideas include dogs, litter boxes, and scratching posts."
    },
    …
  ]
  ```
- Easy to look up and integrate on the front-end.

### 6. Linkability Support
- **🔗 All terms** in the generated definitions that match a known Thing Word or Trait Word should be linkable in the UI.
- Don't encode links in the definition text itself
- Instead, the front-end should match visible tokens against each word's known metadata (parent, children, traits, acquaintances)
- If matched, style and bind the word as a clickable hyperlink
- This allows for dynamic, robust linking even if the natural-language wording varies.

### 7. Optional: Regeneration Support
- **🔄 To incrementally** re-render definitions later:
  - Track a `definitionLastUpdatedAt` timestamp per word
  - Only re-run the LLM if its metadata has changed since that time

### 8. Output after Phase 4
✅ `definitions_master.json` with natural-language definitions for every Thing and Trait Word
✅ Front-end now supports immersive, readable traversal without breaking linkability

---

### 🛠 TECH: Model, Cost & Format

- **Model**: GPT-4 Turbo
  - Cost: $0.003 / 1K tokens
  - Easily fits ~20 metadata objects + prompt + output in 128K context

- **Token & Cost Estimate**
  - Avg: ~200 tokens per word (input + output)
  - 10,000 words = ~2M tokens → $6
  - 50,000 words → ~$30
  - 500,000 words → ~$300

- **Batch Size**
  - 10–20 words per request recommended
  - Keeps response latency low and throughput high

---

### 📌 Why This Matters

- **🚀 Player Experience**: Adds clarity, narrative, and intuition to each node
- **🔁 Future-Proof**: Easy to re-run when definitions change
- **🧠 Cognitive Glue**: Makes the graph feel alive and explorable instead of abstract
- **🧩 Front-End Ready**: UI link logic is metadata-driven, not tied to string parsing

---

## Future Considerations

### Homonym & Word Sense Disambiguation
**TODO**: Establish a homonym-resolution strategy in a later iteration. Potential approaches:
- Lexical context analysis to differentiate word senses (e.g., "Bank" - financial vs river)
- Manual override lists for known ambiguous terms
- Separate nodes for distinct meanings with disambiguation suffixes
- Accept some ambiguity as natural part of human language

### Additional Quality Controls
- Automated graph analysis to detect isolated subgraphs
- Semantic validation of parent-child relationships using additional LLM checks
- Player telemetry to identify confusing or broken paths
- Version control and rollback capabilities for graph updates

