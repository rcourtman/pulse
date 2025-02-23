import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNodes } from '../contexts/NodeContext';
import { useWebSocketContext } from '../contexts/WebSocketContext';

const NodeDetails: React.FC = () => {
  const { nodeId } = useParams<{ nodeId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useNodes();
  const node = nodeId ? state.nodes[nodeId] : null;
  const { socket } = useWebSocketContext();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use the node's actual nodeName instead of assuming 'pve'
  const nodeName = node?.nodeName || nodeId;

  useEffect(() => {
    if (!node) {
      navigate('/');
    }
  }, [node, navigate]);

  useEffect(() => {
    if (!socket || !nodeId) {
      console.log('No socket or nodeId available');
      return;
    }

    console.log(`Subscribing to node: ${nodeName}`);
    socket.emit('subscribeToNode', nodeName);
    setIsLoading(true);

    const handleStatus = (data: any) => {
      console.log('Received node status:', data);
      if (data.nodeId === nodeName) {
        setIsLoading(false);
        if (data.metrics) {
          console.log('Setting metrics:', data.metrics);
          setMetrics(data.metrics);
        }
        dispatch({
          type: 'UPDATE_NODE_STATUS',
          payload: { id: nodeName, status: data.status }
        });
      }
    };

    socket.on('nodeStatus', handleStatus);

    return () => {
      console.log('Cleaning up node subscription:', nodeName);
      socket.off('nodeStatus', handleStatus);
      socket.emit('unsubscribeFromNode', nodeName);
    };
  }, [socket, nodeId, nodeName, dispatch]);

  if (!node) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{node.name}</h2>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Node Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Host</p>
            <p className="font-medium">{node.host}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                node.status === 'online' ? 'bg-green-500' : 
                node.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
              <p className="font-medium capitalize">{node.status}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Token ID</p>
            <p className="font-medium">{node.tokenId}</p>
          </div>
          {node.lastSeen && (
            <div>
              <p className="text-sm text-gray-600">Last Seen</p>
              <p className="font-medium">{new Date(node.lastSeen).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Metrics</h3>
          <p className="text-gray-600">Loading metrics...</p>
        </div>
      ) : metrics ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">CPU Usage</p>
              <p className="font-medium">{(metrics.cpu * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Memory</p>
              <p className="font-medium">
                {Math.round(metrics.memory.used / 1024 / 1024)}GB / {Math.round(metrics.memory.total / 1024 / 1024)}GB
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="font-medium">{Math.round(metrics.uptime / 3600)} hours</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Version</p>
              <p className="font-medium">{metrics.version}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Metrics</h3>
          <p className="text-gray-600">No metrics available</p>
        </div>
      )}
    </div>
  );
};

export default NodeDetails; 