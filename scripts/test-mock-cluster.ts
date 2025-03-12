/**
 * Test script to demonstrate mock cluster mode
 * 
 * This script creates mock clients for multiple nodes and shows how
 * the VM and container IDs are generated with and without cluster mode.
 * 
 * Run with:
 * npx ts-node scripts/test-mock-cluster.ts
 */

import { MockClient } from '../src/api/mock-client';
import { NodeConfig } from '../src/types';

// Create mock node configs
const nodeConfigs: NodeConfig[] = [
  {
    id: 'node-1',
    name: 'pve-1',
    host: 'http://localhost:7656',
    tokenId: 'mock-token',
    tokenSecret: 'mock-secret'
  },
  {
    id: 'node-2',
    name: 'pve-2',
    host: 'http://localhost:7656',
    tokenId: 'mock-token',
    tokenSecret: 'mock-secret'
  },
  {
    id: 'node-3',
    name: 'pve-3',
    host: 'http://localhost:7656',
    tokenId: 'mock-token',
    tokenSecret: 'mock-secret'
  }
];

// Test with cluster mode enabled
async function testWithClusterMode() {
  console.log('\n=== Testing with Cluster Mode Enabled ===');
  
  // Set environment variables for cluster mode
  process.env.MOCK_CLUSTER_ENABLED = 'true';
  process.env.MOCK_CLUSTER_NAME = 'test-cluster';
  
  const clients = nodeConfigs.map(config => new MockClient(config));
  
  // Get VMs and containers from each client
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const vms = await client.getVMs();
    const containers = await client.getContainers();
    
    console.log(`\nNode: ${nodeConfigs[i].name} (${nodeConfigs[i].id})`);
    console.log('VMs:');
    vms.forEach(vm => {
      console.log(`  ${vm.id} (VMID: ${vm.vmid}, Name: ${vm.name}, Node: ${vm.node})`);
    });
    
    console.log('Containers:');
    containers.forEach(container => {
      console.log(`  ${container.id} (VMID: ${container.vmid}, Name: ${container.name}, Node: ${container.node})`);
    });
  }
  
  // Clean up
  clients.forEach(client => client.disconnect());
}

// Test with cluster mode disabled
async function testWithoutClusterMode() {
  console.log('\n=== Testing with Cluster Mode Disabled ===');
  
  // Set environment variables to disable cluster mode
  process.env.MOCK_CLUSTER_ENABLED = 'false';
  
  const clients = nodeConfigs.map(config => new MockClient(config));
  
  // Get VMs and containers from each client
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const vms = await client.getVMs();
    const containers = await client.getContainers();
    
    console.log(`\nNode: ${nodeConfigs[i].name} (${nodeConfigs[i].id})`);
    console.log('VMs:');
    vms.forEach(vm => {
      console.log(`  ${vm.id} (VMID: ${vm.vmid}, Name: ${vm.name}, Node: ${vm.node})`);
    });
    
    console.log('Containers:');
    containers.forEach(container => {
      console.log(`  ${container.id} (VMID: ${container.vmid}, Name: ${container.name}, Node: ${container.node})`);
    });
  }
  
  // Clean up
  clients.forEach(client => client.disconnect());
}

// Run the tests
async function runTests() {
  try {
    await testWithClusterMode();
    await testWithoutClusterMode();
    
    console.log('\n=== Summary ===');
    console.log('With cluster mode enabled:');
    console.log('- VMs and containers have IDs like: test-cluster-vm-100, test-cluster-ct-200');
    console.log('- The same VMID across different nodes will have the same ID');
    console.log('- This results in deduplication in the UI');
    
    console.log('\nWith cluster mode disabled:');
    console.log('- VMs and containers have IDs like: node-1-vm-100, node-2-vm-100');
    console.log('- The same VMID across different nodes will have different IDs');
    console.log('- This results in showing all VMs/containers from all nodes in the UI');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

runTests(); 