#!/usr/bin/env node

/**
 * Script to check connections between frontend, backend, and mock server
 * Usage: node scripts/check-connections.js
 */

const http = require('http');
const net = require('net');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('Pulse Connection Checker');
console.log('=======================');
console.log(`Environment: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`USE_MOCK_DATA: ${process.env.USE_MOCK_DATA || 'Not set'}`);
console.log(`MOCK_DATA_ENABLED: ${process.env.MOCK_DATA_ENABLED || 'Not set'}`);

// Check if a port is in use
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false); // Port is not in use
    });
    
    server.listen(port);
  });
}

// Check if a server is responding on a given port
function checkServer(host, port, path = '/') {
  return new Promise((resolve) => {
    const req = http.request({
      host,
      port,
      path,
      method: 'GET',
      timeout: 3000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data.substring(0, 100) // Just get the first 100 chars
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        status: 'error',
        error: err.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 'timeout',
        error: 'Request timed out'
      });
    });
    
    req.end();
  });
}

// Check frontend socket.js file
function checkFrontendSocketConfig() {
  const socketJsPath = path.join(process.cwd(), 'frontend', 'src', 'hooks', 'useSocket.js');
  
  if (!fs.existsSync(socketJsPath)) {
    return {
      exists: false,
      error: 'useSocket.js file not found'
    };
  }
  
  const content = fs.readFileSync(socketJsPath, 'utf8');
  
  // Check if we're using the dynamic port selection
  if (content.includes('useMockData ?')) {
    // We're using dynamic port selection
    const isDevelopment = process.env.NODE_ENV === 'development';
    const useMockData = process.env.USE_MOCK_DATA === 'true' || process.env.MOCK_DATA_ENABLED === 'true';
    
    if (isDevelopment) {
      const port = useMockData ? '7656' : '7654';
      return {
        exists: true,
        port,
        isDynamic: true,
        useMockData
      };
    } else {
      // In production, we use window.location.origin
      return {
        exists: true,
        port: '7654', // Production always uses 7654
        isDynamic: true,
        useMockData: false
      };
    }
  } else {
    // Extract the port from the socketUrl (old method)
    const portMatch = content.match(/socketUrl\s*=\s*`http:\/\/\${currentHost}:(\d+)`/);
    const port = portMatch ? portMatch[1] : null;
    
    return {
      exists: true,
      port,
      isDynamic: false
    };
  }
}

async function main() {
  // Check if backend server is running (port 7654)
  const backendRunning = await checkPort(7654);
  console.log(`\nBackend server (port 7654): ${backendRunning ? 'RUNNING' : 'NOT RUNNING'}`);
  
  if (backendRunning) {
    const backendResponse = await checkServer('localhost', 7654);
    console.log(`  Response: ${typeof backendResponse.status === 'number' ? backendResponse.status : backendResponse.status}`);
    if (backendResponse.error) {
      console.log(`  Error: ${backendResponse.error}`);
    }
  }
  
  // Check if mock server is running (port 7656)
  const mockRunning = await checkPort(7656);
  console.log(`\nMock server (port 7656): ${mockRunning ? 'RUNNING' : 'NOT RUNNING'}`);
  
  if (mockRunning) {
    const mockResponse = await checkServer('localhost', 7656);
    console.log(`  Response: ${typeof mockResponse.status === 'number' ? mockResponse.status : mockResponse.status}`);
    if (mockResponse.error) {
      console.log(`  Error: ${mockResponse.error}`);
    }
  }
  
  // Check frontend socket configuration
  const socketConfig = checkFrontendSocketConfig();
  console.log('\nFrontend Socket Configuration:');
  if (socketConfig.exists) {
    if (socketConfig.isDynamic) {
      console.log('  Dynamic port selection: ENABLED');
      console.log(`  Current environment: ${process.env.NODE_ENV || 'Not set'}`);
      console.log(`  Mock data enabled: ${socketConfig.useMockData ? 'Yes' : 'No'}`);
      console.log(`  Will connect to port: ${socketConfig.port}`);
      
      if (socketConfig.port === '7654') {
        console.log('  Frontend is configured to connect to the BACKEND server');
      } else if (socketConfig.port === '7656') {
        console.log('  Frontend is configured to connect to the MOCK server');
      }
    } else {
      console.log(`  Socket port: ${socketConfig.port || 'Not found'}`);
      if (socketConfig.port === '7654') {
        console.log('  Frontend is configured to connect to the BACKEND server');
      } else if (socketConfig.port === '7656') {
        console.log('  Frontend is configured to connect to the MOCK server');
      } else {
        console.log(`  Frontend is configured to connect to an UNKNOWN port: ${socketConfig.port}`);
      }
    }
  } else {
    console.log(`  Error: ${socketConfig.error}`);
  }
  
  // Check if frontend dev server is running
  const frontendRunning = await checkPort(5173);
  console.log(`\nFrontend dev server (port 5173): ${!frontendRunning ? 'RUNNING' : 'NOT RUNNING'}`);
  
  // Summary and recommendations
  console.log('\nSummary:');
  
  if (process.env.NODE_ENV === 'production') {
    console.log('- Running in PRODUCTION mode');
    
    if (process.env.USE_MOCK_DATA === 'true' || process.env.MOCK_DATA_ENABLED === 'true') {
      console.log('  WARNING: Mock data is enabled in production mode!');
    }
    
    if (socketConfig.port === '7656') {
      console.log('  WARNING: Frontend is configured to connect to the mock server (port 7656) but you are in production mode!');
      console.log('  SOLUTION: Edit frontend/src/hooks/useSocket.js to use port 7654 instead of 7656');
    }
  } else {
    console.log('- Running in DEVELOPMENT mode');
    
    if (process.env.USE_MOCK_DATA !== 'true' && process.env.MOCK_DATA_ENABLED !== 'true') {
      console.log('  NOTE: Mock data is disabled in development mode');
    }
    
    if (socketConfig.port === '7654' && (process.env.USE_MOCK_DATA === 'true' || process.env.MOCK_DATA_ENABLED === 'true')) {
      console.log('  WARNING: Frontend is configured to connect to the backend server (port 7654) but mock data is enabled!');
      console.log('  SOLUTION: Edit frontend/src/hooks/useSocket.js to use port 7656 instead of 7654');
    }
  }
  
  if (backendRunning && mockRunning && socketConfig.port === '7656' && process.env.NODE_ENV === 'production') {
    console.log('\nPROBLEM DETECTED: You are running in production mode but the frontend is connecting to the mock server!');
    console.log('SOLUTION: Kill all servers, edit frontend/src/hooks/useSocket.js to use port 7654, and restart with npm run prod');
  }
  
  if (!backendRunning && process.env.NODE_ENV === 'production') {
    console.log('\nPROBLEM DETECTED: Production backend server is not running!');
    console.log('SOLUTION: Start the production server with npm run prod');
  }
  
  if (!mockRunning && (process.env.USE_MOCK_DATA === 'true' || process.env.MOCK_DATA_ENABLED === 'true')) {
    console.log('\nPROBLEM DETECTED: Mock data is enabled but the mock server is not running!');
    console.log('SOLUTION: Start the mock server with npm run mock');
  }
}

main().catch(console.error); 