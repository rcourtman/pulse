export interface ProxmoxToken {
  tokenId: string;     // Token name/ID
  tokenSecret: string; // Token secret/value
  host: string;        // Proxmox host URL
  node?: string;       // Optional node name
}

export interface TokenFormData extends ProxmoxToken {
  isValid?: boolean;
}

export interface NodeMetrics {
  cpu: number;
  memory: {
    total: number;
    used: number;
    free: number;
  };
  uptime: number;
  version: string;
}

export interface ProxmoxNode {
  id: string;          // Unique identifier for the node
  host: string;        // Proxmox host URL
  tokenId: string;     // Token name/ID
  tokenSecret: string; // Token secret/value
  name?: string;       // Optional display name
  status?: 'online' | 'offline' | 'error';
  lastSeen?: string;   // ISO timestamp
  metrics?: NodeMetrics;
}

export interface NodeState {
  nodes: Record<string, ProxmoxNode>;
  selectedNode?: string;
} 