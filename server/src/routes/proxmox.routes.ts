import express from 'express';
import { validateToken } from '../controllers/proxmox.controller';
import { ProxmoxService } from '../services/proxmox';
import { logger } from '../utils/logger';
import { monitor } from '../services/monitor.service';
import crypto from 'crypto';

const router = express.Router();

router.post('/validate', async (req, res) => {
  try {
    const { host, tokenId, tokenSecret } = req.body;

    const service = new ProxmoxService({
      host,
      tokenId,
      tokenSecret,
      node: 'minipc' // We'll get the actual node name after validation
    });

    // First validate the connection
    await service.validate();

    // Get the list of nodes to find the correct node name
    const nodes = await service.getNodes();
    if (!nodes.length) {
      throw new Error('No nodes found on Proxmox server');
    }

    // Generate a unique ID for this node
    const nodeId = crypto.randomUUID();

    // Add the node to the monitor with the correct node name
    if (!monitor) {
      throw new Error('Monitor not initialized');
    }
    
    monitor.addNode({
      id: nodeId,
      host,
      tokenId,
      tokenSecret,
      nodeName: nodes[0] // Use the first available node name
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

export default router; 