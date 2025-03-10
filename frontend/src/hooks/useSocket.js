import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook to manage WebSocket connections with Socket.io
 * @param {string} url - WebSocket server URL (defaults to current origin)
 * @returns {Object} Socket state and message handlers
 */
const useSocket = (url) => {
  // In development mode, we need to connect to the backend server on port 7654
  // In production, we can use window.location.origin since both frontend and backend are served from the same origin
  const isDevelopment = process.env.NODE_ENV === 'development' || import.meta.env.DEV;
  
  // Get the current host and protocol
  const currentHost = window.location.hostname;
  const currentPort = window.location.port;
  const currentProtocol = window.location.protocol;
  
  // For development, we need to explicitly connect to the backend server
  // For production, we use the same origin that served the page
  // This ensures we connect to the same host that served the page, which works in both host and bridge network modes
  const socketUrl = url || (isDevelopment 
    ? `http://${currentHost}:7654` 
    : window.location.origin);
  
  // For debugging - log the connection URL and environment
  console.log('Environment:', isDevelopment ? 'development' : 'production');
  console.log('Connecting to WebSocket server at:', socketUrl);
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [nodeData, setNodeData] = useState([]);
  const [guestData, setGuestData] = useState([]);
  const [metricsData, setMetricsData] = useState([]);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'disconnected', 'error'
  const [pingResult, setPingResult] = useState(null);
  
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
    
    console.log('Creating new socket connection to:', socketUrl);
    
    // Create a new socket connection
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'], // Add polling as fallback
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true, // Force a new connection
      autoConnect: true // Automatically connect
    });
    
    // Store the socket in the ref
    socketRef.current = newSocket;
    
    // Set up event listeners
    newSocket.on('connect', () => {
      console.log('WebSocket connected successfully');
      setConnectionStatus('connected');
      setIsConnected(true);
      setError(null);
      
      // Start ping interval to keep connection alive and test latency
      pingIntervalRef.current = setInterval(() => {
        if (newSocket.connected) {
          const startTime = Date.now();
          newSocket.emit('ping', (response) => {
            const latency = Date.now() - startTime;
            setPingResult({ latency, timestamp: response.timestamp });
            console.log(`WebSocket ping: ${latency}ms`);
          });
        }
      }, 10000); // Ping every 10 seconds
    });
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is hidden, prepare for potential disconnect
      } else {
        // Page is visible again, ensure connection
        if (!newSocket.connected) {
          reconnect();
        }
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
      console.error('WebSocket connection error:', err.message);
      setConnectionStatus('error');
      setIsConnected(false);
      setError(`Connection error: ${err.message}`);
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    // Message handler
    newSocket.on('message', (message) => {
      setLastMessage(message);
      
      switch (message.type) {
        case 'CONNECTED':
          console.log('Received CONNECTED message from server');
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
      
      return updatedGuests;
    });
  }, []);

  // Handler for metrics updates
  const handleMetricsUpdate = useCallback((payload) => {
    // Handle both single metric and array of metrics
    const metricData = Array.isArray(payload) ? payload : [payload];
    
    if (metricData.length > 0) {
    }
    
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
      console.log('Attempting to reconnect WebSocket...');
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