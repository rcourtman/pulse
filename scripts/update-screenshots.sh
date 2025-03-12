#!/bin/bash

# Pulse for Proxmox VE Screenshot Generator
# Automates the process of generating screenshots for documentation
# by starting required servers with mock data and running the screenshot tool.

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Process tracking variables
MOCK_SERVER_PID=""
BACKEND_PID=""
FRONTEND_PID=""

# Cleanup function to ensure all processes are stopped
cleanup() {
  echo "🧹 Cleaning up processes..."
  
  if [ -n "$FRONTEND_PID" ]; then
    echo "Stopping frontend server (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null || true
  fi
  
  if [ -n "$BACKEND_PID" ]; then
    echo "Stopping backend server (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null || true
  fi
  
  if [ -n "$MOCK_SERVER_PID" ]; then
    echo "Stopping mock server (PID: $MOCK_SERVER_PID)..."
    kill $MOCK_SERVER_PID 2>/dev/null || true
  fi
  
  echo "Killing any remaining processes..."
  cd "$PROJECT_ROOT" && npm run dev:kill:all 2>/dev/null || true
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

# Ensure clean environment
echo "🔪 Killing any existing servers..."
cd "$PROJECT_ROOT" && npm run dev:kill:all

# Start required services
echo "🚀 Starting mock data server..."
export NODE_ENV=development
export USE_MOCK_DATA=true
export MOCK_DATA_ENABLED=true

# Load environment variables from .env if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
  echo "Loading environment from .env"
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
  # Override with mock data settings
  export NODE_ENV=development
  export USE_MOCK_DATA=true
  export MOCK_DATA_ENABLED=true
fi

cd "$PROJECT_ROOT" && ts-node src/mock/run-server.ts > /tmp/pulse-mock-server.log 2>&1 &
MOCK_SERVER_PID=$!
echo "Mock server started with PID: $MOCK_SERVER_PID"
sleep 5

# Check if mock server is running
if ! ps -p $MOCK_SERVER_PID > /dev/null; then
  echo "❌ Error: Mock data server failed to start"
  cat /tmp/pulse-mock-server.log
  exit 1
fi

echo "🚀 Starting backend server..."
cd "$PROJECT_ROOT" && USE_MOCK_DATA=true MOCK_DATA_ENABLED=true npm run dev:server > /tmp/pulse-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"
sleep 8

# Check if backend server is running
if ! ps -p $BACKEND_PID > /dev/null; then
  echo "❌ Error: Backend server failed to start"
  cat /tmp/pulse-backend.log
  exit 1
fi

echo "🚀 Starting frontend server..."
cd "$PROJECT_ROOT/frontend" && USE_MOCK_DATA=true MOCK_DATA_ENABLED=true npm run dev -- --host "0.0.0.0" --port 7654 > /tmp/pulse-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"

# Wait for services to be ready
echo "⏳ Waiting for servers to start..."
sleep 15

# Verify services are running correctly
if ! curl -s http://localhost:7654 > /dev/null; then
  echo "❌ Error: Frontend server is not running on port 7654"
  cat /tmp/pulse-frontend.log
  exit 1
fi

# Check if mock data server is responding
if ! curl -s http://localhost:7656/status > /dev/null; then
  echo "❌ Error: Mock data server is not responding on port 7656"
  cat /tmp/pulse-mock-server.log
  exit 1
fi

# Check if backend is using mock data
MOCK_STATUS=$(curl -s http://localhost:7654/api/status)
if ! echo "$MOCK_STATUS" | grep -q "mockDataEnabled\":true"; then
  echo "❌ Error: Server is running but mock data is not enabled"
  echo "Server status: $MOCK_STATUS"
  cat /tmp/pulse-backend.log
  exit 1
fi

echo "✅ All servers are running with mock data enabled"

# Generate screenshots
echo "📸 Running screenshot tool..."
cd "$PROJECT_ROOT/tools/screenshot-automation" && npm run build && npm start -- --config ../../screenshot-config.json
SCREENSHOT_RESULT=$?

# Report results
if [ $SCREENSHOT_RESULT -eq 0 ]; then
  echo "✅ Screenshots updated successfully!"
  echo "Check the docs/images directory for the new screenshots."
else
  echo "❌ Error: Failed to update screenshots"
  exit 1
fi 