/**
 * Run the mock data server
 * 
 * This script runs the mock data server for development and testing.
 */

// Set the port from environment variable or default to 7656
const port = process.env.MOCK_SERVER_PORT || process.env.PORT || '7656';
// Set the host from environment variable or default to 0.0.0.0 (all interfaces)
const host = process.env.MOCK_SERVER_HOST || process.env.HOST || '0.0.0.0';

// Set the port and host in the global scope for the server.ts file to use
(global as any).MOCK_SERVER_PORT = port;
(global as any).HOST = host;

import './server';

console.log(`Mock data server started on host ${host}, port ${port}`);
console.log('Press Ctrl+C to stop the server'); 