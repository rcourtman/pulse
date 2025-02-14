import React, { useState, useCallback } from 'react';

const API_ENDPOINT = '/api/nodes/minipc/lxc';

const useContainerData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const previousStats = React.useRef({});
  // Store smoothed values for each container
  const smoothedValues = React.useRef({});
  const lastFetchTime = React.useRef(Date.now());

  // Asymmetric smoothing: rises quickly, falls slowly
  const smoothValue = (newValue, oldValue) => {
    if (oldValue === undefined) return newValue;
    const factor = newValue > oldValue ? 0.3 : 0.7;
    return oldValue * (1 - factor) + newValue * factor;
  };

  const fetchData = useCallback(async (signal) => {
    try {
      const response = await fetch(API_ENDPOINT, { signal });
      const currentTime = Date.now();
      const timeDiff = (currentTime - lastFetchTime.current) / 1000; // seconds
      lastFetchTime.current = currentTime;
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
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
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    const interval = setInterval(() => fetchData(controller.signal), 2000);
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [fetchData]);

  return { data, loading, error };
};

export default useContainerData;
