# Pulse Release Guide

This document outlines the key requirements for creating new releases of Pulse.

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

### CHANGELOG Generation

- Review ALL commits since the last release tag to create a comprehensive changelog
- Use `git log <last-tag>..HEAD --oneline` to see commits since the last release
- Ensure all significant changes, features, and fixes are documented
- Organize changes by type (Added, Changed, Fixed, etc.)

### Git Requirements

- Create and push a version tag (format: vX.Y.Z)
- Create GitHub release with meaningful release notes
- Reference the CHANGELOG

### Docker Requirements

- Build multi-architecture images (amd64, arm64)
- Tag with both specific version and latest
- Verify image version labels match release version
- Push to DockerHub

### Pre-Release Validation

- Tests pass
- Documentation updated
- CHANGELOG.md updated with new features, fixes, and changes
- Application runs correctly in both development and production modes

## Common Issues

### Version Mismatch

When versions don't match across files, the release appears inconsistent to users.
Rebuild Docker images if labels are incorrect.

### Docker Build Problems

For multi-architecture builds, ensure buildx is configured properly and Docker daemon is running.

### Command Pager Issues

For commands that invoke a pager (git log, docker logs, etc.), append `| cat` to avoid interactive pager issues:
```
git log | cat
docker logs container_name | cat
```
