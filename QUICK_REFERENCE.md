# Six Degrees Build System - Quick Reference

## 🚀 Most Common Workflows

### Development Testing (25 words)
```bash
cd build_system
npm run test:25           # Clean → Build → Test → Archive
```

### Monitor Build Progress
```bash
# Terminal 1: Start build
npm run test:25

# Terminal 2: Watch progress
npm run monitor
```

### Update Frontend
```bash
npm run update-frontend   # Refresh frontend with latest data
```

## 📊 Build Commands

| Command | Purpose | Time | Words |
|---------|---------|------|-------|
| `npm run test:25` | Quick test | ~5 min | 25 |
| `npm run test:cycle` | Default test | ~15 min | 50 |
| `npm run clean` | Reset data | ~1 sec | - |
| `npm run monitor` | Watch progress | Real-time | - |

## 🔍 Monitoring Commands

| Command | Purpose | Output |
|---------|---------|--------|
| `npm run monitor` | Live progress | Real-time updates |
| `npm run monitor:once` | Status check | Single snapshot |
| `npm run build:status` | Async status | Background builds |
| `npm run analyze` | Build quality | Analysis report |
| `npm run validate` | Semantic tests | Pass/fail results |

## 📁 Key Files & Locations

### Configuration
- `config/test-25.json` - Quick test (25 words)
- `config/test-sample.json` - Standard test (50 words)  
- `config/full-run.json` - Production (2000 words)

### Data Output
- `data/processed/unified_master.json` - Final game data
- `data/archive/build_*_success/` - Archived builds
- `../frontend/data/dummy_data.json` - Frontend data

### Prompts (Edit these to improve quality)
- `prompts/phase1_children.txt` - Generate child words
- `prompts/phase1_traits.txt` - Generate traits
- `prompts/phase1_acquaintances.txt` - Generate acquaintances
- `prompts/phase1_roles.txt` - Determine roles

## 🎯 Progress Indicators

### Monitor Display
```
🔨 Six Degrees Build Monitor
══════════════════════════════════════════════════
📊 Status: RUNNING
⚙️  Config: config/test-25.json
⏱️  Elapsed: 3:45
🎯 Target: 25 words

📋 Recent Log Output:
─────────────────────────────────────────────────
🔵 🔄 Phase 1 Progress: 60% (15/25 words complete)
🔵 Processing word: Horse
   API Response for children for Horse: Thoroughbred, Arabian...
🟢 📊 Progress: 16/25 fully processed, 67 total words, 23 in queue
📈 Log is actively growing (+245 chars)

Press Ctrl+C to stop monitoring
```

### Log Color Coding
- 🔴 **Errors**: API failures, validation errors
- 🟡 **Warnings**: Retries, fallbacks, validation issues  
- 🔵 **Progress**: Phase updates, word processing
- 🟢 **Success**: Completions, validations passed

## ⚡ Quick Fixes

### Build Stuck/Slow
```bash
# Check if actually progressing
npm run monitor:once

# If truly stuck, restart
npm run clean && npm run test:25
```

### Frontend Shows Old Data
```bash
npm run update-frontend
```

### Poor Build Quality
```bash
# Check analysis
npm run analyze

# Reduce clustering threshold
# Edit config: "similarityThreshold": 0.65
```

### Need Fresh Start
```bash
npm run clean           # Remove all data
npm run test:25         # Start fresh build
```

## 🛠️ Advanced Usage

### Custom Builds
```bash
# Custom config
node index.js --config config/my-config.json

# Specific phases only
node index.js --phases 1,2,3

# Disable archiving
node index.js --no-archive
```

### Background Builds
```bash
# Start in background
npm run build:async config/test-25.json

# Check status
npm run build:status
```

### Archive Management
```bash
# List archives
npm run archives

# Restore from archive
cp data/archive/build_*_success/* data/processed/
npm run update-frontend
```

## 🔧 Configuration Tips

### For Development (Fast Testing)
```json
{
  "targetWordCount": 10,
  "clustering": { "similarityThreshold": 0.7 },
  "verbose": true
}
```

### For Quality (Better Results)
```json
{
  "targetWordCount": 25,
  "clustering": { "similarityThreshold": 0.65 },
  "itemCounts": {
    "children": { "min": 4, "max": 6 },
    "traits": { "min": 4, "max": 6 }
  }
}
```

## 📈 Performance Guidelines

### Build Times (Estimated)
- **10 words**: ~2 minutes
- **25 words**: ~5 minutes  
- **50 words**: ~15 minutes
- **100 words**: ~45 minutes

### API Usage
- **Phase 1**: ~4-5 calls per word
- **Total**: ~120 calls for 25 words
- **Cost**: ~$0.50 for 25 words

## 🚨 Emergency Procedures

### Complete System Reset
```bash
npm run clean
rm -rf data/archive/*     # Optional: clear archives
npm run test:25
```

### Restore Last Good Build
```bash
# Find latest successful build
ls -la data/archive/ | grep success

# Restore it
cp data/archive/build_*_success/* data/processed/
npm run update-frontend
```

### Debug Build Issues
```bash
# Check current status
npm run monitor:once

# View detailed logs
tail -f logs/build_*.log

# Run quality analysis
npm run analyze
npm run validate
```

---

## 📞 Need Help?

1. **Check logs**: `logs/build_*.log`
2. **Run diagnostics**: `npm run analyze && npm run validate`
3. **View archives**: `npm run archives`
4. **Read full docs**: `README.md`

**Most Common Fix**: `npm run clean && npm run test:25`