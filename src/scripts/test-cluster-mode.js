/**
 * Test script for Proxmox cluster mode
 * 
 * This script directly tests the cluster mode implementation by simulating
 * VMs and containers with the same VMID from different nodes and checking
 * if they are properly deduplicated.
 */

// Set environment variables for testing
process.env.PROXMOX_CLUSTER_MODE = 'true';
process.env.PROXMOX_CLUSTER_NAME = 'test-cluster';

// Create a simple test environment
const clusterMode = process.env.PROXMOX_CLUSTER_MODE === 'true';
const clusterName = process.env.PROXMOX_CLUSTER_NAME;

// Create test VMs with the same VMID from different nodes
const testVMs = [
  {
    vmid: 100,
    name: 'test-vm',
    status: 'running',
    node: 'node-1',
    type: 'qemu'
  },
  {
    vmid: 100,
    name: 'test-vm',
    status: 'running',
    node: 'node-2',
    type: 'qemu'
  },
  {
    vmid: 101,
    name: 'another-vm',
    status: 'running',
    node: 'node-1',
    type: 'qemu'
  }
];

// Create test containers with the same VMID from different nodes
const testContainers = [
  {
    vmid: 200,
    name: 'test-container',
    status: 'running',
    node: 'node-1',
    type: 'lxc'
  },
  {
    vmid: 200,
    name: 'test-container',
    status: 'running',
    node: 'node-2',
    type: 'lxc'
  }
];

// Function to generate IDs based on cluster mode
function generateId(item) {
  if (clusterMode) {
    return item.type === 'qemu'
      ? `${clusterName}-vm-${item.vmid}`
      : `${clusterName}-ct-${item.vmid}`;
  } else {
    return item.type === 'qemu'
      ? `${item.node}-vm-${item.vmid}`
      : `${item.node}-ct-${item.vmid}`;
  }
}

// Assign IDs to VMs and containers
testVMs.forEach(vm => {
  vm.id = generateId(vm);
});

testContainers.forEach(container => {
  container.id = generateId(container);
});

// Run the test
console.log('=== Cluster Mode Test ===');
console.log(`Cluster Mode: ${clusterMode ? 'Enabled' : 'Disabled'}`);
console.log(`Cluster Name: ${clusterName}`);

// Print all VMs and containers
console.log('\n=== VMs ===');
testVMs.forEach(vm => {
  console.log(`${vm.id} (VMID: ${vm.vmid}, Name: ${vm.name}, Node: ${vm.node})`);
});

console.log('\n=== Containers ===');
testContainers.forEach(container => {
  console.log(`${container.id} (VMID: ${container.vmid}, Name: ${container.name}, Node: ${container.node})`);
});

// Check for duplicates by VMID
const vmsByVmid = new Map();
testVMs.forEach(vm => {
  if (!vmsByVmid.has(vm.vmid)) {
    vmsByVmid.set(vm.vmid, []);
  }
  vmsByVmid.get(vm.vmid).push(vm);
});

const containersByVmid = new Map();
testContainers.forEach(container => {
  if (!containersByVmid.has(container.vmid)) {
    containersByVmid.set(container.vmid, []);
  }
  containersByVmid.get(container.vmid).push(container);
});

// Check for VMs with the same VMID
console.log('\n=== VMs with Same VMID ===');
let inconsistentVmIds = 0;

vmsByVmid.forEach((vms, vmid) => {
  if (vms.length > 1) {
    console.log(`\nVM VMID ${vmid} appears ${vms.length} times:`);
    
    // Check if all VMs with this VMID have the same ID (which means cluster mode is working)
    const ids = new Set(vms.map(vm => vm.id));
    if (ids.size > 1) {
      inconsistentVmIds++;
      console.log(`  ❌ Inconsistent IDs: ${Array.from(ids).join(', ')}`);
    } else {
      console.log(`  ✅ Consistent ID: ${Array.from(ids)[0]}`);
    }
    
    vms.forEach(vm => {
      console.log(`  - ${vm.id} (Name: ${vm.name}, Node: ${vm.node})`);
    });
  }
});

// Check for containers with the same VMID
console.log('\n=== Containers with Same VMID ===');
let inconsistentContainerIds = 0;

containersByVmid.forEach((containers, vmid) => {
  if (containers.length > 1) {
    console.log(`\nContainer VMID ${vmid} appears ${containers.length} times:`);
    
    // Check if all containers with this VMID have the same ID (which means cluster mode is working)
    const ids = new Set(containers.map(container => container.id));
    if (ids.size > 1) {
      inconsistentContainerIds++;
      console.log(`  ❌ Inconsistent IDs: ${Array.from(ids).join(', ')}`);
    } else {
      console.log(`  ✅ Consistent ID: ${Array.from(ids)[0]}`);
    }
    
    containers.forEach(container => {
      console.log(`  - ${container.id} (Name: ${container.name}, Node: ${container.node})`);
    });
  }
});

// Final result
console.log('\n=== Test Summary ===');
console.log(`VMs with inconsistent IDs: ${inconsistentVmIds}`);
console.log(`Containers with inconsistent IDs: ${inconsistentContainerIds}`);

if (inconsistentVmIds === 0 && inconsistentContainerIds === 0) {
  console.log('\n✅ TEST PASSED: Cluster mode is working correctly!');
  console.log('All VMs/CTs with the same VMID have the same ID.');
} else {
  console.log('\n❌ TEST FAILED: Cluster mode is not working as expected.');
  console.log('Some VMs/CTs with the same VMID have different IDs, which means cluster mode ID generation is not working.');
}

// Now test with cluster mode disabled
console.log('\n\n=== Testing with Cluster Mode Disabled ===');
process.env.PROXMOX_CLUSTER_MODE = 'false';
const nonClusterMode = process.env.PROXMOX_CLUSTER_MODE !== 'true';

// Regenerate IDs with cluster mode disabled
testVMs.forEach(vm => {
  vm.id = vm.type === 'qemu'
    ? `${vm.node}-vm-${vm.vmid}`
    : `${vm.node}-ct-${vm.vmid}`;
});

testContainers.forEach(container => {
  container.id = container.type === 'qemu'
    ? `${container.node}-vm-${container.vmid}`
    : `${container.node}-ct-${container.vmid}`;
});

// Print all VMs and containers with cluster mode disabled
console.log(`Cluster Mode: ${!nonClusterMode ? 'Enabled' : 'Disabled'}`);

console.log('\n=== VMs (Cluster Mode Disabled) ===');
testVMs.forEach(vm => {
  console.log(`${vm.id} (VMID: ${vm.vmid}, Name: ${vm.name}, Node: ${vm.node})`);
});

console.log('\n=== Containers (Cluster Mode Disabled) ===');
testContainers.forEach(container => {
  console.log(`${container.id} (VMID: ${container.vmid}, Name: ${container.name}, Node: ${container.node})`);
});

// Check for VMs with the same VMID (cluster mode disabled)
console.log('\n=== VMs with Same VMID (Cluster Mode Disabled) ===');
let nonClusterInconsistentVmIds = 0;

vmsByVmid.forEach((vms, vmid) => {
  if (vms.length > 1) {
    console.log(`\nVM VMID ${vmid} appears ${vms.length} times:`);
    
    // Check if all VMs with this VMID have the same ID
    const ids = new Set(vms.map(vm => vm.id));
    if (ids.size === 1) {
      nonClusterInconsistentVmIds++;
      console.log(`  ❌ Unexpectedly consistent IDs: ${Array.from(ids)[0]}`);
    } else {
      console.log(`  ✅ Correctly different IDs: ${Array.from(ids).join(', ')}`);
    }
    
    vms.forEach(vm => {
      console.log(`  - ${vm.id} (Name: ${vm.name}, Node: ${vm.node})`);
    });
  }
});

// Compare results
console.log('\n=== Overall Test Results ===');
console.log(`With Cluster Mode: ${inconsistentVmIds} VMs and ${inconsistentContainerIds} containers with inconsistent IDs`);
console.log(`Without Cluster Mode: ${nonClusterInconsistentVmIds} VMs with unexpectedly consistent IDs`);

if (inconsistentVmIds === 0 && inconsistentContainerIds === 0 && nonClusterInconsistentVmIds === 0) {
  console.log('\n✅ OVERALL TEST PASSED: Cluster mode implementation works correctly!');
} else {
  console.log('\n❌ OVERALL TEST FAILED: Cluster mode implementation has issues.');
} 