import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNodes } from '../contexts/NodeContext';
import { useWebSocketContext } from '../contexts/WebSocketContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useNodes();
  const { socket } = useWebSocketContext();

  useEffect(() => {
    if (!socket) return;

    // Listen for node status updates
    const handleNodeStatus = (data: any) => {
      console.log('Received node status:', data);
      if (data.nodeId) {
        // Always use UPDATE_NODE action to prevent duplicates
        dispatch({
          type: 'UPDATE_NODE',
          payload: {
            id: data.nodeId,
            name: data.name,
            host: data.host,
            tokenId: data.tokenId,
            status: data.status,
            metrics: data.metrics
          }
        });
      }
    };

    socket.on('nodeStatus', handleNodeStatus);

    return () => {
      socket.off('nodeStatus', handleNodeStatus);
    };
  }, [socket]);

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <button
          onClick={() => navigate('/onboarding')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Node
        </button>
      </div>

      {Object.keys(state.nodes).length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">
            No nodes added yet. Click "Add Node" to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {Object.values(state.nodes).map(node => (
            <div
              key={node.id}
              className="border rounded-lg p-4 shadow-sm bg-white"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{node.name || 'Unnamed Node'}</h3>
                  <p className="text-sm text-gray-600">{node.host}</p>
                  <p className="text-sm text-gray-600">Token: {node.tokenId}</p>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  node.status === 'online' ? 'bg-green-100 text-green-800' : 
                  node.status === 'error' ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {node.status || 'unknown'}
                </span>
              </div>

              {node.metrics && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">CPU Usage</p>
                    <p className="font-semibold">{(node.metrics.cpu * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Memory Usage</p>
                    <p className="font-semibold">
                      {((node.metrics.memory.used / node.metrics.memory.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Uptime</p>
                    <p className="font-semibold">
                      {Math.floor(node.metrics.uptime / 86400)}d {Math.floor((node.metrics.uptime % 86400) / 3600)}h
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end space-x-2">
                <button
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                  onClick={() => {
                    if (confirm('Are you sure you want to remove this node?')) {
                      dispatch({ type: 'REMOVE_NODE', payload: node.id });
                    }
                  }}
                >
                  Remove
                </button>
                <button
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => navigate(`/nodes/${node.id}`)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;