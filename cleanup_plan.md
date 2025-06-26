# File Structure Cleanup Plan

## Current Issues:
1. Data files are in `/Users/preetoshi/data/` (outside project)
2. Multiple empty `data` directories inside the project
3. Path configuration in `file_utils.js` goes up too many levels

## Proposed Clean Structure:
```
/Users/preetoshi/6degrees/
├── data/                    # All game data here
│   ├── processed/          # Generated data files
│   └── raw/               # Raw CSV files
├── build_system/          # Build pipeline
│   └── (no data folder)   # Remove empty data folder
├── frontend/              # Game UI
│   └── (no data folder)   # Remove empty data folder
├── checkpoints/           # Build checkpoints (already correct)
├── logs/                  # Build logs (already correct)
└── GDD/                   # Game design docs (already correct)
```

## Steps to Execute:
1. Move data from `/Users/preetoshi/data/` to `/Users/preetoshi/6degrees/data/`
2. Update `file_utils.js` to use correct path
3. Remove empty data directories
4. Update frontend to load from correct path

## Commands to execute (in order):
```bash
# 1. Move the actual data into the project
mv /Users/preetoshi/data/processed/* /Users/preetoshi/6degrees/data/processed/
mv /Users/preetoshi/data/raw/* /Users/preetoshi/6degrees/data/raw/

# 2. Remove the external data directory
rmdir /Users/preetoshi/data/processed
rmdir /Users/preetoshi/data/raw
rmdir /Users/preetoshi/data

# 3. Remove empty internal data directories
rm -rf /Users/preetoshi/6degrees/build_system/data
rm -rf /Users/preetoshi/6degrees/frontend/data

# 4. Fix will be applied to file_utils.js
```