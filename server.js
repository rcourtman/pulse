import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const PROXMOX_URL = 'https://192.168.0.132:8006';
const AUTH_HEADER = 'PVEAPIToken=root@pam!monitoring=134e4338-1b20-438b-94c0-6dfe0e3f87c9';

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

const PORT = 5173;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://192.168.0.187:${PORT}`);
  console.log('Ready to proxy requests to:', PROXMOX_URL);
});
