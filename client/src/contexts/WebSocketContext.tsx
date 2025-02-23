import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';

interface WebSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  console.log('WebSocketProvider rendering', { socket }); // Add debug log

  useEffect(() => {
    try {
      // Use environment variable or fallback to window.location
      const serverUrl = import.meta.env.VITE_SERVER_URL || 
        (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
      
      const newSocket = io(serverUrl);
      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}; 