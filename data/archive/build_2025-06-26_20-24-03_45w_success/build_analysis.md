# Build Analysis - 2025-06-26

## Build Status: ✅ SUCCESS

- **Date**: 2025-06-26T20:24:03.723Z
- **Config**: config/test-25.json
- **Words Built**: 45
- **Unified Index**: Yes



## Automated Analysis
See console output above for structural and semantic analysis.

## Manual Notes

### Detective Analysis - Semantic Validation Results

**Overall Build Quality: 62.4% Pass Rate (93/149 tests)**

#### Critical Issues Found:

1. **Trait Clustering Too Aggressive**
   - Only 3 traits survived from 22 unique traits generated
   - Similarity threshold of 0.8 is clustering unrelated traits
   - Every word has insufficient traits (1 instead of 3-5)
   - The traits "complex", "tangible", and "mobile" are too generic

2. **Children Appearing as Acquaintances**
   - Major semantic violation: 62 failures
   - Examples: "Thing" lists "Object" as both child AND acquaintance
   - This creates confusing relationships in the game

3. **Mixed Sibling Types**
   - Adoptions creating inconsistent hierarchies
   - Example: "Thing" has natural children (Animal, Object) mixed with adoptions (possession, veterinarian)
   - Creates unnatural groupings

#### What's Working Well:

1. **Path Connectivity**: All tested paths are semantically valid
2. **Hierarchical Structure**: The taxonomy is logically sound
3. **Response Validation**: No more LLM errors in data
4. **Auto-archiving**: Build process is stable

#### Root Causes:

1. **Prompt Issues**:
   - Acquaintance prompt not excluding children/parents effectively
   - Need stronger exclusion instructions

2. **Clustering Configuration**:
   - Threshold 0.8 is too high for trait similarity
   - Should reduce to 0.6-0.7 for more trait diversity

3. **Adoption Logic**:
   - Words being adopted as children when they should be peers
   - Need better category detection for adoptions

#### Recommendations:

1. **Immediate**: Adjust clustering threshold to 0.65
2. **Immediate**: Fix acquaintance prompt to explicitly exclude all family relations
3. **Short-term**: Improve adoption logic to maintain type consistency
4. **Long-term**: Add post-processing to clean relationship conflicts
