#!/bin/bash

# Make script executable if it isn't already
chmod +x "$0"

# Kill any existing servers
echo "Killing any existing servers..."
pkill -f "node dist/server.js" || true
pkill -f "ts-node src/mock/run-server.ts" || true
npx kill-port 7654 7655

# Set environment to production and load the production environment file
export NODE_ENV=production

# Check if .env.production exists and use it
if [ -f .env.production ]; then
  echo "Loading production environment from .env.production"
  # Use a more careful approach to export environment variables
  while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and empty lines
    if [[ ! "$line" =~ ^# && -n "$line" ]]; then
      # Export the variable
      export "$line"
    fi
  done < .env.production
else
  echo "Warning: .env.production not found, using default .env file"
fi

# Force mock data to be disabled for production
export USE_MOCK_DATA=false
export MOCK_DATA_ENABLED=false

# Build the backend
echo "Building backend..."
npm run build

# Build the frontend
echo "Building frontend..."
cd frontend && npm run build && cd ..

# Start the production server
echo "Starting production server..."
node dist/server.js

# When the server exits, also kill the mock server if it's running
if [ -n "$MOCK_SERVER_PID" ]; then
  kill $MOCK_SERVER_PID
fi 