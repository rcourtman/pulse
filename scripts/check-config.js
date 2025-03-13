#!/usr/bin/env node

/**
 * Check Configuration Script
 * 
 * This script checks if the Proxmox configuration is valid before running in production mode.
 * If the configuration is missing or invalid, it provides guidance to the user.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Path to the .env file
const envFilePath = path.join(process.cwd(), '.env');

// Check if .env file exists
if (!fs.existsSync(envFilePath)) {
  console.error('\x1b[31mError: .env file not found.\x1b[0m');
  console.log('Please create a .env file with your Proxmox configuration.');
  process.exit(1);
}

// Check for nodes using the original format (PROXMOX_NODE_X_NAME, etc.)
let hasValidConfig = false;
for (let i = 1; i <= 10; i++) {
  const hostKey = `PROXMOX_NODE_${i}_HOST`;
  const nodeNameKey = `PROXMOX_NODE_${i}_NAME`;
  const tokenIdKey = `PROXMOX_NODE_${i}_TOKEN_ID`;
  const tokenSecretKey = `PROXMOX_NODE_${i}_TOKEN_SECRET`;
  
  const hasNodeConfig = [hostKey, nodeNameKey, tokenIdKey, tokenSecretKey].every(key => 
    process.env[key] && process.env[key] !== 'your-token-secret-here' && process.env[key] !== 'your-token-secret'
  );
  
  if (hasNodeConfig) {
    hasValidConfig = true;
    break;
  }
}

// If mock data is enabled, we don't need Proxmox configuration
const mockDataEnabled = process.env.USE_MOCK_DATA === 'true' || process.env.MOCK_DATA_ENABLED === 'true';

if (!hasValidConfig && !mockDataEnabled) {
  console.error('\x1b[31mError: Missing or invalid Proxmox configuration.\x1b[0m');
  console.log('You need to configure at least one Proxmox node:');
  console.log('\nNode configuration format:');
  console.log('  - PROXMOX_NODE_1_NAME   (e.g. "pve")');
  console.log('  - PROXMOX_NODE_1_HOST   (e.g. "https://proxmox.local:8006")');
  console.log('  - PROXMOX_NODE_1_TOKEN_ID    (e.g. "root@pam!pulse")');
  console.log('  - PROXMOX_NODE_1_TOKEN_SECRET  (your API token)');
  
  console.log('\nYou have two options:');
  console.log('1. Update your .env file with valid Proxmox details');
  console.log('2. Use development mode with mock data instead');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\nWould you like to continue with mock data instead? (y/n): ', (answer) => {
    rl.close();
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log('\n\x1b[33mSwitching to development mode with mock data...\x1b[0m');
      
      // Update the current .env file with development settings
      let envContent = fs.readFileSync(envFilePath, 'utf8');
      envContent = envContent.replace(/NODE_ENV=.*/g, 'NODE_ENV=development');
      envContent = envContent.replace(/USE_MOCK_DATA=.*/g, 'USE_MOCK_DATA=true');
      envContent = envContent.replace(/MOCK_DATA_ENABLED=.*/g, 'MOCK_DATA_ENABLED=true');
      fs.writeFileSync(envFilePath, envContent);
      console.log('\x1b[32mUpdated .env file with development settings and mock data enabled.\x1b[0m');
      
      console.log('\x1b[33mPlease run "npm run dev" to start in development mode.\x1b[0m');
      process.exit(0);
    } else {
      console.log('\nPlease update your .env file with valid Proxmox configuration and try again.');
      process.exit(1);
    }
  });
} else {
  // Configuration is valid
  if (hasValidConfig) {
    console.log('\x1b[32mProxmox configuration is valid. Continuing with production mode.\x1b[0m');
  } else if (mockDataEnabled) {
    console.log('\x1b[32mMock data is enabled. No Proxmox configuration needed. Continuing with production mode.\x1b[0m');
  }
  process.exit(0);
} 