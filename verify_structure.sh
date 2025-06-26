#!/bin/bash

echo "=== Verifying File Structure ==="
echo ""

echo "✓ Checking data directory..."
if [ -d "/Users/preetoshi/6degrees/data" ]; then
    echo "  Main data directory exists ✓"
    echo "  Contents:"
    ls -la /Users/preetoshi/6degrees/data/processed/ | head -5
else
    echo "  ERROR: Data directory missing!"
fi

echo ""
echo "✓ Checking for duplicate directories..."
duplicates=$(find /Users/preetoshi/6degrees -type d -name "data" 2>/dev/null | grep -v node_modules | wc -l)
if [ "$duplicates" -eq 1 ]; then
    echo "  No duplicate data directories ✓"
else
    echo "  WARNING: Found $duplicates data directories"
fi

echo ""
echo "✓ Checking build system paths..."
cd /Users/preetoshi/6degrees/build_system
node -e "
const { DATA_DIR } = require('./utils/file_utils.js');
console.log('  DATA_DIR points to:', DATA_DIR);
console.log('  Resolved path:', require('path').resolve(DATA_DIR));
" 2>/dev/null || echo "  Using ES modules (expected)"

echo ""
echo "✓ File structure verification complete!"