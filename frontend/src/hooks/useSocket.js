import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { clearAppData } from '../utils/storageUtils';

/**
 * Custom hook to manage WebSocket connections with Socket.io
 * @param {string} url - WebSocket server URL (defaults to current origin)
 * @returns {Object} Socket state and message handlers
 */
const useSocket = (url) => {
  // In development mode, we need to connect to the backend server on port 7654
  // In production, we can use window.location.origin since both frontend and backend are served from the same origin
  const isDevelopment = process.env.NODE_ENV === 'development' || import.meta.env.DEV;
  
  // Get the current host
  const currentHost = window.location.hostname;
  
  // For development, we need to explicitly connect to the backend server
  // For production, we use the same origin that served the page
  let socketUrl;
  if (isDevelopment) {
    // Check if we're using mock data
    const useMockData = localStorage.getItem('use_mock_data') === 'true' || 
                        localStorage.getItem('MOCK_DATA_ENABLED') === 'true';
    
    // Connect to mock server (7656) if using mock data, otherwise connect to backend server (7654)
    socketUrl = `http://${currentHost}:${useMockData ? '7656' : '7654'}`;
  } else {
    // In production, use the same origin that served the page
    socketUrl = window.location.origin;
  }
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [nodeData, setNodeData] = useState([]);
  const [guestData, setGuestData] = useState([]);
  const [metricsData, setMetricsData] = useState([]);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  // Use ref to maintain socket instance across renders
  const socketRef = useRef(null);
  // Use ref for ping interval
  const pingIntervalRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    // Clear any existing socket connection
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // Clear any existing ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    // Create a new socket connection
    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
      forceNew: true,
      autoConnect: true,
      path: '/socket.io', // Explicitly set the socket.io path
      withCredentials: false // Disable credentials for cross-origin requests
    });
    
    // Store the socket in the ref
    socketRef.current = newSocket;
    
    // Set up event listeners
    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      setIsConnected(true);
      setError(null);
      
      // Start ping interval to keep connection alive
      pingIntervalRef.current = setInterval(() => {
        if (newSocket.connected) {
          newSocket.emit('ping');
        }
      }, 30000); // Ping every 30 seconds
    });
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !newSocket.connected) {
        reconnect();
      }
    };
    
    // Handle page unload
    const handleBeforeUnload = () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
    
    // Set up page visibility and unload listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Handle connection errors
    newSocket.on('connect_error', (err) => {
      setConnectionStatus('error');
      setIsConnected(false);
      setError(`Connection error: ${err.message}`);
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (newSocket) {
          newSocket.connect();
        }
      }, 3000);
    });
    
    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    // Message handler
    newSocket.on('message', (message) => {
      setLastMessage(message);
      
      switch (message.type) {
        case 'CONNECTED':
          break;
        
        case 'NODE_STATUS_UPDATE':
          handleNodeStatusUpdate(message.payload);
          break;
        
        case 'GUEST_STATUS_UPDATE':
          handleGuestStatusUpdate(message.payload);
          break;
        
        case 'METRICS_UPDATE':
          handleMetricsUpdate(message.payload);
          break;
        
        case 'EVENT':
          break;
        
        case 'ERROR':
          setError(message.payload);
          break;
        
        default:
      }
    });

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Clear ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      // Remove event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [socketUrl]);

  // Handler for node status updates
  const handleNodeStatusUpdate = useCallback((payload) => {
    // Handle both single node and array of nodes
    const nodeData = Array.isArray(payload) ? payload : [payload];
    
    setNodeData(prevNodes => {
      const updatedNodes = [...prevNodes];
      
      nodeData.forEach(node => {
        const index = updatedNodes.findIndex(n => n.id === node.id);
        if (index >= 0) {
          updatedNodes[index] = node;
        } else {
          updatedNodes.push(node);
        }
      });
      
      return updatedNodes;
    });
  }, []);

  // Handler for guest status updates
  const handleGuestStatusUpdate = useCallback((payload) => {
    // Handle both single guest and array of guests
    const guestData = Array.isArray(payload) ? payload : [payload];
    
    setGuestData(prevGuests => {
      const updatedGuests = [...prevGuests];
      
      guestData.forEach(guest => {
        const index = updatedGuests.findIndex(g => g.id === guest.id);
        if (index >= 0) {
          updatedGuests[index] = guest;
        } else {
          updatedGuests.push(guest);
        }
      });
      
      // Store the current environment with the guest data
      try {
        localStorage.setItem('guest_data_cache', JSON.stringify({
          environment: process.env.NODE_ENV || 'development',
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Error storing guest data cache info:', error);
      }
      
      return updatedGuests;
    });
  }, []);

  // Handler for metrics updates
  const handleMetricsUpdate = useCallback((payload) => {
    // Handle both single metric and array of metrics
    const metricData = Array.isArray(payload) ? payload : [payload];
    
    // Use functional update to avoid closure issues with stale state
    setMetricsData(prevMetrics => {
      // Performance optimization: Check if we actually have new data before updating
      if (!metricData.length) return prevMetrics;
      
      // Make a new array to ensure React detects the change
      const newMetrics = [...prevMetrics];
      let hasChanges = false;
      
      // Process updates with a Map for O(1) lookups instead of O(n) array searches
      const metricsMap = new Map();
      
      // First create a map of existing metrics for faster lookup
      prevMetrics.forEach(metric => {
        if (metric.guestId) {
          metricsMap.set(metric.guestId, metric);
        }
      });
      
      // Then process the updates
      metricData.forEach(metric => {
        if (!metric.guestId) {
          return; // Skip metrics without a guestId
        }
        
        const existingMetric = metricsMap.get(metric.guestId);
        
        if (existingMetric) {
          // Update existing metric only if the timestamp is newer
          if (!existingMetric.timestamp || metric.timestamp >= existingMetric.timestamp) {
            // Find the index in the array
            const index = newMetrics.findIndex(m => m.guestId === metric.guestId);
            if (index >= 0) {
              newMetrics[index] = {
                ...existingMetric,
                ...metric,
                timestamp: metric.timestamp || Date.now()
              };
              hasChanges = true;
            }
          }
        } else {
          // Add new metric
          newMetrics.push({
            ...metric,
            timestamp: metric.timestamp || Date.now()
          });
          hasChanges = true;
        }
      });
      
      // Only update state if there were actual changes
      return hasChanges ? newMetrics : prevMetrics;
    });
  }, []);

  // Function to manually attempt reconnection
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      setConnectionStatus('connecting');
      socketRef.current.connect();
    }
  }, []);

  // Function to subscribe to specific node or guest
  const subscribeToNode = useCallback((nodeId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('subscribe:node', nodeId);
    }
  }, [isConnected]);

  const subscribeToGuest = useCallback((guestId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('subscribe:guest', guestId);
    }
  }, [isConnected]);

  // Function to get historical data
  const getHistory = useCallback((id) => {
    return new Promise((resolve) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('get:history', id, (data) => {
          resolve(data);
        });
      } else {
        resolve([]);
      }
    });
  }, [isConnected]);

  return {
    socket: socketRef.current,
    isConnected,
    lastMessage,
    error,
    nodeData,
    guestData,
    metricsData,
    connectionStatus,
    reconnect,
    subscribeToNode,
    subscribeToGuest,
    getHistory
  };
};

export default useSocket; 