#!/bin/bash

# Update Screenshots Script for Pulse for Proxmox VE
# This script automates the process of taking screenshots for documentation

# Set default values
DEV_SERVER_URL="http://localhost:7654"
BACKEND_URL="http://localhost:7654"
CONFIG_FILE="screenshot-config.json"
MAX_RETRIES=3
RETRY_DELAY=2

# Display help message
show_help() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -h, --help                 Show this help message"
  echo "  -u, --url <url>            Development server URL (default: $DEV_SERVER_URL)"
  echo "  -c, --config <file>        Config file path (default: $CONFIG_FILE)"
  echo "  -r, --retries <number>     Maximum number of retries (default: $MAX_RETRIES)"
  echo "  -d, --delay <seconds>      Delay between retries in seconds (default: $RETRY_DELAY)"
  echo ""
  echo "Example:"
  echo "  $0 --url http://localhost:9000 --config custom-config.json"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_help
      exit 0
      ;;
    -u|--url)
      DEV_SERVER_URL="$2"
      shift 2
      ;;
    -c|--config)
      CONFIG_FILE="$2"
      shift 2
      ;;
    -r|--retries)
      MAX_RETRIES="$2"
      shift 2
      ;;
    -d|--delay)
      RETRY_DELAY="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Change to the script directory
cd "$(dirname "$0")"

# Make script executable if it isn't already
chmod +x "$0"

# Function to check if mock data is enabled on the server
check_mock_data() {
  # Check if the server is running and if mock data is enabled
  if curl -s "${BACKEND_URL}/api/status" | grep -q "mockDataEnabled\":true"; then
    echo "✅ Server is running with mock data enabled"
    return 0
  else
    echo "❌ Server is not running with mock data enabled"
    return 1
  fi
}

# Check if the development server is running
check_server() {
  local url="$1"
  local retries="$2"
  local delay="$3"
  
  echo "Checking if development server is running at $url..."
  
  for ((i=1; i<=retries; i++)); do
    if curl -s "$url" > /dev/null; then
      echo "✅ Development server is running"
      return 0
    else
      echo "⚠️ Development server not responding (attempt $i of $retries)"
      if [ "$i" -lt "$retries" ]; then
        echo "Waiting $delay seconds before retrying..."
        sleep "$delay"
      fi
    fi
  done
  
  echo "❌ Error: Development server is not running at $url"
  echo "Please start the development server with mock data enabled using: npm run dev:mock"
  return 1
}

# Check if the server is running
if ! check_server "$DEV_SERVER_URL" "$MAX_RETRIES" "$RETRY_DELAY"; then
  exit 1
fi

# Check if mock data is enabled
if ! check_mock_data; then
  echo "❌ Error: Server is running but mock data is not enabled"
  echo "Screenshots must be taken with mock data enabled."
  echo "Please restart the server with mock data enabled using: npm run dev:mock"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  
  if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install dependencies"
    exit 1
  fi
fi

# Build the tool
echo "🔨 Building screenshot tool..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to build the screenshot tool"
  exit 1
fi

# Run the screenshot tool
echo "📸 Taking screenshots..."
npm start -- --url "$DEV_SERVER_URL" --config "$CONFIG_FILE"

# Check if screenshots were created successfully
if [ $? -eq 0 ]; then
  echo "✅ Screenshots updated successfully!"
  echo "Check the docs/images directory for the new screenshots."
else
  echo "❌ Error: Failed to update screenshots"
  exit 1
fi 