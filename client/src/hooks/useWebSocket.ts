import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { url = 'http://localhost:3000', autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    socketRef.current = io(url, {
      autoConnect,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setError(err);
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [url, autoConnect]);

  const connect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    connect,
    disconnect,
    emit
  };
}; 