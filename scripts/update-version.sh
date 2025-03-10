#!/bin/bash

# Automated version update script for Pulse
# Usage: ./scripts/update-version.sh X.Y.Z

if [ $# -ne 1 ]; then
  echo "Usage: $0 <new-version>"
  echo "Example: $0 1.5.3"
  exit 1
fi

NEW_VERSION=$1

# Update package.json
sed -i.bak "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$NEW_VERSION\"/" package.json

# Update frontend/package.json
sed -i.bak "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$NEW_VERSION\"/" frontend/package.json

# Update frontend/src/utils/version.js
sed -i.bak "s/VERSION = '[0-9]*\.[0-9]*\.[0-9]*'/VERSION = '$NEW_VERSION'/" frontend/src/utils/version.js

# Update Dockerfile
sed -i.bak "s/version=\"[0-9]*\.[0-9]*\.[0-9]*\"/version=\"$NEW_VERSION\"/" Dockerfile

# Clean up backup files
find . -name "*.bak" -type f -delete

# Verify all files were updated
echo "Verifying version updates..."
PACKAGE_VERSION=$(grep -E '"version"' package.json | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d ' ')
FRONTEND_PACKAGE_VERSION=$(grep -E '"version"' frontend/package.json | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d ' ')
FRONTEND_VERSION=$(grep -E "VERSION = " frontend/src/utils/version.js | awk -F"'" '{ print $2 }')
DOCKERFILE_VERSION=$(grep -E "version=" Dockerfile | awk -F'"' '{ print $2 }')

echo "package.json: $PACKAGE_VERSION"
echo "frontend/package.json: $FRONTEND_PACKAGE_VERSION"
echo "frontend/src/utils/version.js: $FRONTEND_VERSION"
echo "Dockerfile: $DOCKERFILE_VERSION"

# Check if all versions match
if [ "$PACKAGE_VERSION" != "$NEW_VERSION" ] || [ "$FRONTEND_PACKAGE_VERSION" != "$NEW_VERSION" ] || [ "$FRONTEND_VERSION" != "$NEW_VERSION" ] || [ "$DOCKERFILE_VERSION" != "$NEW_VERSION" ]; then
  echo "ERROR: Version mismatch detected!"
  exit 1
else
  echo "✅ All version files successfully updated to $NEW_VERSION"
  echo "Run 'git status' to see changes"
fi 