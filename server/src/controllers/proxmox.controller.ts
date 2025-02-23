import { Request, Response } from 'express';
import { ProxmoxService } from '../services/proxmox';
import { logger, nodeMonitor } from '../server';
import { v4 as uuidv4 } from 'uuid';

export const validateToken = async (req: Request, res: Response) => {
  try {
    const { host, tokenId, tokenSecret } = req.body;
    
    logger.info('Received validation request:', {
      host,
      tokenId,
      hasSecret: !!tokenSecret
    });

    if (!host || !tokenId || !tokenSecret) {
      logger.warn('Missing required fields:', {
        hasHost: !!host,
        hasTokenId: !!tokenId,
        hasSecret: !!tokenSecret
      });
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    const proxmoxService = new ProxmoxService({
      host,
      tokenId,
      tokenSecret
    });

    await proxmoxService.validate();
    
    // Generate a unique ID for the node
    const nodeId = uuidv4();
    
    // Add the node to the monitor
    nodeMonitor.addNode(nodeId, proxmoxService);

    logger.info('Token validation successful:', {
      host,
      tokenId,
      nodeId
    });

    return res.json({
      status: 'ok',
      message: 'Token validated successfully',
      nodeId // Send the nodeId back to the client
    });
  } catch (error) {
    logger.error('Token validation failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof Error) {
      return res.status(400).json({
        error: error.message
      });
    }

    return res.status(500).json({
      error: 'Failed to validate token'
    });
  }
}; 