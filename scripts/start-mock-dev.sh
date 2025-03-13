#!/bin/bash

# Make script executable if it isn't already
chmod +x "$0"

# Kill any existing servers
echo "Killing any existing servers..."
pkill -f "node dist/server.js" || true
pkill -f "ts-node src/mock/run-server.ts" || true
npx kill-port 7654 7655 7656 5173

# Clear any existing data files that might persist between sessions
echo "Clearing any persisted data from previous sessions..."
node scripts/clear-data.js

# Set environment to development and load the environment file
export NODE_ENV=development

# Load environment variables from .env if it exists
if [ -f .env ]; then
  echo "Loading environment from .env"
  set -a
  source .env
  set +a
fi

# Force mock data to be enabled for development
export USE_MOCK_DATA=true
export MOCK_DATA_ENABLED=true

# Start the mock server in the background
echo "Starting mock server..."
node scripts/start-mock-server.js &
MOCK_SERVER_PID=$!

# Build the backend
echo "Building backend..."
npm run build

# Build the frontend
echo "Building frontend..."
cd frontend && npm run build && cd ..

# Start the development server
echo "Starting development server..."
node dist/server.js

# When the server exits, also kill the mock server
kill $MOCK_SERVER_PID 