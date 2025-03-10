# Pulse Release Guide

This document outlines the process and checklist for creating new releases of the ProxMox Pulse application.

## Release Types

Releases should be created when there are:
- New features
- Bug fixes
- Security updates
- Breaking changes
- Significant dependency updates that affect runtime behavior

For development-only changes (like dev dependency updates), wait for the next feature/bugfix release.

## Prerequisites

Before creating a release, ensure you have:
- Git configured with appropriate credentials
- Docker installed and logged in to Docker Hub
- Docker buildx configured for multi-architecture builds:
  ```bash
  # Check if buildx is available
  docker buildx version
  
  # List existing builders
  docker buildx ls
  
  # Create a new builder if needed
  docker buildx create --name multiarch-builder --driver docker-container --bootstrap
  
  # Use the builder
  docker buildx use multiarch-builder
  
  # Verify platforms
  docker buildx inspect --bootstrap
  ```
- GitHub CLI (`gh`) installed and authenticated
- All changes committed to main branch
- All items in the checklist below completed

## Release Checklist

1. **Preparation**
   - [ ] Ensure all desired changes are committed and pushed to main
   - [ ] Run tests to verify everything is working correctly
   - [ ] Decide on new version number (MAJOR.MINOR.PATCH)

2. **Documentation**
   - [ ] Find the last release version:
     ```bash
     # List all release tags
     git tag -l 'v*' --sort=-v:refname | head -n1
     
     # Or find it in CHANGELOG.md
     head -n5 CHANGELOG.md
     ```
   - [ ] Review commits since last release:
     ```bash
     # Using the last release tag (e.g., v1.3.1)
     git log v1.3.1..HEAD --pretty=format:"%h %s"
     
     # Or using commit dates if needed
     git log --since="$(git log -1 --format=%ai v1.3.1)" --pretty=format:"%h %s"
     ```
   - [ ] Update CHANGELOG.md with new version section and date
   - [ ] Categorize changes based on commit types:
     - feat: → Added (new features)
     - fix: → Fixed (bug fixes)
     - security: → Security (security fixes)
     - chore:/refactor:/perf: → Changed (changes in existing functionality)
     - deprecate: → Deprecated (soon-to-be removed features)
     - remove: → Removed (now removed features)
     - docs: → Documentation (if significant)
   - [ ] Ensure all significant changes are documented in the changelog
   - [ ] Review and clean up the changelog entries:
     - Use clear, user-focused language
     - Group related changes together
     - Remove internal/trivial changes
     - Highlight breaking changes or required actions

3. **Testing**
   - [ ] Verify dependencies are properly installed and up-to-date:
     ```bash
     # Root directory
     npm ci
     
     # Frontend directory
     cd frontend && npm ci && cd ..
     ```
   - [ ] Build and test backend: `npm run build`
   - [ ] Build and test frontend: `cd frontend && npm run build && cd ..`
   - [ ] Test application using local development setup:
     ```bash
     # Start the application using the development script
     npm run dev
     
     # This script will:
     # 1. Stop any running Pulse Docker containers
     # 2. Kill any existing servers on ports 7654 and 3000
     # 3. Start the backend in development mode
     # 4. Start the frontend Vite dev server
     
     # Verify in browser:
     # 1. UI loads correctly at http://localhost:3000
     # 2. Version number is correct
     # 3. Can connect to Proxmox
     # 4. Metrics are updating
     # 5. All charts and graphs render
     # 6. Hot reloading works for frontend changes
     ```
   - [ ] Test Docker build (for release verification):
     ```bash
     # Clean all existing containers and images
     docker compose -f docker-compose.dev.yml down
     docker rmi $(docker images -q rcourtman/pulse)
     
     # Build fresh and test locally using dev compose file
     docker compose -f docker-compose.dev.yml up -d --build
     
     # Verify in browser:
     # 1. UI loads correctly at http://localhost:7654
     # 2. Version number is correct
     # 3. Can connect to Proxmox
     # 4. Metrics are updating
     # 5. All charts and graphs render
     
     # Check logs for any errors
     docker logs pulse-app
     ```
   - [ ] Test clean Docker installation:
     ```bash
     # Create a fresh test directory
     mkdir -p /tmp/pulse-test && cd /tmp/pulse-test
     
     # Create minimal docker-compose.yml
     cat > docker-compose.yml << 'EOF'
     services:
       pulse-app:
         image: rcourtman/pulse:X.Y.Z
         ports:
           - "7654:7654"
         env_file:
           - .env
         environment:
           - NODE_ENV=production
         restart: unless-stopped
     EOF
     
     # Copy your test .env file
     cp /path/to/your/test/.env .
     
     # Test deployment
     docker compose up -d
     
     # Verify as above and check logs
     docker logs pulse-app
     ```
   - [ ] Test multi-architecture support:
     ```bash
     # Verify both architectures
     docker buildx imagetools inspect rcourtman/pulse:X.Y.Z
     
     # Test pulling on different architectures if available
     ```

## Development Workflow

For active development, use `npm run dev` instead of Docker. This script provides:
- Hot reloading for frontend changes
- Automatic backend restart on changes
- Direct access to logs and debugging
- Faster iteration cycles than Docker rebuilds

```bash
# Start development servers
npm run dev

# Access the application:
# - Frontend: http://localhost:3000 (with hot reloading)
# - Backend: http://localhost:7654
```

Additional development commands available:
```bash
# Kill specific processes if needed
npm run dev:kill:backend  # Kill backend server
npm run dev:kill:frontend # Kill frontend server
npm run dev:kill:all     # Kill all development servers

# Start frontend separately if needed
npm run dev:frontend

# Use mock data for development
npm run dev:mock
```

Only use Docker testing when:
- Verifying the release build
- Testing multi-architecture support
- Checking production deployment configurations
- Validating the Docker image before release

## Release Process

1. **Update version numbers in ALL files** (⚠️ CRITICAL - VERIFY ALL FILES):
   - [ ] `frontend/src/utils/version.js`
   - [ ] `package.json`
   - [ ] `frontend/package.json`
   - [ ] `Dockerfile` labels (update version in LABEL version="X.Y.Z")
   
   ⚠️ **IMPORTANT**: Verify each file has been updated with the new version number. Missing any file will cause version inconsistencies.

   **NEW: Use the version update script to automate this process:**
   ```bash
   # Create scripts/update-version.sh if it doesn't exist
   cat > scripts/update-version.sh << 'EOF'
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
   EOF
   
   # Make the script executable
   chmod +x scripts/update-version.sh
   ```
   
   Then run:
   ```bash
   ./scripts/update-version.sh X.Y.Z
   ```

2. Rebuild the frontend with the new version:
   ```bash
   # Clean the frontend build directory
   rm -rf frontend/dist
   
   # Rebuild the frontend
   cd frontend && npm run build && cd ..
   
   # Verify the new version appears in the built files
   grep -r "VERSION = " frontend/dist/assets/*.js
   ```

3. Test the build locally:
   ```bash
   # Build and run locally to verify version using dev compose file
   docker compose -f docker-compose.dev.yml up -d --build
   
   # Check the version in UI at http://localhost:7654
   # IMPORTANT: Verify the version number matches the new release version
   ```

4. **Commit ALL version updates** (⚠️ CRITICAL - VERIFY ALL FILES):
   ```bash
   # Check for any uncommitted changes
   git status
   
   # Add all version-related files and the built frontend
   git add frontend/src/utils/version.js package.json frontend/package.json Dockerfile frontend/dist
   
   # Commit the changes
   git commit -m "chore: bump version to X.Y.Z"
   
   # Push to main
   git push origin main
   
   # Verify all changes were committed and pushed
   git status
   ```
   
   ⚠️ **IMPORTANT**: After pushing, run `git status` to verify there are no remaining uncommitted changes related to version updates.

   **NEW: Use the version commit script to automate this process:**
   ```bash
   # Create scripts/commit-version.sh if it doesn't exist
   cat > scripts/commit-version.sh << 'EOF'
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
   EOF
   
   # Make the script executable
   chmod +x scripts/commit-version.sh
   ```
   
   Then run:
   ```bash
   ./scripts/commit-version.sh X.Y.Z
   ```

5. Create and push tag:
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
   ```

6. **Build and push multi-architecture Docker images** (⚠️ CRITICAL - MUST BUILD FOR MULTIPLE ARCHITECTURES):
   ```bash
   # Verify buildx setup
   docker buildx ls
   
   # Ensure using correct builder
   docker buildx use multiarch-builder
   
   # Build and push multi-architecture images
   # IMPORTANT: The --platform flag MUST specify both architectures
   docker buildx build \
     --platform linux/amd64,linux/arm64 \
     --tag rcourtman/pulse:X.X.X \
     --tag rcourtman/pulse:latest \
     --push \
     .
   
   # Verify BOTH architectures are available in the pushed image
   docker buildx imagetools inspect rcourtman/pulse:X.X.X
   ```
   
   ⚠️ **IMPORTANT**: Always verify that both `linux/amd64` and `linux/arm64` platforms appear in the image inspection output. If either is missing, the multi-architecture build was not successful.

7. Create GitHub release:
   ```bash
   # Extract the latest version's changes from CHANGELOG.md
   awk '/^## \[.*\]/{p=NR==1}p' CHANGELOG.md > release-notes.tmp
   
   # Create the release using the extracted notes
   gh release create vX.Y.Z --title "Release vX.Y.Z" --notes-file release-notes.tmp
   
   # Clean up
   rm release-notes.tmp
   ```

8. **Release Verification Checklist**
   - [ ] GitHub Actions:
     - All workflows completed successfully
     - No warnings or errors in logs
   
   - [ ] Docker Image Testing:
     - [ ] Fresh pull test:
       ```bash
       docker pull rcourtman/pulse:X.Y.Z
       ```
     - [ ] Clean installation test:
       - Create new directory with only docker-compose.yml and .env
       - Deploy using pulled image
       - Verify functionality
     - [ ] Version verification:
       - Check version in UI matches release
       - Check version in Docker labels
       - Check version in application logs
     - [ ] **Multi-architecture verification** (⚠️ CRITICAL):
       - [ ] Confirm both amd64 and arm64 images are available:
         ```bash
         docker buildx imagetools inspect rcourtman/pulse:X.Y.Z
         ```
       - [ ] Verify the output shows both `linux/amd64` and `linux/arm64` platforms
       - [ ] Test on different architectures if possible
   
   - [ ] Application Functionality:
     - [ ] UI loads correctly
     - [ ] Static assets are served properly
     - [ ] Can connect to Proxmox
     - [ ] Metrics collection works
     - [ ] Charts and graphs render
     - [ ] WebSocket connection stable
     - [ ] No console errors
   
   - [ ] Documentation:
     - [ ] README is up to date
     - [ ] CHANGELOG reflects all changes
     - [ ] Docker Hub description is current
     - [ ] GitHub release notes are clear

   - [ ] Regression Testing:
     - [ ] Previously reported issues remain fixed
     - [ ] No new issues introduced
     - [ ] Core features working as expected

If any of these checks fail:
1. Do not proceed with the release
2. Document the failure
3. Fix the issue
4. Restart testing from the beginning

## Troubleshooting

### GitHub Actions Issues
- Check workflow files in `.github/workflows/`
- Ensure proper event triggers
- Check GitHub Actions tab for errors

### Docker Issues
- Verify Docker daemon is running
- Check Docker Hub authentication: `docker login`
- Verify push permissions
- Check multi-arch builder setup:
  ```bash
  # If buildx builder is missing or not working
  docker buildx create --name multiarch-builder --driver docker-container --bootstrap
  docker buildx use multiarch-builder
  docker buildx inspect --bootstrap
  ```
- If build fails, try rebuilding the builder:
  ```bash
  docker buildx rm multiarch-builder
  docker buildx create --name multiarch-builder --driver docker-container --bootstrap
  ```
- For faster builds:
  - The multi-stage Dockerfile optimizes builds by:
    - Caching frontend and backend builds separately
    - Only rebuilding stages that have changed
    - Minimizing the final image size
  - Frontend-only changes (like version updates) will only rebuild the frontend stage
  - Backend-only changes will only rebuild the backend stage
  - To force a clean build: `docker buildx build --no-cache ...`
  - To clean up old build cache: `docker builder prune`
  - To see what's using build cache: `docker buildx du`
  - For version updates, ensure you:
    1. Update version in all files
    2. Rebuild frontend locally and verify version
    3. Commit changes including built frontend
    4. Build and push Docker image

### Version Mismatches
- Verify all version files are updated:
  - `frontend/src/utils/version.js`
  - `package.json`
  - `frontend/package.json`
  - `Dockerfile` labels
- Always rebuild frontend after version changes
- Verify version in built frontend before creating Docker image
- Test version in UI after Docker build
- Create patch release if needed

### Multi-Architecture Build Issues
- If multi-architecture build fails:
  - Verify buildx is properly configured
  - Check that the builder supports both architectures
  - Ensure you're using the `--platform linux/amd64,linux/arm64` flag
  - Verify Docker Hub credentials are valid
  - Try recreating the builder if issues persist
- If only one architecture is built:
  - The `--platform` flag may be missing or incomplete
  - The builder may not support all architectures
  - Check for build errors specific to one architecture

## Post-Release

1. Verify the release is working in production
2. Clean up any temporary files/branches
3. Announce release to users if needed
4. Update documentation if required
5. Start planning next release 

## Release Checklist Quick Reference

### Critical Steps (Don't Miss These!)
1. ✅ Update ALL version files (frontend/src/utils/version.js, package.json, frontend/package.json, Dockerfile)
2. ✅ Commit and push ALL version-related changes (verify with git status)
3. ✅ Build for BOTH architectures (linux/amd64,linux/arm64)
4. ✅ Verify multi-architecture support after pushing
5. ✅ Test the release thoroughly before announcing 