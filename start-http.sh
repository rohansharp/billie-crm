#!/bin/bash
set -e

echo "=========================================="
echo "Starting Billie Platform (HTTP Mode)"
echo "=========================================="

APP_DIR="${APP_DIR:-/app}"
cd "$APP_DIR"

# Verify Next.js build exists
# Check for various build output formats
if [ -f ".next/standalone/server.js" ]; then
  echo "✓ Found standalone build (.next/standalone/server.js)"
elif [ -d ".next/server" ]; then
  echo "✓ Found Next.js build output (.next/server exists)"
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
PYTHONPATH="${APP_DIR}/event-processor/src" python3 -m billie_servicing.main &
EVENT_PROCESSOR_PID=$!

# Start the Next.js server (HTTP mode - for use behind reverse proxy)
# NOTE: The root server.js is a custom HTTPS dev server - do NOT use it here
echo "Starting Next.js HTTP Server..."
if [ -f ".next/standalone/server.js" ]; then
  # Use standalone server (runs HTTP by default)
  echo "Using standalone server from .next/standalone/"
  cd .next/standalone
  HOSTNAME="0.0.0.0" PORT=3000 node server.js &
  cd "$APP_DIR"
else
  # Use next start (production HTTP server)
  echo "Using 'next start' (production mode)"
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
