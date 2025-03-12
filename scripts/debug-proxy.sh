#!/bin/bash

# Pulse Debug Proxy
# This script handles everything needed for testing with simulated data
# and includes a debug proxy to log all socket.io messages

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Port configuration
MOCK_PORT=7656
PROXY_PORT=7657
FRONTEND_PORT=7654

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║  Pulse Debug Proxy                                         ║"
echo "║                                                            ║"
echo "║  This script will:                                         ║"
echo "║  1. Kill any existing Node.js processes                    ║"
echo "║  2. Start the mock data server                             ║"
echo "║  3. Start the debug proxy                                  ║"
echo "║  4. Start the frontend with connection to the proxy        ║"
echo "║  5. Log all socket.io messages for debugging               ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required commands
if ! command_exists node; then
  echo -e "${RED}Error: Node.js is not installed. Please install Node.js to continue.${NC}"
  exit 1
fi

# Kill any existing Node.js processes
echo -e "${YELLOW}Killing any existing Node.js processes...${NC}"
pkill -f "node scripts/generate-mock-data.js" 2>/dev/null
pkill -f "node scripts/debug-socket.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# Check if ports are in use
port_check() {
  lsof -i:$1 >/dev/null 2>&1
  return $?
}

if port_check $MOCK_PORT; then
  echo -e "${RED}Error: Port $MOCK_PORT is already in use. Please free this port and try again.${NC}"
  echo -e "${YELLOW}You can try: lsof -i:$MOCK_PORT to see what's using it.${NC}"
  exit 1
fi

if port_check $PROXY_PORT; then
  echo -e "${RED}Error: Port $PROXY_PORT is already in use. Please free this port and try again.${NC}"
  echo -e "${YELLOW}You can try: lsof -i:$PROXY_PORT to see what's using it.${NC}"
  exit 1
fi

if port_check $FRONTEND_PORT; then
  echo -e "${RED}Error: Port $FRONTEND_PORT is already in use. Please free this port and try again.${NC}"
  echo -e "${YELLOW}You can try: lsof -i:$FRONTEND_PORT to see what's using it.${NC}"
  exit 1
fi

# Start the mock data server
echo -e "${GREEN}Starting mock data server on port $MOCK_PORT...${NC}"
node scripts/generate-mock-data.js > /tmp/pulse-mock-server.log 2>&1 &
MOCK_PID=$!

# Wait for the mock server to start
echo -e "${YELLOW}Waiting for mock server to start...${NC}"
sleep 2

# Check if mock server is running
if ! ps -p $MOCK_PID > /dev/null; then
  echo -e "${RED}Error: Mock server failed to start. Check /tmp/pulse-mock-server.log for details.${NC}"
  exit 1
fi

# Start the debug proxy
echo -e "${GREEN}Starting debug proxy on port $PROXY_PORT...${NC}"
node scripts/debug-socket.js > /tmp/pulse-debug-proxy.log 2>&1 &
PROXY_PID=$!

# Wait for the proxy to start
echo -e "${YELLOW}Waiting for debug proxy to start...${NC}"
sleep 2

# Check if proxy is running
if ! ps -p $PROXY_PID > /dev/null; then
  echo -e "${RED}Error: Debug proxy failed to start. Check /tmp/pulse-debug-proxy.log for details.${NC}"
  kill $MOCK_PID
  exit 1
fi

# Start the frontend
echo -e "${GREEN}Starting frontend on port $FRONTEND_PORT...${NC}"
cd frontend && VITE_API_URL=http://localhost:$PROXY_PORT npm run dev > /tmp/pulse-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for the frontend to start
echo -e "${YELLOW}Waiting for frontend to start...${NC}"
sleep 5

# Check if frontend is running
if ! ps -p $FRONTEND_PID > /dev/null; then
  echo -e "${RED}Error: Frontend failed to start. Check /tmp/pulse-frontend.log for details.${NC}"
  kill $MOCK_PID
  kill $PROXY_PID
  exit 1
fi

# Open the browser
echo -e "${GREEN}Opening browser to http://localhost:$FRONTEND_PORT${NC}"
if command_exists open; then
  # macOS
  open "http://localhost:$FRONTEND_PORT"
elif command_exists xdg-open; then
  # Linux
  xdg-open "http://localhost:$FRONTEND_PORT"
elif command_exists explorer; then
  # Windows
  explorer "http://localhost:$FRONTEND_PORT"
else
  echo -e "${YELLOW}Could not automatically open browser. Please open http://localhost:$FRONTEND_PORT manually.${NC}"
fi

echo -e "${GREEN}Everything is running in debug mode!${NC}"
echo -e "${YELLOW}All socket.io messages are being logged to ./socket-debug.log${NC}"
echo -e "${YELLOW}Press Ctrl+C when you're done to stop all processes.${NC}"

# Function to clean up on exit
cleanup() {
  echo -e "\n${GREEN}Cleaning up...${NC}"
  kill $MOCK_PID 2>/dev/null
  kill $PROXY_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  echo -e "${GREEN}Done! Debug logs are available in ./socket-debug.log${NC}"
  exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup SIGINT

# Wait for user to press Ctrl+C
wait 