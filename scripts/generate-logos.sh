#!/bin/bash

# Make script executable if it isn't already
chmod +x "$0"

echo "Generating logos..."

# Install canvas if not already installed
if ! npm list canvas >/dev/null 2>&1; then
  echo "Installing canvas..."
  npm install canvas
fi

# Generate logo PNGs
echo "Generating logo PNGs..."
node scripts/generate-logo-pngs.js

# Generate logo with text
echo "Generating logo with text..."
node scripts/generate-logo-with-text.js

echo "Logo generation complete!" 