# ProxMox Pulse

A lightweight, responsive ProxMox monitoring application that displays real-time metrics for CPU, memory, network, and disk usage across multiple nodes.

![Dashboard](docs/images/dashboard.png)
*Main dashboard showing node overview and resource usage*

## 🚀 Quick Start with Docker

### Option 1: Simple Docker Run

```bash
# 1. Download the example environment file
curl -O https://raw.githubusercontent.com/rcourtman/pulse/main/.env.example
mv .env.example .env

# 2. Edit the .env file with your ProxMox details
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

# 2. Edit the .env file with your ProxMox details
nano .env  # or use your preferred editor

# 3. Run with Docker Compose
docker-compose up -d

# 4. Access the application
# Open http://localhost:7654 in your browser
# If running on a remote server, use http://server-ip:7654
```

## 🔧 Configuration

### Required Environment Variables

Edit your `.env` file with at least these settings:

```bash
# Required: ProxMox Node Configuration
PROXMOX_NODE_1_NAME=Proxmox Node 1
PROXMOX_NODE_1_HOST=https://proxmox.local:8006
PROXMOX_NODE_1_TOKEN_ID=root@pam!pulse
PROXMOX_NODE_1_TOKEN_SECRET=your-token-secret
```

### ProxMox API Token Requirements

Your ProxMox API token needs these permissions:
- PVEAuditor role or custom role with:
  - Datastore.Audit
  - VM.Audit
  - Sys.Audit
  - Pool.Audit

### Creating a ProxMox API Token

#### Option 1: Quick Command (Convenient but less secure)

You can run this command either by SSH'ing into your ProxMox server or by using the Shell console in the ProxMox web UI (Datacenter → Shell):

```bash
# This creates a token named 'pulse' to match the example in the .env file
pveum user token add root@pam pulse --privsep=0 && \
pveum acl modify / -user root@pam -role PVEAuditor && \
pveum user token list root@pam
```

⚠️ **Why this is less secure:**
- Uses the root account (best practice is to use a dedicated user)
- Disables privilege separation (--privsep=0)
- Grants access to all resources (/)
- Outputs the token secret to the terminal (could be logged)

#### Option 2: Step-by-Step Guide (More secure)

1. **Log in to the ProxMox web interface**

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
```

## ✨ Features

- Real-time monitoring of ProxMox nodes, VMs, and containers
- Dashboard with summary cards for nodes, guests, and resources
- Responsive design that works on desktop and mobile
- WebSocket connection for live updates

![Resources](docs/images/resources.png)
*Resource view with filtering options for VMs and containers*

## ❓ Troubleshooting

1. **Connection Issues**: Verify your ProxMox node details in `.env`
2. **SSL Problems**: Add these to your .env file:
   ```
   IGNORE_SSL_ERRORS=true
   NODE_TLS_REJECT_UNAUTHORIZED=0
   ```
3. **Port Conflicts**: Change the port mapping in your docker run command if port 7654 is already in use
4. **API Token Issues**: Ensure your token has the correct permissions (PVEAuditor role)

## 📋 Advanced Configuration

For multiple ProxMox nodes or advanced settings, add these to your `.env`:

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
./start-dev.sh
```

The development server will be accessible at:
- http://localhost:3000 - from the local machine
- http://your-ip-address:3000 - from other devices on your network

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.