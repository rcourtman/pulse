import axios, { AxiosRequestConfig } from 'axios';
import https from 'https';
import { createLogger } from './logger';
import { AppConfig, NodeConfig } from '../types';

const logger = createLogger('ConfigValidator');

/**
 * Validates the application configuration
 */
export async function validateConfig(config: AppConfig): Promise<boolean> {
  logger.info('Validating application configuration...');
  
  // Validate basic configuration
  if (!config.port || config.port < 0 || config.port > 65535) {
    logger.error('Invalid port number');
    return false;
  }
  
  if (!config.nodes || config.nodes.length === 0) {
    logger.warn('No nodes configured');
    return true; // This might be valid in some cases
  }
  
  // Validate each node configuration
  let allValid = true;
  for (const node of config.nodes) {
    const nodeValid = await validateNodeConfig(node, config.ignoreSSLErrors);
    if (!nodeValid) {
      allValid = false;
    }
  }
  
  return allValid;
}

/**
 * Validates a node configuration
 */
async function validateNodeConfig(nodeConfig: NodeConfig, ignoreSSLErrors: boolean): Promise<boolean> {
  logger.info(`Validating node configuration: ${nodeConfig.name} (${nodeConfig.id})`);
  
  // Check for required fields
  if (!nodeConfig.id || !nodeConfig.name || !nodeConfig.host || !nodeConfig.tokenId || !nodeConfig.tokenSecret) {
    logger.error(`Node ${nodeConfig.id}: Missing required fields`);
    return false;
  }
  
  // Check for special characters in tokenId that might cause issues
  const specialChars = ['!', '?', '&', '*', '#', '|', ';', '(', ')', '<', '>', '`', '$'];
  const foundSpecialChars = specialChars.filter(char => nodeConfig.tokenId.includes(char));
  
  if (foundSpecialChars.length > 0) {
    logger.warn(`Node ${nodeConfig.id}: Token ID contains special characters that may cause issues with shell commands: ${foundSpecialChars.join(', ')}`);
    logger.warn(`When using in curl or similar commands, make sure to properly escape or quote the token ID.`);
    // We don't return false here because it might still work with proper escaping
  }
  
  // Test connection to the node
  try {
    // Get timeout from environment variable or use default
    const apiTimeoutMs = parseInt(process.env.API_TIMEOUT_MS || '10000', 10);
    
    const axiosConfig: AxiosRequestConfig = {
      baseURL: `${nodeConfig.host}/api2/json`,
      headers: {
        'Authorization': `PVEAPIToken=${nodeConfig.tokenId}=${nodeConfig.tokenSecret}`
      },
      timeout: apiTimeoutMs
    };
    
    // Determine if SSL verification should be disabled
    // Check multiple environment variables that could control SSL verification
    const disableSSLVerification = 
      ignoreSSLErrors || 
      process.env.PROXMOX_REJECT_UNAUTHORIZED === 'false' ||
      process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ||
      process.env.HTTPS_REJECT_UNAUTHORIZED === 'false' ||
      process.env.PROXMOX_INSECURE === 'true' ||
      process.env.PROXMOX_VERIFY_SSL === 'false' ||
      process.env.IGNORE_SSL_ERRORS === 'true';
    
    // Add SSL certificate validation bypass if needed
    if (disableSSLVerification) {
      logger.warn(`Node ${nodeConfig.id}: SSL certificate verification is disabled. This is insecure and should only be used with trusted networks.`);
      axiosConfig.httpsAgent = new https.Agent({
        rejectUnauthorized: false
      });
    }
    
    const client = axios.create(axiosConfig);
    
    // Test connection
    const response = await client.get('/version');
    logger.info(`Node ${nodeConfig.id}: Successfully connected to Proxmox API version ${response.data.data.version}`);
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        logger.error(`Node ${nodeConfig.id}: API Error: ${error.response.status} - ${error.response.statusText}`);
        logger.error(`Response data:`, error.response.data);
      } else if (error.request) {
        logger.error(`Node ${nodeConfig.id}: No response received from server. Check network connectivity and firewall settings.`);
      } else {
        logger.error(`Node ${nodeConfig.id}: Error setting up request: ${error.message}`);
      }
      
      if (error.code === 'ECONNABORTED') {
        logger.error(`Node ${nodeConfig.id}: Connection timed out. Check if the server is reachable and the port is correct.`);
      }
    } else {
      logger.error(`Node ${nodeConfig.id}: Unknown error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return false;
  }
}

/**
 * Formats a token ID for safe use in shell commands
 */
export function formatSafeTokenId(tokenId: string): string {
  return `'${tokenId}'`; // Wrap in single quotes for shell safety
}

/**
 * Generates a curl command example for testing a node
 */
export function generateCurlExample(nodeConfig: NodeConfig, ignoreSSLErrors: boolean): string {
  const safeTokenId = formatSafeTokenId(nodeConfig.tokenId);
  const sslFlag = ignoreSSLErrors ? '-k ' : '';
  
  return `curl ${sslFlag}-v --connect-timeout 5 -H "Authorization: PVEAPIToken=${safeTokenId}=${nodeConfig.tokenSecret}" ${nodeConfig.host}/api2/json/version`;
}

/**
 * Validates the configuration and logs helpful information
 */
export async function validateAndLogHelp(config: AppConfig): Promise<boolean> {
  const isValid = await validateConfig(config);
  
  if (!isValid) {
    logger.info('Configuration validation failed. Here are some troubleshooting tips:');
    logger.info('1. Check network connectivity to the Proxmox nodes');
    logger.info('2. Verify your API token has the correct permissions (PVEAuditor role)');
    logger.info('3. Make sure the Proxmox API is accessible on the specified port');
    logger.info('4. Check for special characters in token IDs that might need escaping');
    
    // Generate curl examples for each node
    logger.info('You can test the connection to each node with the following curl commands:');
    for (const node of config.nodes) {
      const curlExample = generateCurlExample(node, config.ignoreSSLErrors);
      logger.info(`Node ${node.id}: ${curlExample}`);
    }
  }
  
  return isValid;
} 