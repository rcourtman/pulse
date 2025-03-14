import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createLogger } from '../utils/logger';
import { nodeManager } from '../services/node-manager';
import { metricsService } from '../services/metrics-service';
import { WebSocketMessageType, WebSocketMessage, MetricsData, ProxmoxEvent, ProxmoxNodeStatus, ProxmoxGuest } from '../types';
import config from '../config';

export class WebSocketServer {
  private io: Server;
  private logger = createLogger('WebSocketServer');
  private connectedClients: number = 0;
  // Add a map to track the last time metrics were sent for each guest
  private lastMetricsSentTime: Map<string, number> = new Map();
  // Minimum time between metrics updates for the same guest (in milliseconds)
  private readonly metricsUpdateThreshold: number = 1000;
  // Track connection attempts by IP to prevent connection storms
  private connectionAttempts: Map<string, { count: number, lastAttempt: number }> = new Map();
  // Maximum connection attempts allowed in the throttle window
  private readonly maxConnectionAttemptsPerWindow: number = 10;
  // Throttle window in milliseconds (20 seconds)
  private readonly connectionThrottleWindow: number = 20000;
  // Check if we're in development mode
  private readonly isDevelopment: boolean = process.env.NODE_ENV === 'development';

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['*']
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 15000,         // Reduced from 20000
      pingInterval: 2000,         // Reduced from 5000 to match more frequent node polling interval
      connectTimeout: 8000,       // Reduced from 10000
      allowUpgrades: true,
      path: '/socket.io',         // Explicitly set the socket.io path
      perMessageDeflate: {
        threshold: 512            // Reduced from 1024 to compress smaller messages
      },
      maxHttpBufferSize: 1e8, // 100 MB
      // Add connection retry logic
      connectionStateRecovery: {
        // the backup duration of the sessions and the packets
        maxDisconnectionDuration: 2 * 60 * 1000,
        // whether to skip middlewares upon successful recovery
        skipMiddlewares: true,
      }
    });
    
    this.setupSocketHandlers();
    this.subscribeToEvents();
    
    this.logger.info('WebSocket server initialized and ready to accept connections');
    this.logger.debug('WebSocket server configuration:', {
      transports: ['websocket', 'polling'],
      pingTimeout: 15000,
      pingInterval: 2000,
      connectTimeout: 8000,
      path: '/socket.io',
      cors: { 
        origin: '*', 
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['*']
      }
    });
    
    // Only set up cleanup if throttling is enabled (not in development)
    if (!this.isDevelopment) {
      // Clean up connection attempts map periodically
      setInterval(() => {
        const now = Date.now();
        for (const [ip, data] of this.connectionAttempts.entries()) {
          if (now - data.lastAttempt > this.connectionThrottleWindow) {
            this.connectionAttempts.delete(ip);
          }
        }
      }, 60000); // Clean up every minute
    }
  }

  /**
   * Set up socket connection handlers
   */
  private setupSocketHandlers(): void {
    // Add middleware to throttle connections - skip in development mode
    if (!this.isDevelopment) {
      this.io.use((socket, next) => {
        const clientIp = socket.handshake.address;
        
        // Check if this IP is being throttled
        const attempts = this.connectionAttempts.get(clientIp) || { count: 0, lastAttempt: 0 };
        const now = Date.now();
        
        // Reset count if outside the throttle window
        if (now - attempts.lastAttempt > this.connectionThrottleWindow) {
          attempts.count = 1;
          attempts.lastAttempt = now;
        } else {
          // Increment count if within the throttle window
          attempts.count++;
          attempts.lastAttempt = now;
        }
        
        // Update the map
        this.connectionAttempts.set(clientIp, attempts);
        
        // Check if we should throttle
        if (attempts.count > this.maxConnectionAttemptsPerWindow) {
          this.logger.warn(`Connection throttled for ${clientIp} - too many attempts (${attempts.count}) within ${this.connectionThrottleWindow}ms`);
          return next(new Error('Too many connection attempts, please try again later'));
        }
        
        next();
      });
    } else {
      this.logger.info('Connection throttling disabled in development mode');
    }

    this.io.on('connection', (socket: Socket) => {
      this.connectedClients++;
      this.logger.info(`Client connected: ${socket.id}. Total clients: ${this.connectedClients}`);
      this.logger.debug('Client connection details:', {
        id: socket.id,
        handshake: {
          address: socket.handshake.address,
          headers: socket.handshake.headers,
          query: socket.handshake.query,
          url: socket.handshake.url
        },
        transport: socket.conn.transport.name
      });
      
      // Send initial data
      this.sendInitialData(socket);
      
      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.connectedClients--;
        this.logger.info(`Client disconnected: ${socket.id}. Reason: ${reason}. Total clients: ${this.connectedClients}`);
      });
      
      // Handle subscription to specific node
      socket.on('subscribe:node', (nodeId: string) => {
        this.logger.debug(`Client ${socket.id} subscribed to node: ${nodeId}`);
        socket.join(`node:${nodeId}`);
      });
      
      // Handle subscription to specific guest
      socket.on('subscribe:guest', (guestId: string) => {
        this.logger.debug(`Client ${socket.id} subscribed to guest: ${guestId}`);
        socket.join(`guest:${guestId}`);
      });
      
      // Handle unsubscription from specific node
      socket.on('unsubscribe:node', (nodeId: string) => {
        this.logger.debug(`Client ${socket.id} unsubscribed from node: ${nodeId}`);
        socket.leave(`node:${nodeId}`);
      });
      
      // Handle unsubscription from specific guest
      socket.on('unsubscribe:guest', (guestId: string) => {
        this.logger.debug(`Client ${socket.id} unsubscribed from guest: ${guestId}`);
        socket.leave(`guest:${guestId}`);
      });
      
      // Handle request for historical data
      socket.on('get:history', (id: string, callback: (data: MetricsData[]) => void) => {
        this.logger.debug(`Client ${socket.id} requested history for: ${id}`);
        const history = metricsService.getMetricsHistory(id);
        callback(history);
      });

      // Handle ping request (for debugging)
      socket.on('ping', (callback) => {
        this.logger.debug(`Received ping from client ${socket.id}`);
        if (typeof callback === 'function') {
          callback({ timestamp: Date.now(), status: 'ok' });
        }
      });
      
      // Handle explicit request for node data
      socket.on('requestNodeData', () => {
        this.logger.debug(`Client ${socket.id} requested node data`);
        const nodes = nodeManager.getNodes();
        socket.emit('message', this.createMessage(WebSocketMessageType.NODE_STATUS_UPDATE, nodes));
      });
      
      // Handle explicit request for guest data
      socket.on('requestGuestData', () => {
        this.logger.debug(`Client ${socket.id} requested guest data`);
        const guests = nodeManager.getGuests();
        socket.emit('message', this.createMessage(WebSocketMessageType.GUEST_STATUS_UPDATE, guests));
      });
      
      // Handle explicit request for metrics data
      socket.on('requestMetricsData', () => {
        this.logger.debug(`Client ${socket.id} requested metrics data`);
        const metrics = metricsService.getAllCurrentMetrics();
        socket.emit('message', this.createMessage(WebSocketMessageType.METRICS_UPDATE, metrics));
      });
      
      // Handle request for server configuration
      socket.on('getServerConfig', (callback) => {
        this.logger.debug(`Client ${socket.id} requested server configuration`);
        if (typeof callback === 'function') {
          // Send the server configuration to the client
          callback({
            useMockData: process.env.USE_MOCK_DATA === 'true' || process.env.MOCK_DATA_ENABLED === 'true',
            mockDataEnabled: process.env.USE_MOCK_DATA === 'true' || process.env.MOCK_DATA_ENABLED === 'true',
            nodeEnv: process.env.NODE_ENV || 'production',
            isDevelopment: process.env.NODE_ENV === 'development'
          });
        }
      });
    });

    // Log any errors
    this.io.engine.on('connection_error', (err) => {
      this.logger.error('WebSocket connection error:', err);
    });
    
    // Log transport changes
    this.io.engine.on('upgrade', (transport) => {
      this.logger.info(`WebSocket transport upgraded to: ${transport}`);
    });
  }

  /**
   * Subscribe to events from services
   */
  private subscribeToEvents(): void {
    // Subscribe to metrics updates
    metricsService.on('metricsUpdated', (metrics: MetricsData) => {
      // Apply throttling for guest metrics in cluster mode
      if (config.clusterMode && metrics.guestId) {
        const now = Date.now();
        const lastSentTime = this.lastMetricsSentTime.get(metrics.guestId) || 0;
        
        // Check if we've sent metrics for this guest recently
        if (now - lastSentTime < this.metricsUpdateThreshold) {
          // Skip this update to prevent rapid cycling
          this.logger.debug(`Throttling metrics update for guest ${metrics.guestId} - too soon since last update`);
          return;
        }
        
        // Update the last sent time
        this.lastMetricsSentTime.set(metrics.guestId, now);
      }
      
      this.sendMessage(WebSocketMessageType.METRICS_UPDATE, metrics);
      
      // Send to specific rooms
      if (metrics.guestId) {
        this.io.to(`guest:${metrics.guestId}`).emit('message', this.createMessage(WebSocketMessageType.METRICS_UPDATE, metrics));
      } else {
        this.io.to(`node:${metrics.nodeId}`).emit('message', this.createMessage(WebSocketMessageType.METRICS_UPDATE, metrics));
      }
    });
    
    // Subscribe to node status changes
    nodeManager.on('nodeStatusChanged', (nodeStatus: ProxmoxNodeStatus) => {
      this.sendMessage(WebSocketMessageType.NODE_STATUS_UPDATE, nodeStatus);
      this.io.to(`node:${nodeStatus.id}`).emit('message', this.createMessage(WebSocketMessageType.NODE_STATUS_UPDATE, nodeStatus));
    });
    
    // Subscribe to guest status changes
    nodeManager.on('guestStatusChanged', (guest: ProxmoxGuest) => {
      this.sendMessage(WebSocketMessageType.GUEST_STATUS_UPDATE, guest);
      this.io.to(`guest:${guest.id}`).emit('message', this.createMessage(WebSocketMessageType.GUEST_STATUS_UPDATE, guest));
    });
    
    // Subscribe to events
    nodeManager.on('event', (event: ProxmoxEvent) => {
      this.sendMessage(WebSocketMessageType.EVENT, event);
      this.io.to(`node:${event.node}`).emit('message', this.createMessage(WebSocketMessageType.EVENT, event));
    });
  }

  /**
   * Send initial data to a newly connected client
   */
  private sendInitialData(socket: Socket): void {
    // Send connected message
    socket.emit('message', this.createMessage(WebSocketMessageType.CONNECTED, {
      timestamp: Date.now(),
      message: 'Connected to Pulse for Proxmox VE WebSocket server'
    }));
    
    // Send all nodes
    const nodes = nodeManager.getNodes();
    socket.emit('message', this.createMessage(WebSocketMessageType.NODE_STATUS_UPDATE, nodes));
    
    // Send all guests
    const guests = nodeManager.getGuests();
    socket.emit('message', this.createMessage(WebSocketMessageType.GUEST_STATUS_UPDATE, guests));
    
    // Send current metrics
    const metrics = metricsService.getAllCurrentMetrics();
    socket.emit('message', this.createMessage(WebSocketMessageType.METRICS_UPDATE, metrics));
  }

  /**
   * Send a message to all connected clients
   */
  private sendMessage<T>(type: WebSocketMessageType, payload: T): void {
    const message = this.createMessage(type, payload);
    this.io.emit('message', message);
  }

  /**
   * Create a WebSocket message
   */
  private createMessage<T>(type: WebSocketMessageType, payload: T): WebSocketMessage<T> {
    return {
      type,
      payload,
      timestamp: Date.now()
    };
  }

  /**
   * Get the number of connected clients
   */
  getConnectedClientsCount(): number {
    return this.connectedClients;
  }
}

// Export factory function
export function createWebSocketServer(httpServer: HttpServer): WebSocketServer {
  return new WebSocketServer(httpServer);
} 