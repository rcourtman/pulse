# Mock Data Documentation

This document provides information about the mock data functionality in Pulse, which is useful for development and testing without requiring a real Proxmox environment.

## Overview

The mock data system simulates:
- Multiple Proxmox nodes with realistic specifications
- Virtual machines (VMs) with various configurations
- Containers (CTs) with various configurations
- Realistic resource usage metrics that update in real-time
- Cluster mode functionality for testing multi-node environments

## Enabling Mock Data

To use mock data during development:

1. Set the following environment variables in your `.env` file:
   ```
   NODE_ENV=development
   USE_MOCK_DATA=true
   MOCK_DATA_ENABLED=true
   ```

2. Start the development server with mock data:
   ```bash
   # Local development with mock data
   npm run dev
   
   # Docker development with mock data
   npm run dev:docker
   ```

These npm scripts automatically set the required environment variables for mock data.

## Mock Data Configuration

You can customize the mock data behavior with these environment variables:

```bash
# Number of mock nodes to generate
MOCK_NODE_COUNT=3

# Enable/disable mock cluster mode
MOCK_CLUSTER_ENABLED=true

# Custom name for the mock cluster
MOCK_CLUSTER_NAME=mock-cluster

# Number of VMs per node
MOCK_VM_COUNT=10

# Number of containers per node
MOCK_CT_COUNT=10

# Enable/disable random failures for testing error handling
MOCK_RANDOM_FAILURES=false
```

## Cluster Mode in Mock Data

The mock data system supports simulating Proxmox cluster environments. This allows you to test how Pulse handles VMs and containers that exist across multiple nodes in a cluster.

### How Cluster Mode Works

When cluster mode is enabled:
- VMs and containers with the same VMID across different nodes are treated as a single entity
- The dashboard shows only one instance of each VM/container, regardless of how many nodes it exists on
- The node where the VM/container is currently running is displayed correctly

When cluster mode is disabled:
- Each VM/container is treated as a separate entity for each node it exists on
- The dashboard shows multiple instances of VMs/containers that exist on multiple nodes
- Each instance is associated with its specific node

### Configuring Cluster Mode

You can control cluster mode through environment variables:

```
# In your .env file
# Cluster mode is enabled by default and automatically detected
# Only set these if you want to override the automatic behavior:
PROXMOX_AUTO_DETECT_CLUSTER=false  # Disable automatic cluster detection
PROXMOX_CLUSTER_MODE=false         # Disable cluster mode even if a cluster is detected
PROXMOX_CLUSTER_NAME=my-cluster    # Set a custom name for your cluster
```

For mock data specifically, you can control the mock cluster behavior:

```
# Enable/disable mock cluster mode
MOCK_CLUSTER_ENABLED=true

# Custom name for the mock cluster
MOCK_CLUSTER_NAME=mock-cluster
```

### Testing Cluster Mode

The mock data includes "shared" VMs and containers that exist on multiple nodes:
- A VM named "shared-vm" with ID 999 exists on all mock nodes
- A container named "shared-container" with ID 888 exists on all mock nodes

To test cluster mode functionality:

1. Use `npm run dev` to run with cluster mode enabled (default)
   - You'll see only one instance of "shared-vm" and "shared-container" in the UI
   
2. Use `npm run dev:no-cluster` to run with cluster mode disabled
   - You'll see multiple instances of "shared-vm" and "shared-container" in the UI, one for each node

You can filter for these shared resources in the dashboard by typing "shared" in the search box.

## Customizing Mock Data

The mock data is generated in the `src/api/mock-client.ts` file. You can modify this file to:

- Change the number and specifications of nodes
- Adjust the number and types of VMs and containers
- Modify resource usage patterns
- Add or remove "shared" VMs and containers for cluster testing
- Change the update frequency of metrics

After modifying the mock data, restart the development server to apply your changes.

## Troubleshooting

If you encounter issues with mock data:

1. Ensure the environment variables are set correctly
2. Check the console logs for any errors related to mock data generation
3. Restart the development server to regenerate the mock data
4. Verify that your `.env` file has the correct settings

For more detailed information about development tools, see [README-dev-tools.md](../scripts/README-dev-tools.md). 