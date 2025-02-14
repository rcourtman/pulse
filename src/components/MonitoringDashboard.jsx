import React, { useState, useCallback, useMemo } from 'react';
import { Settings2, SortAsc, AlertTriangle, Pin } from "lucide-react";
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

const ContainerRow = React.memo(({ container, getProgressBarColor, thresholds, isPinned, onTogglePin }) => {
  const isRunning = container.status === 'running';
  const nameColor = isRunning ? 'text-gray-200' : 'text-gray-500';
  const pinColor = isPinned ? 'text-blue-400' : 'text-gray-500';
  const cpuColor = !isRunning || container.cpu < thresholds.cpu ? 'text-gray-500' : 'text-white';
  const memColor = !isRunning || container.memory < thresholds.memory ? 'text-gray-500' : 'text-white';
  const diskColor = !isRunning || container.disk < thresholds.disk ? 'text-gray-500' : 'text-white';
  const netInColor = !isRunning || container.networkIn < thresholds.network ? 'text-gray-500' : 'text-white';
  const netOutColor = !isRunning || container.networkOut < thresholds.network ? 'text-gray-500' : 'text-white';

  return (
    <div className="grid grid-cols-5 gap-4 px-4 py-2 rounded hover:bg-gray-800">
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span title={container.ip ? `IP: ${container.ip}` : ''} className={nameColor}>
            {container.name}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onTogglePin(container.id)}
          className={`h-6 w-6 ${pinColor} hover:text-blue-400`}
        >
          <Pin className="h-4 w-4" />
        </Button>
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
      <div className="text-gray-200 flex gap-2 justify-end">
        <span className={netInColor}>↑ {formatNetworkRate(container.networkIn)}</span>
        <span className="mx-1 text-gray-500">|</span>
        <span className={netOutColor}>↓ {formatNetworkRate(container.networkOut)}</span>
      </div>
    </div>
  );
});

// Settings Panel Component
const SettingsPanel = ({ thresholds, setThresholds, alertConfig, setAlertConfig, onClose }) => {
  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-gray-800 p-6 shadow-lg border-l border-gray-700 overflow-y-auto">
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
          
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Alert Mode</label>
            <select
              value={alertConfig.mode}
              onChange={(e) => setAlertConfig(prev => ({ ...prev, mode: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white text-sm"
            >
              <option value="any">Any Threshold Exceeded</option>
              <option value="all">All Thresholds Exceeded</option>
              <option value="custom">Custom Threshold Count</option>
            </select>
          </div>

          {alertConfig.mode === 'custom' && (
            <div className="space-y-2">
              <label className="text-gray-300 text-sm block">
                Minimum Thresholds: {alertConfig.minThresholds}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={alertConfig.minThresholds}
                onChange={(e) => setAlertConfig(prev => ({ ...prev, minThresholds: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include-stopped"
              checked={alertConfig.includeStoppedContainers}
              onChange={(e) => setAlertConfig(prev => ({ ...prev, includeStoppedContainers: e.target.checked }))}
              className="rounded bg-gray-700 border-gray-600"
            />
            <label htmlFor="include-stopped" className="text-gray-300 text-sm">
              Include Stopped Containers
            </label>
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
    </div>
  );
};

const MonitoringDashboard = () => {
  const { data: containers, loading, error } = useContainerData();
  const [showSettings, setShowSettings] = useState(false);
  const [sortMode, setSortMode] = useState('alert');
  const [pinnedServices, setPinnedServices] = useState(new Set());

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
  const [thresholds, setThresholds] = useState({
    cpu: 5,
    memory: 80,
    disk: 80,
    network: 1024
  });
  const [alertConfig, setAlertConfig] = useState({
    mode: 'any',
    minThresholds: 2,
    includeStoppedContainers: false
  });

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

    switch (alertConfig.mode) {
      case 'any':
        return exceededThresholds > 0 ? 1 : 0;
      case 'all':
        return exceededThresholds === 5 ? 1 : 0;
      case 'custom':
        return exceededThresholds >= alertConfig.minThresholds ? 1 : 0;
      default:
        return 0;
    }
  }, [thresholds, alertConfig]);

  const sortedContainers = useMemo(() => {
    if (!containers) return [];
    return [...containers].sort((a, b) => {
      // First prioritize pinned status
      const aPinned = pinnedServices.has(a.id);
      const bPinned = pinnedServices.has(b.id);
      if (aPinned !== bPinned) {
        return bPinned ? 1 : -1;
      }
      
      // Then apply the selected sort mode
      if (sortMode === 'alert') {
        const aScore = getAlertScore(a);
        const bScore = getAlertScore(b);
        if (aScore === bScore) {
          return a.name.localeCompare(b.name);
        }
        return bScore - aScore;
      }
      return a.name.localeCompare(b.name);
    });
  }, [containers, sortMode, getAlertScore, pinnedServices]);

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

          <Button
            variant="outline"
            onClick={() => setSortMode((prev) => (prev === 'alert' ? 'name' : 'alert'))}
            className="bg-gray-800 hover:bg-gray-700 text-white"
          >
            {sortMode === 'alert' ? 
              <AlertTriangle className="h-4 w-4 mr-2" /> : 
              <SortAsc className="h-4 w-4 mr-2" />
            }
            {sortMode === 'alert' ? 'Sort by Alerts' : 'Sort by Name'}
          </Button>
        </div>
      </div>

      {showSettings && (
        <SettingsPanel
          thresholds={thresholds}
          setThresholds={setThresholds}
          alertConfig={alertConfig}
          setAlertConfig={setAlertConfig}
          onClose={() => setShowSettings(false)}
        />
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
          <div>Name</div>
          <div>CPU</div>
          <div>Memory</div>
          <div>Disk</div>
          <div className="text-right">Network</div>
        </div>
        
        {sortedContainers.map((container) => (
          <ContainerRow
            key={container.id}
            container={container}
            getProgressBarColor={getProgressBarColor}
            thresholds={thresholds}
            isPinned={pinnedServices.has(container.id)}
            onTogglePin={handleTogglePin}
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
