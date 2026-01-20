#!/bin/bash
set -e

echo "=========================================="
echo "Starting Billie Platform (HTTP Mode)"
echo "=========================================="

cd /app

# Start the event processor in background
echo "Starting Event Processor..."
PYTHONPATH=/app/event-processor/src python3 -m billie_servicing.main &
EVENT_PROCESSOR_PID=$!

# Start the Next.js server (HTTP mode - for use behind reverse proxy)
echo "Starting Next.js HTTP Server..."
pnpm start &
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
