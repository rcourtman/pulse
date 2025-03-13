#!/bin/bash

# Make script executable if it isn't already
chmod +x "$0"

echo "Updating screenshots..."

# Install puppeteer if not already installed
if ! npm list puppeteer >/dev/null 2>&1; then
  echo "Installing puppeteer..."
  npm install puppeteer
fi

# Create screenshots directory if it doesn't exist
mkdir -p docs/screenshots

# Start the application in development mode with mock data
echo "Starting application with mock data..."
npm run dev:docker &

# Wait for the application to start
echo "Waiting for application to start..."
sleep 10

# Take screenshots
echo "Taking screenshots..."
node scripts/take-screenshots.js

# Stop the application
echo "Stopping application..."
npm run stop

echo "Screenshot update complete!" 