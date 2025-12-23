#!/bin/bash
set -e

echo "=========================================="
echo "Starting Billie Platform"
echo "=========================================="

# Ensure dependencies are installed (for volume mounts)
cd /app
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.pnpm/lock.yaml" ]; then
    echo "Installing Node.js dependencies..."
    pnpm install
fi

# Start the event processor in background
echo "Starting Event Processor..."
cd /app
PYTHONPATH=/app/event-processor/src python3 -m billie_servicing.main &
EVENT_PROCESSOR_PID=$!

# Start the Next.js server
echo "Starting Next.js HTTPS Server..."
cd /app
node server.js &
NEXTJS_PID=$!

echo "=========================================="
echo "Services started:"
echo "  - Next.js HTTPS: https://localhost:3000"
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
