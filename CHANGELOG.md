# Changelog

## [Unreleased]

## [1.6.1] - 2024-03-12

### Fixed
- Reverted to the original environment variable naming format (PROXMOX_NODE_1_NAME, etc.)
- Removed the new environment variable format introduced in v1.6.0
- Improved backward compatibility for users upgrading from earlier versions

## [1.6.0] - 2024-03-12

### Added
- New one-line installation command: `git clone https://github.com/rcourtman/pulse.git && cd pulse && npm run install:pulse`
- Interactive installation script (`scripts/install.sh`) for guided setup
- New logging system with advanced filtering and real-time monitoring
- Comprehensive logging documentation in `docs/logging.md`
- New utility scripts for troubleshooting and configuration
- Getting Started guide (`GETTING-STARTED.md`) for new users
- Improved metrics service with better rate detection and capping
- New npm scripts for common operations (logs, status, restart, stop, cleanup)
- Proxmox cluster support: Added automatic detection and handling of Proxmox clusters
  - System now automatically detects if nodes are part of a cluster without manual configuration
  - Manual configuration via PROXMOX_CLUSTER_MODE is still supported but optional
- New configuration options: PROXMOX_CLUSTER_MODE and PROXMOX_CLUSTER_NAME (optional)
- Prevents duplicate VMs/CTs from appearing when multiple nodes from the same cluster are configured
- Mock cluster simulation for development and testing
- New mock data environment variables: MOCK_CLUSTER_ENABLED and MOCK_CLUSTER_NAME (optional)
- Updated documentation for mock data and cluster functionality
- Simplified environment configuration with a single .env file
- Improved development and production scripts for better cross-platform support
- New start-prod.sh and start-prod.bat scripts for production deployment
- Comprehensive mock data documentation in docs/MOCK_DATA.md
- Enhanced Docker development environment with detached mode and cleanup commands
- Performance tuning documentation and optimized default settings:
  - Increased polling intervals to reduce Proxmox server load (NODE_POLLING_INTERVAL_MS, EVENT_POLLING_INTERVAL_MS)
  - Added API rate limiting settings (API_RATE_LIMIT_MS, API_TIMEOUT_MS, API_RETRY_DELAY_MS)
  - Reduced memory usage with optimized metrics history (METRICS_HISTORY_MINUTES)
  - New performance tuning guide in documentation
- Animated pulsing logo for better visual feedback
- Detailed WebSocket troubleshooting guide for connection issues
- Enhanced CPU modeling in simulation mode for more realistic testing

### Changed
- Simplified environment configuration with a single `.env` file instead of multiple environment-specific files
- Improved Docker configuration with dynamic environment variables
- **IMPORTANT**: Default polling intervals have been increased to reduce load on Proxmox servers
  - NODE_POLLING_INTERVAL_MS: 1000ms → 15000ms
  - EVENT_POLLING_INTERVAL_MS: 1000ms → 5000ms
  - METRICS_HISTORY_MINUTES: 60 → 30
  - Users upgrading from previous versions should update their environment settings for optimal performance
- Restructured project organization for better maintainability
- Updated container name from `pulse-app` to `pulse`
- Moved Docker files to `docker/` directory
- Enhanced metrics service to handle unrealistic network rates
- Updated documentation to reflect new simplified configuration
- Improved WebSocket troubleshooting with new diagnostic tools
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
- Updated README with new screenshots and improved documentation
- Enhance export functionality with additional fields (Type, ID, Uptime) in NetworkDisplay
- Clarify node vs guest counts in dropdown by adding descriptive labels
- Improved error handling in Proxmox API client
- Enhanced network metrics stability with moving average calculations

### Removed
- Separate environment files (`.env.development`, `.env.production`)
- Redundant Docker Compose files (merged into a single configurable file)
- Legacy startup scripts (replaced with the new launcher system)

## [1.5.4] - 2024-03-26

### Fixed
- Fixed network rate calculation to properly handle Proxmox cumulative counters, resolving inaccurate network speed reporting

## [1.5.3] - 2025-03-10

### Security
- Improved Docker networking security by making bridge networking (default) work properly with WebSockets
- Removed host network mode as the default recommendation for better container isolation
- Updated documentation to prioritize secure networking options

### Fixed
- Enhanced WebSocket connection handling to work correctly in bridge network mode
- Improved hostname resolution for WebSocket connections

## [1.5.2] - 2025-03-01

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