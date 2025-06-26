# Six Degrees Build System

This system generates the semantic word graph for the Six Degrees game according to the BUILD FLOW specification.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

## Running the Build

### Test Run (50 words)
```bash
npm run build:test
```

### Full Run (2000 words)
```bash
npm run build:full
```

### Dry Run (no API calls)
```bash
node index.js --config config/dry-run.json
```

### Run specific phases
```bash
node index.js --phases 1,2
```

## Phases

1. **Phase 1**: Core Tree Growth - Generates the parent-child taxonomy
2. **Phase 2**: Trait Normalization - Clusters and promotes trait words
3. **Phase 2.5**: Role Normalization - Clusters and promotes role words
4. **Phase 3**: Acquaintance Adoption - Finds parents for orphaned acquaintances
5. **Phase 3.5**: Unified Index - Creates final unified data structure
6. **Phase 4**: Natural Language Generation (Beta) - Generates prose definitions

## Output Files

- `data/processed/master_words.json` - Main word graph
- `data/processed/traits_master.json` - Promoted trait words
- `data/processed/roles_master.json` - Promoted role words
- `data/processed/unified_master.json` - Complete unified index
- `data/raw/*.csv` - Raw metadata from Phase 1

## Configuration

See `config/` directory for configuration options:
- `test-sample.json` - 50 word test run
- `full-run.json` - 2000 word production run
- `dry-run.json` - Testing without API calls

## Cost Estimates

Based on BUILD FLOW calculations:
- Phase 1: ~$2.40 (2000 words)
- Phase 2: ~$0.05
- Phase 2.5: ~$0.04
- Phase 3: ~$1.04
- Phase 4: ~$6.00 (optional)

**Total: ~$3.53** for core build (without natural language)

## Monitoring

The system includes:
- Checkpoint files for resumability
- Progress logging
- Error tracking
- API call counting

## Resuming Failed Builds

If a build fails, simply run the same command again. The system will:
1. Load the last checkpoint
2. Skip already-processed words
3. Continue from where it left off

## Testing & Quality Assurance

The project includes a comprehensive testing framework documented in `GDD/05_TESTING.md`. After each build:

1. Run the build analyzer:
   ```bash
   node scripts/analyze_build.js
   ```

2. Review the automated analysis for:
   - Structural integrity (connectivity, cycles)
   - Connection density (aim for 4-7 per word)
   - Relationship distribution

3. Perform manual testing per the framework:
   - Semantic quality checks
   - Game design alignment
   - Prompt effectiveness

4. Archive builds with analysis:
   ```
   data/archive/
   └── build_YYYY-MM-DD_Xw/
       ├── unified_master.json
       ├── build_analysis.md
       └── config_used.json
   ```

## Known Issues (Current Build)

- Low trait generation (0.13 per word vs expected 3-5)
- Sparse connections (2.66 average vs expected 4-7)
- Abstract words getting poor LLM responses
- Some words not fully processed

## Next Steps

1. Fix trait/acquaintance prompts for abstract words
2. Ensure complete processing of all words
3. Increase connection density for better gameplay
4. Run smaller test builds (25 words) to debug prompts
5. Implement natural language generation phase