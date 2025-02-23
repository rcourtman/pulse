import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { ProxmoxToken } from '../types/proxmox';
import { logger } from '../server';

interface ProxmoxCredentials {
  host: string;
  tokenId: string;
  tokenSecret: string;
  node?: string;
}

export class ProxmoxService {
  private client: AxiosInstance;
  private baseUrl: string;
  private nodeName: string;
  private credentials: ProxmoxCredentials;

  constructor(credentials: ProxmoxCredentials) {
    this.baseUrl = credentials.host;
    this.nodeName = credentials.node || 'minipc';
    this.credentials = credentials;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `PVEAPIToken=${credentials.tokenId}=${credentials.tokenSecret}`
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    logger.info(`ProxmoxService initialized for ${this.nodeName}`);
  }

  getNodeName(): string {
    return this.nodeName;
  }

  getHost(): string {
    return this.baseUrl;
  }

  getTokenId(): string {
    return this.credentials.tokenId;
  }

  async validate(): Promise<boolean> {
    try {
      await this.client.get('/api2/json/version');
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Validation failed for ${this.nodeName}`, {
          status: error.response?.status,
          message: error.message
        });
      }
      throw error;
    }
  }

  async getVersion(): Promise<any> {
    try {
      const response = await this.client.get('/api2/json/version');
      return response.data.data;
    } catch (error) {
      logger.error(`Failed to get version for ${this.nodeName}`, { error });
      throw error;
    }
  }

  async getNodeStatus(): Promise<any> {
    try {
      const response = await this.client.get(`/api2/json/nodes/${this.nodeName}/status`);
      return response.data.data;
    } catch (error) {
      logger.error(`Failed to get status for ${this.nodeName}`, { error });
      throw error;
    }
  }

  async getNodes(): Promise<string[]> {
    try {
      const response = await this.client.get('/api2/json/nodes');
      return response.data.data.map((node: any) => node.node);
    } catch (error) {
      logger.error(`Failed to get nodes for ${this.nodeName}`, { error });
      throw error;
    }
  }
} 