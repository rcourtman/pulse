#!/bin/bash
set -e
# Build the tool
echo "🔨 Building screenshot tool..."
npm run build
# Run the screenshot tool
echo "📸 Taking screenshots..."
npm start -- --url "http://localhost:7654" --config "screenshot-config.json"

# Make script executable if it isn't already
chmod +x "$0"
