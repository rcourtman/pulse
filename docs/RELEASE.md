# Pulse Release Guide

This document outlines the key requirements for creating releases of Pulse that work efficiently with the installation scripts.

## Release Criteria

Create releases for:
- New features
- Bug fixes
- Security updates
- Breaking changes
- Significant dependency updates affecting runtime behavior

## Release Requirements

### Version Consistency

Ensure version numbers match in ALL these files:
- `frontend/src/utils/version.js`
- `package.json`
- `frontend/package.json`
- `docker/Dockerfile` (LABEL version)

### Distribution Package Creation

For each release:
1. Build the application (both backend and frontend):
   ```bash
   # Build backend
   npm run build
   
   # Build frontend
   cd frontend && npm run build && cd ..
   ```

2. Create a distribution package (tar.gz) with the correct directory structure:
   ```bash
   VERSION=$(node -e "console.log(require('./package.json').version)")
   
   # Create temporary structure with files in the right locations
   mkdir -p tmp/pulse/frontend
   
   # Copy compiled backend, dependencies, and config files
   cp -R dist node_modules package.json package-lock.json .env.example LICENSE README.md CHANGELOG.md scripts tmp/pulse/
   cp scripts/start-prod.sh scripts/start-prod.bat tmp/pulse/
   
   # Copy frontend files to frontend/dist (CRITICAL: server expects files here)
   cp -R frontend/dist tmp/pulse/frontend/
   
   # Include version info
   echo "${VERSION}" > tmp/pulse/version.txt
   
   # Create package without macOS metadata files
   COPYFILE_DISABLE=1 tar --exclude="._*" --exclude=".git" --exclude=".DS_Store" -czf pulse-${VERSION}.tar.gz -C tmp pulse
   
   # Clean up
   rm -rf tmp
   ```

3. The package should exclude:
   - Source TypeScript files
   - Source maps
   - Tests and test fixtures
   - Build artifacts not needed for production
   - Development dependencies
   - Git files
   - Operating system metadata files (._*)

> **IMPORTANT:** The directory structure is critical. The compiled server code expects frontend files to be in `frontend/dist/`. Placing them elsewhere (like `dist/public/`) will cause a "Frontend not found" error when the application starts.

### Docker Multi-Architecture Build

For each release:
1. Ensure Docker and Docker Buildx are properly configured:
   ```bash
   docker buildx ls  # Verify buildx is available
   ```

2. Login to DockerHub:
   ```bash
   docker login
   ```

3. Build and push multi-architecture images:
   ```bash
   VERSION=$(node -e "console.log(require('./package.json').version)")
   docker buildx build --platform linux/amd64,linux/arm64 \
     -t rcourtman/pulse:${VERSION} \
     -t rcourtman/pulse:latest \
     --push -f docker/Dockerfile .
   ```

4. Verify the multi-architecture image:
   ```bash
   docker buildx imagetools inspect rcourtman/pulse:${VERSION}
   ```

5. Ensure both amd64 and arm64 architectures are included in the published image.

### CHANGELOG Generation

- Review ALL commits since the last release tag to create a comprehensive changelog
- Use `git log <last-tag>..HEAD --oneline` to see commits since the last release
- Ensure all significant changes, features, and fixes are documented
- Organize changes by type (Added, Changed, Fixed, etc.)

### Git and Release Steps

1. Update version numbers in all relevant files
2. Build backend and frontend
3. Create distribution package:
   ```bash
   # Create distribution package
   VERSION=$(node -e "console.log(require('./package.json').version)")
   tar -czf pulse-${VERSION}.tar.gz -C dist pulse
   ```
4. Create GitHub release with:
   - Version tag (vX.Y.Z)
   - Release notes
   - Distribution package attached
   - CHANGELOG information

### Pre-Release Testing

Ensure:
- Distribution package installs and runs correctly
- Services start properly
- Configuration can be modified
- Application is accessible on expected port
- Mock data server works correctly
- Update process functions
- Docker image runs correctly on both amd64 and arm64 architectures

## Distribution Package Structure

The expected structure:
```
pulse/
├── dist/              # Compiled server JavaScript
├── frontend/
│   └── dist/          # Built frontend assets
├── node_modules/      # Production dependencies only
├── .env.example       # Configuration template
├── package.json       # For dependency references
├── LICENSE
├── README.md
└── version.txt        # Plain text version for updates
```

## Common Issues

### Production vs Development

Ensure all code properly references the production paths. Common issues:
- Frontend asset paths
- API endpoint references
- Static file handling

### Mock Data Server

- Verify mock data server works in production mode
- Ensure it can be started correctly from systemd
- Test with mock data enabled and disabled

### Update Process Compatibility 

Ensure new releases remain compatible with the update script in existing installations.

### Docker Build Problems

For multi-architecture builds, ensure buildx is configured properly and Docker daemon is running.
For ARM builds on x86 machines, ensure qemu emulation is available with: `docker run --rm --privileged multiarch/qemu-user-static --reset -p yes`

### Command Pager Issues

For commands that invoke a pager (git log, docker logs, etc.), append `| cat` to avoid interactive pager issues:
```
git log | cat
docker logs container_name | cat
``` 