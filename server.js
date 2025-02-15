import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import https from 'https';
import os from 'os';
import dotenv from 'dotenv';

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

  try {
    console.log(`[${new Date().toISOString()}] Validating token for URL:`, proxmoxUrl);
    
    // Ensure the URL ends with /api2/json
    const baseUrl = proxmoxUrl.endsWith('/') ? proxmoxUrl.slice(0, -1) : proxmoxUrl;
    const apiUrl = `${baseUrl}/api2/json/version`;

    console.log(`[${new Date().toISOString()}] Making request to:`, apiUrl);

    // Try to fetch the version endpoint as a simple validation
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `PVEAPIToken=${apiToken}=${apiTokenSecret}`
      },
      agent: httpsAgent
    });

    console.log(`[${new Date().toISOString()}] Validation response status:`, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${new Date().toISOString()}] Validation error response:`, errorText);
      throw new Error(`Failed to validate token: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[${new Date().toISOString()}] Validation successful:`, data);
    
    // If we get here, the token is valid
    res.json({ 
      valid: true,
      version: data.data.version 
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Token validation error:`, error);
    res.status(401).json({ 
      valid: false, 
      message: 'Invalid credentials or unable to connect to Proxmox server' 
    });
  }
});

// Handle the API proxy route
app.get('/api/nodes/minipc/lxc', async (req, res) => {
  try {
    // Get credentials from request headers
    const authHeader = req.headers['x-proxmox-auth'];
    const proxmoxUrl = req.headers['x-proxmox-url'];

    console.log(`[${new Date().toISOString()}] Received API request with URL:`, proxmoxUrl);

    if (!authHeader || !proxmoxUrl) {
      console.error(`[${new Date().toISOString()}] Missing credentials:`, {
        hasAuth: !!authHeader,
        hasUrl: !!proxmoxUrl
      });
      throw new Error('Missing required Proxmox credentials');
    }

    const baseUrl = proxmoxUrl.endsWith('/') ? proxmoxUrl.slice(0, -1) : proxmoxUrl;
    const apiUrl = `${baseUrl}/api2/json/nodes/minipc/lxc`;

    console.log(`[${new Date().toISOString()}] Making request to:`, apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': authHeader
      },
      agent: httpsAgent
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${new Date().toISOString()}] API error response:`, errorText);
      throw new Error(`Proxmox API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[${new Date().toISOString()}] API request successful`);
    res.json(data);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error proxying request:`, error);
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
  console.log(`[${new Date().toISOString()}] Server running on http://${serverIP}:${PORT}`);
  console.log(`[${new Date().toISOString()}] Ready to proxy requests to Proxmox`);
});