import axios from 'axios';
import https from 'https';
import { ProxmoxToken } from '../types/proxmox';
import { logger } from '../server';

export class ProxmoxService {
  private baseUrl: string;
  private tokenId: string;
  private tokenSecret: string;
  private nodeName: string;
  private client: any;

  constructor(credentials: ProxmoxToken) {
    this.baseUrl = credentials.host.replace(/\/$/, ''); // Remove trailing slash
    this.tokenId = credentials.tokenId;
    this.tokenSecret = credentials.tokenSecret;
    
    // Extract node name from the host URL
    const url = new URL(this.baseUrl);
    this.nodeName = credentials.node || url.hostname;
    
    // Create axios client with SSL verification disabled
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `PVEAPIToken=${this.tokenId}=${this.tokenSecret}`
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Disable SSL verification
      })
    });

    logger.info('ProxmoxService initialized:', {
      baseUrl: this.baseUrl,
      nodeName: this.nodeName
    });
  }

  async validate(): Promise<boolean> {
    try {
      logger.info('Validating Proxmox connection:', {
        host: this.baseUrl,
        nodeName: this.nodeName
      });

      // Try to get version info as a validation check
      const response = await this.client.get('/api2/json/version');
      logger.info('Validation successful:', {
        status: response.status,
        data: response.data
      });
      
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorDetails = {
          host: this.baseUrl,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          code: error.code,
          message: error.message
        };
        
        logger.error('Validation failed:', errorDetails);
        throw new Error(`Failed to validate Proxmox connection: ${error.message}`);
      }
      throw error;
    }
  }

  async getVersion(): Promise<{ version: string; release: string }> {
    logger.info(`Getting version info from ${this.baseUrl}`);
    const response = await this.client.get('/api2/json/version');
    
    // Log the raw response for debugging
    logger.info('Version response:', {
      url: '/api2/json/version',
      data: response.data
    });

    return {
      version: response.data.data.version,
      release: response.data.data.release
    };
  }

  async getNodeStatus(): Promise<{
    cpu: number;
    memory: { total: number; used: number; free: number };
    uptime: number;
  }> {
    try {
      logger.info(`Getting status for node ${this.nodeName}`);
      const response = await this.client.get(`/api2/json/nodes/${this.nodeName}/status`);
      
      // Log the raw response for debugging
      logger.info('Status response:', {
        url: `/api2/json/nodes/${this.nodeName}/status`,
        data: response.data
      });

      // Transform the response to match our expected format
      const data = response.data.data;
      if (!data) {
        throw new Error('No data received from Proxmox API');
      }

      return {
        cpu: data.cpu || 0,
        memory: {
          total: data.memory?.total || 0,
          used: data.memory?.used || 0,
          free: data.memory?.free || 0
        },
        uptime: data.uptime || 0
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Failed to get node status for ${this.nodeName}:`, {
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method
        });

        if (error.response?.status === 500) {
          throw new Error(`Proxmox server error: ${error.response.data?.message || 'Unknown server error'}`);
        }
      }
      
      logger.error(`Failed to get node status for ${this.nodeName}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async getNodes(): Promise<string[]> {
    try {
      logger.info('Getting list of nodes');
      const response = await this.client.get('/api2/json/nodes');
      
      logger.info('Nodes response:', {
        url: '/api2/json/nodes',
        data: response.data
      });

      if (!response.data?.data) {
        throw new Error('No node data received from Proxmox API');
      }

      return response.data.data.map((node: any) => node.node);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Failed to get nodes:', {
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }
      throw error;
    }
  }
} 