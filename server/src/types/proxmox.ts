export interface ProxmoxToken {
  tokenId: string;     // Token name/ID
  tokenSecret: string; // Token secret/value
  host: string;        // Proxmox host URL
  node?: string;       // Optional node name
} 