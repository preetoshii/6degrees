# Six Degrees Build System Prompts

This directory contains all LLM prompts used in the build system. Each prompt is in its own file for easy editing and iteration.

## Structure

- Each `.txt` file contains a single prompt template
- Comments at the top explain where/how the prompt is used
- Variables are marked with `{{variable}}` syntax
- The actual code reads these files as the source of truth

## Prompt Files

### Phase 1: Tree Growth
- `phase1_children.txt` - Generate subtypes/children for words
- `phase1_traits.txt` - Generate adjective traits
- `phase1_acquaintances.txt` - Generate co-occurring nouns
- `phase1_acquaintances_retry.txt` - Retry with exclusions
- `phase1_roles.txt` - Generate functional roles

### Phase 2.5: Role Normalization
- `phase2_5_role_acquaintances.txt` - Generate acquaintances for roles

### Phase 3: Acquaintance Adoption
- `phase3_best_parent.txt` - Select best parent from candidates
- `phase3_validate_parent.txt` - Validate parent-child relationship

### System
- `system_prompt.txt` - System-level instruction for all calls

## Usage

Prompts are loaded in the code like:
```javascript
const prompt = await loadPrompt('phase1_children.txt', {
  min: 3,
  max: 5,
  word: 'Animal'
});
```

## Tips for Editing

1. Keep prompts concise but specific
2. Always specify the exact output format
3. Use examples when dealing with abstract concepts
4. Test changes with small builds (25 words) first
5. Consider the word's abstractness level when writing prompts