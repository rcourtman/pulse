import { EventEmitter } from 'events';
import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { createLogger } from '../../utils/logger';
import { NodeConfig, ProxmoxNodeStatus, ProxmoxVM, ProxmoxContainer, ProxmoxEvent } from '../../types';
import { formatSafeTokenId } from '../../utils/config-validator';
import { formatBytes, bytesToMB, mbToBytes } from '../../utils/format';
import config from '../../config';
import winston from 'winston';
import { ProxmoxClientMethods } from './types';
import { isNodeInCluster } from './cluster';

// Define the class without the method implementations
export class ProxmoxClient extends EventEmitter implements ProxmoxClientMethods {
  config: NodeConfig;
  logger: winston.Logger;
  client: AxiosInstance | null = null;
  retryAttempts: number = 3;
  retryDelayMs: number = 5000;
  eventLastTimestamp = 0;
  isMockData: boolean = false;
  nodeName = '';

  constructor(config: NodeConfig, ignoreSSLErrors: boolean = false) {
    super();
    this.config = config;
    this.logger = createLogger('ProxmoxClient', config.id);
    
    // Check if this is a mock data client
    this.isMockData = process.env.USE_MOCK_DATA === 'true' || process.env.MOCK_DATA_ENABLED === 'true';
    
    if (this.isMockData) {
      this.logger.info('Mock data mode enabled. Using mock data server.');
    } else {
      // Get timeout from environment variable or use default
      const apiTimeoutMs = parseInt(process.env.API_TIMEOUT_MS || '60000', 10);
      this.retryAttempts = parseInt(process.env.API_RETRY_ATTEMPTS || '3', 10);
      this.retryDelayMs = parseInt(process.env.API_RETRY_DELAY_MS || '5000', 10);
      
      // Create axios instance with base configuration
      const axiosConfig = {
        baseURL: `${config.host}/api2/json`,
        headers: {
          Authorization: `PVEAPIToken=${config.tokenId}=${config.tokenSecret}`
        },
        timeout: apiTimeoutMs,
        httpsAgent: new https.Agent({
          rejectUnauthorized: !ignoreSSLErrors
        })
      };
      
      this.client = axios.create(axiosConfig);
      this.logger.info(`Proxmox API client created with timeout: ${apiTimeoutMs}ms and ${this.retryAttempts} retry attempts`);

      // Add request interceptor for logging
      this.client.interceptors.request.use(request => {
        this.logger.debug(`API Request: ${request.method?.toUpperCase()} ${request.url}`, { 
          params: request.params 
        });
        return request;
      });

      // Add response interceptor for logging
      this.client.interceptors.response.use(
        response => {
          this.logger.debug(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, { 
            data: response.data 
          });
          return response;
        },
        async error => {
          if (error.response) {
            this.logger.error(`API Error: ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, { 
              data: error.response.data 
            });
          } else {
            this.logger.error(`API Error: ${error.message}`, { error });
          }
          
          // Implement retry logic for network errors and timeouts
          const config = error.config;
          
          // Only retry on network errors or timeouts, not on 4xx or 5xx responses
          if (!error.response && config && (!config.retryCount || config.retryCount < this.retryAttempts)) {
            config.retryCount = config.retryCount || 0;
            config.retryCount++;
            
            this.logger.warn(`Retrying request (attempt ${config.retryCount}/${this.retryAttempts}): ${config.method?.toUpperCase()} ${config.url}`);
            
            // Use configured retry delay instead of exponential backoff
            const delay = this.retryDelayMs;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            if (this.client) {
              return this.client(config);
            }
            return Promise.reject(new Error('HTTP client is not initialized'));
          }
          
          return Promise.reject(error);
        }
      );
    }
  }

  // Add the isNodeInCluster method
  isNodeInCluster = isNodeInCluster;

  // Method stubs that will be implemented by the prototype assignments
  async discoverNodeName(): Promise<string> { throw new Error('Not implemented'); }
  extractIpAddress(host: string): string { throw new Error('Not implemented'); }
  async getNodeNameAsync(): Promise<string> { throw new Error('Not implemented'); }
  getNodeName(): string { throw new Error('Not implemented'); }
  async getNodeStatus(): Promise<ProxmoxNodeStatus> { throw new Error('Not implemented'); }
  async getVirtualMachines(): Promise<ProxmoxVM[]> { throw new Error('Not implemented'); }
  async getContainers(): Promise<ProxmoxContainer[]> { throw new Error('Not implemented'); }
  async getGuestResourceUsage(type: 'qemu' | 'lxc', vmid: number): Promise<any> { throw new Error('Not implemented'); }
  async subscribeToEvents(callback: (event: ProxmoxEvent) => void): Promise<() => void> { throw new Error('Not implemented'); }
  determineEventType(event: any): 'node' | 'vm' | 'container' | 'storage' | 'pool' { throw new Error('Not implemented'); }
  setupEventPolling(): void { throw new Error('Not implemented'); }

  /**
   * Test the connection to the Proxmox API
   */
  async testConnection(): Promise<boolean> {
    try {
      // First try to discover the node name
      const nodeName = await this.discoverNodeName();
      
      // Then try to access the node's status endpoint
      if (this.client) {
        await this.client.get(`/nodes/${nodeName}/status`);
      }
      
      this.logger.info('Connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Connection test failed', { error });
      return false;
    }
  }
}

// Import functionality after the class definition to avoid circular dependencies
import { 
  discoverNodeName, 
  extractIpAddress, 
  getNodeNameAsync, 
  getNodeName 
} from './node-discovery';

import { getNodeStatus } from './node-status';

import { 
  getVirtualMachines, 
  getContainers, 
  getGuestResourceUsage 
} from './guests';

import { 
  subscribeToEvents, 
  determineEventType, 
  setupEventPolling 
} from './events';

// Assign methods to the prototype
ProxmoxClient.prototype.discoverNodeName = discoverNodeName;
ProxmoxClient.prototype.extractIpAddress = extractIpAddress;
ProxmoxClient.prototype.getNodeNameAsync = getNodeNameAsync;
ProxmoxClient.prototype.getNodeName = getNodeName;
ProxmoxClient.prototype.getNodeStatus = getNodeStatus;
ProxmoxClient.prototype.getVirtualMachines = getVirtualMachines;
ProxmoxClient.prototype.getContainers = getContainers;
ProxmoxClient.prototype.getGuestResourceUsage = getGuestResourceUsage;
ProxmoxClient.prototype.subscribeToEvents = subscribeToEvents;
ProxmoxClient.prototype.determineEventType = determineEventType;
ProxmoxClient.prototype.setupEventPolling = setupEventPolling; 