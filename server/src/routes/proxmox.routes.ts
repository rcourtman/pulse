import express from 'express';
import { ProxmoxService } from '../services/proxmox';
import { logger } from '../utils/logger';
import { getMonitor } from '../services/monitorService';

const router = express.Router();

router.post('/validate', async (req, res) => {
  try {
    const { host, tokenId, tokenSecret } = req.body;

    if (!host || !tokenId || !tokenSecret) {
      return res.status(400).json({
        error: 'Missing required credentials'
      });
    }

    // Create service to validate connection
    const service = new ProxmoxService({
      host,
      tokenId,
      tokenSecret
    });

    // Validate connection and get node info
    await service.validate();
    const nodes = await service.getNodes();

    if (!nodes || nodes.length === 0) {
      throw new Error('No nodes found on Proxmox server');
    }

    // Add the node to our monitor
    const monitor = getMonitor();
    const nodeId = monitor.addNode({
      host,
      tokenId,
      tokenSecret,
      node: nodes[0] // Use the first available node
    });

    logger.info('Token validation successful:', {
      host,
      tokenId,
      nodeId
    });

    res.json({
      isValid: true,
      nodeId,
      nodeName: nodes[0]
    });
  } catch (error) {
    logger.error('Token validation failed:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Validation failed'
    });
  }
});

// Add a test endpoint
router.get('/test/:nodeId', async (req, res) => {
  try {
    const requestedNode = req.params.nodeId;
    logger.info(`Testing node ${requestedNode}`);
    
    // Get the node configuration from the monitor
    if (!monitor) {
      throw new Error('Monitor not initialized');
    }
    
    const nodeConfig = monitor.getNode(requestedNode);
    if (!nodeConfig) {
      throw new Error(`Node ${requestedNode} not found in monitor`);
    }

    // Use the node's own configuration instead of environment variables
    const service = new ProxmoxService({
      host: nodeConfig.host,
      tokenId: nodeConfig.tokenId,
      tokenSecret: nodeConfig.tokenSecret,
      node: nodeConfig.nodeName
    });

    // First validate the connection
    await service.validate();
    logger.info('Connection validated successfully');

    // Get list of available nodes
    const nodes = await service.getNodes();
    logger.info('Available nodes:', nodes);

    // If validation passes, get the data
    const version = await service.getVersion();
    logger.info('Got version:', version);

    const status = await service.getNodeStatus();
    logger.info('Got status:', status);

    res.json({ 
      nodes,
      version, 
      status 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Test failed:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(500).json({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

router.put('/nodes/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { host, tokenId, tokenSecret } = req.body;
    
    const monitor = getMonitor();
    // Update node implementation...
  } catch (error) {
    // Error handling...
  }
});

export default router; 