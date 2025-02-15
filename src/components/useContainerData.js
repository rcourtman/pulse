import React, { useState, useCallback } from 'react';

const API_ENDPOINT = '/api/nodes/minipc/lxc';

const useContainerData = (credentials) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const previousStats = React.useRef({});
  const smoothedValues = React.useRef({});
  const lastFetchTime = React.useRef(Date.now());

  // Asymmetric smoothing: rises quickly, falls slowly
  const smoothValue = (newValue, oldValue) => {
    if (oldValue === undefined) return newValue;
    const factor = newValue > oldValue ? 0.3 : 0.7;
    return oldValue * (1 - factor) + newValue * factor;
  };

  const fetchData = useCallback(async (signal) => {
    if (!credentials) {
      console.log('No credentials provided to useContainerData');
      setError('No credentials provided');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching data with credentials:', {
        url: credentials.proxmoxUrl,
        token: credentials.apiToken,
        // Don't log the secret
      });

      const response = await fetch(API_ENDPOINT, { 
        signal,
        headers: {
          'X-Proxmox-Auth': `PVEAPIToken=${credentials.apiToken}=${credentials.apiTokenSecret}`,
          'X-Proxmox-URL': credentials.proxmoxUrl
        }
      });

      console.log('API response status:', response.status);
      
      const currentTime = Date.now();
      const timeDiff = (currentTime - lastFetchTime.current) / 1000; // seconds
      lastFetchTime.current = currentTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API response data:', result);

      if (result?.data) {
        const containers = result.data.map((container) => {
          const prevStats = previousStats.current[container.vmid];
          let instantNetIn, instantNetOut;
          if (prevStats) {
            instantNetIn = Math.max(0, container.netin - prevStats.netin) / timeDiff / 1024;
            instantNetOut = Math.max(0, container.netout - prevStats.netout) / timeDiff / 1024;
          } else {
            instantNetIn = 0;
            instantNetOut = 0;
          }
          
          const instantCpu = Math.round((container.cpu || 0) * 1000) / 10;
          const instantMemory = container.mem && container.maxmem ? 
            Math.round((container.mem / container.maxmem) * 100) : 0;
          const instantDisk = container.disk && container.maxdisk ? 
            Math.round((container.disk / container.maxdisk) * 100) : 0;

          const prevSmooth = smoothedValues.current[container.vmid] || {};
          const smoothedCpu = smoothValue(instantCpu, prevSmooth.cpu);
          const smoothedMemory = Math.round(smoothValue(instantMemory, prevSmooth.memory));
          const smoothedDisk = Math.round(smoothValue(instantDisk, prevSmooth.disk));
          const smoothedNetIn = smoothValue(instantNetIn, prevSmooth.networkIn);
          const smoothedNetOut = smoothValue(instantNetOut, prevSmooth.networkOut);
          const smoothedNetwork = smoothedNetIn + smoothedNetOut;

          smoothedValues.current[container.vmid] = {
            cpu: smoothedCpu,
            memory: smoothedMemory,
            disk: smoothedDisk,
            networkIn: smoothedNetIn,
            networkOut: smoothedNetOut,
          };

          return {
            name: container.name || 'Unknown',
            id: container.vmid,
            cpu: smoothedCpu,
            memory: smoothedMemory,
            disk: smoothedDisk,
            networkIn: smoothedNetIn,
            networkOut: smoothedNetOut,
            network: smoothedNetwork,
            ip: container.ip,
            status: container.status || 'unknown'
          };
        });

        const newStats = {};
        result.data.forEach((container) => {
          newStats[container.vmid] = {
            netin: container.netin,
            netout: container.netout
          };
        });
        previousStats.current = newStats;
        setData(containers);
        setError(null);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error in useContainerData:', err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [credentials]);

  React.useEffect(() => {
    if (!credentials) {
      console.log('No credentials in useEffect, skipping fetch setup');
      return;
    }
    
    console.log('Setting up data fetching interval');
    const controller = new AbortController();
    fetchData(controller.signal);
    const interval = setInterval(() => fetchData(controller.signal), 2000);
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [fetchData, credentials]);

  return { data, loading, error };
};

export default useContainerData;
