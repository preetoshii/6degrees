# Six Degrees Word Association Game

A semantic word graph game where players navigate between concepts through natural associations.

## 🎮 Quick Start

### Play the Game
```bash
cd frontend
npm install && npm run dev
```
Game available at `http://localhost:5174`

### Generate New Data
```bash
cd build_system
npm install
npm run test:25    # Generate 25-word dataset
```

## 📁 Project Structure

```
6degrees/
├── GDD/                    # Game Design Documents
│   ├── 01_GAME_CONCEPT.md
│   ├── 02_TECHNICAL_SPEC.md
│   ├── 03_BUILD_FLOW.md
│   ├── 05_TESTING.md
│   └── 06_SEMANTIC_TESTS.md
├── build_system/          # Data generation system
│   ├── README.md          # 📖 Full build system docs
│   ├── phases/            # Build pipeline phases
│   ├── prompts/          # LLM prompt templates
│   ├── config/           # Build configurations
│   └── scripts/          # Management tools
├── frontend/              # React game interface  
│   ├── README.md         # 📖 Frontend docs
│   └── src/              # Game components
├── data/                  # Generated word graph data
│   ├── processed/        # Final game data
│   └── archive/          # Archived builds
├── QUICK_REFERENCE.md     # 📖 Essential commands
└── README.md             # This file
```

## 🚀 Development Workflow

### 1. **Data Generation** (build_system/)
```bash
cd build_system
npm run test:25           # Generate 25-word test dataset
npm run monitor          # Watch build progress (in another terminal)
```

### 2. **Game Development** (frontend/)  
```bash
cd frontend
npm run dev              # Start game interface
# Data updates automatically when builds complete
```

### 3. **Quality Assurance**
```bash
cd build_system
npm run analyze          # Check build quality
npm run validate         # Run semantic tests
```

## 📖 Documentation

### 📋 Quick Reference
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Essential commands and workflows

### 🔧 Build System  
- **[build_system/README.md](build_system/README.md)** - Complete build system documentation
- Data generation, monitoring, configuration, troubleshooting

### 🎮 Frontend
- **[frontend/README.md](frontend/README.md)** - Game interface documentation  
- Features, data integration, development guide

### 📋 Game Design
- **[GDD/](GDD/)** - Complete game design documentation
- Concept, technical specs, build flow, testing framework

## 🎯 Key Features

### Build System
- **Real-time monitoring** with live progress tracking
- **Automatic archiving** of all builds (success/failure)  
- **Smart progress counting** (only fully processed words)
- **Response validation** (filters LLM errors)
- **Resumable builds** with checkpoint system

### Game Interface
- **Two view modes**: Natural language vs. structured data
- **Build timestamp display** shows data freshness
- **Navigation**: Click, breadcrumbs, browser back, keyboard
- **Optimal path finding** with BFS algorithm
- **Tooltips** with word previews

### Data Quality
- **Semantic validation** with 149 automated tests
- **Build analysis** with quality metrics
- **Prompt management** system for easy iteration
- **Archive system** for comparing builds

## ⚡ Most Common Commands

```bash
# Quick test build with monitoring
cd build_system && npm run test:25
cd build_system && npm run monitor    # In another terminal

# Update frontend data
cd build_system && npm run update-frontend  

# Start game
cd frontend && npm run dev

# Check build quality  
cd build_system && npm run analyze

# Emergency reset
cd build_system && npm run clean && npm run test:25
```

## 🔍 Monitoring & Progress

### Real-time Build Monitoring
The build system includes comprehensive progress tracking:

```bash
# Live progress monitor
npm run monitor

# Single status check  
npm run monitor:once
```

**Monitor Display:**
- 📊 Build status (running/completed/failed)
- ⏱️ Elapsed time (MM:SS)
- 🎯 Progress (X/25 words complete, percentage)  
- 📋 Live log stream with color coding
- 📈 Activity indicator (shows if build is progressing)

### Frontend Data Tracking
The game interface shows when data was last updated:
- **Location**: Top corner next to "Six Degrees" 
- **Format**: "Data: Jun 26, 2025, 04:07 PM"
- **Purpose**: Know if you're using latest or stale data

## 🛠️ Configuration

### Build System Configs
- `config/test-25.json` - Quick testing (25 words, ~5 min)
- `config/test-sample.json` - Standard test (50 words, ~15 min)
- `config/full-run.json` - Production (2000 words, ~2 hours)

### Key Parameters
```json
{
  "targetWordCount": 25,
  "clustering": {
    "similarityThreshold": 0.65    // Lower = more trait diversity
  },
  "itemCounts": {
    "children": { "min": 3, "max": 5 },
    "traits": { "min": 3, "max": 5 }
  }
}
```

## 🧪 Testing & Quality

### Automated Testing
```bash
npm run analyze          # Structural analysis
npm run validate         # 149 semantic tests  
```

### Manual Testing Framework
See `GDD/05_TESTING.md` and `GDD/06_SEMANTIC_TESTS.md` for comprehensive testing procedures.

### Build Archives
Every build is automatically archived with:
- All data files (JSON, CSV)
- Configuration used
- Success/failure status  
- Automated analysis results

## 🔧 Troubleshooting

### Common Issues

**Build timeouts**: Use smaller configs (`test-25.json`)
**Frontend shows old data**: Run `npm run update-frontend`
**Poor trait diversity**: Lower `similarityThreshold` to 0.65
**Incomplete word metadata**: Fixed in current version

### Emergency Recovery
```bash
# Complete reset
cd build_system
npm run clean
npm run test:25

# Restore from archive
cp data/archive/build_*_success/* data/processed/
npm run update-frontend
```

### Getting Help
1. Check `QUICK_REFERENCE.md` for common solutions
2. View logs: `build_system/logs/build_*.log`  
3. Run diagnostics: `npm run analyze && npm run validate`
4. Check archives: `npm run archives`

## 🚀 Advanced Usage

### Custom Builds
```bash
# Custom config
node index.js --config config/my-config.json

# Specific phases only
node index.js --phases 1,2,3

# Background builds
npm run build:async config/test-25.json
npm run build:status  # Check progress
```

### Prompt Iteration
Edit files in `build_system/prompts/` to improve LLM output quality:
- `phase1_children.txt` - Generate child words
- `phase1_traits.txt` - Generate traits  
- `phase1_acquaintances.txt` - Generate associations
- `phase1_roles.txt` - Determine functional purposes

Changes take effect immediately - no code modification needed.

## 🎯 Performance

### Build Times (Estimated)
- **25 words**: ~5 minutes, ~120 API calls
- **50 words**: ~15 minutes, ~240 API calls  
- **100 words**: ~45 minutes, ~480 API calls

### Costs (OpenAI GPT-4 Turbo)
- **25 words**: ~$0.50
- **100 words**: ~$2.00
- **2000 words**: ~$40.00

## 📈 Future Development

### Roadmap
- [ ] Natural language definitions (Phase 4)
- [ ] Larger vocabulary (10K+ words)
- [ ] Multiplayer functionality
- [ ] Mobile interface
- [ ] Voice navigation

### Contributing
1. Test changes with small builds (`npm run test:25`)
2. Use monitoring during development (`npm run monitor`)
3. Check quality with analysis tools (`npm run analyze`)
4. Document new features in appropriate README files

---

For detailed information, see the README files in each directory:
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Essential commands
- **[build_system/README.md](build_system/README.md)** - Build system
- **[frontend/README.md](frontend/README.md)** - Game interface  
- **[GDD/](GDD/)** - Game design documents