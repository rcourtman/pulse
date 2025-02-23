import axios from 'axios';
import https from 'https';
import { ProxmoxToken } from '../types/proxmox';
import { logger } from '../server';

export class ProxmoxService {
  private baseUrl: string;
  private tokenId: string;
  private tokenSecret: string;

  constructor(credentials: ProxmoxToken) {
    this.baseUrl = credentials.host.replace(/\/$/, ''); // Remove trailing slash
    this.tokenId = credentials.tokenId;
    this.tokenSecret = credentials.tokenSecret;
  }

  private get client() {
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `PVEAPIToken=${this.tokenId}=${this.tokenSecret}`
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Note: In production, you might want to handle SSL certificates properly
      })
    });
  }

  async validate(): Promise<boolean> {
    try {
      if (!this.baseUrl.startsWith('http')) {
        throw new Error('Invalid host URL: must start with http:// or https://');
      }

      logger.info('Attempting to validate Proxmox token:', {
        host: this.baseUrl,
        tokenId: this.tokenId
      });
      
      // Try to access the version endpoint which requires authentication
      const response = await this.client.get('/api2/json/version');
      
      logger.info('Proxmox validation successful:', {
        host: this.baseUrl,
        status: response.status,
        data: response.data
      });
      
      return response.status === 200;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorDetails = {
          host: this.baseUrl,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          code: error.code,
          message: error.message,
          url: error.config?.url,
          method: error.config?.method
        };
        
        logger.error('Proxmox validation error:', errorDetails);

        if (error.response?.status === 401) {
          throw new Error('Invalid credentials');
        }
        if (error.code === 'ECONNREFUSED') {
          throw new Error(`Could not connect to Proxmox server at ${this.baseUrl}`);
        }
        if (error.message.includes('CERT_')) {
          throw new Error('SSL certificate validation failed - using self-signed certificate?');
        }
        if (!error.response) {
          throw new Error(`Network error connecting to ${this.baseUrl}: ${error.message}`);
        }
        throw new Error(`Proxmox API error: ${error.response.data?.message || error.message}`);
      }
      logger.error('Unknown error during Proxmox validation:', error);
      throw error;
    }
  }

  async getVersion(): Promise<{ version: string; release: string }> {
    const response = await this.client.get('/api2/json/version');
    return response.data.data;
  }

  async getNodeStatus(): Promise<{
    cpu: number;
    memory: { total: number; used: number; free: number };
    uptime: number;
  }> {
    // Get the node name from the URL or use a default
    const nodeName = new URL(this.baseUrl).hostname;
    const response = await this.client.get(`/api2/json/nodes/${nodeName}/status`);
    return response.data.data;
  }
} 