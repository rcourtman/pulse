import React from 'react';
import { Pin, Gauge } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

// Utility functions
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

const ContainerRow = React.memo(({
  container,
  isPinned,
  onTogglePin,
  getAlertScore,
  hasPinnedContainers,
  thresholds,
  compact
}) => {
  const isRunning = container.status === 'running';
  const isAlerted = getAlertScore(container) > 0;
  
  // Base row styles with compact mode support
  const rowClassName = cn(
    "relative grid grid-cols-[1fr_1fr_1fr_1fr_1fr_40px] gap-4 px-4 rounded hover:bg-gray-800 transition-colors",
    compact ? "py-1" : "py-2"
  );

  // Dynamic text colors based on pin status and container state
  const nameColor = hasPinnedContainers
    ? (isPinned ? 'text-white' : 'text-gray-500')
    : (isRunning ? 'text-gray-200' : 'text-gray-500');
  
  const pinColor = isPinned ? 'text-blue-400' : 'text-gray-500';

  // Metric color calculation
  const getMetricColor = (value, threshold) => {
    if (hasPinnedContainers) {
      return isPinned ? 'text-white' : 'text-gray-500';
    }
    if (!thresholds.enabled) {
      return isRunning ? 'text-white' : 'text-gray-500';
    }
    return !isRunning || value < threshold ? 'text-gray-500' : 'text-white';
  };

  const cpuColor = getMetricColor(container.cpu, thresholds.cpu);
  const memColor = getMetricColor(container.memory, thresholds.memory);
  const diskColor = getMetricColor(container.disk, thresholds.disk);
  const netInColor = getMetricColor(container.networkIn, thresholds.network);
  const netOutColor = getMetricColor(container.networkOut, thresholds.network);

  return (
    <div className={rowClassName}>
      {/* Alert/Pin Highlight */}
      {(isPinned || (!hasPinnedContainers && isAlerted)) && (
        <div className="absolute inset-0 bg-blue-500/20 rounded pointer-events-none" />
      )}

      {/* Container Name */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-500'}`} />
        <span 
          title={container.ip ? `IP: ${container.ip}` : ''} 
          className={nameColor}
        >
          {container.name}
        </span>
      </div>

      {/* CPU Usage */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className={`w-12 ${cpuColor}`}>{container.cpu.toFixed(1)}%</span>
          {container.cpu >= thresholds.cpu && thresholds.enabled && (
            <Gauge className="h-4 w-4 text-blue-400" />
          )}
        </div>
        <div className="flex-1 bg-gray-700 rounded-full h-2">
          <div
            className={`${getProgressBarColor(container.cpu)} h-full rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(container.cpu, 100)}%` }}
          />
        </div>
      </div>

      {/* Memory Usage */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className={`w-12 ${memColor}`}>{container.memory}%</span>
          {container.memory >= thresholds.memory && thresholds.enabled && (
            <Gauge className="h-4 w-4 text-blue-400" />
          )}
        </div>
        <div className="flex-1 bg-gray-700 rounded-full h-2">
          <div
            className={`${getProgressBarColor(container.memory)} h-full rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(container.memory, 100)}%` }}
          />
        </div>
      </div>

      {/* Disk Usage */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className={`w-12 ${diskColor}`}>{container.disk}%</span>
          {container.disk >= thresholds.disk && thresholds.enabled && (
            <Gauge className="h-4 w-4 text-blue-400" />
          )}
        </div>
        <div className="flex-1 bg-gray-700 rounded-full h-2">
          <div
            className={`${getProgressBarColor(container.disk)} h-full rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(container.disk, 100)}%` }}
          />
        </div>
      </div>

      {/* Network Usage */}
      <div className="text-gray-200 flex gap-2 items-center">
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <span className={netInColor}>↑ {formatNetworkRate(container.networkIn)}</span>
            {container.networkIn >= thresholds.network && thresholds.enabled && (
              <Gauge className="h-4 w-4 text-blue-400" />
            )}
          </div>
          <span className="mx-1 text-gray-500">|</span>
          <div className="flex items-center gap-1">
            <span className={netOutColor}>↓ {formatNetworkRate(container.networkOut)}</span>
            {container.networkOut >= thresholds.network && thresholds.enabled && (
              <Gauge className="h-4 w-4 text-blue-400" />
            )}
          </div>
        </div>
      </div>

      {/* Pin Button */}
      <div className="flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onTogglePin(container.id)}
          className={`h-5 w-5 ${pinColor} hover:text-blue-400`}
        >
          <Pin className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

ContainerRow.displayName = 'ContainerRow';

export default ContainerRow;