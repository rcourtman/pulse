# Changelog

All notable changes to this project will be documented in this file.

## [1.5.3] - 2025-03-10

### Security
- Improved Docker networking security by making bridge networking (default) work properly with WebSockets
- Removed host network mode as the default recommendation for better container isolation
- Updated documentation to prioritize secure networking options

### Fixed
- Enhanced WebSocket connection handling to work correctly in bridge network mode
- Improved hostname resolution for WebSocket connections

## [1.5.2] - 2025-03-10

### Fixed
- WebSocket connection issues in Docker environments by using the browser's hostname instead of hardcoded localhost
- Updated docker-compose.yml to use host network mode by default to fix connection issues
- Added comprehensive troubleshooting guide for WebSocket connection problems

## [1.5.1] - 2025-03-10

### Added
- Improved error handling for WebSocket connections
- Better logging for connection issues

### Fixed
- Various minor UI bugs
- Performance improvements for metric collection

## [1.5.0] - 2024-03-10

### Added
- New animated pulse logo implementation
- Cross-platform development environment with hot-reloading
- Cross-platform cleanup script for development processes

### Fixed
- Fixed Vite port incrementing issues
- Fixed logo asset inclusion in Docker build
- Improved Docker development environment setup

### Changed
- Improved Docker build and release process
- Enhanced Docker Compose setup for users and developers
- Updated development workflow documentation

## [1.4.1] - 2024-03-15

### Fixed
- Fixed static file serving in production Docker container

## [1.4.0] - 2024-03-15

### Added
- Improved favicon support with multiple sizes and formats
- Detailed Docker buildx setup and troubleshooting documentation
- Comprehensive release process documentation
- Improved changelog generation process

### Changed
- Updated dependencies to latest major versions (@types/express@5, node-fetch@3, @types/react-dom@19)
- Simplified release process and removed automated script references
- Consolidated release documentation into single comprehensive guide
- Improved TypeScript type definitions in API routes

### Fixed
- TypeScript build errors in API route handlers
- Updated package-lock.json versions

## [1.3.1] - 2025-03-10

### Security
- Update axios to version 1.8.2 to address SSRF and Credential Leakage vulnerability (GHSA-jr5f-v2jv-69x6)

## [1.3.0] - 2024-03-09

### Added
- Dashboard screenshot to README
- Ko-fi support button and Support section
- Code of Conduct based on Contributor Covenant
- GitHub templates and developer documentation
- Development architecture explanation to README
- start-dev.sh script to repository

### Changed
- Combine system type and visibility filters, improve UI design
- Refactor NetworkDisplay component into smaller, more manageable files with custom hooks and components
- Optimize column widths for space conservation in network table
- Refactor proxmox-client.ts into smaller modules for better maintainability
- Enhance network table UI with improved filtering and search functionality
- Improve space efficiency for important metric columns
- Standardize styling across all dropdown menus and popovers
- Move status column to leftmost position for better organization
- Center status icons for better visual alignment
- Replace status text with icon-only display to save space
- Update README with new screenshots and improved documentation
- Enhance export functionality with additional fields (Type, ID, Uptime) in NetworkDisplay
- Clarify node vs guest counts in dropdown by adding descriptive labels

### Fixed
- Fix search filtering for type terms and optimize type column width
- Update vite.config.js to use IPv4 (127.0.0.1) instead of IPv6 (::1) for WebSocket connections
- Fix transparent table headers in CT/VM list by adding solid background and border
- Fix column visibility issues in network table
- Improve dropdown behavior and styling
- Ensure 'No Matching Systems' message spans full table width

## [1.2.1] - 2024-03-04

Initial versioned release. 