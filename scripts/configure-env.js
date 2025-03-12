#!/usr/bin/env node

/**
 * Script to configure environment variables in .env file
 * Usage: node scripts/configure-env.js [prod|dev]
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Get the environment from command line arguments
const args = process.argv.slice(2);
const env = args[0] || 'dev'; // Default to dev if no argument provided

// Path to the .env file
const envFilePath = path.resolve(process.cwd(), '.env');

// Check if .env file exists
if (!fs.existsSync(envFilePath)) {
  console.error('Error: .env file not found. Please create one by copying .env.example');
  process.exit(1);
}

// Load current .env file
const currentEnv = dotenv.parse(fs.readFileSync(envFilePath));

// Define environment-specific values
const envConfigs = {
  prod: {
    NODE_ENV: 'production',
    LOG_LEVEL: 'info',
    USE_MOCK_DATA: 'false',
    MOCK_DATA_ENABLED: 'false',
    PROXMOX_AUTO_DETECT_CLUSTER: 'true',
    PROXMOX_CLUSTER_MODE: 'true',
    MOCK_CLUSTER_ENABLED: 'false',
    DOCKERFILE: 'docker/Dockerfile'
  },
  'prod:no-cluster': {
    NODE_ENV: 'production',
    LOG_LEVEL: 'info',
    USE_MOCK_DATA: 'false',
    MOCK_DATA_ENABLED: 'false',
    PROXMOX_AUTO_DETECT_CLUSTER: 'false',
    PROXMOX_CLUSTER_MODE: 'false',
    MOCK_CLUSTER_ENABLED: 'false',
    DOCKERFILE: 'docker/Dockerfile'
  },
  dev: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'info',
    USE_MOCK_DATA: 'true',
    MOCK_DATA_ENABLED: 'true',
    PROXMOX_AUTO_DETECT_CLUSTER: 'true',
    PROXMOX_CLUSTER_MODE: 'true',
    MOCK_CLUSTER_ENABLED: 'true',
    DOCKERFILE: 'docker/Dockerfile.dev'
  },
  'dev:no-cluster': {
    NODE_ENV: 'development',
    LOG_LEVEL: 'info',
    USE_MOCK_DATA: 'true',
    MOCK_DATA_ENABLED: 'true',
    PROXMOX_AUTO_DETECT_CLUSTER: 'false',
    PROXMOX_CLUSTER_MODE: 'false',
    MOCK_CLUSTER_ENABLED: 'false',
    DOCKERFILE: 'docker/Dockerfile.dev'
  }
};

// Get the config for the specified environment
const config = envConfigs[env];
if (!config) {
  console.error(`Error: Unknown environment "${env}". Use "prod", "prod:no-cluster", "dev", or "dev:no-cluster".`);
  process.exit(1);
}

// Update the .env file
let envContent = fs.readFileSync(envFilePath, 'utf8');

// Update each environment variable
Object.entries(config).forEach(([key, value]) => {
  // Check if the key exists in the .env file
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(envContent)) {
    // Replace the existing value
    envContent = envContent.replace(regex, `${key}=${value}`);
    console.log(`Updated ${key}=${value}`);
  } else {
    // Add the key if it doesn't exist
    envContent += `\n${key}=${value}`;
    console.log(`Added ${key}=${value}`);
  }
});

// Write the updated content back to the .env file
fs.writeFileSync(envFilePath, envContent);

console.log(`\nEnvironment configured for ${env === 'prod' ? 'production' : env === 'prod:no-cluster' ? 'production (no cluster)' : env === 'dev' ? 'development' : 'development (no cluster)'}`); 