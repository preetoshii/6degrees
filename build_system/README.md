# Six Degrees Build System

A comprehensive system for generating and managing word graph data for the Six Degrees word association game.

## Quick Start

```bash
# Basic 25-word test build
npm run test:25

# Monitor build progress (in another terminal)
npm run monitor

# Update frontend with latest data
npm run update-frontend
```

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Build Commands](#build-commands)
- [Monitoring & Progress](#monitoring--progress)
- [Configuration](#configuration)
- [Build Phases](#build-phases)
- [Data Management](#data-management)
- [Frontend Integration](#frontend-integration)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

## Overview

The build system generates a semantic word graph by:
1. **Phase 1**: Growing a tree of words via BFS expansion from "Thing"
2. **Phase 2**: Normalizing and clustering traits using embedding similarity
3. **Phase 2.5**: Normalizing and clustering roles/purposes
4. **Phase 3**: Adopting orphaned acquaintances into the word hierarchy
5. **Phase 3.5**: Creating a unified index with all relationships

## Installation

```bash
cd build_system
npm install

# Set your OpenAI API key
export OPENAI_API_KEY=your_key_here
# or create a .env file with OPENAI_API_KEY=your_key
```

## Build Commands

### Basic Builds

```bash
# Quick 25-word test (recommended for development)
npm run test:25

# Full test cycle with custom config
npm run test:cycle config/my-config.json

# Individual phases
npm run build:phase1
npm run build:phase2
npm run build:phase3

# Clean previous build data
npm run clean
```

### Advanced Builds

```bash
# Custom configuration
node index.js --config config/custom.json

# Specific phases only
node index.js --phases 1,2,3

# Disable auto-archiving
node index.js --no-archive

# Background/async build
npm run build:async config/test-25.json
```

### Configuration Files

- `config/test-25.json` - 25 words for quick testing
- `config/test-sample.json` - Default small test
- `config/full-run.json` - Production-scale build

## Monitoring & Progress

### Real-time Monitoring

```bash
# Live progress monitor (recommended)
npm run monitor

# Single status check
npm run monitor:once

# Check async build status
npm run build:status
```

### Comprehensive Build with Monitoring

```bash
# Runs build with progress tracking
./scripts/monitor_build.sh config/test-25.json
```

### Progress Indicators

The monitor shows:
- 📊 **Build Status**: running/completed/failed/timeout
- ⏱️ **Elapsed Time**: Real-time duration (MM:SS format)
- 🎯 **Target Progress**: X/25 words complete with percentage
- 📋 **Live Log Stream**: Last 15 lines with color coding
- 📈 **Log Activity**: Shows if build is actively progressing
- 🔄 **Phase Progress**: Current phase and word processing status

### Log Color Coding
- 🔴 **Red**: Errors (`[ERROR]`)
- 🟡 **Yellow**: Warnings (`[WARN]`)
- 🔵 **Blue**: Progress updates (`Progress:`, `Phase`)
- 🟢 **Green**: Completions (`complete`, `✅`)

## Configuration

### Basic Config Structure

```json
{
  "targetWordCount": 25,
  "dryRun": false,
  "phases": {
    "phase1": true,
    "phase2": true,
    "phase2_5": true,
    "phase3": true,
    "phase3_5": true
  },
  "api": {
    "model": "gpt-4-turbo-preview",
    "temperature": 0.7,
    "timeout": 30000
  },
  "itemCounts": {
    "children": { "min": 3, "max": 5 },
    "traits": { "min": 3, "max": 5 },
    "acquaintances": { "min": 3, "max": 5 },
    "roles": { "min": 1, "max": 3 }
  },
  "clustering": {
    "similarityThreshold": 0.8,
    "minClusterSize": 3
  },
  "verbose": true
}
```

### Key Parameters

- **targetWordCount**: Number of fully processed words (not total words)
- **similarityThreshold**: Higher = more aggressive clustering (0.6-0.8 recommended)
- **itemCounts**: Controls how many children/traits/etc. each word gets
- **verbose**: Shows detailed progress vs. summary progress

## Build Phases

### Phase 1: Core Tree Growth
- **Purpose**: BFS expansion from root "Thing" word
- **Output**: `master_words.json`, raw CSV files
- **Key Feature**: Only counts fully processed words toward target
- **Progress**: Shows percentage completion and queue status

### Phase 2: Trait Normalization
- **Purpose**: Clusters similar traits using embeddings
- **Output**: `traits_master.json`
- **Algorithm**: K-means clustering with similarity threshold

### Phase 2.5: Role Normalization  
- **Purpose**: Clusters functional purposes/roles
- **Output**: `roles_master.json`
- **Detection**: Identifies words with functional purposes

### Phase 3: Acquaintance Adoption
- **Purpose**: Adopts orphaned acquaintances into word hierarchy
- **Algorithm**: Embedding similarity + LLM validation
- **Fallback**: Uses "Thing" as ultimate parent if no match found

### Phase 3.5: Unified Index
- **Purpose**: Creates final game-ready data structure
- **Output**: `unified_master.json`
- **Features**: Optimized for frontend consumption

## Data Management

### Directory Structure

```
data/
├── processed/           # Final processed data
│   ├── master_words.json
│   ├── traits_master.json
│   ├── roles_master.json
│   └── unified_master.json
├── raw/                # Raw LLM outputs
│   ├── raw_traits.csv
│   ├── raw_acquaintances.csv
│   └── raw_purposes.csv
└── archive/            # Archived builds
    └── build_YYYY-MM-DD_HH-MM-SS_Xw_status/
```

### Archive Structure

Each build is automatically archived with:
- **All data files**: JSON and CSV outputs
- **Configuration**: `config_used.json`
- **Build status**: `build_status.json` with success/failure info
- **Analysis**: `build_analysis.md` with automated analysis

### Archive Naming Convention

```
build_YYYY-MM-DD_HH-MM-SS_Xw_status
```
- **Date/Time**: When build completed
- **Word Count**: Number of words generated
- **Status**: success/failed/timeout

### Archive Management

```bash
# List all archives
npm run archives

# View specific archive
ls data/archive/build_2025-06-26_20-24-03_45w_success/

# Manual archive current build
node scripts/archive_current.js
```

## Frontend Integration

### Automatic Data Updates

The frontend automatically uses the latest build data:

```bash
# Update frontend with latest build
npm run update-frontend
```

This is automatically called after every build.

### Build Timestamp Display

The frontend shows when the current data was generated:
- **Location**: Top corner of the game interface
- **Format**: "Data: Jun 26, 2025, 04:07 PM"
- **Updates**: Automatically when data is refreshed

### Frontend Data Structure

The frontend receives `dummy_data.json` with:
```json
{
  "master_words": { /* word objects */ },
  "traits_master": { /* trait objects */ },
  "roles_master": { /* role objects */ },
  "stats": { /* build statistics */ },
  "buildInfo": {
    "timestamp": "2025-06-26T21:07:52.484Z",
    "date": "Jun 26, 2025, 04:07 PM"
  }
}
```

## Troubleshooting

### Common Issues

#### Build Timeouts
**Symptom**: Build stops after 10 minutes
**Solution**: 
```bash
# Use shorter config
npm run test:cycle config/test-25.json

# Or increase timeout in config
"timeout": 60000  # 60 seconds per API call
```

#### Only Few Words Have Metadata
**Symptom**: Most words have empty traits/acquaintances
**Cause**: Old logic counted total words instead of processed words
**Fixed**: Current system counts only fully processed words

#### LLM Error Messages in Data
**Symptom**: Traits like "please specify the object"
**Solution**: Response validator automatically filters these

#### Frontend Shows Old Data
**Solution**:
```bash
npm run update-frontend
```

#### Trait Clustering Too Aggressive
**Symptom**: Only 1-3 traits survive from many generated
**Solution**: Lower similarity threshold in config:
```json
"clustering": {
  "similarityThreshold": 0.65  // was 0.8
}
```

### Diagnostic Commands

```bash
# Check current build status
npm run monitor:once

# Analyze latest build quality
npm run analyze

# Run semantic validation
npm run validate

# Check logs
tail -f logs/build_*.log
```

### Recovery Procedures

#### Interrupted Build
```bash
# Clean and restart
npm run clean
npm run test:25
```

#### Corrupted Data
```bash
# Restore from archive
cp data/archive/build_*_success/* data/processed/
npm run update-frontend
```

## Development

### Key Files

- **`index.js`**: Main build orchestrator with status tracking
- **`phases/`**: Individual build phases
- **`utils/`**: Shared utilities (file operations, LLM calls, etc.)
- **`scripts/`**: Management and monitoring scripts
- **`config/`**: Build configurations
- **`prompts/`**: LLM prompt templates

### Adding New Features

#### New Build Phase
1. Create `phases/phaseX_description.js`
2. Add to `index.js` phase execution
3. Update config schema
4. Add progress logging

#### New Monitoring Feature
1. Update `scripts/build_monitor.js`
2. Add status tracking in `index.js`
3. Update progress indicators

#### New Configuration Option
1. Add to config JSON schema
2. Update validation in phase files
3. Document in this README

### Testing

```bash
# Quick development test
npm run test:25

# With monitoring (in separate terminal)
npm run monitor

# Validate output quality
npm run analyze && npm run validate
```

### Best Practices

1. **Always use monitoring** for builds > 10 words
2. **Archive successful builds** before making changes
3. **Test with small configs** before large builds
4. **Check semantic validation** after builds
5. **Update frontend data** after manual changes

### Performance Notes

- **Phase 1**: Scales linearly with target word count
- **Phase 3**: Scales with orphan count (can be slow)
- **Memory**: ~100MB per 1000 words
- **API Calls**: ~120 calls per 25 words

### Prompt Management

Prompts are stored in `prompts/` directory:
- `phase1_children.txt` - Generate child words
- `phase1_traits.txt` - Generate traits
- `phase1_acquaintances.txt` - Generate acquaintances
- `phase1_roles.txt` - Determine functional roles

Edit these files to improve LLM output quality.

---

## Quick Reference

### Most Common Commands
```bash
npm run test:25           # Quick test build
npm run monitor          # Watch build progress
npm run clean            # Reset for new build
npm run update-frontend  # Refresh frontend data
npm run analyze          # Check build quality
```

### Emergency Recovery
```bash
npm run clean
cp data/archive/build_*_success/* data/processed/
npm run update-frontend
```

For more help, check the logs in `logs/` or run `npm run status` to see current system state.