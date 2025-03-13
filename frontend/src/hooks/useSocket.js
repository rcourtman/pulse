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
  const isDevelopment = import.meta.env.DEV;
  
  // Get the current host
  const currentHost = window.location.hostname;
  
  // For development, we need to explicitly connect to the backend server
  // For production, we use the same origin that served the page
  let socketUrl;
  if (isDevelopment) {
    // Check if we're using mock data
    const useMockData = localStorage.getItem('use_mock_data') === 'true' || 
                        localStorage.getItem('MOCK_DATA_ENABLED') === 'true';
    
    // Always connect to the backend server (7654), which will handle the mock data if needed
    socketUrl = `http://${currentHost}:7654`;
  } else {
    // In production, use the same origin that served the page
    socketUrl = window.location.origin;
  }
  
  // Check if we're using mock data
  const useMockData = localStorage.getItem('use_mock_data') === 'true' || 
                      localStorage.getItem('MOCK_DATA_ENABLED') === 'true';
  
  // Store the mock data status as a state variable so it can be exposed in the return value
  const [isMockData, setIsMockData] = useState(useMockData);

  const [isConnected, setIsConnected] = useState(useMockData ? true : false);
  const [lastMessage, setLastMessage] = useState(null);
  const [nodeData, setNodeData] = useState(useMockData ? [
    { id: 'node-1', name: 'MOCK-pve1', status: 'online' },
    { id: 'node-2', name: 'MOCK-pve2', status: 'online' },
    { id: 'node-3', name: 'MOCK-pve3', status: 'online' }
  ] : []);
  const [guestData, setGuestData] = useState([]);
  const [metricsData, setMetricsData] = useState([]);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(useMockData ? 'connected' : 'connecting');
  
  // Use ref to maintain socket instance across renders
  const socketRef = useRef(null);
  // Use ref for ping interval
  const pingIntervalRef = useRef(null);
  // Track reconnection attempts to prevent infinite loops
  const reconnectAttemptsRef = useRef(0);
  // Reduce reconnection attempts in development mode
  const MAX_RECONNECT_ATTEMPTS = isDevelopment ? 1 : 3;

  // Initialize socket connection
  useEffect(() => {
    // Clear any existing socket connection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Log connection attempt
    console.log(`Attempting to connect to socket server at: ${socketUrl}`);
    
    // In mock data mode, we can immediately set up the UI without waiting for a connection
    if (useMockData) {
      console.log('Using mock data mode - setting up immediate UI rendering');
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Set up mock data
      const mockNodes = [
        { id: 'node-1', name: 'MOCK-pve1', status: 'online' },
        { id: 'node-2', name: 'MOCK-pve2', status: 'online' },
        { id: 'node-3', name: 'MOCK-pve3', status: 'online' }
      ];
      setNodeData(mockNodes);
    }
    
    // Set a timeout to ensure we don't wait forever for the socket connection
    const connectionTimeout = setTimeout(() => {
      if (!isConnected) {
        console.log('Socket connection timeout - using fallback');
        // Force connected state for mock data mode
        if (useMockData || isDevelopment) {
          setIsConnected(true);
          setConnectionStatus('connected');
        }
      }
    }, 3000); // Reduced from 5000ms to 3000ms
    
    try {
      // Create new socket connection
      socketRef.current = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
        autoConnect: true,
        forceNew: true,
        randomizationFactor: 0.5
      });
      
      // Set up event handlers
      socketRef.current.on('connect', () => {
        console.log('Socket connected successfully');
        clearTimeout(connectionTimeout); // Clear the timeout on successful connection
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
        
        // Request server configuration to check if mock data is enabled on the server
        socketRef.current.emit('getServerConfig', (config) => {
          if (config && (config.useMockData || config.mockDataEnabled)) {
            console.log('Server is using mock data');
            setIsMockData(true);
            // Store this information in localStorage for persistence
            localStorage.setItem('use_mock_data', 'true');
            localStorage.setItem('MOCK_DATA_ENABLED', 'true');
          } else {
            console.log('Server is using real data');
            setIsMockData(false);
          }
        });
        
        // Request initial data
        socketRef.current.emit('requestNodeData');
        socketRef.current.emit('requestGuestData');
        socketRef.current.emit('requestMetricsData');
        
        // Start ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('ping', { timestamp: Date.now() });
          }
        }, 5000);
      });
      
      // Handle page visibility changes
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && socketRef.current && !socketRef.current.connected) {
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current++;
            reconnect();
          } else {
            console.warn(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Not attempting further reconnections.`);
            // If using mock data, still show the UI
            if (useMockData) {
              setIsConnected(true);
              setConnectionStatus('connected');
            }
          }
        }
      };
      
      // Handle page unload
      const handleBeforeUnload = () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
      
      // Set up page visibility and unload listeners
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Handle connection errors
      socketRef.current.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        
        // In development mode, immediately fall back to mock data mode
        if (isDevelopment) {
          console.log('Development mode: Immediately falling back to mock data mode');
          socketRef.current.disconnect();
          setConnectionStatus('connected'); // Set to connected anyway to show the UI
          setIsConnected(true);
          
          // Generate mock data for the UI
          const mockNodes = [
            { id: 'node-1', name: 'MOCK-pve1', status: 'online' },
            { id: 'node-2', name: 'MOCK-pve2', status: 'online' },
            { id: 'node-3', name: 'MOCK-pve3', status: 'online' }
          ];
          
          // Set mock data
          setNodeData(mockNodes);
          return;
        }
        
        reconnectAttemptsRef.current++;
        
        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.warn(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Not attempting further reconnections.`);
          socketRef.current.disconnect();
          setConnectionStatus('error');
          setIsConnected(false);
          setError(`Connection error after ${MAX_RECONNECT_ATTEMPTS} attempts: ${err.message}`);
          
          // If we're using mock data, we can still show the UI with mock data
          if (useMockData) {
            // Generate some mock data for the UI
            console.log('Using mock data fallback due to connection error');
            
            // Mock node data
            const mockNodes = [
              { id: 'node-1', name: 'MOCK-pve1', status: 'online' },
              { id: 'node-2', name: 'MOCK-pve2', status: 'online' },
              { id: 'node-3', name: 'MOCK-pve3', status: 'online' }
            ];
            
            // Set mock data
            setNodeData(mockNodes);
            
            // Set connection status to connected so the UI renders
            setConnectionStatus('connected');
            setIsConnected(true);
          }
        } else {
          setConnectionStatus('error');
          setIsConnected(false);
          setError(`Connection error: ${err.message}`);
          
          // If we're using mock data, we can still show the UI with mock data
          if (useMockData) {
            // Generate some mock data for the UI
            console.log('Using mock data fallback due to connection error');
            
            // Mock node data
            const mockNodes = [
              { id: 'node-1', name: 'MOCK-pve1', status: 'online' },
              { id: 'node-2', name: 'MOCK-pve2', status: 'online' },
              { id: 'node-3', name: 'MOCK-pve3', status: 'online' }
            ];
            
            // Set mock data
            setNodeData(mockNodes);
            
            // Set connection status to connected so the UI renders
            setConnectionStatus('connected');
            setIsConnected(true);
          }
        }
      });
      
      socketRef.current.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${reason}`);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Don't attempt to reconnect if we've reached the maximum attempts
        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.warn(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Not attempting further reconnections.`);
          // If using mock data, still show the UI
          if (useMockData) {
            setIsConnected(true);
            setConnectionStatus('connected');
          }
          return;
        }
        
        // Only attempt to reconnect for certain disconnect reasons
        if (reason === 'io server disconnect' || reason === 'transport close') {
          reconnectAttemptsRef.current++;
          // Calculate a delay with exponential backoff and randomization
          const baseDelay = 3000; // Base delay of 3 seconds
          const attempt = reconnectAttemptsRef.current;
          const exponentialDelay = baseDelay * Math.pow(1.5, attempt); // Exponential backoff
          const jitter = Math.random() * 2000; // Random jitter up to 2 seconds
          const reconnectDelay = exponentialDelay + jitter;
          
          console.log(`Will attempt reconnection in ${Math.round(reconnectDelay / 1000)} seconds (attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS})`);
          
          // Attempt to reconnect after the calculated delay
          setTimeout(() => {
            if (socketRef.current) {
              socketRef.current.connect();
            }
          }, reconnectDelay);
        }
      });

      // Message handler
      socketRef.current.on('message', (message) => {
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
            handleEventUpdate(message.payload);
            break;
          
          case 'ERROR':
            setError(message.payload);
            break;
          
          default:
        }
      });

      // Direct event handler for migration events
      socketRef.current.on('event', (event) => {
        if (event && event.type === 'migration') {
          handleEventUpdate(event);
        }
      });

      // Setup socket event listeners
      socketRef.current.on('nodeData', (data) => {
        if (Array.isArray(data)) {
          // Check if this is mock data by looking for the 'MOCK-' prefix in node names
          const isMockDataNodes = data.some(node => node.name && node.name.startsWith('MOCK-'));
          if (isMockDataNodes) {
            console.log('Detected mock data from node names');
            setIsMockData(true);
          }
          setNodeData(data);
        }
      });

      // Cleanup function
      return () => {
        clearTimeout(connectionTimeout); // Clear the timeout on cleanup
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
        
        // Remove event listeners
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    } catch (error) {
      clearTimeout(connectionTimeout); // Clear the timeout on error
      console.error('Error initializing socket connection:', error);
      setError('Failed to initialize socket connection');
      
      // If we're using mock data, still show the UI
      if (useMockData) {
        setIsConnected(true);
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    }
  }, [socketUrl, useMockData]); // Remove isConnected from dependency array to prevent reconnection loops

  // Generate mock guest data if we're using mock data and have no real data
  useEffect(() => {
    if (useMockData && guestData.length === 0 && nodeData.length > 0) {
      console.log('Generating mock guest data');
      
      // Generate some basic mock guest data
      const mockGuests = [
        { id: '101', name: 'mock-db-master', type: 'vm', status: 'running', node: 'node-1' },
        { id: '104', name: 'mock-web1', type: 'vm', status: 'running', node: 'node-1' },
        { id: '121', name: 'mock-dev-db', type: 'vm', status: 'running', node: 'node-2' },
        { id: '125', name: 'mock-dev-web1', type: 'vm', status: 'running', node: 'node-2' },
        { id: '150', name: 'mock-win10-test', type: 'vm', status: 'running', node: 'node-3' },
        { id: '203', name: 'mock-lb1', type: 'ct', status: 'running', node: 'node-1' },
        { id: '220', name: 'mock-dev-tools', type: 'ct', status: 'running', node: 'node-2' },
        { id: '240', name: 'mock-pihole-dns', type: 'ct', status: 'running', node: 'node-3' },
        { id: '999', name: 'mock-shared-vm', type: 'vm', status: 'running', node: 'node-1' },
        { id: '888', name: 'mock-shared-container', type: 'ct', status: 'running', node: 'node-1' }
      ];
      
      setGuestData(mockGuests);
    }
  }, [useMockData, guestData.length, nodeData]);
  
  // Generate mock metrics data if we're using mock data and have no real metrics
  useEffect(() => {
    if (useMockData && metricsData.length === 0 && guestData.length > 0) {
      console.log('Generating mock metrics data');
      
      // Generate mock metrics for each guest
      const mockMetrics = guestData.map(guest => {
        return {
          guestId: guest.id,
          nodeId: guest.node,
          timestamp: Date.now(),
          metrics: {
            cpu: Math.random() * 50, // Random CPU usage between 0-50%
            memory: {
              total: 8 * 1024 * 1024 * 1024, // 8 GB
              used: Math.random() * 4 * 1024 * 1024 * 1024, // 0-4 GB used
              percentUsed: Math.random() * 50 // 0-50%
            },
            disk: {
              total: 100 * 1024 * 1024 * 1024, // 100 GB
              used: Math.random() * 50 * 1024 * 1024 * 1024, // 0-50 GB used
              percentUsed: Math.random() * 50 // 0-50%
            },
            network: {
              inRate: Math.random() * 10 * 1024 * 1024, // 0-10 MB/s
              outRate: Math.random() * 5 * 1024 * 1024, // 0-5 MB/s
            }
          }
        };
      });
      
      setMetricsData(mockMetrics);
    }
  }, [useMockData, metricsData.length, guestData]);

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
          environment: import.meta.env.MODE || 'development',
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
          // Increase minimum time threshold to avoid too frequent updates
          const minUpdateInterval = 1000; // milliseconds (increased from 200ms to 1000ms)
          const timeSinceLastUpdate = metric.timestamp - (existingMetric.timestamp || 0);
          
          if (!existingMetric.timestamp || 
              (metric.timestamp >= existingMetric.timestamp && timeSinceLastUpdate >= minUpdateInterval)) {
            // Find the index in the array
            const index = newMetrics.findIndex(m => m.guestId === metric.guestId);
            if (index >= 0) {
              // Check if the metrics have actually changed, with higher thresholds to reduce UI flicker
              const hasSignificantChange = 
                Math.abs((metric.metrics?.cpu || 0) - (existingMetric.metrics?.cpu || 0)) > 1.0 ||
                Math.abs((metric.metrics?.memory?.percentUsed || 0) - (existingMetric.metrics?.memory?.percentUsed || 0)) > 1.0 ||
                Math.abs((metric.metrics?.disk?.percentUsed || 0) - (existingMetric.metrics?.disk?.percentUsed || 0)) > 1.0 ||
                Math.abs((metric.metrics?.network?.inRate || 0) - (existingMetric.metrics?.network?.inRate || 0)) > 2.0 ||
                Math.abs((metric.metrics?.network?.outRate || 0) - (existingMetric.metrics?.network?.outRate || 0)) > 2.0;
              
              // Always update if it's been more than 3 seconds, regardless of change magnitude
              const forceUpdateInterval = 3000; // 3 seconds (increased from 2 seconds)
              const shouldForceUpdate = timeSinceLastUpdate >= forceUpdateInterval;
              
              if (hasSignificantChange || shouldForceUpdate) {
                newMetrics[index] = {
                  ...existingMetric,
                  ...metric,
                  timestamp: metric.timestamp || Date.now()
                };
                hasChanges = true;
              }
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

  // Handler for event updates
  const handleEventUpdate = useCallback((event) => {
    if (!event) return;
    
    console.log('Event received:', event);
    
    try {
      // Check if this is a migration event
      const isMigrationEvent = 
        (event.type === 'migration') || 
        (event.details?.type === 'migration') ||
        (event.description?.toLowerCase().includes('migration'));
      
      if (isMigrationEvent) {
        console.log('Migration event received:', event);
        
        // Extract migration details from either format
        const details = event.details || {};
        const guestId = details.guestId || event.guestId || '';
        const guestName = details.guestName || event.guestName || '';
        const fromNode = details.fromNode || event.fromNode || '';
        const toNode = details.toNode || event.toNode || event.node || '';
        const timestamp = details.timestamp || event.eventTime || Date.now();
        
        // Emit a custom event that can be listened to by other components
        const migrationEvent = new CustomEvent('proxmox:migration', { 
          detail: {
            guestId,
            guestName,
            fromNode,
            toNode,
            timestamp,
            originalEvent: event
          } 
        });
        window.dispatchEvent(migrationEvent);
        
        // Request fresh guest data after a migration
        if (socketRef.current) {
          socketRef.current.emit('requestGuestData');
        }
      }
      
      // Always set the last message for other event types
      setLastMessage(event);
    } catch (error) {
      console.error('Error handling event update:', error);
    }
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
    getHistory,
    isMockData
  };
};

export default useSocket; 