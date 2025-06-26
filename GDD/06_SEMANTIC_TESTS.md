# Six Degrees Semantic Test Suite

Based on comprehensive analysis of the Game Design Document, these tests ensure build output aligns with the core game philosophy.

## Core Philosophy Alignment

The game supports two player types:
- **Logicians**: Navigate hierarchically (parent-child relationships)
- **Poets**: Navigate associatively (traits, roles, acquaintances)

Both strategies must be equally viable.

## 1. Thing Word Semantic Tests

### 1.1 Parent-Child Validity Test
**Purpose**: Ensure every parent-child relationship satisfies "is-a" semantics
**Test**: For each Thing word with parent:
- `{child} is a type of {parent}` must make semantic sense
- No metaphorical relationships (e.g., "Memory" should NOT be child of "Thing")
- No part-whole relationships (e.g., "Wheel" should NOT be child of "Car")

**Examples from GDD**:
- ✓ Cat is a type of Animal
- ✓ Animal is a type of Thing  
- ✗ Purring is a type of Cat (should be role/acquaintance)

### 1.2 Hierarchical Coherence Test
**Purpose**: Ensure proper abstraction levels
**Test**: 
- Root "Thing" → High-level categories → Mid-level → Specific
- No skipping levels (e.g., "Siamese" shouldn't be direct child of "Animal")
- Siblings should be at same conceptual level

### 1.3 Sibling Consistency Test
**Purpose**: Ensure children of same parent are meaningfully parallel
**Test**: All children of a parent should be:
- Same type of categorization (not mixing types with instances)
- Roughly same level of specificity
- Culturally neutral major categories

**Example Check**:
- Under Animal: Cat, Dog, Bird ✓ (all common animal types)
- Not: Cat, Dog, Fluffy ✗ (mixing types with specific instances)

### 1.4 Child Salience Test
**Purpose**: Ensure children are the MOST commonly thought-of examples
**Test**: When asked "name types of {parent}", the children should be top responses
- Use frequency/commonality as guide
- Avoid obscure or specialized examples at high levels

### 1.5 Acquaintance Non-Overlap Test  
**Purpose**: Ensure acquaintances don't duplicate other relationships
**Test**: For each Thing's acquaintances, verify NOT:
- Parent or child of the word
- A trait (adjective)
- A role (functional relationship)
- A synonym or very close synonym

### 1.6 Acquaintance Cultural Relevance Test
**Purpose**: Ensure acquaintances reflect actual cultural associations
**Test**: Acquaintances should be:
- Commonly associated in real usage (Cat → "litter box", "whiskers")
- Not forced or artificially created
- Meaningful for gameplay navigation

### 1.7 Acquaintance Asymmetry Test
**Purpose**: Validate one-directional relationships make sense
**Test**: For A → B acquaintance:
- "When thinking of A, B naturally comes to mind" should be true
- The reverse doesn't need to be true
- But both directions should eventually emerge if truly associated

## 2. Trait Word Semantic Tests

### 2.1 Trait Grammatical Validity Test
**Purpose**: Ensure all traits are actual adjectives
**Test**: Each trait must:
- Be an adjective that can modify nouns
- Pass: "The {trait} {thing}" makes grammatical sense
- Not be a noun, verb, or other part of speech

### 2.2 Trait-Thing Appropriateness Test
**Purpose**: Ensure traits meaningfully describe their associated things
**Test**: For each trait-thing pair:
- "A {thing} can be {trait}" makes semantic sense
- The trait is commonly used to describe that thing
- Not metaphorical unless universally understood

### 2.3 Trait Bridge Effectiveness Test
**Purpose**: Ensure traits enable "poetic" navigation
**Test**: Each trait should:
- Connect at least 3 different Thing words
- Connect semantically diverse things (not just siblings)
- Represent genuinely shared qualities

**Example**: "Fuzzy" → Cat, Peach, Sweater (diverse categories)

### 2.4 Trait Clustering Quality Test
**Purpose**: Validate trait normalization worked correctly
**Test**: Promoted traits should:
- Have similarity > 0.8 with their cluster members
- Represent the cluster's semantic center
- Not have near-duplicates in promoted set

### 2.5 Trait Minimum Exemplar Test
**Purpose**: Ensure traits have enough examples for gameplay
**Test**: Each promoted trait must:
- Connect to at least 3 Thing words
- Have clear, distinct examples
- Not be so specific it only applies to one category

## 3. Role Word Semantic Tests

### 3.1 Role Grammatical Format Test
**Purpose**: Ensure roles follow correct grammatical pattern
**Test**: Each role must be:
- A gerund (verb+ing): "protecting", "carrying", "illuminating"
- OR an abstract noun of function: "guardian", "carrier", "illuminator"
- Not a trait adjective or thing noun

### 3.2 Role Functional Appropriateness Test
**Purpose**: Ensure roles represent actual functional relationships
**Test**: For each role-thing pair:
- The role must be a PRIMARY PURPOSE of that thing
- "A {thing} is for {role}" should make sense
- Not incidental capabilities

**Examples from GDD**:
- ✓ Flashlight + "illuminating" (primary purpose)
- ✗ Cat + "sleeping" (cats do sleep, but not their purpose)

### 3.3 Role-Thing Semantic Match Test
**Purpose**: Validate role assignments make sense
**Test**: Each thing with a role should:
- Actually perform that function
- Be commonly recognized for that role
- Not have contradictory roles

### 3.4 Role Acquaintance Relevance Test
**Purpose**: Ensure role acquaintances are functionally related
**Test**: Role acquaintances should be:
- Other things that share the functional relationship
- Tools/objects used in that function
- Results or contexts of that function

### 3.5 Role Bridge Effectiveness Test
**Purpose**: Ensure roles enable functional navigation
**Test**: Each promoted role should:
- Connect at least 3 different things
- Represent a meaningful functional category
- Enable "poet" strategy navigation

### 3.6 No Trait-Role Overlap Test
**Purpose**: Ensure clean separation between traits and roles
**Test**: 
- No word should be both trait and role
- Traits describe qualities, roles describe functions
- Check for words that could be misclassified

## 4. Cross-Type Semantic Tests

### 4.1 Metadata Completeness Test
**Purpose**: Ensure no word is missing required relationships
**Test**: Each Thing word must have:
- 3-5 children (unless leaf node)
- 3-5 traits
- 3-5 acquaintances
- 0-2 roles (only when functionally appropriate)

### 4.2 Reference Integrity Test  
**Purpose**: Ensure all references are valid
**Test**:
- Every parent reference points to existing Thing
- Every trait points to promoted trait
- Every role points to promoted role
- Every acquaintance points to valid word

### 4.3 Bidirectional Consistency Test
**Purpose**: Validate relationship symmetry where expected
**Test**:
- If A has child B, then B must have parent A
- Trait assignments are reflected in trait's exemplars
- Role assignments match role's connected things

### 4.4 Graph Connectivity Test
**Purpose**: Ensure playable navigation
**Test**:
- Every word reachable from "Thing" 
- No orphaned subgraphs
- Average 4-8 total connections per word
- No words with only parent connection

### 4.5 Adoption Quality Test
**Purpose**: Validate orphan adoption made semantic sense
**Test**: For each adopted acquaintance:
- New parent makes semantic sense
- Better than defaulting to "Thing"
- Maintains meaningful relationships

## 5. Player Experience Semantic Tests

### 5.1 Path Diversity Test
**Purpose**: Ensure multiple valid paths between words
**Test**: For random word pairs:
- At least 2-3 semantically valid paths exist
- Paths use different strategies (hierarchical vs associative)
- Path lengths are reasonable (3-8 steps)

### 5.2 Connection Density Test
**Purpose**: Ensure rich navigation options
**Test**:
- Average connections per word: 4-8
- No more than 10% poorly connected (<3)
- No more than 10% over-connected (>12)

### 5.3 Intuitive Navigation Test
**Purpose**: Validate connections feel natural
**Test**: Sample paths should:
- Make intuitive sense to players
- Not require specialized knowledge
- Support both logical and creative thinking

### 5.4 Cultural Universality Test
**Purpose**: Ensure broad accessibility
**Test**: Relationships should:
- Not depend on specific cultural knowledge
- Use universal rather than regional associations
- Avoid idioms or culturally specific metaphors

### 5.5 Balanced Difficulty Test
**Purpose**: Ensure appropriate challenge level
**Test**:
- Mix of obvious and clever connections
- Some "aha!" moments without being obscure
- Trait/role bridges provide alternate routes

## 6. Semantic Consistency Tests

### 6.1 Conceptual Level Matching Test
**Purpose**: Ensure relationships respect abstraction levels
**Test**:
- Abstract concepts connect to abstract things
- Concrete objects connect to concrete things
- No jarring level mismatches

### 6.2 Temporal Consistency Test
**Purpose**: Avoid anachronistic relationships
**Test**:
- Modern concepts don't have ancient things as children
- Historical things use historically appropriate traits
- Technological roles match their era

### 6.3 No Logical Impossibilities Test
**Purpose**: Prevent contradictory relationships
**Test**:
- No circular parent-child relationships
- No mutually exclusive traits on same thing
- No impossible acquaintance relationships

## 7. Implementation Validation Tests

### 7.1 Prompt Effectiveness Test
**Purpose**: Ensure prompts generate appropriate responses
**Test**: For sample of raw responses:
- Responses match requested format
- Abstract words get meaningful traits (not "please specify")
- Appropriate quantity (3-5 items)

### 7.2 Deduplication Effectiveness Test
**Purpose**: Validate exact match removal worked
**Test**:
- No duplicate children under same parent
- No duplicate traits on same thing
- No duplicate acquaintances

### 7.3 Cluster Coherence Test
**Purpose**: Validate embedding-based clustering
**Test**: Within each cluster:
- All members semantically related
- Similarity threshold (0.8) maintained
- Promoted word is representative

## Test Execution Process

### Automated Tests (Programmatic)
- Graph connectivity
- Reference integrity  
- Metadata completeness
- Grammatical format checking
- Duplicate detection

### Semi-Automated Tests (LLM-Assisted)
```javascript
// Example test structure
async function testParentChildValidity(word, parent) {
  const prompt = `Does "${word} is a type of ${parent}" make logical sense? 
                   Answer YES or NO with brief explanation.`;
  const response = await checkWithLLM(prompt);
  return parseValidation(response);
}
```

### Manual Review Tests
- Sample 20-30 paths for intuitive sense
- Check cultural universality
- Evaluate "fun factor" and discovery moments
- Verify poet vs logician balance

## Success Criteria

**Critical (Must Pass 95%+)**
- Parent-child validity
- Reference integrity
- Metadata completeness
- Graph connectivity

**Important (Must Pass 85%+)**
- Trait appropriateness
- Role functionality
- Acquaintance relevance
- Connection density

**Quality (Must Pass 75%+)**
- Path diversity
- Intuitive navigation
- Clustering effectiveness
- Bridge quality

## Red Flags Requiring Immediate Fix

1. **Placeholder data**: Any "trait1", "acquaintance1" etc.
2. **Empty relationships**: Words with no traits/acquaintances
3. **Logical impossibilities**: Circular relationships, contradictions
4. **Severe sparsity**: <2 connections average
5. **Classification errors**: Verbs as traits, adjectives as things
6. **Cultural bias**: Region-specific associations at high levels

## Testing Frequency

- **After each build**: Run all automated tests
- **After prompt changes**: Focus on affected word types
- **Before production**: Complete manual review
- **Iteratively**: Fix issues and rebuild until quality targets met

Remember: The goal is not perfection but a dataset that enables both logical and poetic play strategies while maintaining semantic coherence.