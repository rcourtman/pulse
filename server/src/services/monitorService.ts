import { NodeMonitor } from './NodeMonitor';
import { Server } from 'socket.io';

let monitor: NodeMonitor | null = null;

export function initMonitor(io: Server): NodeMonitor {
  if (!monitor) {
    monitor = new NodeMonitor(io);
  }
  return monitor;
}

export function getMonitor(): NodeMonitor {
  if (!monitor) {
    throw new Error('Monitor not initialized');
  }
  return monitor;
}

// Export the monitor instance directly
export { monitor }; 