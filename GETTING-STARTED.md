# Getting Started with Pulse for Proxmox VE

This guide will help you set up and run Pulse for Proxmox VE on your system.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Docker](https://www.docker.com/) (recommended)
- A Proxmox VE server with API access
- A Proxmox API token with appropriate permissions

## Quick Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rcourtman/pulse.git
   cd pulse
   ```

2. **Start the development environment**:
   
   On Linux/macOS:
   ```bash
   ./scripts/start-dev.sh
   ```
   
   On Windows:
   ```bash
   scripts\start-dev.bat
   ```
   
   This is the quickest way to get started with Pulse in development mode with mock data.

3. **Create a Proxmox API token** (if you want to use real data):
   - Follow the instructions in the [Creating a Proxmox API Token](README.md#creating-a-proxmox-api-token) section of the README
   - You'll need this token to connect to your Proxmox server

4. **Configure your environment**:
   - Copy the example environment file: `cp .env.example .env`
   - Edit this file to add your Proxmox server details and API token

5. **Access the dashboard**:
   - Open your browser and navigate to http://localhost:3000
   - You should see the Pulse dashboard with your Proxmox data (or mock data if using development mode)

## Environment Configuration

Create a `.env` file in the project root with your Proxmox details. Here's the correct structure:

```bash
# === Basic Configuration ===
NODE_ENV=production
LOG_LEVEL=info
PORT=7654

# === Proxmox Configuration ===
# Node 1
PROXMOX_NODE_1_NAME=Proxmox Node 1
PROXMOX_NODE_1_HOST=https://proxmox.local:8006
PROXMOX_NODE_1_TOKEN_ID=root@pam!pulse
PROXMOX_NODE_1_TOKEN_SECRET=your-token-secret

# Node 2 (optional)
# PROXMOX_NODE_2_NAME=Proxmox Node 2
# PROXMOX_NODE_2_HOST=https://proxmox2.local:8006
# PROXMOX_NODE_2_TOKEN_ID=root@pam!pulse
# PROXMOX_NODE_2_TOKEN_SECRET=your-token-secret

# === SSL Configuration ===
# For self-signed certificates or development
IGNORE_SSL_ERRORS=true
NODE_TLS_REJECT_UNAUTHORIZED=0
PROXMOX_REJECT_UNAUTHORIZED=false
HTTPS_REJECT_UNAUTHORIZED=false
PROXMOX_INSECURE=true
PROXMOX_VERIFY_SSL=false

# === Testing Options ===
# Set to 'true' to use mock data instead of connecting to a real Proxmox server
USE_MOCK_DATA=false
MOCK_DATA_ENABLED=false

# === Cluster Configuration ===
PROXMOX_AUTO_DETECT_CLUSTER=true
PROXMOX_CLUSTER_MODE=false

# === Performance Tuning ===
METRICS_HISTORY_MINUTES=30
NODE_POLLING_INTERVAL_MS=15000
EVENT_POLLING_INTERVAL_MS=5000
API_RATE_LIMIT_MS=2000
API_TIMEOUT_MS=90000
API_RETRY_DELAY_MS=10000
```

> ⚠️ **Security Note**: The `.env` file contains sensitive information. Do not commit it to your repository.

## Running Different Environments

Pulse can be run in different modes depending on your needs:

### Development Mode with Mock Data (Recommended for Testing)

The quickest way to start Pulse in development mode with mock data:

```bash
# On Linux/macOS
./scripts/start-dev.sh

# On Windows
scripts\start-dev.bat
```

This starts Pulse in development mode with hot reloading for both frontend and backend, using mock data so you don't need a real Proxmox server.

### Development Mode with Real Data

To use real Proxmox data in development mode:

1. Edit your `.env` file and set:
```
USE_MOCK_DATA=false
MOCK_DATA_ENABLED=false
```

2. Run the development script:
```bash
# On Linux/macOS
./scripts/start-dev.sh

# On Windows
scripts\start-dev.bat
```

### Production Mode

```bash
# Local production mode
npm run prod

# Docker production mode
npm run prod:docker
```

This starts Pulse in production mode, optimized for performance, using your real Proxmox server.

## Performance Tuning

If you notice that Pulse is consuming too many resources or overwhelming your Proxmox server, you can adjust several settings in your `.env` file:

### Polling Intervals
- `NODE_POLLING_INTERVAL_MS`: How often to poll for node status (recommended: 15000ms)
- `EVENT_POLLING_INTERVAL_MS`: How often to poll for events (recommended: 5000ms)

### Metrics Storage
- `METRICS_HISTORY_MINUTES`: How many minutes of metrics to keep in memory (recommended: 30)

### API Rate Limiting
- `API_RATE_LIMIT_MS`: Minimum time between API requests (recommended: 2000ms)
- `API_TIMEOUT_MS`: Timeout for API requests (recommended: 90000ms)
- `API_RETRY_DELAY_MS`: Delay before retrying failed requests (recommended: 10000ms)

### Cluster Settings
If not using cluster mode, you can disable these features to reduce API calls:
- `PROXMOX_CLUSTER_MODE=false`
- `PROXMOX_AUTO_DETECT_CLUSTER=false`

## Troubleshooting

If you encounter issues:

1. **Check your environment configuration**:
   - Verify that your Proxmox server is accessible
   - Ensure your API token has the correct permissions
   - Check that your `.env` file has the correct values

2. **Try development mode with mock data**:
   ```bash
   ./scripts/start-dev.sh
   ```
   This will help verify that the application works without needing a Proxmox server.

3. **Check the Docker logs**:
   ```bash
   docker logs pulse
   ```
   Or use the standard Docker log viewing commands to see what's happening.

4. **Stop running containers**:
   ```bash
   npm run stop
   ```

5. **Clean up and start fresh**:
   ```bash
   npm run cleanup
   npm run prod:docker
   ```

## Next Steps

- Explore the dashboard and familiarize yourself with the interface
- Check out the [README](README.md) for more detailed information
- Consider setting up Pulse as a service for continuous monitoring

For more advanced configuration options, see the [Advanced Configuration](README.md#-advanced-configuration) section in the README. 