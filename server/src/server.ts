import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import proxmoxRoutes from './routes/proxmox.routes';
import { initMonitor } from './services/monitorService';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

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

// Initialize the monitor and store the instance
const monitor = initMonitor(io);
if (!monitor) {
  throw new Error('Failed to initialize monitor');
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribeToNode', (nodeId: string) => {
    logger.info(`Client ${socket.id} subscribing to node ${nodeId}`);
    monitor.subscribe(nodeId, socket.id);
  });

  socket.on('unsubscribeFromNode', (nodeId: string) => {
    logger.info(`Client ${socket.id} unsubscribing from node ${nodeId}`);
    monitor.unsubscribe(nodeId, socket.id);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
    // TODO: Clean up subscriptions for this socket
  });

  socket.on('error', (error) => {
    logger.error(`Socket error for client ${socket.id}:`, error);
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
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Export app and other utilities, but not monitor
export { app, io, logger, cache };