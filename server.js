import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import https from 'https';
import os from 'os';
import dotenv from 'dotenv';
import logger, { requestLogger, getLoggerWithRequestId } from './src/utils/logger.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to get the local IP address
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const ifname of Object.keys(interfaces)) {
    for (const iface of interfaces[ifname]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost'; // Fallback
};

const app = express();
const PORT = process.env.PORT || 3001;

// Add JSON parsing middleware
app.use(express.json());

// Add request logging middleware
app.use(requestLogger);

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Create custom HTTPS agent that ignores self-signed certs
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Token validation endpoint
app.post('/api/validate-token', async (req, res) => {
  const { proxmoxUrl, apiToken, apiTokenSecret } = req.body;

  if (!proxmoxUrl || !apiToken || !apiTokenSecret) {
    return res.status(400).json({ 
      valid: false, 
      message: 'Missing required credentials' 
    });
  }

  const log = getLoggerWithRequestId(req.requestId);
  
  try {
    log.info('Validating token for URL', { proxmoxUrl });
    
    // Ensure the URL ends with /api2/json
    const baseUrl = proxmoxUrl.endsWith('/') ? proxmoxUrl.slice(0, -1) : proxmoxUrl;
    const apiUrl = `${baseUrl}/api2/json/version`;

    log.debug('Making request to Proxmox API', { apiUrl });

    // Try to fetch the version endpoint as a simple validation
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `PVEAPIToken=${apiToken}=${apiTokenSecret}`
      },
      agent: httpsAgent
    });

    log.debug('Validation response received', { status: response.status });

    if (!response.ok) {
      const errorText = await response.text();
      log.error('Token validation failed', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Failed to validate token: ${response.statusText}`);
    }

    const data = await response.json();
    log.info('Token validation successful', {
      version: data.data.version
    });
    
    // If we get here, the token is valid
    res.json({
      valid: true,
      version: data.data.version
    });
  } catch (error) {
    log.error('Token validation error', {
      error: error.message,
      stack: error.stack
    });
    res.status(401).json({
      valid: false,
      message: 'Invalid credentials or unable to connect to Proxmox server'
    });
  }
});

// Handle the API proxy route
app.get('/api/nodes/minipc/lxc', async (req, res) => {
  const log = getLoggerWithRequestId(req.requestId);

  try {
    // Get credentials from request headers
    const authHeader = req.headers['x-proxmox-auth'];
    const proxmoxUrl = req.headers['x-proxmox-url'];

    log.info('Received API request', { proxmoxUrl });

    if (!authHeader || !proxmoxUrl) {
      log.error('Missing credentials', {
        hasAuth: !!authHeader,
        hasUrl: !!proxmoxUrl
      });
      throw new Error('Missing required Proxmox credentials');
    }

    const baseUrl = proxmoxUrl.endsWith('/') ? proxmoxUrl.slice(0, -1) : proxmoxUrl;
    const apiUrl = `${baseUrl}/api2/json/nodes/minipc/lxc`;

    log.debug('Making request to Proxmox API', { apiUrl });

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': authHeader
      },
      agent: httpsAgent
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      log.error('Proxmox API error', {
        status: response.status,
        errorText
      });
      throw new Error(`Proxmox API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    log.info('API request successful', {
      containerCount: data.data?.length
    });
    res.json(data);
  } catch (error) {
    log.error('Error proxying request', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message });
  }
});

// Serve static files
app.use(express.static('dist'));

// Handle all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const serverIP = getLocalIP();
app.listen(PORT, '0.0.0.0', () => {
  // Log startup info to file only
  logger.info('Server details', {
    url: `http://${serverIP}:${PORT}`,
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  });
  
  // Console startup messages
  logger.info('Server started');
  logger.info('Ready to proxy requests to Proxmox');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  // Give logger time to write before exiting
  setTimeout(() => process.exit(1), 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined
  });
});