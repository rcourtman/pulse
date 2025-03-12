#!/usr/bin/env node

/**
 * Script to start just the mock server
 * Usage: node scripts/start-mock-server.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Use port 7656 to avoid conflicts with the backend server
const MOCK_PORT = 7656;

console.log(`Starting mock server on port ${MOCK_PORT}...`);

// Set environment variables
process.env.NODE_ENV = 'development';
process.env.USE_MOCK_DATA = 'true';
process.env.MOCK_DATA_ENABLED = 'true';
process.env.MOCK_SERVER_PORT = MOCK_PORT.toString();

// Start the mock server
const mockServer = spawn('npx', ['ts-node', 'src/mock/run-server.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    USE_MOCK_DATA: 'true',
    MOCK_DATA_ENABLED: 'true',
    PORT: MOCK_PORT.toString(),
    MOCK_SERVER_PORT: MOCK_PORT.toString()
  }
});

// Handle mock server exit
mockServer.on('exit', (code) => {
  console.log(`Mock server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping mock server...');
  mockServer.kill();
});

process.on('SIGTERM', () => {
  console.log('Stopping mock server...');
  mockServer.kill();
});

console.log(`Mock server started on port ${MOCK_PORT}`);
console.log('Press Ctrl+C to stop'); 