# Six Degrees Semantic Test Suite

## Overview
This document defines comprehensive semantic tests to ensure the build system creates data that perfectly aligns with the Six Degrees game design vision. These tests validate that each word type fulfills its intended semantic purpose and that relationships make intuitive sense to players.

## 1. THING WORD SEMANTIC TESTS

### 1.1 Parent-Child Semantic Validity
**Test**: Every parent-child relationship must satisfy "A [child] is a kind of [parent]"
- **Pass Examples**: 
  - "A Siamese is a kind of Cat" ✓
  - "A Hammer is a kind of Tool" ✓
  - "A Democracy is a kind of System" ✓
- **Fail Examples**:
  - "A Cloud is a kind of Rain" ✗ (cloud causes rain, not a type of rain)
  - "A Friend is a kind of Happy" ✗ (category mismatch)
- **Validation Method**: For each parent-child pair, use LLM to verify: "Is [child] a type/kind/example of [parent]? Answer yes or no."

### 1.2 Hierarchical Coherence
**Test**: The path from any word to "Thing" should maintain logical abstraction levels
- **Expected Pattern**: Specific → Category → Broader Category → Abstract → Thing
- **Good Path**: Persian → Cat → Animal → Living Being → Thing
- **Bad Path**: Persian → Fur → Material → Thing (skips natural category)
- **Validation**: Trace paths and check for logical jumps or missing intermediate categories

### 1.3 Sibling Consistency
**Test**: All children of the same parent should be conceptually parallel
- **Good Example**: Under "Emotion": Joy, Sadness, Anger, Fear (all basic emotions)
- **Bad Example**: Under "Tool": Hammer, Screwdriver, Happiness (happiness is not a tool)
- **Validation**: For each parent, verify all children belong to the same conceptual category

### 1.4 Child Salience
**Test**: Children should be the MOST commonly thought-of examples
- **Expected**: "Animal" → Dog, Cat, Bird (highly salient)
- **Not Expected**: "Animal" → Platypus, Axolotl, Quokka (too specific/rare)
- **Validation**: Sample human evaluators to rank which children come to mind first

### 1.5 Acquaintance Non-Overlap
**Test**: Acquaintances must NOT be parents, children, siblings, traits, roles, or synonyms
- **Good Acquaintances for "Cat"**: Mouse, Litter Box, Yarn, Whiskers
- **Bad Acquaintances for "Cat"**: 
  - Animal (parent)
  - Siamese (child)
  - Dog (sibling)
  - Furry (trait)
  - Feline (synonym)
- **Validation**: Cross-check each acquaintance against exclusion lists

### 1.6 Acquaintance Salience and Cultural Relevance
**Test**: Acquaintances should reflect natural thought associations
- **Good Examples**:
  - "Romeo" → Juliet, Balcony, Shakespeare
  - "9/11" → Twin Towers, Terrorism, New York
  - "Christmas" → Santa, Presents, Tree
- **Bad Examples**:
  - "Romeo" → Pasta (weak/random association)
  - "9/11" → Bicycle (no meaningful connection)
- **Validation**: Use free association surveys or LLM-as-judge

### 1.7 Acquaintance Asymmetry Appropriateness
**Test**: One-directional acquaintances should make semantic sense
- **Good Asymmetry**: 
  - "Sidekick" → Batman (people think of Batman when hearing sidekick)
  - "Batman" → Gotham (but not necessarily sidekick)
- **Natural Symmetry**: 
  - "Romeo" ↔ "Juliet" (mutual strong association)
  - "Yin" ↔ "Yang" (conceptually paired)
- **Validation**: Check if asymmetric links reflect natural thought patterns

## 2. TRAIT WORD SEMANTIC TESTS

### 2.1 Trait Grammatical Validity
**Test**: All traits must be adjectives (not nouns or verbs)
- **Good Traits**: agile, mysterious, resilient, bright
- **Bad Traits**: 
  - running (verb)
  - speed (noun)
  - quickly (adverb)
- **Validation**: Part-of-speech tagging + manual review

### 2.2 Trait-Thing Appropriateness
**Test**: Traits must be commonly associated characteristics of their exemplars
- **Good Examples**:
  - "Cat" + "independent" ✓
  - "Ocean" + "vast" ✓
  - "Diamond" + "hard" ✓
- **Bad Examples**:
  - "Cat" + "wooden" ✗
  - "Ocean" + "furry" ✗
  - "Diamond" + "soft" ✗
- **Validation**: For each trait-thing pair, verify logical connection

### 2.3 Trait Bridge Validity
**Test**: Things sharing a trait should have that quality in common
- **Good Bridge**: "agile" connects Cat, Dancer, Gymnast (all nimble/flexible)
- **Bad Bridge**: "red" connecting Apple, Anger, Stop Sign, Blood (too diverse - color vs emotion vs object)
- **Validation**: Verify conceptual similarity among all exemplars of a trait

### 2.4 Trait Clustering Quality
**Test**: Similar traits should merge appropriately
- **Should Merge**: 
  - {beautiful, pretty, attractive} → "beautiful"
  - {smart, intelligent, clever} → "intelligent"
- **Should NOT Merge**:
  - {hot, warm} (different intensities)
  - {big, important} (size vs significance)
- **Validation**: Review cluster outputs for over/under-merging

### 2.5 Trait Minimum Exemplar Requirement
**Test**: Every promoted trait must have ≥2 distinct exemplars
- **Purpose**: Ensures traits function as true bridges
- **Validation**: Count exemplars post-promotion, flag any with count < 2

## 3. ROLE WORD SEMANTIC TESTS

### 3.1 Role Grammatical Format
**Test**: All roles must be nouns (gerunds or abstract nouns)
- **Good Roles**: 
  - Cutting, Teaching, Healing (gerunds)
  - Companionship, Protection, Leadership (abstract nouns)
- **Bad Roles**:
  - Sharp (adjective - should be trait)
  - Cut (verb)
  - Quickly (adverb)
- **Validation**: Part-of-speech verification

### 3.2 Role Functional Appropriateness
**Test**: Roles should only be assigned when functional purpose is central to identity
- **Good Role Assignments**:
  - Scissors → Cutting (primary purpose)
  - Teacher → Teaching (defines the profession)
  - Dog → Companionship (key function as pet)
- **Bad Role Assignments**:
  - Cloud → ??? (no clear functional purpose)
  - Beauty → ??? (aesthetic quality, not functional)
  - Mountain → ??? (natural formation, not tool/agent)
- **Validation**: Review which things receive roles vs NONE

### 3.3 Role-Thing Semantic Match
**Test**: Things must genuinely fulfill the roles assigned to them
- **Good Matches**:
  - Knife → Cutting (knives cut things)
  - Friend → Companionship (friends provide companionship)
  - Alarm Clock → Waking (alarm clocks wake people)
- **Bad Matches**:
  - Tree → Computing (trees don't compute)
  - Rock → Teaching (rocks don't teach)
- **Validation**: Verify each thing can perform its assigned roles

### 3.4 Role Acquaintance Relevance
**Test**: Role acquaintances should be functionally or symbolically related
- **Good Role Acquaintances**:
  - "Cutting" → Blade, Sharpness, Separation, Precision
  - "Companionship" → Loyalty, Friendship, Support, Together
- **Bad Role Acquaintances**:
  - "Cutting" → Democracy, Rainbow (no functional connection)
  - "Companionship" → Mathematics, Gravity (unrelated concepts)
- **Validation**: Check semantic connection to role's function

### 3.5 Role Bridge Effectiveness
**Test**: Things sharing a role should serve similar purposes
- **Good Bridge**: "Guarding" connects Dog, Security Guard, Firewall
- **Bad Bridge**: "Protection" connecting Sunscreen, Bodyguard, Copyright, Condom (too conceptually diverse)
- **Validation**: Verify functional similarity among exemplars

### 3.6 No Trait-Role Overlap
**Test**: No word should be both a trait and a role
- **Validation**: Cross-check trait and role word lists for duplicates
- **Expected**: Zero overlap due to grammatical constraints (adjectives vs nouns)

## 4. CROSS-TYPE SEMANTIC TESTS

### 4.1 Metadata Completeness
**Test**: Every Thing Word has required metadata in valid ranges
- **Requirements**:
  - Parent: exactly 1 (except "Thing" itself)
  - Children: 3-5 based on salience
  - Traits: 3-5 based on salience
  - Acquaintances: 3-5 based on salience
  - Roles: 0-3 based on functional centrality
- **Validation**: Count metadata items, flag outliers

### 4.2 Reference Integrity
**Test**: All referenced words must exist in the graph
- **Check**: Every parent, child, trait, acquaintance, and role reference
- **Expected**: 100% of references resolve to existing nodes
- **Validation**: Cross-reference all metadata against unified index

### 4.3 Bidirectional Consistency
**Test**: Parent-child relationships must be bidirectional
- **If**: "Cat" lists "Animal" as parent
- **Then**: "Animal" must list "Cat" as child
- **Validation**: Verify both directions for every relationship

### 4.4 No Orphan Islands
**Test**: Every word must be reachable from "Thing" root
- **Method**: Breadth-first search from "Thing" using all edge types
- **Expected**: 100% graph connectivity
- **Validation**: Flag any unreachable nodes

### 4.5 Adoption Semantic Quality
**Test**: Adopted acquaintances should have semantically appropriate parents
- **Good Adoptions**:
  - "Eiffel Tower" → adopted under "Monument"
  - "Shakespeare" → adopted under "Writer"
- **Bad Adoptions**:
  - "Democracy" → adopted under "Food"
  - "Happiness" → adopted under "Tool"
- **Validation**: Review adoption choices for semantic fit

## 5. PLAYER EXPERIENCE SEMANTIC TESTS

### 5.1 Path Diversity
**Test**: Multiple valid paths should exist between most word pairs
- **Expected**: 3+ different paths using different strategies
- **Example Paths (Cat → Stop Sign)**:
  - Logical: Cat → Animal → Human → City → Traffic → Stop Sign
  - Poetic: Cat → Night → Street → Intersection → Stop Sign
  - Trait Bridge: Cat → Agile → Runner → Marathon → Street → Stop Sign
- **Validation**: Pathfinding algorithm with strategy variations

### 5.2 Connection Density
**Test**: Each word should have 4-8 total connections for good gameplay
- **Too Few** (<3): Boring, limited options
- **Too Many** (>10): Overwhelming, choice paralysis
- **Validation**: Count total clickable links per word

### 5.3 Intuitive Navigation
**Test**: Next steps from any word should feel natural/logical
- **Good Options from "Cat"**: Animal (parent), Siamese (child), Dog (via parent), Mouse (acquaintance)
- **Bad Options**: If "Cat" somehow connected to "Algebra" or "Volcano"
- **Validation**: Human playtesting or LLM simulation

### 5.4 Cultural Universality
**Test**: Associations should work across different cultural contexts
- **Good**: Cat → Mouse (universal predator-prey relationship)
- **Potentially Bad**: Baseball → America (culturally specific)
- **Validation**: Review for overly culture-specific associations

### 5.5 Balanced Difficulty
**Test**: Words at similar graph distances should offer similar challenge
- **Expected**: All 6-step puzzles should be roughly equal difficulty
- **Not Expected**: Some 6-step puzzles trivial, others impossible
- **Validation**: Generate multiple puzzles and test solve rates

## 6. SEMANTIC CONSISTENCY TESTS

### 6.1 Conceptual Level Matching
**Test**: Related words should operate at similar abstraction levels
- **Good**: "Dog" acquainted with "Cat" (both specific animals)
- **Bad**: "Dog" acquainted with "Organism" (mismatched abstraction)
- **Validation**: Check abstraction level compatibility

### 6.2 Temporal Consistency
**Test**: Contemporary associations should match temporal context
- **Good**: "Smartphone" → Apps, Touchscreen, Selfie
- **Bad**: "Smartphone" → Telegraph, Phonograph
- **Validation**: Flag anachronistic associations

### 6.3 Logical Impossibilities
**Test**: No contradictory relationships should exist
- **Bad Examples**:
  - Something being both parent and child of same word
  - Circular parent-child chains
  - Self-references in any relationship
- **Validation**: Graph analysis for logical violations

## 7. IMPLEMENTATION VALIDATION TESTS

### 7.1 Prompt Effectiveness
**Test**: LLM responses match prompt specifications
- **Check**: Response format, count constraints, exclusion compliance
- **Expected**: 95%+ compliance rate after retries
- **Validation**: Parse and validate all LLM outputs

### 7.2 Deduplication Accuracy
**Test**: No unintended duplicates after normalization
- **Check**: Normalized forms don't create false equivalencies
- **Example**: "Running" (trait) vs "Running" (role) should stay distinct
- **Validation**: Review deduplication decisions

### 7.3 Cluster Coherence
**Test**: Embedding clusters contain semantically similar items
- **Good Cluster**: {beautiful, pretty, lovely, attractive}
- **Bad Cluster**: {red, regal, ready, reading}
- **Validation**: Manual review of cluster contents

## Test Execution Framework

### Automated Tests (Programmatic)
1. Grammatical validation (POS tagging)
2. Reference integrity checks
3. Bidirectional consistency
4. Graph connectivity
5. Count constraints
6. Format compliance

### Semi-Automated Tests (LLM-Assisted)
1. Parent-child "is-a" validation
2. Trait-thing appropriateness scoring
3. Role-thing functional matching
4. Acquaintance relevance rating
5. Conceptual level matching

### Manual Review Tests (Human Required)
1. Salience evaluation
2. Cultural universality assessment
3. Gameplay experience testing
4. Cluster quality review
5. Edge case investigation

## Success Criteria

A build is considered semantically valid when:
- 95%+ automated tests pass
- 90%+ semi-automated tests pass
- 85%+ manual review tests pass
- No critical failures in any category
- Player testing shows intuitive navigation
- Both "Logician" and "Poet" strategies viable

## Continuous Improvement

After each build:
1. Run full test suite
2. Document failures with examples
3. Trace failures to root causes
4. Update prompts/logic as needed
5. Compare results across builds
6. Track improvement metrics

This comprehensive semantic test suite ensures that the Six Degrees word graph not only functions technically but creates meaningful, intuitive, and enjoyable player experiences aligned with the game's design vision.