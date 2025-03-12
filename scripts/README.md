# Pulse Scripts

This directory contains various scripts used for development, testing, and maintenance of the Pulse application.

## Development Tools

These scripts are for development and testing purposes only. They are not part of the main Pulse application and should not be used in production environments.

## Available Scripts

### Core Scripts

- **start.js** - Main launcher script that provides a menu to select which environment to start
- **install.sh** - Interactive installation and setup script
- **check-config.js** - Validates the configuration and checks for common issues
- **monitor-logs.js** - Real-time log monitoring with filtering capabilities
- **run-with-logs.js** - Runs the application and monitors logs in the same terminal

### Development Scripts

- **start-dev.sh/bat** - Start the application in development mode with mock data
- **start-mock-dev.sh/bat** - Start the application in development mode with mock data (alias for start-dev.sh)
- **start-mock-server.js** - Starts only the mock data server
- **debug-socket.js** - Debug proxy for troubleshooting socket communication
- **debug-proxy.sh** - Runs the application with the debug proxy

### Production Scripts

- **start-prod.sh/bat** - Start the application in production mode
- **docker-prod.sh** - Start the application in production mode with Docker

### Utility Scripts

- **check-connections.js** - Tests various connection methods to help diagnose issues
- **clear-data.js** - Clears cached data and resets the application state
- **configure-env.js** - Interactive script to configure the .env file
- **verify-cluster-config.js** - Verifies the cluster configuration

## Which Script Should I Use?

Instead of calling these scripts directly, you can use the npm scripts in the root directory:

```bash
# Development mode with mock data (local)
npm run dev

# Development mode with mock data (Docker)
npm run dev:docker

# Production mode with real Proxmox data (local)
npm run prod

# Production mode with real Proxmox data (Docker)
npm run prod:docker

# Monitor logs
npm run logs

# Check container status
npm run status

# Restart the application
npm run restart

# Stop the application
npm run stop

# Clean up (remove containers, images, volumes)
npm run cleanup
```

## Using the Launcher

You can also use the launcher in the root directory:

```bash
# On Unix/Linux/macOS
./start.sh

# On Windows
start.bat
```

The launcher provides a menu to select which environment to start, making it easier for users to choose the right option. 