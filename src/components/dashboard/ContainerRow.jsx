import React from 'react';
import { Gauge } from "lucide-react";
import { cn } from "../../lib/utils";
import ContainerRowBase from './ContainerRowBase';

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

const getProgressBarColor = (value, type = 'default') => {
  if (type === 'network-up') {
    if (value >= 90) return 'bg-purple-500';
    if (value >= 75) return 'bg-purple-400';
    return 'bg-purple-300';
  } else if (type === 'network-down') {
    if (value >= 90) return 'bg-blue-500';
    if (value >= 75) return 'bg-blue-400';
    return 'bg-blue-300';
  } else {
    if (value >= 90) return 'bg-red-500';
    if (value >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  }
};

const ContainerRow = React.memo(({ container, getAlertScore, compact }) => {
  const isRunning = container.status === 'running';
  const isAlerted = getAlertScore(container) > 0;

  const nameColor = isRunning ? 'text-gray-200' : 'text-gray-500';
  
  // Metric color calculation
  const getMetricColor = (value) => {
    return isRunning ? 'text-white' : 'text-gray-500';
  };

  const cpuColor = getMetricColor(container.cpu);
  const memColor = getMetricColor(container.memory);
  const diskColor = getMetricColor(container.disk);
  const netInColor = getMetricColor(container.networkIn);
  const netOutColor = getMetricColor(container.networkOut);

  return (
    <ContainerRowBase compact={compact}>
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
      <ContainerRowBase.MetricCell>
        <div className="flex items-center gap-1">
          <span className={`w-12 ${cpuColor}`}>{container.cpu.toFixed(1)}%</span>
        </div>
        <div className="flex-1 bg-gray-700 rounded-full h-2 relative">
          <div
            className={`${getProgressBarColor(container.cpu)} h-full rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(container.cpu, 100)}%` }}
          />

        </div>
      </ContainerRowBase.MetricCell>

      {/* Memory Usage */}
      <ContainerRowBase.MetricCell>
        <div className="flex items-center gap-1">
          <span className={`w-12 ${memColor}`}>{container.memory}%</span>
        </div>
        <div className="flex-1 bg-gray-700 rounded-full h-2 relative">
          <div
            className={`${getProgressBarColor(container.memory)} h-full rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(container.memory, 100)}%` }}
          />

        </div>
      </ContainerRowBase.MetricCell>

      {/* Disk Usage */}
      <ContainerRowBase.MetricCell>
        <div className="flex items-center gap-1">
          <span className={`w-12 ${diskColor}`}>{container.disk}%</span>
        </div>
        <div className="flex-1 bg-gray-700 rounded-full h-2 relative">
          <div
            className={`${getProgressBarColor(container.disk)} h-full rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(container.disk, 100)}%` }}
          />

        </div>
      </ContainerRowBase.MetricCell>

      {/* Network Usage */}
      <ContainerRowBase.MetricCell>
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-20 text-xs ${netInColor}`}>↓ {formatNetworkRate(container.networkIn)}</span>
            <div className="flex-1 bg-gray-700 rounded-full h-1 relative">
              <div
                className={`${getProgressBarColor(container.networkIn, 'network-down')} h-full rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(container.networkIn, 100)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-20 text-xs ${netOutColor}`}>↑ {formatNetworkRate(container.networkOut)}</span>
            <div className="flex-1 bg-gray-700 rounded-full h-1 relative">
              <div
                className={`${getProgressBarColor(container.networkOut, 'network-up')} h-full rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(container.networkOut, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </ContainerRowBase.MetricCell>

      {/* Empty space for grid alignment */}
      <div className="w-6" />
    </ContainerRowBase>
  );
});

export default ContainerRow;