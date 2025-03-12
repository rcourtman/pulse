/**
 * Test script to check the Proxmox cluster API response
 * This will help diagnose why standalone nodes are being detected as part of a cluster
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

// Test function to check cluster status
const testClusterStatus = async (host, tokenId, tokenSecret, nodeName) => {
  try {
    console.log(`Testing cluster status for node: ${nodeName} (${host})`);
    const client = createClient(host, tokenId, tokenSecret);
    
    // Try to access the cluster status endpoint
    const response = await client.get('/cluster/status');
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response data: ${JSON.stringify(response.data, null, 2)}`);
    
    // Check if there's a cluster type in the response
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      const clusterInfo = response.data.data.find(item => item.type === 'cluster');
      if (clusterInfo) {
        console.log(`Found cluster info: ${JSON.stringify(clusterInfo, null, 2)}`);
        console.log(`This node IS part of a cluster named: ${clusterInfo.name}`);
      } else {
        console.log('No cluster type found in the response');
        console.log('This node is NOT part of a cluster, but the cluster API is available');
      }
    } else {
      console.log('No data array in response');
      console.log('This node is NOT part of a cluster');
    }
    
    console.log('-----------------------------------');
  } catch (error) {
    console.error(`Error testing cluster status for ${nodeName}:`, error.message);
    if (error.response) {
      console.log(`Response status: ${error.response.status}`);
      console.log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    console.log('This node is NOT part of a cluster (error response)');
    console.log('-----------------------------------');
  }
};

// Main function to test all nodes
const testAllNodes = async () => {
  // Node 1
  await testClusterStatus(
    process.env.PROXMOX_HOST,
    process.env.PROXMOX_TOKEN_ID,
    process.env.PROXMOX_TOKEN_SECRET,
    process.env.PROXMOX_NODE
  );
  
  // Node 2
  if (process.env.PROXMOX_HOST_2) {
    await testClusterStatus(
      process.env.PROXMOX_HOST_2,
      process.env.PROXMOX_TOKEN_ID_2,
      process.env.PROXMOX_TOKEN_SECRET_2,
      process.env.PROXMOX_NODE_2
    );
  }
  
  // Node 3
  if (process.env.PROXMOX_HOST_3) {
    await testClusterStatus(
      process.env.PROXMOX_HOST_3,
      process.env.PROXMOX_TOKEN_ID_3,
      process.env.PROXMOX_TOKEN_SECRET_3,
      process.env.PROXMOX_NODE_3
    );
  }
};

// Run the tests
testAllNodes().catch(error => {
  console.error('Error running tests:', error);
}); 