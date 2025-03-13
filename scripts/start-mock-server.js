const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS
app.use(cors());

// Mock data endpoints
app.get('/api/v1/cluster/status', (req, res) => {
  res.json({
    nodes: [
      {
        name: 'pve1',
        status: 'online',
        cpu: {
          usage: 45.2,
          cores: 4
        },
        memory: {
          total: 16777216,
          used: 8388608,
          free: 8388608
        }
      },
      {
        name: 'pve2',
        status: 'online',
        cpu: {
          usage: 32.8,
          cores: 4
        },
        memory: {
          total: 16777216,
          used: 6291456,
          free: 10485760
        }
      }
    ]
  });
});

app.get('/api/v1/cluster/resources', (req, res) => {
  res.json({
    vms: [
      {
        id: '100',
        name: 'vm-100',
        status: 'running',
        node: 'pve1',
        cpu: {
          usage: 25.5,
          cores: 2
        },
        memory: {
          total: 4096,
          used: 2048,
          free: 2048
        }
      }
    ],
    containers: [
      {
        id: '101',
        name: 'ct-101',
        status: 'running',
        node: 'pve2',
        cpu: {
          usage: 15.2,
          cores: 1
        },
        memory: {
          total: 2048,
          used: 1024,
          free: 1024
        }
      }
    ]
  });
});

const PORT = process.env.MOCK_SERVER_PORT || 7655;
app.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`);
}); 