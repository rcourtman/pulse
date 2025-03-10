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

1. Set the following environment variables in your `.env.development` file:
   ```
   USE_MOCK_DATA=true
   MOCK_DATA_ENABLED=true
   ```

2. Start the development server with mock data:
   ```bash
   npm run dev:mock
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

You can control cluster mode through the environment variable:

```
# In .env, .env.development, or .env.production
PROXMOX_CLUSTER_MODE=true  # Enable cluster mode
PROXMOX_CLUSTER_MODE=false # Disable cluster mode
```

The system will also automatically detect if your nodes are part of a cluster based on the API response.

### Testing Cluster Mode

The mock data includes "shared" VMs and containers that exist on multiple nodes:
- A VM named "shared-vm" with ID 999 exists on all mock nodes
- A container named "shared-container" with ID 888 exists on all mock nodes

To test cluster mode functionality:

1. Set `PROXMOX_CLUSTER_MODE=true` to see consolidated VMs/containers
2. Set `PROXMOX_CLUSTER_MODE=false` to see duplicate VMs/containers for each node
3. Restart the server after changing this setting

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
4. Verify that the `.env.development` file has the correct settings

For more detailed information about development tools, see [README-dev-tools.md](../scripts/README-dev-tools.md). 