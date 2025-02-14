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

// Validate required environment variables
const requiredEnvVars = ['PROXMOX_URL', 'PROXMOX_AUTH'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

const PROXMOX_URL = process.env.PROXMOX_URL;
const AUTH_HEADER = process.env.PROXMOX_AUTH;
const PORT = process.env.PORT || 5173;

// Create custom HTTPS agent that ignores self-signed certs
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

// Handle the API proxy route
app.get('/api/nodes/minipc/lxc', async (req, res) => {
  try {
    console.log('Fetching from Proxmox...');
    
    const response = await fetch(`${PROXMOX_URL}/api2/json/nodes/minipc/lxc`, {
      headers: {
        'Authorization': AUTH_HEADER
      },
      agent: httpsAgent
    });
    
    if (!response.ok) {
      throw new Error(`Proxmox API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Proxmox response:', JSON.stringify(data).substring(0, 200));
    
    res.json(data);
  } catch (error) {
    console.error('Error proxying request:', error);
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
  console.log(`Server running on http://${serverIP}:${PORT}`);
  console.log('Ready to proxy requests to:', PROXMOX_URL);
});