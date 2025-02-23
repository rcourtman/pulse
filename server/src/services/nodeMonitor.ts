import { ProxmoxService } from './proxmox';
import { Server } from 'socket.io';
import { logger } from '../server';

export class NodeMonitor {
  private nodes: Map<string, {
    service: ProxmoxService;
    subscribers: Set<string>;
    interval: NodeJS.Timeout;
  }> = new Map();

  constructor(private io: Server) {}

  addNode(nodeId: string, service: ProxmoxService) {
    if (this.nodes.has(nodeId)) {
      return;
    }

    this.nodes.set(nodeId, {
      service,
      subscribers: new Set(),
      interval: setInterval(() => this.checkNodeStatus(nodeId), 30000) // Check every 30 seconds
    });

    // Initial check
    this.checkNodeStatus(nodeId);
  }

  removeNode(nodeId: string) {
    const node = this.nodes.get(nodeId);
    if (node) {
      clearInterval(node.interval);
      this.nodes.delete(nodeId);
    }
  }

  subscribe(nodeId: string, socketId: string) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.subscribers.add(socketId);
    }
  }

  unsubscribe(nodeId: string, socketId: string) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.subscribers.delete(socketId);
    }
  }

  private async checkNodeStatus(nodeId: string) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

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
      node.subscribers.forEach(socketId => {
        this.io.to(socketId).emit('nodeStatus', {
          nodeId,
          status: 'online',
          metrics
        });
      });

    } catch (error) {
      logger.error(`Failed to check node ${nodeId} status:`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Emit error status to subscribers
      node.subscribers.forEach(socketId => {
        this.io.to(socketId).emit('nodeStatus', {
          nodeId,
          status: 'error'
        });
      });
    }
  }
} 