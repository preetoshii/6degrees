# Six Degrees Testing Framework

## Overview
This document defines the testing criteria and detective framework for evaluating the quality of generated word graph data. These tests require intelligent analysis, not just programmatic validation.

## Test Categories

### 1. STRUCTURAL INTEGRITY TESTS

#### 1.1 Graph Connectivity
- **Test**: Every word should be reachable from "Thing" through some path
- **Expected**: 100% connectivity
- **Detective Questions**: 
  - Are there orphaned subgraphs?
  - Did Phase 3 adoption fail to connect certain words?
  - Are there words with no parent?

#### 1.2 Cycle Prevention
- **Test**: No cycles should exist in parent-child relationships
- **Expected**: Zero cycles detected
- **Detective Questions**:
  - Is the isAncestor() function working correctly?
  - Are LLM responses sometimes suggesting ancestors as children?

#### 1.3 Relationship Validity
- **Test**: All relationships should make semantic sense
- **Expected**: 
  - Children are proper subtypes of parents
  - Traits are actual adjectives describing the word
  - Acquaintances are meaningfully related
- **Detective Questions**:
  - Are prompts clear enough about relationship types?
  - Is the LLM confusing different relationship types?

### 2. SEMANTIC QUALITY TESTS

#### 2.1 Taxonomic Coherence
- **Test**: The hierarchy should follow intuitive categorization
- **Expected Examples**:
  - Cat → Animal → Thing (✓)
  - Hammer → Tool → Object → Thing (✓)
  - NOT: Emotion → Animal (✗)
- **Detective Questions**:
  - Are abstract concepts being properly categorized?
  - Is the LLM understanding the difference between "is-a" and "related-to"?

#### 2.2 Trait Appropriateness
- **Test**: Traits should be commonly associated characteristics
- **Expected Examples**:
  - Cat: independent, playful, curious (✓)
  - NOT Cat: wooden, metallic (✗)
- **Detective Questions**:
  - Is the trait prompt emphasizing "commonly associated"?
  - Are we getting metaphorical vs literal traits?

#### 2.3 Acquaintance Relevance
- **Test**: Acquaintances should be natural mental associations
- **Expected Examples**:
  - Cat: litter box, whiskers, purring (✓)
  - NOT Cat: airplane, mathematics (✗)
- **Detective Questions**:
  - Is the prompt clear about "co-occurrence in thought"?
  - Are we getting too abstract or too specific?

### 3. CLUSTERING EFFECTIVENESS TESTS

#### 3.1 Trait Cluster Quality
- **Test**: Similar traits should cluster together meaningfully
- **Expected Examples**:
  - Cluster: {beautiful, pretty, attractive} → "beautiful"
  - Cluster: {smart, intelligent, clever} → "intelligent"
- **Detective Questions**:
  - Is the similarity threshold (0.8) appropriate?
  - Are embeddings capturing semantic similarity well?
  - Is the cluster representative selection working?

#### 3.2 Role Identification
- **Test**: Roles should be correctly identified and promoted
- **Expected Examples**:
  - "hammer" → Role (tool with purpose)
  - "companion" → Role (functional relationship)
  - NOT "red" → Role (just a trait)
- **Detective Questions**:
  - Is the role identification prompt clear enough?
  - Are we distinguishing tools/functions from mere objects?

### 4. GAME DESIGN ALIGNMENT TESTS

#### 4.1 Puzzle Viability
- **Test**: Generated puzzles should have multiple valid paths
- **Expected**: At least 3-5 different paths between origin and destination
- **Detective Questions**:
  - Is the graph dense enough for interesting puzzles?
  - Are acquaintances providing good alternative paths?
  - Are we generating enough interconnections?

#### 4.2 Difficulty Balance
- **Test**: Paths should vary in conceptual difficulty
- **Expected**:
  - Obvious paths through parent-child
  - Creative paths through acquaintances
  - Clever paths through traits
- **Detective Questions**:
  - Do we have enough variety in relationship types?
  - Are some categories too sparse?

#### 4.3 Player Navigation
- **Test**: Each word should have 3-8 meaningful connections
- **Expected**: Not too few (boring) or too many (overwhelming)
- **Detective Questions**:
  - Are we generating appropriate counts for each relationship type?
  - Should we adjust min/max limits in prompts?

### 5. PROMPT EFFECTIVENESS TESTS

#### 5.1 Response Format Compliance
- **Test**: LLM responses should match expected format
- **Expected**: Comma-separated values, correct count
- **Detective Questions**:
  - Are some prompts ambiguous?
  - Do we need more format examples in prompts?
  - Should we add validation examples?

#### 5.2 Abstract Word Handling
- **Test**: Abstract concepts should generate appropriate responses
- **Expected**: 
  - "Justice" gets meaningful children/traits
  - "Democracy" gets appropriate associations
- **Detective Questions**:
  - Do prompts work for both concrete and abstract?
  - Should we have different prompts for different word types?

## Detective Framework

### When Tests Fail

1. **Categorize the Failure**
   - Structural (broken connections, cycles)
   - Semantic (wrong relationships, poor quality)
   - Game Design (unplayable, too easy/hard)

2. **Trace the Source**
   - Which phase generated the problematic data?
   - What prompt was used?
   - What was the LLM's exact response?

3. **Form Hypotheses**
   - **Prompt Issues**: Ambiguous, misleading, or incomplete instructions
   - **Logic Issues**: Algorithm bugs, edge cases not handled
   - **Scale Issues**: Not enough data for algorithms to work properly
   - **Model Issues**: LLM limitations or inconsistencies

4. **Identify Patterns**
   - Does the issue occur with specific word types?
   - Is it consistent or sporadic?
   - Does it correlate with word complexity/abstractness?

### Documentation Format

Each build should be archived with:

```markdown
# Build Analysis - [DATE]

## Build Configuration
- Target Words: X
- Model: gpt-4-turbo
- Key Parameters: [list]

## Test Results
### Structural Integrity
- [✓/✗] Graph Connectivity: X/Y connected
- [✓/✗] Cycle Prevention: X cycles detected
- [✓/✗] Relationship Validity: X% valid

### Semantic Quality
- [✓/✗] Taxonomic Coherence: [examples]
- [✓/✗] Trait Appropriateness: [examples]
- [✓/✗] Acquaintance Relevance: [examples]

### Clustering Effectiveness
- Trait Clusters: X clusters from Y traits
- Roles Identified: X roles promoted

### Game Design Alignment
- Average connections per word: X
- Puzzle path diversity: [analysis]

## What Worked
- [Success 1]: [Why it worked]
- [Success 2]: [Why it worked]

## What Failed
- [Failure 1]: [Hypothesis for why]
- [Failure 2]: [Hypothesis for why]

## Changes for Next Build
1. [Specific change to make]
2. [Specific change to make]

## Detective Notes
[Detailed investigation of interesting findings]
```

## Iteration Strategy

1. **Start Small**: Test with 25-50 words to quickly identify issues
2. **Fix Prompts First**: Usually the easiest wins
3. **Scale Gradually**: 25 → 50 → 100 → 500 words
4. **Compare Builds**: Look for regressions and improvements
5. **Track Metrics**: Keep quantitative measures of quality

## Key Metrics to Track

- **Connectivity Rate**: % of words reachable from Thing
- **Valid Relationship Rate**: % of relationships that make sense
- **Cluster Efficiency**: Reduction ratio from raw to promoted traits
- **Orphan Adoption Success**: % of orphans successfully placed
- **Average Path Length**: Between random word pairs
- **Connection Density**: Average connections per word

## Testing Checklist

Before considering a build "production ready":

- [ ] All structural integrity tests pass
- [ ] 90%+ semantic quality (manual review of sample)
- [ ] Clustering reduces traits by 60-80%
- [ ] Average 4-7 connections per word
- [ ] Can find 3+ paths for most word pairs
- [ ] No obvious nonsensical relationships
- [ ] Abstract and concrete words both handled well
- [ ] Puzzles feel engaging and varied

## Archive Structure

```
data/
├── processed/          # Current build
├── raw/               # Current raw data
└── archive/
    ├── build_2024-01-15_100w/
    │   ├── unified_master.json
    │   ├── build_analysis.md
    │   └── config_used.json
    └── build_2024-01-20_500w/
        ├── unified_master.json
        ├── build_analysis.md
        └── config_used.json
```

This testing framework ensures we're not just generating data, but generating *good* data that serves the game's design goals.