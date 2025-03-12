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

# When the server exits, also kill the mock server if it's running
if [ -n "$MOCK_SERVER_PID" ]; then
  kill $MOCK_SERVER_PID
fi 