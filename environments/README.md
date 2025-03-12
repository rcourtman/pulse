# Environment Configuration

Pulse uses a single `.env` file for all environment settings related to Proxmox and application configuration.

## Required Variables

```bash
# Required Proxmox Configuration
PROXMOX_HOST=https://your-proxmox-host:8006
PROXMOX_NODE=your-node-name
PROXMOX_TOKEN_ID=your-token-id
PROXMOX_TOKEN_SECRET=your-token-secret
```

## Optional Variables

```bash
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
NODE_ENV=production  # 'production' or 'development'
USE_MOCK_DATA=false  # Set to true to use mock data instead of connecting to Proxmox
PORT=7654            # Port for the backend server
LOG_LEVEL=info       # Logging level (debug, info, warn, error)
```

## Example Files

An example file is provided as a template:

- `.env.example` - Example configuration file

## Usage

Copy the `.env.example` file to create your actual environment file:

```bash
cp .env.example .env
```

Then edit the `.env` file with your specific settings.

## Security Note

⚠️ **IMPORTANT**: The `.env` file contains sensitive information such as API tokens and should NEVER be committed to the repository.

The `.gitignore` file is configured to exclude this sensitive file from being committed. 