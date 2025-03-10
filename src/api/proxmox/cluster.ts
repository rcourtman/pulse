import { ProxmoxClient } from './index';
import { createLogger } from '../../utils/logger';

/**
 * Check if the node is part of a cluster
 * @returns Object containing isCluster (boolean) and clusterName (string if in cluster, empty if not)
 */
export async function isNodeInCluster(this: ProxmoxClient): Promise<{ isCluster: boolean; clusterName: string }> {
  try {
    if (!this.client) {
      this.logger.error('HTTP client is not initialized');
      return { isCluster: false, clusterName: '' };
    }

    // Try to access the cluster status endpoint
    const response = await this.client.get('/cluster/status');
    
    if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      // If we get a valid response with data, the node is part of a cluster
      // Find the cluster name from the response
      const clusterInfo = response.data.data.find((item: any) => item.type === 'cluster');
      const clusterName = clusterInfo?.name || 'proxmox-cluster';
      
      this.logger.info(`Node is part of cluster: ${clusterName}`);
      return { isCluster: true, clusterName };
    } else {
      this.logger.info('Node is not part of a cluster');
      return { isCluster: false, clusterName: '' };
    }
  } catch (error: any) {
    // If we get a 404 error, it means the cluster endpoint doesn't exist, so the node is not part of a cluster
    if (error.response && error.response.status === 404) {
      this.logger.info('Node is not part of a cluster (404 response from cluster endpoint)');
      return { isCluster: false, clusterName: '' };
    }
    
    // For other errors, log them but assume the node is not in a cluster
    this.logger.error('Error checking if node is in cluster', { error });
    return { isCluster: false, clusterName: '' };
  }
} 