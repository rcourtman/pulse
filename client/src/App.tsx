import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { NodeProvider } from './contexts/NodeContext';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import NodeDetails from './pages/NodeDetails';

const App: React.FC = () => {
  return (
    <NodeProvider>
      <WebSocketProvider>
        <Router>
          <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Pulse - Proxmox Monitoring Dashboard</h1>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/nodes/:nodeId" element={<NodeDetails />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </Router>
      </WebSocketProvider>
    </NodeProvider>
  );
};

export default App;