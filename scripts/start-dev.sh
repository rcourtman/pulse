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

# Check if running in Docker
if [ -n "$DOCKER_CONTAINER" ]; then
  echo "Running in Docker container"
else
  # Stop any running Pulse Docker containers first if not in Docker
  echo "Stopping any running Pulse Docker containers..."
  if command -v docker &> /dev/null; then
    docker ps -q --filter "name=pulse" | xargs -r docker stop
  else
    echo "Docker not found, skipping container cleanup..."
  fi
fi

# Kill any existing servers
echo "Killing any existing servers..."
pkill -f "node dist/server.js" || true
pkill -f "ts-node src/mock/run-server.ts" || true
npx kill-port 7654 7656 3000

# Clear any existing data files that might persist between sessions
echo "Clearing any persisted data from previous sessions..."
node scripts/clear-data.js

# Set environment to development
export NODE_ENV=development

# Load environment variables from .env if it exists
if [ -f .env ]; then
  echo "Loading environment from .env"
  set -a
  source .env
  set +a
fi

# Only set mock data if it's not already set in the environment
# This allows the caller to override it
if [ -z "$USE_MOCK_DATA" ]; then
  export USE_MOCK_DATA=true
fi
if [ -z "$MOCK_DATA_ENABLED" ]; then
  export MOCK_DATA_ENABLED=true
fi
export MOCK_SERVER_PORT=7656

# Check if we should use mock data
if [ "$USE_MOCK_DATA" = "true" ] || [ "$MOCK_DATA_ENABLED" = "true" ]; then
  echo "Starting development environment with mock data..."
  
  # Start the mock data server
  echo "Starting mock data server on port 7656..."
  
  if [ "$DRY_RUN" = false ]; then
    # If running in Docker, we need to bind to 0.0.0.0 instead of localhost
    if [ -n "$DOCKER_CONTAINER" ]; then
      # Create a modified version of the run-server.ts file that binds to 0.0.0.0
      echo "global.HOST = '0.0.0.0';" > /tmp/mock-server-config.js
      # Start the mock server with the modified config
      NODE_OPTIONS="--require /tmp/mock-server-config.js" MOCK_SERVER_PORT=7656 ts-node src/mock/run-server.ts > /tmp/pulse-mock-server.log 2>&1 &
    else
      # Start the mock server normally
      MOCK_SERVER_PORT=7656 ts-node src/mock/run-server.ts > /tmp/pulse-mock-server.log 2>&1 &
    fi
    
    MOCK_SERVER_PID=$!
    
    # Wait a moment for the mock server to start
    sleep 5
    
    # Verify mock server is running
    if [ -n "$DOCKER_CONTAINER" ]; then
      # In Docker, check 0.0.0.0 or the HOST_IP environment variable
      # Use -I to get headers only and check if we got ANY HTTP response (200 or 404 both mean the server is running)
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://0.0.0.0:7656)
      if [[ "$HTTP_CODE" == "404" || "$HTTP_CODE" == "200" ]]; then
        echo "✅ Mock server is running on port 7656 (HTTP code: $HTTP_CODE)"
      else
        echo "❌ Mock server failed to start (HTTP code: $HTTP_CODE)"
        cat /tmp/pulse-mock-server.log
      fi
    else
      # Not in Docker, check localhost
      # Use -I to get headers only and check if we got ANY HTTP response (200 or 404 both mean the server is running)
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7656)
      if [[ "$HTTP_CODE" == "404" || "$HTTP_CODE" == "200" ]]; then
        echo "✅ Mock server is running on port 7656 (HTTP code: $HTTP_CODE)"
      else
        echo "❌ Mock server failed to start (HTTP code: $HTTP_CODE)"
        cat /tmp/pulse-mock-server.log
      fi
    fi
  else
    echo "[DRY RUN] Would start mock data server"
  fi
else
  echo "Starting development environment with real data..."
fi

# Start the backend server with hot reloading on port 7654
echo "Starting backend server on port 7654..."
if [ "$DRY_RUN" = false ]; then
  PORT=7654 ts-node-dev --respawn --transpile-only src/server.ts &
  BACKEND_PID=$!

  # Wait a moment for the server to start
  sleep 3

  # Verify backend server is running
  if curl -s http://localhost:7654/api/status > /dev/null; then
    echo "✅ Backend server is running on port 7654"
  else
    echo "❌ Backend server failed to start"
  fi
else
  echo "[DRY RUN] Would start backend server with: PORT=7654 ts-node-dev --respawn --transpile-only src/server.ts"
fi

# Get the host IP (use 0.0.0.0 in Docker, otherwise use localhost)
HOST_IP="0.0.0.0"
if [ -z "$DOCKER_CONTAINER" ]; then
  # Not in Docker, use 0.0.0.0 to bind to all interfaces
  HOST_IP="0.0.0.0"
fi

echo ""
echo "Pulse is now running in development mode!"
echo "- Backend API: http://localhost:7654"
if [ "$USE_MOCK_DATA" = "true" ] || [ "$MOCK_DATA_ENABLED" = "true" ]; then
  echo "- Mock Server: http://localhost:7656"
else
  echo "- Using real Proxmox data"
fi
echo "- Frontend UI: http://localhost:3000 (use this for development)"
echo ""
echo "Access the application at: http://localhost:3000"
echo ""

# Start the frontend Vite dev server with hot reloading on port 3000
echo "Starting frontend development server on port 3000..."
if [ "$DRY_RUN" = false ]; then
  cd frontend && npm run dev -- --host "$HOST_IP" --port 3000 --strict-port

  # When the frontend exits, also kill the backend and mock server
  kill $BACKEND_PID
  if [ -n "$MOCK_SERVER_PID" ]; then
    kill $MOCK_SERVER_PID
  fi
else
  echo "[DRY RUN] Would start frontend with: cd frontend && npm run dev -- --host \"$HOST_IP\" --port 3000 --strict-port"
fi