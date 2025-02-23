import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import winston from 'winston';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import proxmoxRoutes from './routes/proxmox.routes';
import { NodeMonitor } from './services/nodeMonitor';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Initialize cache
const cache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

// Create Express app
const app = express();

// Configure CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.0.130:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add body parser middleware
app.use(express.json());

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://192.168.0.130:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// After initializing Socket.IO
const nodeMonitor = new NodeMonitor(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribeToNode', (nodeId: string) => {
    logger.info(`Client ${socket.id} subscribed to node ${nodeId}`);
    nodeMonitor.subscribe(nodeId, socket.id);
  });

  socket.on('unsubscribeFromNode', (nodeId: string) => {
    logger.info(`Client ${socket.id} unsubscribed from node ${nodeId}`);
    nodeMonitor.unsubscribe(nodeId, socket.id);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
    // Clean up any subscriptions
    // TODO: Track subscriptions to clean up
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

// Export nodeMonitor
export { app, io, logger, cache, nodeMonitor };