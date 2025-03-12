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

The mock data system simulates Proxmox cluster environments by showing how VMs and containers exist across multiple nodes.

### How Shared Guests Work

In the mock data system:
- VMs and containers with the same VMID across different nodes are treated as separate entities
- The dashboard shows all instances of each VM/container, one for each node it exists on
- Each guest is associated with its specific node
- For shared guests (with IDs 999 and 888), the primary node concept is applied to prevent duplicate metrics
- Only one node (determined alphabetically) will show a shared guest as "running" and generate metrics for it
- Other nodes will show the shared guest as "stopped" with zeroed resource usage

This approach accurately represents how Proxmox works in reality:
- In a real Proxmox cluster, a VM or container exists in the cluster's configuration but is only actively running on one node at a time
- When a migration occurs, the VM/container stops on the source node and starts on the destination node
- Each node maintains its own view of the guests, showing which ones are running locally

### Shared Guests Behavior

Shared guests (with IDs 999 and 888) are handled specially:

1. **Primary Node Assignment**:
   - The primary node for each shared guest is determined by sorting node IDs alphabetically
   - The first node alphabetically becomes the primary node
   - This ensures consistent behavior across application restarts

2. **Status and Metrics**:
   - Shared guests appear on all nodes they exist on
   - Only the primary node shows the guest as "running" and generates metrics
   - Other nodes show the guest as "stopped" with zeroed resource usage
   - This prevents duplicate metrics and provides a consistent experience

3. **Migrations**:
   - Every 10 seconds, a shared guest (ID 999 or 888) may migrate to a different node
   - The previous primary node will mark the guest as "stopped"
   - The new primary node will mark the guest as "running" and start generating metrics
   - Migrations are prioritized for shared guests to make the behavior more visible for testing

### Configuring Proxmox Cluster Detection

In real Proxmox environments, cluster detection is automatic. You can control this behavior through environment variables if needed:

```
# In your .env file
# Only set these if you want to override the automatic behavior:
PROXMOX_AUTO_DETECT_CLUSTER=false  # Disable automatic cluster detection
PROXMOX_CLUSTER_NAME=my-cluster    # Set a custom name for your cluster
```

### Testing Shared Guests

The mock data includes "shared" VMs and containers that exist on multiple nodes:
- A VM named "shared-vm" with ID 999 exists on all mock nodes
- A container named "shared-container" with ID 888 exists on all mock nodes

To test shared guests functionality:

1. Start the application with mock data enabled:
   ```bash
   npm run dev
   ```
2. Observe how the shared VM and container appear on all nodes in the dashboard
3. Filter for "shared" in the search box to focus on just these resources
4. Verify that only one instance of each shared guest is shown as "running" (on the primary node)
5. Verify that other instances are shown as "stopped" with zeroed resource usage
6. Watch as they migrate between nodes every 10 seconds (primary node changes)
7. Observe in the server logs which node becomes primary:
   ```
   🔄 MIGRATION: Guest 999 migrated from node node-1 to node-2
   Guest 999 on node node-1: status=stopped (isPrimary=false)
   Guest 999 on node node-2: status=running (isPrimary=true)
   ```

You can filter for these shared resources in the dashboard by typing "shared" in the search box. By default, the dashboard hides stopped guests, so you may need to toggle the "Show Stopped" option to see all instances of the shared guests.

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

### Common Issues

#### Shared Guests Show Metrics on Multiple Nodes

If shared guests (ID 999 and 888) are showing metrics on multiple nodes:

1. Check the server logs for primary node assignment messages:
   ```
   Found shared guest 999 on nodes: node-1, node-2, node-3
   Assigned primary node node-1 for guest 999
   ```

2. Verify that the MockClient is respecting the primary node assignment:
   ```
   Shared guest 999 (mock-shared-vm) on node node-2: primaryNode=node-1, shouldBeRunning=false
   ```

3. Ensure that the `initializePrimaryNodes` function is being called during server initialization

4. Check that migrations are working properly by watching for log messages like:
   ```
   🔄 MIGRATION: Guest 999 migrated from node node-1 to node-2
   Guest 999 on node node-1: status=stopped (isPrimary=false)
   Guest 999 on node node-2: status=running (isPrimary=true)
   ```

#### Inconsistent Metrics for Shared Guests

If metrics for shared guests are inconsistent or fluctuating rapidly:

1. Ensure that only one node is generating metrics for each shared guest
2. Check that the primary node assignment is consistent across server restarts
3. Verify that the `isNodePrimaryForGuest` function is being called correctly
4. Monitor the logs for unexpected primary node changes
5. Note that shared guests (IDs 999 and 888) are configured to migrate every 10 seconds, so some fluctuation is expected

For more detailed information about development tools, see [README-dev-tools.md](../scripts/README-dev-tools.md). 