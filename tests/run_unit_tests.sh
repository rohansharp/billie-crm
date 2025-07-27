#!/bin/bash

# Billie CRM - Unit Tests Runner
# This script runs all unit tests for regression testing

set -e

echo "🧪 Running Billie CRM Unit Tests"
echo "================================="

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Check if we're in the right directory (should be in tests/ directory)
if [ ! -f "../package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the tests directory."
    exit 1
fi

# Check if unit directory exists
if [ ! -d "unit" ]; then
    echo "❌ Error: unit directory not found. Please run this script from the tests directory."
    exit 1
fi

# Set test environment variables
export NODE_ENV=test
export REDIS_URL=redis://localhost:6383

echo "📂 Test directory: unit"
echo "🔧 Node environment: $NODE_ENV"
echo "🔗 Redis URL: $REDIS_URL"
echo ""

# Change to project root to run pnpm commands
cd ..

# Run unit tests with vitest
echo "🏃 Running unit tests..."
pnpm exec vitest run tests/unit --config ./vitest.config.mts

# Check the exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All unit tests passed!"
    echo "🎉 Test suite completed successfully."
else
    echo ""
    echo "❌ Some unit tests failed!"
    echo "💡 Check the output above for details."
    exit 1
fi 