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
import { ProxmoxEvent } from '../types';

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

// Add a new map to track the primary node for each guest in cluster mode
const primaryNodeForGuest = new Map<string, string>();

// Function to initialize primary nodes for guests
const initializePrimaryNodes = () => {
  logger.info('Initializing primary nodes for guests...');
  
  // Reset the map
  primaryNodeForGuest.clear();
  
  // First, identify all shared guests (those that exist on multiple nodes)
  const guestNodeMap = new Map<string, string[]>();
  
  // Build a map of guest IDs to the nodes they exist on
  for (const [nodeId, nodeGuests] of guests.entries()) {
    for (const guest of nodeGuests) {
      if (!guestNodeMap.has(guest.id)) {
        guestNodeMap.set(guest.id, []);
      }
      guestNodeMap.get(guest.id)?.push(nodeId);
    }
  }
  
  // Log shared guests for debugging
  for (const [guestId, nodeIds] of guestNodeMap.entries()) {
    if (nodeIds.length > 1) {
      logger.info(`Found shared guest ${guestId} on nodes: ${nodeIds.join(', ')}`);
    }
  }
  
  // Now assign primary nodes, prioritizing the first node alphabetically for consistency
  for (const [guestId, nodeIds] of guestNodeMap.entries()) {
    // Sort node IDs alphabetically for consistent assignment
    const sortedNodeIds = [...nodeIds].sort();
    const primaryNodeId = sortedNodeIds[0];
    primaryNodeForGuest.set(guestId, primaryNodeId);
    logger.info(`Assigned primary node ${primaryNodeId} for guest ${guestId}`);
    
    // Update the guest status on all nodes
    for (const [nodeId, nodeGuests] of guests.entries()) {
      for (let i = 0; i < nodeGuests.length; i++) {
        const guest = nodeGuests[i];
        if (guest.id === guestId) {
          // Update status based on whether this is the primary node
          const isPrimary = nodeId === primaryNodeId;
          
          // Log the status change
          logger.info(`Setting guest ${guestId} on node ${nodeId} to ${isPrimary ? 'running' : 'stopped'} (isPrimary: ${isPrimary})`);
          
          // Create a new guest object with updated status and resources
          const updatedGuest = {
            ...guest,
            status: isPrimary ? 'running' : 'stopped',
            // For non-primary nodes, also zero out CPU usage and memory used
            cpu: isPrimary ? guest.cpu : 0,
            memory: isPrimary 
              ? guest.memory 
              : (typeof guest.memory === 'number' 
                ? 0 
                : { ...guest.memory, used: 0 })
          };
          
          // Replace the guest in the array
          nodeGuests[i] = updatedGuest;
          
          // Log the updated guest object
          logger.info(`Updated guest ${guestId} on node ${nodeId}: status=${updatedGuest.status}, cpu=${typeof updatedGuest.cpu === 'number' ? updatedGuest.cpu : JSON.stringify(updatedGuest.cpu)}, memory=${typeof updatedGuest.memory === 'number' ? updatedGuest.memory : JSON.stringify(updatedGuest.memory)}`);
        }
      }
    }
  }
  
  logger.info('Primary node initialization complete');
};

// Call this function during server initialization
initializePrimaryNodes();

// Function to check if a node is the primary for a guest
const isNodePrimaryForGuest = (nodeId: string, guestId: string): boolean => {
  const primaryNodeId = primaryNodeForGuest.get(guestId);
  const isPrimary = primaryNodeId === nodeId;
  
  // Only log for shared guests (those that exist on multiple nodes)
  const nodeIds = Array.from(guests.entries())
    .filter(([_, nodeGuests]) => nodeGuests.some((guest: MockVM) => guest.id === guestId))
    .map(([nodeId]) => nodeId);
  
  if (nodeIds.length > 1) {
    logger.debug(`isNodePrimaryForGuest: Guest ${guestId} on node ${nodeId}, primaryNode=${primaryNodeId}, isPrimary=${isPrimary}`);
  }
  
  return isPrimary;
};

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
  
  // Log the number of guests passed to generateMetrics
  logger.debug(`Generating metrics for node ${nodeId} with ${nodeGuests.length} guests`);
  
  // Process each guest
  nodeGuests.forEach((guest: MockVM) => {
    // Only generate metrics for running guests where this node is primary
    // This ensures only the primary node generates metrics for a guest
    if (guest.status === 'running' && isNodePrimaryForGuest(nodeId, guest.id)) {
      logger.debug(`Generating metrics for guest ${guest.id} on node ${nodeId} (primary node)`);
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
  logger.info(`Sending initial data to client ${socket.id}`);
  
  // Convert nodes map to array
  const nodeArray = Array.from(nodes.values());
  
  // Send node data
  socket.emit('nodes', { nodes: nodeArray });
  
  // Get client info
  const clientInfo = clients.get(socket.id);
  
  if (clientInfo?.nodeId) {
    // Client has registered for a specific node
    const nodeId = clientInfo.nodeId;
    logger.info(`Client ${socket.id} is registered for node ${nodeId}`);
    
    // Get the node's guests
    const nodeGuests = guests.get(nodeId) || [];
    logger.info(`Node ${nodeId} has ${nodeGuests.length} guests`);
    
    // Log the status of each guest before processing
    nodeGuests.forEach((guest: MockVM) => {
      const isPrimary = isNodePrimaryForGuest(nodeId, guest.id);
      logger.info(`Guest ${guest.id} on node ${nodeId}: status=${guest.status}, isPrimary=${isPrimary}`);
    });
    
    // Process guest data to ensure it has the right format
    const processedGuests = nodeGuests.map((guest: MockVM) => {
      // Check if this node is primary for this guest, regardless of cluster mode
      const isPrimary = isNodePrimaryForGuest(nodeId, guest.id);
      
      // If this is not the primary node, mark the guest as stopped
      if (!isPrimary && guest.status === 'running') {
        logger.info(`Marking non-primary guest ${guest.id} on node ${nodeId} as stopped (was running)`);
        return {
          ...guest,
          status: 'stopped',
          memory: typeof guest.memory === 'number' ? { total: guest.memory, used: 0 } : { ...guest.memory, used: 0 }
        };
      }
      
      // Handle different memory structures
      const memoryTotal = typeof guest.memory === 'number' ? guest.memory : guest.memory.total;
      
      return {
        ...guest,
        memory: typeof guest.memory === 'number' ? { total: guest.memory, used: Math.floor(guest.memory * 0.7) } : guest.memory
      };
    });
    
    // Log the status of each guest after processing
    processedGuests.forEach((guest: MockVM) => {
      const isPrimary = isNodePrimaryForGuest(nodeId, guest.id);
      logger.info(`Processed guest ${guest.id} on node ${nodeId}: status=${guest.status}, isPrimary=${isPrimary}`);
    });
    
    // Send guest data for this node
    socket.emit('guests', { guests: processedGuests });
    
    // Generate and send metrics for this node - but only for running guests
    const runningGuests = processedGuests.filter((guest: MockVM) => 
      guest.status === 'running' && isNodePrimaryForGuest(nodeId, guest.id)
    );
    logger.info(`Node ${nodeId} has ${runningGuests.length} running guests where it is primary`);
    
    const nodeMetrics = generateMetrics(nodeId, runningGuests);
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
        // Check if this node is primary for this guest, regardless of cluster mode
        const isPrimary = isNodePrimaryForGuest(nodeId, guest.id);
        
        // If this is not the primary node, mark the guest as stopped
        if (!isPrimary && guest.status === 'running') {
          return {
            ...guest,
            status: 'stopped',
            memory: typeof guest.memory === 'number' ? { total: guest.memory, used: 0 } : { ...guest.memory, used: 0 }
          };
        }
        
        return {
          ...guest,
          memory: typeof guest.memory === 'number' ? { total: guest.memory, used: Math.floor(guest.memory * 0.7) } : guest.memory
        };
      });
      
      // Add to all guests
      allGuests.push(...processedGuests);
      
      // Generate metrics for this node - but only for running guests where this node is primary
      const runningGuests = processedGuests.filter((guest: MockVM) => 
        guest.status === 'running' && isNodePrimaryForGuest(nodeId, guest.id)
      );
      const nodeMetrics = generateMetrics(nodeId, runningGuests);
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

/**
 * Get the node ID associated with a socket
 */
const getNodeIdFromSocket = (socket: Socket): string | undefined => {
  const clientInfo = clients.get(socket.id);
  return clientInfo?.nodeId;
};

// Function to update metrics for a socket
const updateMetrics = (socket: Socket) => {
  // Get the node ID from the socket
  const nodeId = getNodeIdFromSocket(socket);
  if (!nodeId) {
    return;
  }
  
  // Get the guests for this node
  const nodeGuests = guests.get(nodeId) || [];
  if (nodeGuests.length === 0) {
    return;
  }
  
  // Get the current metrics for this node
  const currentMetrics = metrics.get(nodeId) || [];
  if (currentMetrics.length === 0) {
    return;
  }
  
  // Filter to only include metrics for running guests where this node is primary
  // This ensures only the primary node sends metrics for a guest, regardless of cluster mode
  const runningGuests = nodeGuests.filter((guest: MockVM) => 
    guest.status === 'running' && isNodePrimaryForGuest(nodeId, guest.id)
  );
  const runningGuestIds = new Set(runningGuests.map((guest: MockVM) => guest.id));
  
  // Log the number of running guests where this node is primary
  logger.debug(`Node ${nodeId} has ${runningGuests.length} running guests where it is primary`);
  
  // Update metrics for each running guest
  const updatedMetrics = currentMetrics
    .filter((metric: MockMetric) => runningGuestIds.has(metric.guestId))
    .map((metric: MockMetric) => {
      const guest = nodeGuests.find((g: MockVM) => g.id === metric.guestId);
      // Double-check that this is still a running guest and this node is primary
      if (!guest || guest.status !== 'running' || !isNodePrimaryForGuest(nodeId, guest.id)) {
        return metric;
      }
      
      // For primary node, continue with normal metric updates
      // Update CPU usage with more dynamic variations
      const currentCpu = metric.metrics.cpu;
      
      // Create more realistic CPU patterns - sometimes spikes, sometimes gradual changes
      let cpuDelta;
      if (Math.random() < 0.1) {
        // 10% chance of a significant spike or drop - reduce magnitude from ±15 to ±8
        cpuDelta = randomFloatBetween(-8, 8);
      } else if (Math.random() < 0.3) {
        // 30% chance of a moderate change - reduce magnitude from ±8 to ±5
        cpuDelta = randomFloatBetween(-5, 5);
      } else {
        // 60% chance of a small change - reduce magnitude from ±3 to ±2
        cpuDelta = randomFloatBetween(-2, 2);
      }
      
      // Apply trend bias - if CPU is high, more likely to go down, if low, more likely to go up
      if (currentCpu > 70) {
        cpuDelta -= 1.5; // Bias towards decreasing when high (increased from -1 to -1.5)
      } else if (currentCpu < 20) {
        cpuDelta += 1.5; // Bias towards increasing when low (increased from +1 to +1.5)
      }
      
      // During stress tests, CPU should stay high with smaller fluctuations
      // This simulates a VM under constant load better
      if (currentCpu > 80) {
        // If CPU is already very high (likely stress test), keep it high with smaller variations
        cpuDelta = randomFloatBetween(-3, 1); // More likely to stay high
      }
      
      const newCpu = Math.max(1, Math.min(100, currentCpu + cpuDelta));
      
      // Update memory usage with more realistic variations
      const currentMemoryPercent = metric.metrics.memory.percentUsed;
      
      // Memory tends to change more gradually than CPU
      let memoryDelta;
      if (Math.random() < 0.05) {
        // 5% chance of a larger memory change (application started/stopped)
        memoryDelta = randomFloatBetween(-8, 8);
      } else if (Math.random() < 0.2) {
        // 20% chance of a moderate change
        memoryDelta = randomFloatBetween(-4, 4);
      } else {
        // 75% chance of a small change
        memoryDelta = randomFloatBetween(-2, 2);
      }
      
      // Memory often correlates with CPU changes
      if (cpuDelta > 5) {
        memoryDelta += 1; // If CPU spiked up, memory likely increases too
      } else if (cpuDelta < -5) {
        memoryDelta -= 0.5; // If CPU dropped significantly, memory might decrease too
      }
      
      const newMemoryPercent = Math.max(5, Math.min(95, currentMemoryPercent + memoryDelta));
      
      // Check if memory is a number or an object
      const memoryTotal = typeof guest.memory === 'number' ? guest.memory : guest.memory.total;
      const newMemoryUsed = (memoryTotal * newMemoryPercent) / 100;
      
      // Update disk usage (disk changes are typically slower than CPU/memory)
      const diskTotal = guest.disk?.total || 1073741824; // 1GB default
      const diskUsed = guest.disk?.used || 536870912; // 512MB default
      const currentDiskPercent = diskUsed / diskTotal * 100;
      
      // Disk usage typically increases slowly over time with occasional drops (cleanup)
      let diskDelta;
      if (Math.random() < 0.02) {
        // 2% chance of disk cleanup (significant drop)
        diskDelta = randomFloatBetween(-5, -1);
      } else if (Math.random() < 0.1) {
        // 10% chance of a larger increase (file download, log growth)
        diskDelta = randomFloatBetween(0.5, 2);
      } else {
        // 88% chance of a very small increase
        diskDelta = randomFloatBetween(0, 0.5);
      }
      
      const newDiskPercent = Math.max(10, Math.min(90, currentDiskPercent + diskDelta));
      const newDiskUsed = (diskTotal * newDiskPercent) / 100;
      
      // Update network usage with more noticeable variations
      const currentNetworkIn = metric.metrics.network.inRate;
      const currentNetworkOut = metric.metrics.network.outRate;
      
      // Network traffic often comes in bursts
      let networkInDelta, networkOutDelta;
      
      if (Math.random() < 0.15) {
        // 15% chance of a traffic burst
        networkInDelta = randomFloatBetween(100000, 1000000);
        networkOutDelta = randomFloatBetween(50000, 500000);
      } else if (Math.random() < 0.3) {
        // 30% chance of moderate traffic
        networkInDelta = randomFloatBetween(-200000, 400000);
        networkOutDelta = randomFloatBetween(-100000, 300000);
      } else {
        // 55% chance of low/declining traffic
        networkInDelta = randomFloatBetween(-300000, 100000);
        networkOutDelta = randomFloatBetween(-200000, 50000);
      }
      
      const newNetworkIn = Math.max(0, currentNetworkIn + networkInDelta);
      const newNetworkOut = Math.max(0, currentNetworkOut + networkOutDelta);
      
      // Update network history
      const networkHistory = [...metric.metrics.network.history.slice(1), { in: newNetworkIn, out: newNetworkOut }];
      
      // Update CPU history
      const cpuHistory = [...metric.history.cpu.slice(1), newCpu];
      
      // Update memory history
      const memoryHistory = [...metric.history.memory.slice(1), newMemoryPercent];
      
      // Update disk history (less frequent changes)
      const diskHistory = [...metric.history.disk.slice(1), newDiskPercent];
      
      // Return updated metric
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
            inRate: newNetworkIn,
            outRate: newNetworkOut,
            history: networkHistory
          }
        },
        history: {
          ...metric.history,
          cpu: cpuHistory,
          memory: memoryHistory,
          disk: diskHistory
        }
      };
    });
  
  // Update metrics for this node
  metrics.set(nodeId, updatedMetrics);
  
  // Emit metrics update to the client
  socket.emit('metrics', { metrics: updatedMetrics });
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

// Add a function to occasionally migrate guests between nodes
const migrateRandomGuest = () => {
  // Get all guest IDs
  const guestIds = Array.from(primaryNodeForGuest.keys());
  if (guestIds.length === 0) {
    return;
  }
  
  // Focus on shared guests (IDs 999 and 888) to make migrations more visible
  const sharedGuestIds = guestIds.filter(id => id === '999' || id === '888');
  
  // If no shared guests found, fall back to any guest
  const targetGuestIds = sharedGuestIds.length > 0 ? sharedGuestIds : guestIds;
  
  // Pick a random guest from our target list
  const randomGuestId = targetGuestIds[Math.floor(Math.random() * targetGuestIds.length)];
  
  // Get current primary node
  const currentPrimaryNode = primaryNodeForGuest.get(randomGuestId);
  if (!currentPrimaryNode) {
    return;
  }
  
  // Get all nodes that have this guest
  const nodesWithGuest = Array.from(guests.entries())
    .filter(([nodeId, nodeGuests]) => 
      nodeGuests.some((guest: MockVM) => guest.id === randomGuestId))
    .map(([nodeId]) => nodeId);
  
  if (nodesWithGuest.length <= 1) {
    return; // Can't migrate if guest is only on one node
  }
  
  // Pick a different node as the new primary
  const otherNodes = nodesWithGuest.filter(nodeId => nodeId !== currentPrimaryNode);
  if (otherNodes.length === 0) {
    return;
  }
  
  const newPrimaryNode = otherNodes[Math.floor(Math.random() * otherNodes.length)];
  
  // Update the primary node
  primaryNodeForGuest.set(randomGuestId, newPrimaryNode);
  
  // Make the log message more visible
  logger.info(`🔄 MIGRATION: Guest ${randomGuestId} migrated from node ${currentPrimaryNode} to ${newPrimaryNode}`);
  
  // Get the guest name
  const guestName = Array.from(guests.values())
    .flatMap(nodeGuests => nodeGuests)
    .find((guest: any) => guest.id === randomGuestId)?.name || 'Unknown';
  
  // Create a migration event object that matches the ProxmoxEvent interface
  const migrationEvent: ProxmoxEvent = {
    id: `migration-${Date.now()}`,
    node: newPrimaryNode,
    type: 'vm', // or 'container' based on the guest type
    eventTime: Date.now(),
    user: 'system',
    description: `Migration of ${guestName} from ${currentPrimaryNode} to ${newPrimaryNode}`,
    details: {
      type: 'migration',
      guestId: randomGuestId,
      guestName: guestName,
      fromNode: currentPrimaryNode,
      toNode: newPrimaryNode,
      timestamp: Date.now()
    }
  };
  
  // Emit to all connected clients
  io.emit('event', migrationEvent);
  
  // Update the guest status on all nodes
  for (const [nodeId, nodeGuests] of guests.entries()) {
    for (let i = 0; i < nodeGuests.length; i++) {
      // Explicitly type the guest to avoid linter errors
      const guest: {
        id: string;
        status: string;
        cpu: number | { usage: number; cores?: number; };
        memory: number | { total: number; used: number; };
        [key: string]: any;
      } = nodeGuests[i];
      
      if (guest.id === randomGuestId) {
        // Update status based on whether this is the new primary node
        const isPrimary = nodeId === newPrimaryNode;
        
        // Store the original CPU and memory values from the current primary node
        let originalCpu = guest.cpu;
        let originalMemory = guest.memory;
        
        // If this is the current primary node, save its values before changing
        if (nodeId === currentPrimaryNode) {
          // Save the current values to use for the new primary
          originalCpu = guest.cpu;
          originalMemory = guest.memory;
        }
        
        // If this is the new primary node, we need to get the CPU and memory values from the old primary
        if (isPrimary) {
          // Find the guest on the old primary node to get its values
          const oldPrimaryGuest = guests.get(currentPrimaryNode)?.find((g: MockVM) => g.id === randomGuestId);
          if (oldPrimaryGuest) {
            originalCpu = oldPrimaryGuest.cpu;
            originalMemory = oldPrimaryGuest.memory;
          }
        }
        
        nodeGuests[i] = {
          ...guest,
          status: isPrimary ? 'running' : 'stopped',
          // For non-primary nodes, zero out CPU usage and memory used
          cpu: isPrimary ? originalCpu : 0,
          memory: isPrimary 
            ? originalMemory 
            : (typeof guest.memory === 'number' 
              ? 0 
              : { ...guest.memory, used: 0 })
        };
        
        // Log the status change for each node
        logger.info(`Guest ${randomGuestId} on node ${nodeId}: status=${isPrimary ? 'running' : 'stopped'} (isPrimary=${isPrimary})`);
      }
    }
  }
};

// Set up more frequent migrations (every 10 seconds instead of 30)
setInterval(migrateRandomGuest, 10000);

// Start the server
server.listen(PORT, HOST, () => {
  logger.info(`Mock data server running on ${HOST}:${PORT}`);
});

// Export for testing
export default server; 