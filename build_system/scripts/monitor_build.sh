#!/bin/bash

# Six Degrees Build Monitor Script
# This script runs a build in the background and monitors its progress

BUILD_CONFIG=${1:-"config/test-25.json"}

echo "🚀 Starting Six Degrees build with monitoring..."
echo "Config: $BUILD_CONFIG"
echo ""

# Check if a build is already running
if [ -f .build_status.json ]; then
    STATUS=$(cat .build_status.json | grep '"status"' | cut -d'"' -f4)
    if [ "$STATUS" = "running" ]; then
        echo "⚠️  A build is already running. Run 'npm run monitor' to watch it."
        exit 1
    fi
fi

echo "Instructions:"
echo "1. This terminal will show the build progress"
echo "2. Open another terminal and run 'npm run monitor' for detailed monitoring"
echo "3. Press Ctrl+C to stop (build will continue in background)"
echo ""
echo "Starting build in 3 seconds..."
sleep 3

# Start the build
echo "🔨 Launching build..."
npm run test:cycle -- $BUILD_CONFIG

echo ""
echo "✅ Build completed! Check the archives for results."