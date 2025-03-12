# Pulse Release Guide

This document outlines the process and checklist for creating new releases of the Pulse application.

## Release Types

Releases should be created when there are:
- New features
- Bug fixes
- Security updates
- Breaking changes
- Significant dependency updates that affect runtime behavior

For development-only changes (like dev dependency updates), wait for the next feature/bugfix release.

## Automated Release Process

We have an automated release script that handles most of the release process. The script:

1. Updates version numbers in all relevant files
2. Commits and pushes the changes
3. Creates and pushes a Git tag
4. Builds and pushes Docker images
5. Creates a GitHub release

### Prerequisites

Before running the release script, ensure you have:

- Git configured with appropriate credentials
- Docker installed and logged in to Docker Hub
- GitHub CLI (`gh`) installed and authenticated
- All changes you want to include in the release are committed

### Running the Release Script

To create a new release:

```bash
./scripts/release.sh <version>
```

For example:

```bash
./scripts/release.sh 1.0.13
```

The script will:

1. Check that you're on the main branch and have a clean working directory
2. Update version numbers in:
   - `frontend/src/utils/version.js`
   - `package.json`
   - `frontend/package.json`
   - `Dockerfile` labels
3. Commit and push these changes
4. Create and push a Git tag (e.g., `v1.0.13`)
5. Build Docker images for both the specific version and `latest`
6. Push the Docker images to Docker Hub
7. Create a GitHub release

### After Running the Script

After the script completes:

1. GitHub Actions workflows will be triggered automatically
2. The "Update Version" workflow will run first
3. Once that completes, the "Publish Docker image" workflow will run

You can check the status of these workflows with:

```bash
gh run list --limit 5
```

## Manual Release Process (if needed)

If you need to perform a release manually, follow these steps:

1. Update version numbers in:
   - `frontend/src/utils/version.js`
   - `package.json`
   - `frontend/package.json`
   - `Dockerfile` labels

2. Commit and push these changes:
   ```bash
   git add frontend/src/utils/version.js package.json frontend/package.json Dockerfile
   git commit -m "Bump version to X.Y.Z"
   git push origin main
   ```

3. Create and push a Git tag:
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
   ```

4. Build Docker images:
   ```bash
   docker build -t rcourtman/pulse:X.Y.Z -t rcourtman/pulse:latest .
   ```

5. Push Docker images:
   ```bash
   docker push rcourtman/pulse:X.Y.Z
   docker push rcourtman/pulse:latest
   ```

6. Create a GitHub release:
   ```bash
   gh release create vX.Y.Z --title "Release vX.Y.Z" --notes "Release notes here"
   ```

## Release Checklist

Before finalizing a release, ensure:

- [ ] All tests pass
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated with new features, fixes, and breaking changes
- [ ] Version numbers are consistent across all files
- [ ] Docker images build successfully
- [ ] The application runs correctly in both development and production modes

## Troubleshooting

### GitHub Actions Workflows Not Running

If the GitHub Actions workflows don't run automatically:

1. Check the workflow files in `.github/workflows/`
2. Ensure they're configured to trigger on the appropriate events
3. Check the GitHub Actions tab in the repository for any errors

### Docker Build or Push Issues

If you encounter issues with Docker:

1. Ensure you're logged in to Docker Hub: `docker login`
2. Check that you have permissions to push to the repository
3. Verify that the Docker daemon is running

### Version Mismatch

If you notice version mismatches:

1. Check all files that contain version information
2. Ensure they're all updated to the same version
3. If necessary, make manual corrections and create a new patch release
