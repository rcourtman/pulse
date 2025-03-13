#!/bin/bash

# Make script executable if it isn't already
chmod +x "$0"

# Get the absolute path of the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Stop any running Pulse Docker containers first
echo "Stopping any running Pulse Docker containers..."
docker ps -q --filter "name=pulse" | xargs -r docker stop

# Kill any existing servers
echo "Killing any existing servers..."
pkill -f "node dist/server.js" || true
npx kill-port 7654 7656 3000

# Set environment to development with mock data
export NODE_ENV=development
export USE_MOCK_DATA=true
export MOCK_DATA_ENABLED=true
export MOCK_SERVER_PORT=7656

# Load environment variables from .env if it exists
if [ -f "${PROJECT_ROOT}/.env" ]; then
  echo "Loading environment from .env"
  set -a
  source "${PROJECT_ROOT}/.env"
  set +a
  # Override with mock data settings
  export NODE_ENV=development
  export USE_MOCK_DATA=true
  export MOCK_DATA_ENABLED=true
  export MOCK_SERVER_PORT=7656
fi

# Start the development environment with mock data
echo "Starting development environment with mock data..."
cd "${PROJECT_ROOT}" && npm run dev &
DEV_PID=$!

# Wait for the development environment to be ready
echo "Waiting for the development environment to be ready..."
sleep 10

# Run the screenshot tool directly from its directory
echo "Running screenshot tool..."
cd "${PROJECT_ROOT}/tools/screenshot-automation" && npm run build && npm start

# When the screenshot tool exits, also kill the development server
echo "Cleaning up servers..."
kill $DEV_PID 