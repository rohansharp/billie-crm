#!/bin/bash
set -e

echo "=========================================="
echo "Starting Billie Platform (HTTP Mode)"
echo "=========================================="

cd /app

# Verify Next.js build exists (standalone mode)
if [ ! -f ".next/standalone/server.js" ] && [ ! -f ".next/BUILD_ID" ]; then
  echo "WARNING: Next.js build not found"
  echo "Checking .next directory contents:"
  ls -la .next/ 2>&1 || echo ".next directory does not exist"
  echo "Attempting to build now..."
  pnpm run build
  if [ ! -f ".next/standalone/server.js" ] && [ ! -f ".next/BUILD_ID" ]; then
    echo "ERROR: Build failed. Cannot start Next.js server."
    echo "Build output directory contents:"
    ls -la .next/ 2>&1 || echo ".next directory still does not exist"
    exit 1
  fi
  echo "Build completed successfully."
fi

# Start the event processor in background
echo "Starting Event Processor..."
PYTHONPATH=/app/event-processor/src python3 -m billie_servicing.main &
EVENT_PROCESSOR_PID=$!

# Start the Next.js server (HTTP mode - for use behind reverse proxy)
echo "Starting Next.js HTTP Server..."
if [ -f ".next/standalone/server.js" ]; then
  # Use standalone server if available (standalone mode)
  # The standalone server needs to be run from its directory
  # but static files should be in .next/static relative to app root
  cd .next/standalone
  HOSTNAME="0.0.0.0" PORT=3000 node server.js &
  cd /app
else
  # Fallback to pnpm start for non-standalone builds
  pnpm start &
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
