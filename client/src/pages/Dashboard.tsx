import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNodes } from '../contexts/NodeContext';
import { useWebSocketContext } from '../contexts/WebSocketContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useNodes();
  const { isConnected } = useWebSocketContext();

  return (
    <div data-testid="dashboard-page">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => navigate('/onboarding')}
          >
            Add Node
          </button>
        </div>
      </div>

      {Object.keys(state.nodes).length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No nodes added yet. Click "Add Node" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(state.nodes).map(node => (
            <div key={node.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{node.name}</h3>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    node.status === 'online' ? 'bg-green-500' : 
                    node.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <span className="ml-2 text-sm text-gray-600 capitalize">{node.status}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 truncate" title={node.host}>
                  <span className="font-medium">Host:</span> {node.host}
                </p>
                <p className="text-sm text-gray-600 truncate" title={node.tokenId}>
                  <span className="font-medium">Token ID:</span> {node.tokenId}
                </p>
                {node.lastSeen && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Last Seen:</span> {new Date(node.lastSeen).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                  onClick={() => {
                    if (confirm('Are you sure you want to remove this node?')) {
                      state.dispatch({ type: 'REMOVE_NODE', payload: node.id });
                    }
                  }}
                >
                  Remove
                </button>
                <button
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => {
                    state.dispatch({ type: 'SELECT_NODE', payload: node.id });
                    navigate(`/nodes/${node.id}`);
                  }}
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