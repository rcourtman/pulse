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

// Check if Proxmox configuration is valid
// We'll check for the default configuration or additional nodes
const defaultVars = [
  'PROXMOX_HOST',
  'PROXMOX_NODE',
  'PROXMOX_TOKEN_ID',
  'PROXMOX_TOKEN_SECRET'
];

// Check if we have the default configuration
const hasDefaultConfig = defaultVars.every(varName => 
  process.env[varName] && process.env[varName] !== 'your-token-secret-here' && process.env[varName] !== 'your-token-secret'
);

// Check for additional nodes (with numeric suffix)
let hasAdditionalNodes = false;
for (let i = 2; i <= 10; i++) {
  const hostKey = `PROXMOX_HOST_${i}`;
  const nodeNameKey = `PROXMOX_NODE_${i}`;
  const tokenIdKey = `PROXMOX_TOKEN_ID_${i}`;
  const tokenSecretKey = `PROXMOX_TOKEN_SECRET_${i}`;
  
  const hasNodeConfig = [hostKey, nodeNameKey, tokenIdKey, tokenSecretKey].every(key => 
    process.env[key] && process.env[key] !== 'your-token-secret-here' && process.env[key] !== 'your-token-secret'
  );
  
  if (hasNodeConfig) {
    hasAdditionalNodes = true;
    break;
  }
}

// If mock data is enabled, we don't need Proxmox configuration
const mockDataEnabled = process.env.USE_MOCK_DATA === 'true' || process.env.MOCK_DATA_ENABLED === 'true';

if (!hasDefaultConfig && !hasAdditionalNodes && !mockDataEnabled) {
  console.error('\x1b[31mError: Missing or invalid Proxmox configuration.\x1b[0m');
  console.log('You need to configure at least one Proxmox node:');
  console.log('\nDefault node configuration:');
  defaultVars.forEach(varName => {
    console.log(`  - ${varName}`);
  });
  
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
  if (hasDefaultConfig) {
    console.log('\x1b[32mDefault Proxmox configuration is valid. Continuing with production mode.\x1b[0m');
  } else if (hasAdditionalNodes) {
    console.log('\x1b[32mAdditional Proxmox node configuration is valid. Continuing with production mode.\x1b[0m');
  } else if (mockDataEnabled) {
    console.log('\x1b[32mMock data is enabled. No Proxmox configuration needed. Continuing with production mode.\x1b[0m');
  }
  process.exit(0);
} 