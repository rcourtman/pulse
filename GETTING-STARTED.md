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

2. **Run the installation script**:
   ```bash
   npm run install:pulse
   ```
   This will check your system requirements and guide you through the setup process.

3. **Create a Proxmox API token** (if you don't have one already):
   - Follow the instructions in the [Creating a Proxmox API Token](README.md#creating-a-proxmox-api-token) section of the README
   - You'll need this token to connect to your Proxmox server

4. **Configure your environment**:
   - The installation script will create a default `.env` file
   - Edit this file to add your Proxmox server details and API token

5. **Start the application**:
   ```bash
   npm run prod:docker
   ```

6. **Access the dashboard**:
   - Open your browser and navigate to http://localhost:7654
   - You should see the Pulse dashboard with your Proxmox data

## Manual Setup

If you prefer to set up Pulse manually:

1. **Copy the example environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your Proxmox details:
   ```
   # Required: Proxmox Configuration
   PROXMOX_HOST=https://your-proxmox-server:8006
   PROXMOX_NODE=your-node-name
   PROXMOX_TOKEN_ID=your-token-id
   PROXMOX_TOKEN_SECRET=your-token-secret
   ```

3. **Start the application**:
   ```bash
   npm run prod:docker
   ```

## Environment Configuration

Create a `.env` file in the project root with your Proxmox details:

```bash
# Required Proxmox Configuration
PROXMOX_HOST=https://your-proxmox-host:8006
PROXMOX_NODE=your-node-name
PROXMOX_TOKEN_ID=your-token-id
PROXMOX_TOKEN_SECRET=your-token-secret

# Optional: For multiple nodes
PROXMOX_HOST_2=https://your-second-proxmox-host:8006
PROXMOX_NODE_2=your-second-node-name
PROXMOX_TOKEN_ID_2=your-second-token-id
PROXMOX_TOKEN_SECRET_2=your-second-token-secret

# Optional: SSL Configuration
# If you have SSL certificate issues, uncomment these lines:
# IGNORE_SSL_ERRORS=true
# NODE_TLS_REJECT_UNAUTHORIZED=0

# Optional: Application Configuration
# NODE_ENV=production  # 'production' or 'development'
# USE_MOCK_DATA=false  # Set to true to use mock data instead of connecting to Proxmox

# Optional: Cluster Configuration
# Pulse automatically detects if your Proxmox nodes are part of a cluster
# PROXMOX_AUTO_DETECT_CLUSTER=true  # Set to 'false' to disable automatic detection
# PROXMOX_CLUSTER_MODE=true  # Set to 'false' to disable cluster mode even if a cluster is detected
# PROXMOX_CLUSTER_NAME=my-cluster  # Custom name for your cluster (defaults to detected name)
```

> ⚠️ **Security Note**: The `.env` file contains sensitive information. Do not commit it to your repository.

When you run development or production scripts, the application automatically sets the appropriate environment variables based on the mode.

## Running Different Environments

Pulse can be run in different modes depending on your needs:

### Production Mode

```bash
# Local production mode
npm run prod

# Docker production mode
npm run prod:docker
```

This starts Pulse in production mode, optimized for performance, using your real Proxmox server.

### Development Mode

```bash
# Local development mode with mock data
npm run dev

# Docker development mode with mock data
npm run dev:docker
```

This starts Pulse in development mode with hot reloading for both frontend and backend, using mock data so you don't need a real Proxmox server. The application automatically sets the following environment variables:

```
NODE_ENV=development
USE_MOCK_DATA=true
MOCK_DATA_ENABLED=true
```

## Troubleshooting

If you encounter issues:

1. **Check your environment configuration**:
   - Verify that your Proxmox server is accessible
   - Ensure your API token has the correct permissions
   - Check that your `.env` file has the correct values

2. **Try different connection methods**:
   - Try the development mode with mock data to verify the application works: `npm run dev`
   - Try accessing the application by IP address instead of localhost

3. **Check the logs**:
   ```bash
   npm run logs
   ```

4. **Restart the application**:
   ```bash
   npm run restart
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