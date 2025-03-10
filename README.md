# <img src="public/logos/pulse-logo-256x256.png" alt="Pulse Logo" width="32" height="32" style="vertical-align: middle"> Pulse for Proxmox VE

A lightweight, responsive monitoring application for Proxmox VE that displays real-time metrics for CPU, memory, network, and disk usage across multiple nodes.

![Pulse Dashboard for Proxmox VE](docs/images/dashboard.png)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/rcourtman)

## 📑 Table of Contents
- [Quick Start with Docker](#-quick-start-with-docker)
- [Configuration](#-configuration)
- [Common Docker Commands](#️-common-docker-commands)
- [Features](#-features)
- [Troubleshooting](#-troubleshooting)
  - [WebSocket Connection Issues](#websocket-connection-issues)
- [Advanced Configuration](#-advanced-configuration)
- [Development](#-development)
  - [Development Architecture](#development-architecture)
  - [Developer Documentation](#developer-documentation)
- [System Requirements](#-system-requirements)
- [Version Information](#-version-information)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)

## 🚀 Quick Start with Docker

### Option 1: Simple Docker Run

```bash
# 1. Download the example environment file
curl -O https://raw.githubusercontent.com/rcourtman/pulse/main/.env.example
mv .env.example .env

# 2. Edit the .env file with your Proxmox details
nano .env  # or use your preferred editor

# 3. Run with Docker
docker run -d \
  -p 7654:7654 \
  --env-file .env \
  --name pulse-app \
  --restart unless-stopped \
  rcourtman/pulse:latest

# 4. Access the application
# Open http://localhost:7654 in your browser
# If running on a remote server, use http://server-ip:7654
```

### Option 2: Docker Compose

```bash
# 1. Download the example files
curl -O https://raw.githubusercontent.com/rcourtman/pulse/main/.env.example
curl -O https://raw.githubusercontent.com/rcourtman/pulse/main/docker-compose.yml
mv .env.example .env

# 2. Edit the .env file with your Proxmox details
nano .env  # or use your preferred editor

# 3. Run with Docker Compose
docker compose up -d  # Note: newer Docker versions use 'docker compose' (no hyphen)

# 4. Access the application
# Open http://localhost:7654 in your browser
# If running on a remote server, use http://server-ip:7654
```

## 🔧 Configuration

### Required Environment Variables

Edit your `.env` file with at least these settings:

```bash
# Required: Proxmox Node Configuration
PROXMOX_NODE_1_NAME=Proxmox Node 1
PROXMOX_NODE_1_HOST=https://proxmox.local:8006
PROXMOX_NODE_1_TOKEN_ID=root@pam!pulse
PROXMOX_NODE_1_TOKEN_SECRET=your-token-secret
```

### Proxmox Cluster Configuration

Pulse now automatically detects if your nodes are part of a Proxmox cluster:

```bash
# Optional: Cluster Configuration
# Cluster mode is now automatically detected, these settings are only needed to override the automatic detection
# PROXMOX_CLUSTER_MODE=true
# PROXMOX_CLUSTER_NAME=MyProxmoxCluster

# Configure all nodes in your cluster
PROXMOX_NODE_1_NAME=PVE01
PROXMOX_NODE_1_HOST=https://pve01.domain.local:8006
PROXMOX_NODE_1_TOKEN_ID=pulse-monitor@pve!pulse
PROXMOX_NODE_1_TOKEN_SECRET=your-token-secret

PROXMOX_NODE_2_NAME=PVE02
PROXMOX_NODE_2_HOST=https://pve02.domain.local:8006
# ... and so on for all nodes
```

When cluster mode is enabled, Pulse will:
- Automatically detect VMs and containers that exist on multiple nodes
- Use consistent IDs based on the VM/CT ID rather than the node
- Prevent duplicate entries in the dashboard
- Show the correct node where each VM/CT is currently running

You can also enable cluster mode automatically by configuring multiple nodes - Pulse will detect this and enable cluster mode by default.

### Proxmox API Token Requirements

Your Proxmox API token needs these permissions:
- PVEAuditor role or custom role with:
  - Datastore.Audit
  - VM.Audit
  - Sys.Audit
  - Pool.Audit

### Creating a Proxmox API Token

#### Option 1: Quick Command (Convenient but less secure)

You can run this command either by SSH'ing into your Proxmox server or by using the Shell console in the Proxmox web UI (Datacenter → Shell):

```bash
# This creates a token named 'pulse' to match the example in the .env file
pveum user token add root@pam pulse --privsep=0 && \
pveum acl modify / -user root@pam -role PVEAuditor && \
pveum user token list root@pam
```

⚠️ **Why this is less secure:**
- Uses the root account (best practice is to use a dedicated user)
- **Disables** privilege separation with `--privsep=0` (privilege separation restricts token permissions)
- Grants access to all resources (/)
- Outputs the token secret to the terminal (could be logged)

#### Option 2: Step-by-Step Guide (More secure)

1. **Log in to the Proxmox web interface**

2. **Create a dedicated user** (optional but recommended)
   - Go to Datacenter → Permissions → Users
   - Click "Add"
   - Enter a username (e.g., "pulse-monitor")
   - Set a password and enable the user

3. **Create an API token**
   - Go to Datacenter → Permissions → API Tokens
   - Click "Add"
   - Select your user (e.g., "pulse-monitor@pam" or "root@pam")
   - Enter a token ID (e.g., "pulse")
   - Leave "Privilege Separation" checked for better security (this restricts the token to only use permissions explicitly granted to it)
   - Click "Add"
   - **Important:** Save the displayed token value securely - it will only be shown once!

4. **Assign permissions**
   - Go to Datacenter → Permissions → Add
   - Path: /
   - User: Your user (e.g., "pulse-monitor@pam")
   - Role: PVEAuditor
   - Click "Add"

5. **Update your .env file**
   ```
   # If using root user (matching the quick command example)
   PROXMOX_NODE_1_TOKEN_ID=root@pam!pulse
   PROXMOX_NODE_1_TOKEN_SECRET=your-saved-token-value
   
   # OR if using a dedicated user (recommended for better security)
   PROXMOX_NODE_1_TOKEN_ID=pulse-monitor@pam!pulse
   PROXMOX_NODE_1_TOKEN_SECRET=your-saved-token-value
   ```

## 🛠️ Common Docker Commands

```bash
# View logs
docker logs pulse-app

# Restart the application
docker restart pulse-app

# Update to latest version
docker pull rcourtman/pulse:latest
docker rm -f pulse-app
docker run -d -p 7654:7654 --env-file .env --name pulse-app --restart unless-stopped rcourtman/pulse:latest

# For Docker Compose users
docker compose pull  # Pull latest image
docker compose up -d  # Restart with new image
```

## ✨ Features

- Real-time monitoring of Proxmox nodes, VMs, and containers
- Dashboard with summary cards for nodes, guests, and resources
- Responsive design that works on desktop and mobile
- WebSocket connection for live updates

## ❓ Frequently Asked Questions

### How does Pulse compare to Grafana + InfluxDB monitoring?
Pulse and Grafana serve different monitoring needs. Pulse focuses on real-time monitoring with WebSocket-based instant updates, ideal for active system monitoring and dashboards. It's lightweight (single Docker container) and simple to set up. Grafana+InfluxDB is better suited for historical data analysis, complex visualizations, and monitoring multiple systems. If you need detailed historical metrics or custom dashboards, use Grafana. If you want instant resource updates and a simple setup, use Pulse.

### How is it different from the built-in Proxmox summary?
While Proxmox's built-in summary is great for management, Pulse offers:
- Real-time WebSocket updates
- All nodes visible on one screen
- Monitoring without logging into Proxmox
- Ability to share monitoring access without admin privileges
- Lightweight resource usage
- Perfect for dedicated monitoring displays

### Will Pulse support Proxmox Backup Server (PBS)?
PBS integration is planned. The PBS API provides the metrics needed for backup job status, datastore usage tracking, and verification monitoring. A roadmap of planned features will be published soon.

### What about hardware monitoring (temperatures, additional disks)?
Hardware metric expansion is in development, including temperature sensors and additional disk metrics. The focus is on keeping the interface clean and responsive while adding these features.

### How resource-intensive is Pulse?
Pulse is designed to be lightweight, requiring minimal resources (256MB RAM, 1 CPU core). It runs as a single Docker container and doesn't store historical data, keeping the resource footprint small.

### What's the long-term plan for this project?
Pulse is actively maintained and used daily. I'm committed to keeping it relevant and useful, with a focus on stability and thoughtful feature additions. A public roadmap will be published soon to share planned features and improvements.

### Does Pulse collect any telemetry or user data?
No. Pulse only communicates directly with your Proxmox servers using the API token you provide. No data is sent outside your network, and the entire codebase is open source for verification.

## 🔍 Troubleshooting

### WebSocket Connection Issues

If you see a "Connection error: websocket error" message, it's typically because the WebSocket connection can't be established. This is often due to Docker networking or reverse proxy configuration.

#### Quick Fixes:

1. **Make sure you're using the latest version of Pulse:**
   ```bash
   docker pull rcourtman/pulse:latest
   docker restart pulse-app
   ```

2. **Remove VITE_API_URL from your .env file** if you've set it.

3. **Access Pulse directly by IP address** instead of using localhost or a domain name.

4. **As a last resort, if other solutions don't work, you can use host network mode:**
   ```bash
   docker run -d --network host --env-file .env --name pulse-app rcourtman/pulse:latest
   ```
   Note: Host network mode has security implications as it gives the container full access to the host's network stack.

For detailed troubleshooting steps, see our [WebSocket Troubleshooting Guide](docs/troubleshooting-websocket.md).

## 📋 Advanced Configuration

For multiple Proxmox nodes or advanced settings, add these to your `.env`:

```bash
# Additional nodes
PROXMOX_NODE_2_NAME=Proxmox Node 2
PROXMOX_NODE_2_HOST=https://proxmox2.local:8006
PROXMOX_NODE_2_TOKEN_ID=root@pam!pulse
PROXMOX_NODE_2_TOKEN_SECRET=your-token-secret

# App Configuration
PORT=7654
LOG_LEVEL=info
METRICS_HISTORY_MINUTES=60
NODE_POLLING_INTERVAL_MS=1000
EVENT_POLLING_INTERVAL_MS=1000
```

## 🧑‍💻 Development

If you're developing Pulse, you can use the development server:

```bash
# Clone the repository
git clone https://github.com/rcourtman/pulse.git
cd pulse

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Start the development server
npm run dev
```

This will automatically detect your platform (Windows or Unix-like) and run the appropriate script.

### Platform-Specific Development Scripts

- **Windows**: `npm run dev:windows` (runs start-dev.bat)
- **Unix/Linux/macOS**: `npm run dev:unix` (runs start-dev.sh)

### Environment Configuration

Pulse now uses environment-specific configuration files:

- `.env.development` - Used for development environments
- `.env.production` - Used for production environments
- `.env` - Default fallback configuration

When you run development or production scripts, the appropriate environment file is loaded automatically.

#### Security Note

⚠️ **IMPORTANT**: The environment files (`.env`, `.env.development`, `.env.production`) contain sensitive information such as API tokens and should NEVER be committed to the repository. Example files without sensitive data are provided (`.env.development.example`, `.env.production.example`) as templates.

To set up your environment:

1. Copy the example files to create your actual environment files:
   ```bash
   cp .env.development.example .env.development
   cp .env.production.example .env.production
   ```

2. Edit the files to add your actual Proxmox node details and API tokens.

The `.gitignore` file is configured to exclude these sensitive files from being committed.

### Docker Development Environment

For a containerized development environment with hot-reloading:

```bash
# Start the Docker development environment
npm run dev:docker

# Or run in detached mode (background)
npm run dev:docker:detached

# Clean up Docker development environment
npm run dev:docker:cleanup
```

This Docker-based development setup:
- Mounts source code directories as volumes for live code changes
- Enables hot-reloading for both frontend and backend
- Exposes ports 7654 (backend) and 3000 (frontend)
- Uses the same .env file as the regular development setup
- Provides a consistent development environment across different platforms
- Automatically stops any running development processes before starting

### Mock Data Development

For development without a Proxmox server, you can use mock data:

```bash
# Start with mock data
npm run dev:mock

# Platform-specific mock data scripts
npm run dev:mock:unix    # For Unix/Linux/macOS
npm run dev:mock:windows # For Windows
```

The mock data environment automatically:
- Sets `USE_MOCK_DATA=true` and `MOCK_DATA_ENABLED=true`
- Loads mock Proxmox nodes and guests from the mock data files
- Simulates real-time metrics and events

### Production Deployment

For production deployment, use:

```bash
# Start production server
npm run prod

# Platform-specific production scripts
npm run prod:unix    # For Unix/Linux/macOS
npm run prod:windows # For Windows

# Docker production deployment
npm run prod:docker
npm run prod:docker:detached  # Run in background
```

The production scripts automatically:
- Load configuration from `.env.production` if available
- Disable mock data for production use
- Build both backend and frontend
- Start the optimized production server

⚠️ **Warning**: The development and production scripts perform the following actions:
- Stop any running Docker containers with "pulse" in their name (if Docker is installed)
- Kill any running Node.js processes serving the application
- Free ports 7654 and 3000 by terminating processes using them
- Set appropriate NODE_ENV values
- Start the required servers based on the environment

### Development Architecture

Pulse uses a split architecture for development:
- **Backend server** (port 7654): Node.js Express server that communicates with Proxmox
- **Frontend server** (port 3000): Vite development server for the React frontend

This separation provides several benefits:
- **Hot Module Replacement (HMR)**: Changes to frontend code are instantly reflected without a full page reload
- **Independent development**: Backend and frontend can be developed and tested separately
- **API isolation**: Clear separation between data services and UI components

When you run `start-dev.sh`, both servers start automatically:
1. The backend server runs on port 7654 and handles all Proxmox API communication
2. The frontend development server runs on port 3000 with hot reloading enabled
3. API requests from the frontend are proxied to the backend

In production, these are combined into a single service running on port 7654.

### Developer Documentation

For more detailed information about the codebase structure, key components, and design decisions, please refer to the [Developer Documentation](docs/DEVELOPER.md).

The development server will be accessible at:
- http://localhost:3000 - from the local machine
- http://your-ip-address:3000 - from other devices on your network

## 💻 System Requirements

- **Docker**: Version 20.10.0 or higher
- **Memory**: Minimum 256MB RAM (512MB recommended)
- **CPU**: Any modern CPU (1+ cores)
- **Disk Space**: Approximately 100MB for the Docker image
- **Network**: Connectivity to your Proxmox server(s)
- **Browser**: Any modern browser (Chrome, Firefox, Safari, Edge)

## 🔄 Version Information

Current version: 1.2.1

To check for updates:
```bash
# Check for newer image versions
docker pull rcourtman/pulse:latest

# View current running version
docker exec pulse-app cat /app/package.json | grep version
```
## 👥 Contributing

Contributions are welcome! Here's how you can contribute:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add some amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

Please make sure to update tests as appropriate and follow the code style of the project.

For more detailed information about contributing, please see our [Contributing Guidelines](CONTRIBUTING.md).

### Reporting Issues

When reporting issues, please use the appropriate issue template:
- [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) - for reporting bugs or unexpected behavior
- [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) - for suggesting new features or improvements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Trademark Notice

Proxmox® and Proxmox VE® are registered trademarks of Proxmox Server Solutions GmbH. Pulse for Proxmox VE is an independent project and is not affiliated with, endorsed by, or sponsored by Proxmox Server Solutions GmbH.

## ❤️ Support

If you find Pulse helpful, please consider supporting its development through Ko-fi. Your support helps keep this project maintained and free for everyone!

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/rcourtman)
