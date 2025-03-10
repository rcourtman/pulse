#!/bin/bash

# Make script executable if it isn't already
chmod +x "$0"

# Stop any running Pulse Docker containers first
echo "Stopping any running Pulse Docker containers..."
docker ps -q --filter "name=pulse" | xargs -r docker stop

# Kill any existing servers
echo "Killing any existing servers..."
pkill -f "node dist/server.js" || true
npx kill-port 7654 3000

# Set environment to development with mock data
export NODE_ENV=development
export USE_MOCK_DATA=true
export MOCK_DATA_ENABLED=true

# Start the backend server with mock data
echo "Starting backend server with mock data..."
cd ../../ && npm run dev:server &
BACKEND_PID=$!

# Wait a moment for the server to start
sleep 3

# Get the host IP (use 0.0.0.0 in Docker, otherwise use localhost or your local IP)
HOST_IP="0.0.0.0"
if [[ -z "${DOCKER_CONTAINER}" ]]; then
  # Not in Docker, still use 0.0.0.0 to bind to all interfaces
  HOST_IP="0.0.0.0"
fi

# Start the frontend Vite dev server
echo "Starting Pulse interface with mock data..."
cd ../../frontend && npm run dev -- --host "${HOST_IP}" --port 3000 &
FRONTEND_PID=$!

# Wait for the frontend to be ready
echo "Waiting for the frontend to be ready..."
sleep 10

# Run the screenshot tool
echo "Running screenshot tool..."
cd ../tools/screenshot-automation && npm run build && npm start

# When the screenshot tool exits, also kill the servers
echo "Cleaning up servers..."
kill $FRONTEND_PID
kill $BACKEND_PID 