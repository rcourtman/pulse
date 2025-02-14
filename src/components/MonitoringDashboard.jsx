import React, { useState, useCallback, useMemo } from 'react';
import { Settings2, Pin, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import useContainerData from './useContainerData';

// Previous helper functions remain the same
const formatNetworkRate = (rateInKB) => {
  if (rateInKB >= 1024 * 1024) {
    return `${Math.round(rateInKB / (1024 * 1024))} GB/s`;
  } else if (rateInKB >= 1024) {
    return `${Math.round(rateInKB / 1024)} MB/s`;
  } else {
    return `${Math.round(rateInKB)} KB/s`;
  }
};

const getProgressBarColor = (value) => {
  if (value >= 90) return 'bg-red-500';
  if (value >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
};

const ContainerRow = React.memo(({ container, getProgressBarColor, thresholds, isPinned, onTogglePin, getAlertScore, enablePulsingAnimation }) => {
  const isRunning = container.status === 'running';
  const nameColor = isRunning ? 'text-gray-200' : 'text-gray-500';
  const pinColor = isPinned ? 'text-blue-400' : 'text-gray-500';
  const cpuColor = !isRunning || container.cpu < thresholds.cpu ? 'text-gray-500' : 'text-white';
  const memColor = !isRunning || container.memory < thresholds.memory ? 'text-gray-500' : 'text-white';
  const diskColor = !isRunning || container.disk < thresholds.disk ? 'text-gray-500' : 'text-white';
  const netInColor = !isRunning || container.networkIn < thresholds.network ? 'text-gray-500' : 'text-white';
  const netOutColor = !isRunning || container.networkOut < thresholds.network ? 'text-gray-500' : 'text-white';
  
  const isAlerted = getAlertScore(container) > 0;
  const rowClassName = `relative grid grid-cols-5 gap-4 px-4 py-2 rounded hover:bg-gray-800`;

  return (
    <div className={rowClassName}>
      {isAlerted && enablePulsingAnimation && (
        <div className="absolute inset-0 bg-blue-500 animate-pulse-bg rounded pointer-events-none" />
      )}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-500'}`} />
        <span title={container.ip ? `IP: ${container.ip}` : ''} className={nameColor}>
          {container.name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`w-12 ${cpuColor}`}>{container.cpu.toFixed(1)}%</span>
        <div className="flex-1 bg-gray-700 rounded-full h-2">
          <div
            className={`${getProgressBarColor(container.cpu)} h-full rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(container.cpu, 100)}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`w-12 ${memColor}`}>{container.memory}%</span>
        <div className="flex-1 bg-gray-700 rounded-full h-2">
          <div
            className={`${getProgressBarColor(container.memory)} h-full rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(container.memory, 100)}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`w-12 ${diskColor}`}>{container.disk}%</span>
        <div className="flex-1 bg-gray-700 rounded-full h-2">
          <div
            className={`${getProgressBarColor(container.disk)} h-full rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(container.disk, 100)}%` }}
          />
        </div>
      </div>
      <div className="text-gray-200 flex gap-2 justify-end items-center">
        <div className="flex gap-2">
          <span className={netInColor}>↑ {formatNetworkRate(container.networkIn)}</span>
          <span className="mx-1 text-gray-500">|</span>
          <span className={netOutColor}>↓ {formatNetworkRate(container.networkOut)}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onTogglePin(container.id)}
          className={`h-6 w-6 ml-2 ${pinColor} hover:text-blue-400`}
        >
          <Pin className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

// Settings Panel Component
const SettingsPanel = ({ thresholds, setThresholds, alertConfig, setAlertConfig, onClose, onReset }) => {
  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-gray-800 p-6 shadow-lg border-l border-gray-700 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-white">Settings</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-gray-700"
        >
          ×
        </Button>
      </div>

      <div className="space-y-6">
        {/* Alert Configuration */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-200">Alert Configuration</h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="include-stopped"
                checked={alertConfig.includeStoppedContainers}
                onChange={(e) => setAlertConfig(prev => ({ ...prev, includeStoppedContainers: e.target.checked }))}
                className="rounded bg-gray-700 border-gray-600"
              />
              <label htmlFor="include-stopped" className="text-gray-300 text-sm">
                Alert on Stopped Containers
                <div className="text-gray-500 text-xs">
                  When enabled, stopped containers can trigger alerts if their last known metrics exceeded thresholds.
                  Useful for detecting containers that crashed or stopped due to resource exhaustion (e.g., a container
                  that stopped because it ran out of memory).
                </div>
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable-pulse"
                checked={alertConfig.enablePulsingAnimation}
                onChange={(e) => setAlertConfig(prev => ({ ...prev, enablePulsingAnimation: e.target.checked }))}
                className="rounded bg-gray-700 border-gray-600"
              />
              <label htmlFor="enable-pulse" className="text-gray-300 text-sm">
                Enable Pulsing Animation
              </label>
            </div>
          </div>
        </div>

        {/* Thresholds */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-200">Alert Thresholds</h4>
          
          <div className="space-y-2">
            <label className="text-gray-300 text-sm flex justify-between">
              <span>CPU</span>
              <span>{thresholds.cpu}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={thresholds.cpu}
              onChange={(e) => setThresholds(prev => ({ ...prev, cpu: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-300 text-sm flex justify-between">
              <span>Memory</span>
              <span>{thresholds.memory}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={thresholds.memory}
              onChange={(e) => setThresholds(prev => ({ ...prev, memory: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-300 text-sm flex justify-between">
              <span>Disk</span>
              <span>{thresholds.disk}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={thresholds.disk}
              onChange={(e) => setThresholds(prev => ({ ...prev, disk: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-300 text-sm flex justify-between">
              <span>Network</span>
              <span>{thresholds.network} KB/s</span>
            </label>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={thresholds.network}
              onChange={(e) => setThresholds(prev => ({ ...prev, network: Number(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="pt-4 mt-6 border-t border-gray-700">
        <Button
          variant="ghost"
          onClick={onReset}
          className="w-full text-white hover:bg-gray-700"
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};

// Default settings values
const DEFAULT_THRESHOLDS = {
  cpu: 5,
  memory: 80,
  disk: 80,
  network: 1024
};

const DEFAULT_ALERT_CONFIG = {
  includeStoppedContainers: false,
  enablePulsingAnimation: true
};

const SortableHeader = ({ field, currentField, direction, onSort, children, className = "" }) => {
  const isActive = currentField === field;

  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-2 hover:text-white transition-colors ${isActive ? 'text-white' : ''} ${className}`}
    >
      {children}
      {isActive && field !== 'alert' && (
        <span className="text-blue-400">
          {direction === 'desc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        </span>
      )}
    </button>
  );
};

const MonitoringDashboard = () => {
  const { data: containers, loading, error } = useContainerData();
  const [showSettings, setShowSettings] = useState(false);
  const [sortField, setSortField] = useState('alert');
  const [sortDirection, setSortDirection] = useState('desc');
  const [pinnedServices, setPinnedServices] = useState(new Set());

  const handleSort = useCallback((field) => {
    if (field === 'alert') return; // Prevent direct clicking of alert sort
    
    setSortField(prev => {
      if (prev === field) {
        // If clicking the same field again, return to alert sorting
        setSortDirection('desc');
        return 'alert';
      }
      // Switch to new field
      setSortDirection('desc');
      return field;
    });
  }, []);

  const handleTogglePin = useCallback((containerId) => {
    setPinnedServices(prev => {
      const newPinned = new Set(prev);
      if (newPinned.has(containerId)) {
        newPinned.delete(containerId);
      } else {
        newPinned.add(containerId);
      }
      return newPinned;
    });
  }, []);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [alertConfig, setAlertConfig] = useState(DEFAULT_ALERT_CONFIG);

  const handleReset = useCallback(() => {
    setThresholds(DEFAULT_THRESHOLDS);
    setAlertConfig(DEFAULT_ALERT_CONFIG);
  }, []);

  const getAlertScore = useCallback((container) => {
    if (!alertConfig.includeStoppedContainers && container.status !== 'running') {
      return 0;
    }

    let exceededThresholds = 0;
    if (container.cpu >= thresholds.cpu) exceededThresholds++;
    if (container.memory >= thresholds.memory) exceededThresholds++;
    if (container.disk >= thresholds.disk) exceededThresholds++;
    if (container.networkIn >= thresholds.network) exceededThresholds++;
    if (container.networkOut >= thresholds.network) exceededThresholds++;

    return exceededThresholds > 0 ? 1 : 0;
  }, [thresholds, alertConfig]);

  const sortedContainers = useMemo(() => {
    if (!containers) return [];
    return [...containers].sort((a, b) => {
      const aPinned = pinnedServices.has(a.id);
      const bPinned = pinnedServices.has(b.id);

      // First sort by pin status
      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }

      // Then apply the selected sort within each group (pinned and unpinned)
      
      // If manual sort is active, use that
      if (sortField !== 'alert') {
        const direction = sortDirection === 'asc' ? 1 : -1;
        switch (sortField) {
          case 'cpu':
            return (a.cpu - b.cpu) * direction;
          case 'memory':
            return (a.memory - b.memory) * direction;
          case 'disk':
            return (a.disk - b.disk) * direction;
          case 'network':
            const aNet = Math.max(a.networkIn, a.networkOut);
            const bNet = Math.max(b.networkIn, b.networkOut);
            return (aNet - bNet) * direction;
        }
      }

      // Default alert sorting
      const aScore = getAlertScore(a);
      const bScore = getAlertScore(b);
      if (aScore === bScore) {
        return a.name.localeCompare(b.name);
      }
      return bScore - aScore; // Always descending for alerts (higher score at top)
    });
  }, [containers, sortField, sortDirection, getAlertScore, pinnedServices]);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">All Systems</h1>
          <p className="text-gray-400">Updated in real time.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="bg-gray-800 hover:bg-gray-700 text-white"
          >
            <Settings2 className="h-4 w-4" />
          </Button>

        </div>
      </div>

      {showSettings && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowSettings(false)}
          />
          <SettingsPanel
            thresholds={thresholds}
            setThresholds={setThresholds}
            alertConfig={alertConfig}
            setAlertConfig={setAlertConfig}
            onClose={() => setShowSettings(false)}
            onReset={handleReset}
          />
        </>
      )}

      {loading && (
        <div className="text-gray-200 mb-4 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-white rounded-full" />
          Loading...
        </div>
      )}
      
      {error && (
        <div className="text-red-500 mb-4 p-4 bg-red-900/20 rounded-lg">
          Error: {error}
        </div>
      )}

      <div className="space-y-1 rounded-lg border border-gray-800 bg-gray-900/50 p-1">
        <div className="grid grid-cols-5 gap-4 px-4 py-2 text-sm font-medium text-gray-400">
          <span className="text-gray-400">Name</span>
          <div>
            <SortableHeader
              field="cpu"
              currentField={sortField}
              direction={sortDirection}
              onSort={handleSort}
            >
              CPU
            </SortableHeader>
          </div>
          <div>
            <SortableHeader
              field="memory"
              currentField={sortField}
              direction={sortDirection}
              onSort={handleSort}
            >
              Memory
            </SortableHeader>
          </div>
          <div>
            <SortableHeader
              field="disk"
              currentField={sortField}
              direction={sortDirection}
              onSort={handleSort}
            >
              Disk
            </SortableHeader>
          </div>
          <div className="text-right">
            <SortableHeader
              field="network"
              currentField={sortField}
              direction={sortDirection}
              onSort={handleSort}
              className="justify-end ml-auto"
            >
              Network
            </SortableHeader>
          </div>
        </div>
        
        {sortedContainers.map((container) => (
          <ContainerRow
            key={container.id}
            container={container}
            getProgressBarColor={getProgressBarColor}
            thresholds={thresholds}
            isPinned={pinnedServices.has(container.id)}
            onTogglePin={handleTogglePin}
            getAlertScore={getAlertScore}
            enablePulsingAnimation={alertConfig.enablePulsingAnimation && sortField === 'alert' && pinnedServices.size === 0}
          />
        ))}

        {sortedContainers.length === 0 && !loading && (
          <div className="text-gray-400 text-center py-8">
            No containers found
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringDashboard;
