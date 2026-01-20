#!/bin/bash
set -e

echo "=========================================="
echo "Starting Billie Platform (HTTP Mode)"
echo "=========================================="

cd /app

# Verify Next.js build exists
# Check for various build output formats
if [ -f ".next/standalone/server.js" ]; then
  echo "✓ Found standalone build"
elif [ -f ".next/BUILD_ID" ]; then
  echo "✓ Found regular Next.js build (BUILD_ID)"
elif [ -f "server.js" ]; then
  echo "✓ Found server.js in root (standalone copied)"
elif [ -d ".next/server" ] && [ -d ".next/static" ]; then
  echo "✓ Found Next.js build output (.next/server and .next/static exist)"
  echo "  Build is ready - will use 'next start'"
else
  echo "ERROR: Next.js build not found!"
  echo "Checking .next directory contents:"
  ls -la .next/ 2>&1 || echo ".next directory does not exist"
  echo ""
  echo "Build must be completed during Docker build. Cannot start server."
  exit 1
fi

# Start the event processor in background
echo "Starting Event Processor..."
PYTHONPATH=/app/event-processor/src python3 -m billie_servicing.main &
EVENT_PROCESSOR_PID=$!

# Start the Next.js server (HTTP mode - for use behind reverse proxy)
echo "Starting Next.js HTTP Server..."
if [ -f ".next/standalone/server.js" ]; then
  # Use standalone server if available (standalone mode)
  echo "Using standalone server from .next/standalone/"
  cd .next/standalone
  HOSTNAME="0.0.0.0" PORT=3000 node server.js &
  cd /app
elif [ -f "server.js" ]; then
  # Standalone mode - server.js is in root (copied from .next/standalone)
  echo "Using standalone server.js from root"
  HOSTNAME="0.0.0.0" PORT=3000 node server.js &
else
  # Use next start (works with both standalone and regular builds)
  # This is the recommended way to start Next.js in production
  echo "Using next start (production mode)"
  HOSTNAME="0.0.0.0" PORT=3000 pnpm start &
fi
NEXTJS_PID=$!

echo "=========================================="
echo "Services started:"
echo "  - Next.js HTTP: http://0.0.0.0:3000"
echo "  - Event Processor: Running"
echo "=========================================="

# Handle shutdown gracefully
cleanup() {
    echo "Shutting down services..."
    kill $EVENT_PROCESSOR_PID 2>/dev/null || true
    kill $NEXTJS_PID 2>/dev/null || true
    wait
    echo "Shutdown complete"
    exit 0
}

trap cleanup SIGTERM SIGINT

# Wait for either process to exit
wait -n
exit_code=$?

echo "A process exited with code $exit_code, shutting down..."
cleanup
