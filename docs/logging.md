# Logging in Pulse

This document describes the logging system in Pulse and how to use the logging tools to troubleshoot issues.

## Log Files

Pulse logs are stored in the `logs` directory:

- `combined.log`: The main log file containing all log entries
- `error.log`: Contains only error-level log entries
- `debug.log`: Contains debug-level log entries (when debug logging is enabled)

When the log files reach a certain size, they are rotated and numbered (e.g., `combined1.log`, `combined2.log`, etc.).

## Log Levels

Pulse uses the following log levels, in order of severity:

1. `error`: Critical errors that prevent the application from functioning correctly
2. `warn`: Warnings about potential issues that don't prevent the application from running
3. `info`: Informational messages about normal operation
4. `debug`: Detailed information useful for debugging
5. `silly`: Very detailed information (rarely used)

The log level can be configured in the `.env` file using the `LOG_LEVEL` variable.

## Logging Tools

Pulse includes several tools to help you monitor and troubleshoot logs:

### Log Monitor

The log monitor script (`scripts/monitor-logs.js`) allows you to view logs in real-time with filtering capabilities:

```bash
# Basic usage
node scripts/monitor-logs.js

# Filter by log level
node scripts/monitor-logs.js --level=error

# Filter by component
node scripts/monitor-logs.js --component=ProxmoxClient

# Search for specific text
node scripts/monitor-logs.js --search=cluster

# Combine filters
node scripts/monitor-logs.js --level=info --component=NodeManager

# Specify a log file
node scripts/monitor-logs.js --file=combined2.log
```

### Run with Logs

The run-with-logs script (`scripts/run-with-logs.js`) runs the application and monitors logs in the same terminal:

```bash
# Run in development mode with logs
node scripts/run-with-logs.js dev

# Run in production mode with logs
node scripts/run-with-logs.js prod

# Run with cluster mode disabled
node scripts/run-with-logs.js dev --no-cluster

# Run with log filtering
node scripts/run-with-logs.js prod --search=cluster
node scripts/run-with-logs.js dev --level=error
```

## NPM Scripts

For convenience, several npm scripts are provided for logging:

```bash
# Monitor logs
npm run logs:monitor

# Filter logs by level
npm run logs:errors

# Filter logs by component
npm run logs:proxmox
npm run logs:node-manager

# Search logs for cluster-related messages
npm run logs:cluster

# Run with logs
npm run dev:logs
npm run prod:logs
npm run dev:logs:no-cluster
npm run prod:logs:no-cluster
```

## Troubleshooting Common Issues

### Cluster Detection Issues

To troubleshoot cluster detection issues, use:

```bash
npm run logs:cluster
```

This will show all log messages related to cluster detection and configuration.

### Connection Issues

To troubleshoot connection issues with Proxmox servers, use:

```bash
npm run logs:proxmox
```

### Guest Duplication Issues

If you're seeing duplicated guests in the UI, check the cluster mode settings:

```bash
# Check if cluster mode is enabled
grep -i "cluster" logs/combined.log

# Run with cluster mode explicitly disabled
npm run dev:logs:no-cluster
```

### Performance Issues

To troubleshoot performance issues, monitor the debug logs:

```bash
npm run logs:monitor --level=debug
```

## Adding Logging to Your Code

When adding new code, follow these guidelines for logging:

1. Use the appropriate log level based on the severity of the message
2. Include relevant context in the log message
3. Use structured logging with metadata for complex objects
4. Include the component name in the logger

Example:

```typescript
import { createLogger } from '../utils/logger';

// Create a logger with a component name
const logger = createLogger('MyComponent');

// Log messages with different levels
logger.error('Critical error occurred', { error });
logger.warn('Potential issue detected', { details });
logger.info('Operation completed successfully');
logger.debug('Detailed debugging information', { data });
``` 