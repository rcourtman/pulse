/**
 * Test script to verify our fix for cluster detection
 * This script directly tests the fixed isNodeInCluster function
 */

const axios = require('axios');
const https = require('https');
require('dotenv').config();

// Create an axios instance with SSL verification disabled
const createClient = (host, tokenId, tokenSecret) => {
  return axios.create({
    baseURL: `${host}/api2/json`,
    headers: {
      'Authorization': `PVEAPIToken=${tokenId}=${tokenSecret}`
    },
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  });
};

// Our fixed isNodeInCluster function
async function isNodeInCluster(client, nodeName) {
  try {
    console.log(`Testing cluster detection for node: ${nodeName}`);
    
    // Try to access the cluster status endpoint
    const response = await client.get('/cluster/status');
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response data: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // Only consider it a cluster if we find an item with type: "cluster"
      const clusterInfo = response.data.data.find(item => item.type === 'cluster');
      
      console.log(`Cluster info: ${JSON.stringify(clusterInfo, null, 2)}`);
      
      if (clusterInfo && clusterInfo.type === 'cluster') {
        const clusterName = clusterInfo.name || 'proxmox-cluster';
        console.log(`Node IS part of cluster: ${clusterName}`);
        return { isCluster: true, clusterName };
      } else {
        console.log('Node has cluster API but no cluster type found - NOT part of a cluster');
        return { isCluster: false, clusterName: '' };
      }
    } else {
      console.log('Node is not part of a cluster (empty response data)');
      return { isCluster: false, clusterName: '' };
    }
  } catch (error) {
    // If we get a 404 error, it means the cluster endpoint doesn't exist, so the node is not part of a cluster
    if (error.response && error.response.status === 404) {
      console.log('Node is not part of a cluster (404 response from cluster endpoint)');
      return { isCluster: false, clusterName: '' };
    }
    
    // For other errors, log them but assume the node is not in a cluster
    console.error('Error checking if node is in cluster:', error.message);
    if (error.response) {
      console.log(`Response status: ${error.response.status}`);
      console.log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { isCluster: false, clusterName: '' };
  }
}

// Test function for a single node
async function testNode(host, tokenId, tokenSecret, nodeName) {
  console.log(`\n=== Testing node: ${nodeName} (${host}) ===\n`);
  try {
    const client = createClient(host, tokenId, tokenSecret);
    const result = await isNodeInCluster(client, nodeName);
    console.log(`\nFinal result: Node ${nodeName} ${result.isCluster ? 'IS' : 'is NOT'} part of a cluster`);
    if (result.isCluster) {
      console.log(`Cluster name: ${result.clusterName}`);
    }
  } catch (error) {
    console.error(`Error testing node ${nodeName}:`, error.message);
  }
  console.log('\n=== Test complete ===\n');
}

// Main function to test all nodes
async function testAllNodes() {
  // Node 1
  await testNode(
    process.env.PROXMOX_NODE_1_HOST,
    process.env.PROXMOX_NODE_1_TOKEN_ID,
    process.env.PROXMOX_NODE_1_TOKEN_SECRET,
    process.env.PROXMOX_NODE_1_NAME
  );
  
  // Node 2
  if (process.env.PROXMOX_NODE_2_HOST) {
    await testNode(
      process.env.PROXMOX_NODE_2_HOST,
      process.env.PROXMOX_NODE_2_TOKEN_ID,
      process.env.PROXMOX_NODE_2_TOKEN_SECRET,
      process.env.PROXMOX_NODE_2_NAME
    );
  }
  
  // Node 3
  if (process.env.PROXMOX_NODE_3_HOST) {
    await testNode(
      process.env.PROXMOX_NODE_3_HOST,
      process.env.PROXMOX_NODE_3_TOKEN_ID,
      process.env.PROXMOX_NODE_3_TOKEN_SECRET,
      process.env.PROXMOX_NODE_3_NAME
    );
  }
}

// Run the tests
testAllNodes().catch(error => {
  console.error('Error running tests:', error);
}); 