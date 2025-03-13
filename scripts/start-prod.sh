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

# Kill any existing servers
echo "Killing any existing servers..."
pkill -f "node dist/server.js" || true
pkill -f "ts-node src/mock/run-server.ts" || true
npx kill-port 7654 7655 7656 5173

# Clear any existing data files that might persist between sessions
echo "Clearing any persisted data from previous sessions..."
node scripts/clear-data.js

# Set environment to production and load the environment file
export NODE_ENV=production

# Load environment variables from .env if it exists
if [ -f .env ]; then
  echo "Loading environment from .env"
  set -a
  source .env
  set +a
fi

# Force mock data to be disabled for production
export USE_MOCK_DATA=false
export MOCK_DATA_ENABLED=false

# Build the backend
echo "Building backend..."
if [ "$DRY_RUN" = false ]; then
  npm run build
else
  echo "[DRY RUN] Would run: npm run build"
fi

# Build the frontend
echo "Building frontend..."
if [ "$DRY_RUN" = false ]; then
  cd frontend && npm run build && cd ..
else
  echo "[DRY RUN] Would run: cd frontend && npm run build && cd .."
fi

# Start the production server
echo "Starting production server..."
if [ "$DRY_RUN" = false ]; then
  node dist/server.js
else
  echo "[DRY RUN] Would run: node dist/server.js"
fi

# If we're using mock data, start the mock server
if [ "$USE_MOCK_DATA" = "true" ] || [ "$MOCK_DATA_ENABLED" = "true" ]; then
  echo "Starting mock data server on port 7656..."
  
  if [ "$DRY_RUN" = false ]; then
    # If running in Docker, we need to bind to 0.0.0.0 instead of localhost
    if [ -n "$DOCKER_CONTAINER" ]; then
      # Create a modified version of the run-server.ts file that binds to 0.0.0.0
      echo "global.HOST = '0.0.0.0';" > /tmp/mock-server-config.js
      # Start the mock server with the modified config
      NODE_OPTIONS="--require /tmp/mock-server-config.js" MOCK_SERVER_PORT=7656 node dist/mock/run-server.js > /tmp/pulse-mock-server.log 2>&1 &
    else
      # Start the mock server normally
      MOCK_SERVER_PORT=7656 node dist/mock/run-server.js > /tmp/pulse-mock-server.log 2>&1 &
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
fi

# When the server exits, also kill the mock server if it's running
if [ -n "$MOCK_SERVER_PID" ]; then
  kill $MOCK_SERVER_PID
fi 