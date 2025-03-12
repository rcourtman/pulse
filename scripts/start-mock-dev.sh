#!/bin/bash

# Make script executable if it isn't already
chmod +x "$0"

# Check for dry run flag from command line or environment variable
DRY_RUN=false
if [ "$DRY_RUN" = "true" ]; then
  echo "Dry run mode enabled via environment variable - will not actually start the server"
else
  for arg in "$@"; do
    if [ "$arg" == "--dry-run" ]; then
      DRY_RUN=true
      echo "Dry run mode enabled via command line flag - will not actually start the server"
    fi
  done
fi

# Stop any running Pulse Docker containers first
echo "Stopping any running Pulse Docker containers..."
if command -v docker &> /dev/null; then
  docker ps -q --filter "name=pulse" | xargs -r docker stop
else
  echo "Docker not found, skipping container cleanup..."
fi

# Kill any existing servers
echo "Killing any existing servers..."
pkill -f "node dist/server.js" || true
pkill -f "ts-node src/mock/run-server.ts" || true
npx kill-port 7654 7655 7656 5173

# Set environment to development with mock data
export NODE_ENV=development
export USE_MOCK_DATA=true
export MOCK_DATA_ENABLED=true
export MOCK_SERVER_PORT=7656

# Load environment variables from .env if it exists
if [ -f .env ]; then
  echo "Loading environment from .env"
  set -a
  source .env
  set +a
  # Override mock data settings
  export USE_MOCK_DATA=true
  export MOCK_DATA_ENABLED=true
  export MOCK_SERVER_PORT=7656
fi

# Start the mock data server
echo "Starting mock data server on port 7656..."
if [ "$DRY_RUN" = false ]; then
  MOCK_SERVER_PORT=7656 ts-node src/mock/run-server.ts > /tmp/pulse-mock-server.log 2>&1 &
  MOCK_SERVER_PID=$!

  # Wait a moment for the mock server to start
  sleep 2

  # Check if the mock data server is running
  if ! ps -p $MOCK_SERVER_PID > /dev/null; then
    echo "Error: Mock data server failed to start."
    echo "Check the logs at /tmp/pulse-mock-server.log for details."
    exit 1
  fi
  
  # Verify mock server is running
  if curl -s http://localhost:7656 > /dev/null; then
    echo "✅ Mock server is running on port 7656"
  else
    echo "❌ Mock server failed to start"
    cat /tmp/pulse-mock-server.log
  fi
else
  echo "[DRY RUN] Would start mock data server with: MOCK_SERVER_PORT=7656 ts-node src/mock/run-server.ts"
fi

# Start the backend server with mock data on port 7654
echo "Starting backend server with mock data on port 7654..."
if [ "$DRY_RUN" = false ]; then
  USE_MOCK_DATA=true MOCK_DATA_ENABLED=true PORT=7654 npm run dev:server &
  BACKEND_PID=$!

  # Wait a moment for the server to start
  sleep 3

  # Verify mock data is enabled - check port 7654 where the backend is running
  echo "Verifying mock data is enabled..."
  curl -s "http://localhost:7654/api/status" | grep -q "mockDataEnabled" && echo "✅ Mock data is enabled" || echo "❌ Mock data is NOT enabled"
else
  echo "[DRY RUN] Would start backend server with: USE_MOCK_DATA=true MOCK_DATA_ENABLED=true PORT=7654 npm run dev:server"
fi

# Get the host IP (use 0.0.0.0 in Docker, otherwise use localhost or your local IP)
HOST_IP="0.0.0.0"
if [[ -z "${DOCKER_CONTAINER}" ]]; then
  # Not in Docker, still use 0.0.0.0 to bind to all interfaces
  HOST_IP="0.0.0.0"
fi

echo ""
echo "Pulse is now running with mock data!"
echo "- Backend API: http://localhost:7654"
echo "- Mock Server: http://localhost:7656"
echo "- Frontend UI: http://localhost:5173 (use this for development)"
echo ""
echo "Access the application at: http://localhost:5173"
echo ""

# Start the frontend Vite dev server on port 5173
echo "Starting Pulse interface with mock data on port 5173..."
if [ "$DRY_RUN" = false ]; then
  cd frontend && USE_MOCK_DATA=true MOCK_DATA_ENABLED=true npm run dev -- --host "${HOST_IP}" --port 5173

  # When the frontend exits, also kill the backend and mock server
  kill $BACKEND_PID $MOCK_SERVER_PID
else
  echo "[DRY RUN] Would start frontend with: cd frontend && USE_MOCK_DATA=true MOCK_DATA_ENABLED=true npm run dev -- --host \"${HOST_IP}\" --port 5173"
fi 