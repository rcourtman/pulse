export interface ServerToClientEvents {
  pong: (data: { time: string }) => void;
  nodeStatus: (data: {
    nodeId: string;
    status: 'online' | 'offline' | 'error';
    metrics?: {
      cpu: number;
      memory: {
        total: number;
        used: number;
        free: number;
      };
      uptime: number;
      version: string;
    }
  }) => void;
}

export interface ClientToServerEvents {
  ping: () => void;
  subscribeToNode: (nodeId: string) => void;
  unsubscribeFromNode: (nodeId: string) => void;
} 