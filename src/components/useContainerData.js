import { useCallback, useRef, useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useContainerStore } from '../stores/containerStore';

const API_ENDPOINT = '/api/nodes/minipc/lxc';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

const useContainerData = (credentials) => {
  const [initialLoad, setInitialLoad] = useState(true);
  
  const {
    setContainers,
    setLoading,
    setError,
    clearError
  } = useContainerStore();

  const { userPreferences } = useSettingsStore();
  const { refreshRate } = userPreferences;

  const previousStats = useRef({});
  const retryCount = useRef(0);
  const retryTimeout = useRef(null);
  const isMounted = useRef(true);
  const hasInitialData = useRef(false);

  const handleError = useCallback((error) => {
    if (!isMounted.current) return;

    console.error('Error fetching container data:', error);
    
    if (retryCount.current < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount.current);
      console.log(`Retrying in ${delay}ms (attempt ${retryCount.current + 1}/${MAX_RETRIES})`);
      
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }

      retryTimeout.current = setTimeout(() => {
        if (isMounted.current) {
          retryCount.current += 1;
          fetchData();
        }
      }, delay);
    } else {
      setError(error.message);
      retryCount.current = 0;
    }
  }, [setError]);

  const fetchData = useCallback(async () => {
    if (!credentials || !isMounted.current) return;

    try {
      // Only set loading on initial fetch
      if (!hasInitialData.current) {
        setLoading(true);
      }
      clearError();

      const response = await fetch(API_ENDPOINT, {
        headers: {
          'X-Proxmox-Auth': `PVEAPIToken=${credentials.apiToken}=${credentials.apiTokenSecret}`,
          'X-Proxmox-URL': credentials.proxmoxUrl
        }
      });

      if (!isMounted.current) return;

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!isMounted.current) return;

      if (result?.data) {
        const containers = result.data.map(container => {
          // Calculate network rates
          const prevStats = previousStats.current[container.vmid] || {};
          const networkIn = prevStats.netin ? 
            Math.max(0, (container.netin - prevStats.netin) / refreshRate * 1000 / (1024 * 1024)) : 0;
          const networkOut = prevStats.netout ? 
            Math.max(0, (container.netout - prevStats.netout) / refreshRate * 1000 / (1024 * 1024)) : 0;

          // Update previous stats
          previousStats.current[container.vmid] = {
            netin: container.netin,
            netout: container.netout
          };

          return {
            name: container.name || 'Unknown',
            id: container.vmid,
            cpu: Math.round((container.cpu || 0) * 1000) / 10,
            memory: container.mem && container.maxmem ? 
              Math.round((container.mem / container.maxmem) * 100) : 0,
            disk: container.disk && container.maxdisk ? 
              Math.round((container.disk / container.maxdisk) * 100) : 0,
            networkIn,
            networkOut,
            ip: container.ip,
            status: container.status || 'unknown'
          };
        });

        setContainers(containers);
        clearError();
        retryCount.current = 0;

        // Mark initial data as received
        if (!hasInitialData.current) {
          hasInitialData.current = true;
          setInitialLoad(false);
        }
      }
    } catch (error) {
      handleError(error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [credentials, refreshRate, setContainers, setLoading, clearError, handleError]);

  useEffect(() => {
    isMounted.current = true;
    hasInitialData.current = false;
    setInitialLoad(true);

    if (!credentials) {
      setError('No credentials provided');
      setInitialLoad(false);
      return;
    }

    // Initial fetch
    fetchData();

    // Set up polling interval
    const interval = setInterval(fetchData, refreshRate);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
    };
  }, [credentials, refreshRate, fetchData, setError]);

  // Return container data from store and initial load state
  const { containers, loading, error } = useContainerStore();
  return { data: containers, loading, error, initialLoad };
};

export default useContainerData;
