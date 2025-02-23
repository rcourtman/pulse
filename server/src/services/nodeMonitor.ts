import { ProxmoxService } from './proxmox';
import { Server } from 'socket.io';
import { logger } from '../utils/logger';

interface MonitoredNode {
  id: string;
  host: string;
  tokenId: string;
  tokenSecret: string;
  nodeName: string;
  service?: ProxmoxService;
  // ... other fields ...
}

export class NodeMonitor {
  private nodes: Map<string, MonitoredNode> = new Map();

  constructor(private io: Server) {
    logger.info('NodeMonitor initialized');
  }

  addNode(node: MonitoredNode) {
    logger.info(`Adding node to monitor: ${node.id}`);
    
    if (this.nodes.has(node.id)) {
      logger.info(`Node ${node.id} already being monitored`);
      return;
    }

    // Create ProxmoxService instance for this node
    const service = new ProxmoxService({
      host: node.host,
      tokenId: node.tokenId,
      tokenSecret: node.tokenSecret,
      node: node.nodeName
    });

    // Store node with service
    this.nodes.set(node.id, {
      ...node,
      service
    });

    logger.info(`Node ${node.id} added to monitor. Current nodes: ${this.nodes.size}`);
    
    // Initial check
    this.checkNodeStatus(node.id);
  }

  removeNode(nodeId: string) {
    const node = this.nodes.get(nodeId);
    if (node) {
      this.nodes.delete(nodeId);
    }
  }

  subscribe(nodeId: string, socketId: string) {
    logger.info(`Socket ${socketId} subscribing to node ${nodeId}`);
    
    const node = this.nodes.get(nodeId);
    if (node) {
      logger.info(`Subscription successful. Current subscribers for node ${nodeId}: ${this.nodes.size}`);
      
      // Do an immediate status check for this subscriber
      this.checkNodeStatus(nodeId);
    } else {
      logger.warn(`Attempted to subscribe to unknown node: ${nodeId}`);
    }
  }

  unsubscribe(nodeId: string, socketId: string) {
    logger.info(`Socket ${socketId} unsubscribing from node ${nodeId}`);
    
    const node = this.nodes.get(nodeId);
    if (node) {
      logger.info(`Unsubscribed. Remaining subscribers for node ${nodeId}: ${this.nodes.size}`);
    }
  }

  private async checkNodeStatus(nodeId: string) {
    const node = this.nodes.get(nodeId);
    if (!node || !node.service) {
      logger.warn(`Attempted to check status of unknown node: ${nodeId}`);
      return;
    }

    if (this.nodes.size === 0) {
      logger.debug(`Skipping status check - no nodes`);
      return;
    }

    try {
      logger.info(`Checking status for node ${nodeId}`);
      
      const version = await node.service.getVersion();
      const status = await node.service.getNodeStatus();

      logger.info(`Node ${nodeId} status:`, { version, status });

      const metrics = {
        cpu: status.cpu,
        memory: {
          total: status.memory.total,
          used: status.memory.used,
          free: status.memory.free
        },
        uptime: status.uptime,
        version: version.version
      };

      // Emit to all subscribers
      this.nodes.forEach(node => {
        logger.info(`Emitting status to subscriber ${node.id}`);
        this.io.to(node.id).emit('nodeStatus', {
          nodeId: node.id,
          status: 'online',
          metrics
        });
      });

    } catch (error) {
      logger.error(`Failed to check node ${nodeId} status:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      this.nodes.forEach(node => {
        this.io.to(node.id).emit('nodeStatus', {
          nodeId: node.id,
          status: 'error'
        });
      });
    }
  }

  getNode(id: string): MonitoredNode | undefined {
    return this.nodes.get(id);
  }
} 