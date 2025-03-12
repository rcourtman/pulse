/**
 * Mock Data Server for Pulse
 * 
 * This script generates simulated data for development and testing.
 * It overrides the socket connection to provide consistent, visually appealing data.
 * 
 * Usage:
 * 1. Run this script with Node.js
 * 2. Start the backend with mock data enabled
 * 3. Start the frontend
 */

import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { vmTemplates, containerTemplates } from './templates';
import { customMockData } from './custom-data';
import { createLogger } from '../utils/logger';

const logger = createLogger('MockServer');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Port for the mock server
const PORT = (global as any).MOCK_SERVER_PORT ? parseInt((global as any).MOCK_SERVER_PORT, 10) : 7656;
// Host for the mock server (default to 0.0.0.0 to bind to all interfaces)
const HOST = (global as any).HOST || process.env.MOCK_SERVER_HOST || '0.0.0.0';

// Log the configuration
logger.info(`Mock server configured to use host: ${HOST}, port: ${PORT}`);

// Generate a random number between min and max
const randomBetween = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1) + min);

// Generate a random floating point number between min and max with specified precision
const randomFloatBetween = (min: number, max: number, precision = 2): number => {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(precision));
};

// Generate a random IP address
const randomIP = (): string => {
  return `192.168.${randomBetween(1, 254)}.${randomBetween(1, 254)}`;
};

// Generate a random MAC address
const randomMAC = (): string => {
  return Array(6).fill(0).map(() => {
    const part = randomBetween(0, 255).toString(16);
    return part.length === 1 ? `0${part}` : part;
  }).join(':');
};

// Store connected clients
const clients = new Map();

// Store node data - initialize with custom data
const nodes = new Map<string, MockNode>(customMockData.nodes.map(node => [node.id, node as MockNode]));

// Define a more comprehensive node type for the nodes map
interface MockNode {
  id: string;
  name: string;
  status: string;
  cpu: { usage: number; cores: number; };
  memory: { used: number; total: number; };
  guests: { id: string; name: string; type: string; status: string; cpu: number; memory: number; }[];
  vms?: any[];
  containers?: any[];
}

// Store guest data - initialize with custom data
// Use a nested map structure: Map<nodeId, Array<guest>>
const guests = new Map();
customMockData.nodes.forEach(node => {
  // Create an array of guests for this node
  const nodeGuests = node.guests.map(guest => ({
    ...guest,
    nodeId: node.id,
    node: node.id // Add node property for compatibility
  }));
  
  // Store the guests array for this node
  guests.set(node.id, nodeGuests);
  
  // Log the number of guests for this node
  logger.info(`Initialized ${nodeGuests.length} guests for node ${node.id}`);
});

// Store metrics data
const metrics = new Map();

// Define types for our mock data
interface MockVM {
  id: string;
  name: string;
  type: string;
  status: string;
  os?: string;
  cpu: number | {
    cores?: number;
    usage: number;
  };
  memory: number | {
    total: number;
    used: number;
  };
  disk?: {
    total: number;
    used: number;
  };
  network?: {
    ip: string;
    mac: string;
    throughput: {
      in: number;
      out: number;
    };
  };
  uptime?: number;
  nodeId?: string;
  node?: string; // Add the node property to match our custom data
}

interface MockContainer extends MockVM {}

interface MockMetric {
  guestId: string;
  timestamp: number;
  metrics: {
    cpu: number;
    memory: {
      total: number;
      used: number;
      percentUsed: number;
    };
    disk: {
      total: number;
      used: number;
      percentUsed: number;
    };
    network: {
      inRate: number;
      outRate: number;
      history: Array<{
        in: number;
        out: number;
      }>;
    };
  };
  history: {
    cpu: number[];
    memory: number[];
    disk: number[];
  };
}

// REST API endpoints
app.get('/api/nodes', (req, res) => {
  res.json({ nodes: Array.from(nodes.values()) });
});

app.get('/api/resources', (req, res) => {
  res.json(customMockData);
});

app.get('/api/mock-data', (req, res) => {
  res.json(customMockData);
});

// Generate guest data
const generateGuests = (): MockVM[] => {
  // This function is no longer used - we're using custom data instead
  return [];
};

// Generate metrics for guests
const generateMetrics = (nodeId: string, nodeGuests: MockVM[]): MockMetric[] => {
  const generatedMetrics: MockMetric[] = [];
  
  // Process each guest
  nodeGuests.forEach((guest: MockVM) => {
    if (guest.status === 'running') {
      // Generate random metrics
      const cpuUsage = typeof guest.cpu === 'number' ? guest.cpu * 100 : guest.cpu.usage * 100;
      
      // Handle different memory structures
      const memoryTotal = typeof guest.memory === 'number' ? guest.memory : guest.memory.total;
      const memoryUsed = typeof guest.memory === 'number' ? 
        Math.floor(guest.memory * 0.7) : 
        guest.memory.used;
      
      // Handle disk
      const diskTotal = guest.disk?.total || 1073741824; // 1GB default
      const diskUsed = guest.disk?.used || 536870912; // 512MB default
      const diskPercentUsed = (diskUsed / diskTotal) * 100;
      
      // Generate network metrics
      const networkIn = randomFloatBetween(0.1, 50); // MB/s
      const networkOut = randomFloatBetween(0.1, 20); // MB/s
      
      generatedMetrics.push({
        guestId: guest.id,
        timestamp: Date.now(),
        metrics: {
          cpu: cpuUsage,
          memory: {
            total: memoryTotal,
            used: memoryUsed,
            percentUsed: (memoryUsed / memoryTotal) * 100
          },
          disk: {
            total: diskTotal,
            used: diskUsed,
            percentUsed: diskPercentUsed
          },
          network: {
            inRate: networkIn,
            outRate: networkOut,
            history: Array(10).fill(0).map(() => ({
              in: randomBetween(Math.max(0, networkIn * 0.8), networkIn * 1.2),
              out: randomBetween(Math.max(0, networkOut * 0.8), networkOut * 1.2)
            }))
          }
        },
        history: {
          cpu: Array(10).fill(0).map(() => 
            randomFloatBetween(Math.max(0, cpuUsage - 20), Math.min(100, cpuUsage + 20))
          ),
          memory: Array(10).fill(0).map(() => 
            randomFloatBetween(Math.max(0, memoryUsed - 15), Math.min(100, memoryUsed + 15))
          ),
          disk: Array(10).fill(0).map(() => 
            randomFloatBetween(Math.max(0, diskUsed - 5), Math.min(100, diskUsed + 5))
          )
        }
      });
    }
  });
  
  return generatedMetrics;
};

// Send initial data to the client
const sendInitialData = (socket: Socket) => {
  // Convert nodes map to array
  const nodeArray = Array.from(nodes.values());
  
  // Send node data
  socket.emit('nodes', { nodes: nodeArray });
  
  // Get client info
  const clientInfo = clients.get(socket.id);
  
  if (clientInfo?.nodeId) {
    // Client has registered for a specific node
    const nodeId = clientInfo.nodeId;
    
    // Get the node's guests
    const nodeGuests = guests.get(nodeId) || [];
    
    // Process guest data to ensure it has the right format
    const processedGuests = nodeGuests.map((guest: MockVM) => {
      // Handle different memory structures
      const memoryTotal = typeof guest.memory === 'number' ? guest.memory : guest.memory.total;
      
      return {
        ...guest,
        memory: typeof guest.memory === 'number' ? { total: guest.memory, used: Math.floor(guest.memory * 0.7) } : guest.memory
      };
    });
    
    // Send guest data for this node
    socket.emit('guests', { guests: processedGuests });
    
    // Generate and send metrics for this node
    const nodeMetrics = generateMetrics(nodeId, nodeGuests);
    metrics.set(nodeId, nodeMetrics);
    socket.emit('metrics', { metrics: nodeMetrics });
    
    logger.info(`Sent initial data for node ${nodeId}: ${nodeGuests.length} guests, ${nodeMetrics.length} metrics`);
  } else {
    // Client hasn't registered for a specific node, send all guests
    // This is useful for the dashboard view
    
    // Collect all guests from all nodes
    const allGuests = [];
    const allMetrics = [];
    
    // Process each node
    for (const [nodeId, nodeGuests] of guests.entries()) {
      // Process guest data
      const processedGuests = nodeGuests.map((guest: MockVM) => {
        return {
          ...guest,
          memory: typeof guest.memory === 'number' ? { total: guest.memory, used: Math.floor(guest.memory * 0.7) } : guest.memory
        };
      });
      
      // Add to all guests
      allGuests.push(...processedGuests);
      
      // Generate metrics for this node
      const nodeMetrics = generateMetrics(nodeId, nodeGuests);
      metrics.set(nodeId, nodeMetrics);
      allMetrics.push(...nodeMetrics);
    }
    
    // Send all guest data
    socket.emit('guests', { guests: allGuests });
    
    // Send all metrics
    socket.emit('metrics', { metrics: allMetrics });
    
    logger.info(`Sent initial data for all nodes: ${allGuests.length} guests, ${allMetrics.length} metrics`);
  }
};

// Function to update metrics for a socket
const updateMetrics = (socket: Socket) => {
  // Get client info
  const clientInfo = clients.get(socket.id);
  
  // If the client has registered for a specific node, update that node's data
  // Otherwise, update data for all nodes
  if (clientInfo?.nodeId) {
    // Update data for the specific node
    const nodeId = clientInfo.nodeId;
    
    // Get the node's guests
    const nodeGuests = guests.get(nodeId) || [];
    if (!nodeGuests || nodeGuests.length === 0) {
      logger.warn(`No guests found for node ${nodeId}`);
      return;
    }
    
    // Get current metrics
    const currentMetrics = metrics.get(nodeId) || [];
    
    // Update metrics
    const updatedMetrics = currentMetrics.map((metric: MockMetric) => {
      const guest = nodeGuests.find((g: MockVM) => g.id === metric.guestId);
      if (!guest || guest.status !== 'running') {
        return metric;
      }
      
      // Update CPU usage (slight variation from previous value)
      const currentCpu = metric.metrics.cpu;
      const cpuDelta = randomFloatBetween(-5, 5);
      const newCpu = Math.max(1, Math.min(100, currentCpu + cpuDelta));
      
      // Update memory usage (slight variation from previous value)
      const currentMemoryPercent = metric.metrics.memory.percentUsed;
      const memoryDelta = randomFloatBetween(-2, 2);
      const newMemoryPercent = Math.max(5, Math.min(95, currentMemoryPercent + memoryDelta));
      
      // Check if memory is a number or an object
      const memoryTotal = typeof guest.memory === 'number' ? guest.memory : guest.memory.total;
      const newMemoryUsed = (memoryTotal * newMemoryPercent) / 100;
      
      // Update disk usage (slight variation from previous value)
      const diskTotal = guest.disk?.total || 1073741824; // 1GB default
      const diskUsed = guest.disk?.used || 536870912; // 512MB default
      const currentDiskPercent = diskUsed / diskTotal * 100;
      const diskDelta = randomFloatBetween(-1, 1);
      const newDiskPercent = Math.max(1, Math.min(99, currentDiskPercent + diskDelta));
      const newDiskUsed = (diskTotal * newDiskPercent) / 100;
      
      // Update network throughput
      const newInRate = randomFloatBetween(0.1, 50);
      const newOutRate = randomFloatBetween(0.1, 20);
      
      // Update history
      const newCpuHistory = [...metric.history.cpu.slice(1), newCpu];
      const newMemoryHistory = [...metric.history.memory.slice(1), newMemoryPercent];
      const newDiskHistory = [...(metric.history.disk || Array(10).fill(0)), newDiskPercent].slice(-10);
      
      return {
        ...metric,
        timestamp: Date.now(),
        metrics: {
          ...metric.metrics,
          cpu: newCpu,
          memory: {
            ...metric.metrics.memory,
            used: newMemoryUsed,
            percentUsed: newMemoryPercent
          },
          disk: {
            ...metric.metrics.disk,
            used: newDiskUsed,
            percentUsed: newDiskPercent
          },
          network: {
            ...metric.metrics.network,
            inRate: newInRate,
            outRate: newOutRate,
            history: [...metric.metrics.network.history.slice(1), { in: newInRate, out: newOutRate }]
          }
        },
        history: {
          ...metric.history,
          cpu: newCpuHistory,
          memory: newMemoryHistory,
          disk: newDiskHistory
        }
      };
    });
    
    // Store updated metrics
    metrics.set(nodeId, updatedMetrics);
    
    // Send updated data
    socket.emit('guests', { guests: nodeGuests });
    socket.emit('metrics', { metrics: updatedMetrics });
  } else {
    // Client hasn't registered for a specific node, update all nodes
    // This is useful for the dashboard view
    
    // Get all guests and metrics
    const allGuests = [];
    const allMetrics = [];
    const updatedMetricsByNode = new Map();
    
    // Process each node
    for (const [nodeId, nodeGuests] of guests.entries()) {
      // Process guest data
      const processedGuests = nodeGuests.map((guest: MockVM) => {
        return {
          ...guest,
          memory: typeof guest.memory === 'number' ? { total: guest.memory, used: Math.floor(guest.memory * 0.7) } : guest.memory
        };
      });
      
      // Add to all guests
      allGuests.push(...processedGuests);
      
      // Get current metrics for this node
      const currentMetrics = metrics.get(nodeId) || [];
      
      // Update metrics for this node
      const updatedMetrics = currentMetrics.map((metric: MockMetric) => {
        const guest = nodeGuests.find((g: MockVM) => g.id === metric.guestId);
        if (!guest || guest.status !== 'running') {
          return metric;
        }
        
        // Update CPU usage (slight variation from previous value)
        const currentCpu = metric.metrics.cpu;
        const cpuDelta = randomFloatBetween(-5, 5);
        const newCpu = Math.max(1, Math.min(100, currentCpu + cpuDelta));
        
        // Update memory usage (slight variation from previous value)
        const currentMemoryPercent = metric.metrics.memory.percentUsed;
        const memoryDelta = randomFloatBetween(-2, 2);
        const newMemoryPercent = Math.max(5, Math.min(95, currentMemoryPercent + memoryDelta));
        
        // Check if memory is a number or an object
        const memoryTotal = typeof guest.memory === 'number' ? guest.memory : guest.memory.total;
        const newMemoryUsed = (memoryTotal * newMemoryPercent) / 100;
        
        // Update disk usage (slight variation from previous value)
        const diskTotal = guest.disk?.total || 1073741824; // 1GB default
        const diskUsed = guest.disk?.used || 536870912; // 512MB default
        const currentDiskPercent = diskUsed / diskTotal * 100;
        const diskDelta = randomFloatBetween(-1, 1);
        const newDiskPercent = Math.max(1, Math.min(99, currentDiskPercent + diskDelta));
        const newDiskUsed = (diskTotal * newDiskPercent) / 100;
        
        // Update network throughput
        const newInRate = randomFloatBetween(0.1, 50);
        const newOutRate = randomFloatBetween(0.1, 20);
        
        // Update history
        const newCpuHistory = [...metric.history.cpu.slice(1), newCpu];
        const newMemoryHistory = [...metric.history.memory.slice(1), newMemoryPercent];
        const newDiskHistory = [...(metric.history.disk || Array(10).fill(0)), newDiskPercent].slice(-10);
        
        return {
          ...metric,
          timestamp: Date.now(),
          metrics: {
            ...metric.metrics,
            cpu: newCpu,
            memory: {
              ...metric.metrics.memory,
              used: newMemoryUsed,
              percentUsed: newMemoryPercent
            },
            disk: {
              ...metric.metrics.disk,
              used: newDiskUsed,
              percentUsed: newDiskPercent
            },
            network: {
              ...metric.metrics.network,
              inRate: newInRate,
              outRate: newOutRate,
              history: [...metric.metrics.network.history.slice(1), { in: newInRate, out: newOutRate }]
            }
          },
          history: {
            ...metric.history,
            cpu: newCpuHistory,
            memory: newMemoryHistory,
            disk: newDiskHistory
          }
        };
      });
      
      // Store updated metrics for this node
      metrics.set(nodeId, updatedMetrics);
      updatedMetricsByNode.set(nodeId, updatedMetrics);
      
      // Add to all metrics
      allMetrics.push(...updatedMetrics);
    }
    
    // Send updated data
    socket.emit('guests', { guests: allGuests });
    socket.emit('metrics', { metrics: allMetrics });
  }
};

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  clients.set(socket.id, { socket });
  
  // Send initial data
  sendInitialData(socket);
  
  // Set up periodic updates (every 2 seconds)
  const updateInterval = setInterval(() => {
    updateMetrics(socket);
  }, 2000);
  
  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
    clients.delete(socket.id);
    clearInterval(updateInterval);
  });
  
  // Handle registration
  socket.on('register', (data) => {
    const nodeId = data.nodeId || data.nodeName;
    logger.info(`Client registered: ${socket.id} for node ${nodeId}`);
    
    // Store the node ID in the client info
    clients.set(socket.id, { 
      ...clients.get(socket.id), 
      nodeId: nodeId, 
      nodeName: data.nodeName 
    });
    
    // Check if we have guests for this node
    const nodeGuests = guests.get(nodeId);
    if (!nodeGuests || nodeGuests.length === 0) {
      logger.warn(`No guests found for registered node ${nodeId}. Available nodes: ${Array.from(guests.keys()).join(', ')}`);
    } else {
      logger.info(`Found ${nodeGuests.length} guests for node ${nodeId}`);
    }
    
    // Resend data for this specific node
    sendInitialData(socket);
  });
  
  // Handle VM updates
  socket.on('updateVMs', (data) => {
    const nodeId = data.nodeId;
    logger.info(`Received VM update from ${socket.id} for node ${nodeId}`);
    
    // Get the node's guests
    const nodeGuests = guests.get(nodeId) || [];
    
    // Update VMs in the node's guests
    const updatedVMs = data.vms || [];
    logger.info(`Received ${updatedVMs.length} VMs for node ${nodeId}`);
    
    // Store the updated VMs
    const node = nodes.get(nodeId);
    if (node) {
      nodes.set(nodeId, { ...node, vms: updatedVMs });
    }
  });
  
  // Handle container updates
  socket.on('updateContainers', (data) => {
    const nodeId = data.nodeId;
    logger.info(`Received container update from ${socket.id} for node ${nodeId}`);
    
    // Get the node's guests
    const nodeGuests = guests.get(nodeId) || [];
    
    // Update containers in the node's guests
    const updatedContainers = data.containers || [];
    logger.info(`Received ${updatedContainers.length} containers for node ${nodeId}`);
    
    // Store the updated containers
    const node = nodes.get(nodeId);
    if (node) {
      nodes.set(nodeId, { ...node, containers: updatedContainers });
    }
  });
});

// Start the server
server.listen(PORT, HOST, () => {
  logger.info(`Mock data server running on ${HOST}:${PORT}`);
});

// Export for testing
export default server; 