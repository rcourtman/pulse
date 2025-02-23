import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import proxmoxRoutes from './routes/proxmox.routes';
import { initMonitor, getMonitor } from './services/monitorService';
import { logger } from './utils/logger';
import { ProxmoxService } from './services/proxmox';
import crypto from 'crypto';
import { config } from 'dotenv';

// Load environment variables
dotenv.config();
config();

// Initialize cache
const cache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

// Get allowed origins from environment variables with a safe default
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

// Create Express app
const app = express();

// Configure CORS
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add body parser middleware
app.use(express.json());

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO with matching CORS config
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize the monitor
const monitor = initMonitor(io);

// Initialize default Proxmox node if environment variables are present
async function initializeDefaultProxmox() {
  try {
    if (process.env.PROXMOX_HOST && process.env.PROXMOX_TOKEN_ID && process.env.PROXMOX_TOKEN_SECRET) {
      // Create a service instance to validate and get node info
      const service = new ProxmoxService({
        host: process.env.PROXMOX_HOST,
        tokenId: process.env.PROXMOX_TOKEN_ID,
        tokenSecret: process.env.PROXMOX_TOKEN_SECRET
      });

      // Validate connection and get node info
      await service.validate();
      const nodes = await service.getNodes();
      
      if (nodes && nodes.length > 0) {
        const nodeId = monitor.addNode({
          host: process.env.PROXMOX_HOST,
          tokenId: process.env.PROXMOX_TOKEN_ID,
          tokenSecret: process.env.PROXMOX_TOKEN_SECRET,
          node: nodes[0] // Use the first available node name
        });
        
        logger.info('Default Proxmox node added:', { 
          nodeId,
          nodeName: nodes[0],
          host: process.env.PROXMOX_HOST 
        });
      } else {
        throw new Error('No nodes found on Proxmox server');
      }
    }
  } catch (error) {
    logger.error('Failed to initialize default Proxmox server:', error);
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Pulse API is running' });
});

// Add routes BEFORE the catch-all route
app.use('/api/proxmox', proxmoxRoutes);

// Then the catch-all route
app.get('*', (req, res) => {
  res.json({ status: 'not_found', message: 'Route not found' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  await initializeDefaultProxmox();
});

// Export app and other utilities, but not monitor
export { app, io, logger, cache };