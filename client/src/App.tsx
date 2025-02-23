import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { NodeProvider } from './contexts/NodeContext';
import AppRoutes from './AppRoutes';

const App: React.FC = () => {
  console.log('App component rendering');

  return (
    <BrowserRouter>
      <WebSocketProvider>
        <NodeProvider>
          <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto px-4 py-8">
              <AppRoutes />
            </div>
          </div>
        </NodeProvider>
      </WebSocketProvider>
    </BrowserRouter>
  );
};

export default App;