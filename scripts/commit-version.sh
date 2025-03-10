#!/bin/bash

# Automated version commit script for Pulse
# Usage: ./scripts/commit-version.sh X.Y.Z

if [ $# -ne 1 ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 1.5.3"
  exit 1
fi

VERSION=$1

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  # Add all version-related files
  git add frontend/src/utils/version.js package.json frontend/package.json Dockerfile
  
  # Commit the changes
  git commit -m "chore: bump version to $VERSION"
  
  # Push to main
  git push origin main
  
  # Verify all changes were committed and pushed
  if [ -z "$(git status --porcelain)" ]; then
    echo "✅ All version changes committed and pushed successfully"
  else
    echo "⚠️ Warning: There are still uncommitted changes:"
    git status
  fi
else
  echo "No changes to commit. Make sure you've run the update-version.sh script first."
fi 