import { ProxmoxClient } from './index';
import { ProxmoxVM, ProxmoxContainer } from '../../types';
import config from '../../config';

/**
 * Generate a unique ID for a VM or container
 * @param type The type of guest ('qemu' or 'lxc')
 * @param vmid The VM ID
 * @param nodeId The node ID
 * @returns A unique ID string
 */
function generateGuestId(type: 'qemu' | 'lxc', vmid: number, nodeId: string): string {
  // In cluster mode, use the cluster name instead of the node ID
  if (config.clusterMode) {
    return type === 'qemu'
      ? `${config.clusterName}-vm-${vmid}`
      : `${config.clusterName}-ct-${vmid}`;
  } else {
    // In non-cluster mode, use the node ID
    return type === 'qemu'
      ? `${nodeId}-vm-${vmid}`
      : `${nodeId}-ct-${vmid}`;
  }
}

/**
 * Get all virtual machines for the node
 */
export async function getVirtualMachines(this: ProxmoxClient): Promise<ProxmoxVM[]> {
  try {
    const nodeName = await this.getNodeNameAsync();
    
    if (!this.client) {
      throw new Error('Client is not initialized');
    }
    
    const response = await this.client.get(`/nodes/${nodeName}/qemu`);
    const vms = response.data.data || [];
    
    // Create an array of promises to fetch detailed resource usage for each VM
    const vmPromises = vms.map(async (vm: any) => {
      try {
        // Get detailed resource usage for this VM
        const resourceData = await this.getGuestResourceUsage('qemu', vm.vmid);
        
        // Use memory values from resource data if available, otherwise fall back to VM data
        const memory = resourceData.mem !== undefined ? resourceData.mem : vm.mem;
        const maxmem = resourceData.maxmem !== undefined ? resourceData.maxmem : vm.maxmem;
        
        // Use disk values from resource data if available
        const disk = resourceData.disk !== undefined ? resourceData.disk : vm.disk;
        const maxdisk = resourceData.maxdisk !== undefined ? resourceData.maxdisk : vm.maxdisk;
        
        return {
          id: generateGuestId('qemu', vm.vmid, this.config.id),
          name: vm.name,
          status: vm.status,
          node: this.config.id,
          vmid: vm.vmid,
          cpus: vm.cpus,
          cpu: resourceData.cpu,
          memory: memory,
          maxmem: maxmem,
          disk: disk,
          maxdisk: maxdisk,
          uptime: vm.uptime || 0,
          netin: resourceData.netin || vm.netin || 0,
          netout: resourceData.netout || vm.netout || 0,
          diskread: resourceData.diskread || vm.diskread || 0,
          diskwrite: resourceData.diskwrite || vm.diskwrite || 0,
          template: vm.template === 1,
          type: 'qemu'
        };
      } catch (error) {
        // If we can't get resource usage, return basic VM info
        this.logger.error(`Error getting resource usage for VM ${vm.vmid}`, { error });
        
        return {
          id: generateGuestId('qemu', vm.vmid, this.config.id),
          name: vm.name,
          status: vm.status,
          node: this.config.id,
          vmid: vm.vmid,
          cpus: vm.cpus,
          cpu: 0,
          memory: vm.mem || 0,
          maxmem: vm.maxmem || 0,
          disk: vm.disk || 0,
          maxdisk: vm.maxdisk || 0,
          uptime: vm.uptime || 0,
          netin: vm.netin || 0,
          netout: vm.netout || 0,
          diskread: vm.diskread || 0,
          diskwrite: vm.diskwrite || 0,
          template: vm.template === 1,
          type: 'qemu'
        };
      }
    });
    
    // Wait for all VM promises to resolve
    const vmResults = await Promise.all(vmPromises);
    
    return vmResults;
  } catch (error) {
    this.logger.error('Error getting virtual machines', { error });
    return [];
  }
}

/**
 * Get all containers for the node
 */
export async function getContainers(this: ProxmoxClient): Promise<ProxmoxContainer[]> {
  try {
    const nodeName = await this.getNodeNameAsync();
    
    if (!this.client) {
      throw new Error('Client is not initialized');
    }
    
    // First, get the list of all containers
    const response = await this.client.get(`/nodes/${nodeName}/lxc`);
    const containers = response.data.data || [];
    
    // Create a batch of promises to get container status
    // We'll process them in smaller batches to avoid overwhelming the API
    const batchSize = 3; // Process 3 containers at a time
    const results: ProxmoxContainer[] = [];
    
    // Process containers in batches
    for (let i = 0; i < containers.length; i += batchSize) {
      const batch = containers.slice(i, i + batchSize);
      const batchPromises = batch.map(async (container: any) => {
        try {
          if (!this.client) {
            throw new Error('Client is not initialized');
          }
          
          // Get the container status first
          const statusResponse = await this.client.get(`/nodes/${nodeName}/lxc/${container.vmid}/status/current`);
          const status = statusResponse.data.data;
          
          // Log the raw status data for debugging
          this.logger.debug(`Raw container status for ${container.vmid}:`, { status });
          
          // Get resource usage for this container
          const resourceData = await this.getGuestResourceUsage('lxc', container.vmid);
          
          // Use memory values from resource data if available, otherwise fall back to container data
          const memory = resourceData.mem !== undefined ? resourceData.mem : (status.mem || 0);
          const maxmem = resourceData.maxmem !== undefined ? resourceData.maxmem : (status.maxmem || 0);
          
          // Use disk values from resource data if available
          const disk = resourceData.disk !== undefined ? resourceData.disk : (status.disk || 0);
          const maxdisk = resourceData.maxdisk !== undefined ? resourceData.maxdisk : (status.maxdisk || 0);
          
          return {
            id: generateGuestId('lxc', container.vmid, this.config.id),
            name: container.name,
            status: container.status,
            node: this.config.id,
            vmid: container.vmid,
            cpus: status.cpus || 1,
            cpu: resourceData.cpu,
            memory: memory,
            maxmem: maxmem,
            disk: disk,
            maxdisk: maxdisk,
            uptime: status.uptime || 0,
            netin: resourceData.netin || 0,
            netout: resourceData.netout || 0,
            diskread: resourceData.diskread || 0,
            diskwrite: resourceData.diskwrite || 0,
            template: container.template === 1,
            type: 'lxc'
          };
        } catch (error) {
          // If we can't get resource usage, return basic container info
          this.logger.error(`Error getting resource usage for container ${container.vmid}`, { error });
          
          return {
            id: generateGuestId('lxc', container.vmid, this.config.id),
            name: container.name,
            status: container.status,
            node: this.config.id,
            vmid: container.vmid,
            cpus: 1,
            cpu: 0,
            memory: 0,
            maxmem: 0,
            disk: 0,
            maxdisk: 0,
            uptime: 0,
            netin: 0,
            netout: 0,
            diskread: 0,
            diskwrite: 0,
            template: container.template === 1,
            type: 'lxc'
          };
        }
      });
      
      // Wait for this batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  } catch (error) {
    this.logger.error('Error getting containers', { error });
    return [];
  }
}

/**
 * Get VM or container resource usage
 */
export async function getGuestResourceUsage(this: ProxmoxClient, type: 'qemu' | 'lxc', vmid: number): Promise<any> {
  try {
    const nodeName = await this.getNodeNameAsync();
    
    if (!this.client) {
      throw new Error('Client is not initialized');
    }
    
    const response = await this.client.get(`/nodes/${nodeName}/${type}/${vmid}/status/current`);
    return response.data.data;
  } catch (error) {
    this.logger.error(`Failed to get ${type} resource usage for VMID ${vmid}`, { error });
    throw error;
  }
} 