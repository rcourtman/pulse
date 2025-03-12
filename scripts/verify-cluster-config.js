#!/usr/bin/env node

/**
 * Verify Cluster Configuration Script
 * 
 * This script checks the current environment configuration for cluster detection settings
 * and verifies that they are correctly applied.
 * 
 * Usage: node scripts/verify-cluster-config.js
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const envFilePath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envFilePath)) {
  console.error('Error: .env file not found');
  process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envFilePath));

// Check cluster configuration
console.log('=== Cluster Configuration ===');
console.log(`PROXMOX_AUTO_DETECT_CLUSTER: ${envConfig.PROXMOX_AUTO_DETECT_CLUSTER || 'not set'}`);
console.log(`PROXMOX_CLUSTER_MODE: ${envConfig.PROXMOX_CLUSTER_MODE || 'not set'}`);
console.log(`MOCK_CLUSTER_ENABLED: ${envConfig.MOCK_CLUSTER_ENABLED || 'not set'}`);

// Check environment mode
console.log('\n=== Environment Mode ===');
console.log(`NODE_ENV: ${envConfig.NODE_ENV || 'not set'}`);
console.log(`LOG_LEVEL: ${envConfig.LOG_LEVEL || 'not set'}`);
console.log(`USE_MOCK_DATA: ${envConfig.USE_MOCK_DATA || 'not set'}`);
console.log(`MOCK_DATA_ENABLED: ${envConfig.MOCK_DATA_ENABLED || 'not set'}`);

// Check if the configuration is consistent
console.log('\n=== Configuration Analysis ===');

// Check if cluster detection is enabled
const isClusterDetectionEnabled = 
  envConfig.PROXMOX_AUTO_DETECT_CLUSTER === 'true' && 
  envConfig.PROXMOX_CLUSTER_MODE === 'true';

// Check if we're in development mode
const isDevMode = envConfig.NODE_ENV === 'development';

// Check if we're using mock data
const isMockDataEnabled = 
  envConfig.USE_MOCK_DATA === 'true' && 
  envConfig.MOCK_DATA_ENABLED === 'true';

// Check if mock cluster is enabled
const isMockClusterEnabled = envConfig.MOCK_CLUSTER_ENABLED === 'true';

// Check if log level is set to info
const isLogLevelInfo = envConfig.LOG_LEVEL === 'info';

console.log(`Cluster Detection: ${isClusterDetectionEnabled ? 'Enabled' : 'Disabled'}`);
console.log(`Development Mode: ${isDevMode ? 'Yes' : 'No'}`);
console.log(`Log Level: ${envConfig.LOG_LEVEL || 'not set'}`);
console.log(`Mock Data: ${isMockDataEnabled ? 'Enabled' : 'Disabled'}`);
console.log(`Mock Cluster: ${isMockClusterEnabled ? 'Enabled' : 'Disabled'}`);

// Verify configuration consistency
console.log('\n=== Configuration Consistency ===');

if (isDevMode) {
  if (isMockDataEnabled) {
    console.log('✓ Development mode is correctly using mock data');
    
    if (isLogLevelInfo) {
      console.log('✓ Log level is correctly set to info for development mode');
    } else {
      console.log('✗ Log level should be set to info for development mode');
    }
    
    if (isClusterDetectionEnabled) {
      console.log('✓ Cluster detection is correctly enabled for development mode');
      
      if (isMockClusterEnabled) {
        console.log('✓ Mock cluster is correctly enabled for development mode with cluster detection');
      } else {
        console.log('✗ Mock cluster should be enabled for development mode with cluster detection');
      }
    } else {
      console.log('✗ Cluster detection should be enabled for development mode');
      
      if (!isMockClusterEnabled) {
        console.log('✓ Mock cluster is correctly disabled for no-cluster mode');
      } else {
        console.log('✗ Mock cluster should be disabled for no-cluster mode');
      }
    }
  } else {
    console.log('✗ Development mode should use mock data');
  }
} else {
  // Production mode
  if (!isMockDataEnabled) {
    console.log('✓ Production mode is correctly not using mock data');
    
    if (isLogLevelInfo) {
      console.log('✓ Log level is correctly set to info for production mode');
    } else {
      console.log('✗ Log level should be set to info for production mode');
    }
    
    if (isClusterDetectionEnabled) {
      console.log('✓ Cluster detection is correctly enabled for production mode');
    } else {
      console.log('✗ Cluster detection should be enabled for production mode');
    }
  } else {
    console.log('✗ Production mode should not use mock data');
  }
}

console.log('\nVerification complete.'); 