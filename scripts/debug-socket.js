/**
 * Socket.io Debug Proxy for Pulse
 * 
 * This script creates a proxy server that sits between the frontend and backend,
 * logging all socket.io messages to help debug connection issues.
 */

const express = require('express');
const http = require('http');
const { Server: SocketServer } = require('socket.io');
const { io: SocketClient } = require('socket.io-client');
const fs = require('fs');

// Create Express app and HTTP server for the proxy
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Configuration
const PROXY_PORT = 7657;
const BACKEND_PORT = 7656;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
const LOG_FILE = './socket-debug.log';

// Clear previous log file
fs.writeFileSync(LOG_FILE, '--- Socket.io Debug Log ---\n\n');

// Helper function to log messages
const logMessage = (direction, type, data) => {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${direction} | ${type} | ${JSON.stringify(data, null, 2)}\n`;
  
  console.log(`${direction} | ${type}`);
  fs.appendFileSync(LOG_FILE, message);
};

// Connect to the real backend with reconnection options
const backendSocket = SocketClient(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

// Handle connections from the frontend
io.on('connection', (frontendSocket) => {
  console.log(`Frontend connected: ${frontendSocket.id}`);
  logMessage('INFO', 'FRONTEND_CONNECTED', { socketId: frontendSocket.id });

  // Request initial data from backend when frontend connects
  // This ensures we capture the initial data messages
  if (backendSocket.connected) {
    console.log('Requesting initial data from backend');
    logMessage('INFO', 'REQUESTING_INITIAL_DATA', {});
    
    // Emit a custom message to request initial data
    // The backend should respond with the initial data messages
    backendSocket.emit('requestInitialData');
  }

  // Handle messages from frontend to backend
  frontendSocket.onAny((event, ...args) => {
    logMessage('FRONTEND → BACKEND', event, args);
    backendSocket.emit(event, ...args);
  });

  // Handle disconnection
  frontendSocket.on('disconnect', () => {
    console.log(`Frontend disconnected: ${frontendSocket.id}`);
    logMessage('INFO', 'FRONTEND_DISCONNECTED', { socketId: frontendSocket.id });
  });

  // Forward backend messages to frontend
  backendSocket.onAny((event, ...args) => {
    logMessage('BACKEND → FRONTEND', event, args);
    frontendSocket.emit(event, ...args);
  });
});

// Handle backend connection events
backendSocket.on('connect', () => {
  console.log(`Connected to backend: ${backendSocket.id}`);
  logMessage('INFO', 'BACKEND_CONNECTED', { socketId: backendSocket.id });
});

backendSocket.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected to backend after ${attemptNumber} attempts`);
  logMessage('INFO', 'BACKEND_RECONNECTED', { attemptNumber });
});

backendSocket.on('disconnect', () => {
  console.log('Disconnected from backend');
  logMessage('INFO', 'BACKEND_DISCONNECTED', {});
});

backendSocket.on('connect_error', (err) => {
  console.error(`Backend connection error: ${err.message}`);
  logMessage('ERROR', 'BACKEND_CONNECTION_ERROR', { error: err.message });
});

// Start the proxy server
server.listen(PROXY_PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║                                                            ║
  ║  Socket.io Debug Proxy                                     ║
  ║                                                            ║
  ║  Proxy running on port ${PROXY_PORT}                          ║
  ║  Forwarding to backend on port ${BACKEND_PORT}                ║
  ║                                                            ║
  ║  All messages are being logged to ${LOG_FILE}   ║
  ║                                                            ║
  ╚════════════════════════════════════════════════════════════╝
  `);
}); 