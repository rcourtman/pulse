import React from 'react';
import { useContainerStore } from '../../stores/containerStore';

const METRICS = {
  cpu: { name: 'CPU', unit: '%' },
  memory: { name: 'Memory', unit: '%' },
  network: { name: 'Network', unit: 'MB/s' }
};

const ThresholdFilterBar = () => {
  const { setCustomThreshold, customThresholds } = useContainerStore();

  const handleSliderChange = (metric, value) => {
    if (value === 0) {
      setCustomThreshold(metric, null);
    } else {
      setCustomThreshold(metric, {
        operator: '>',
        value: value
      });
    }
  };

  const handleClearFilters = () => {
    Object.keys(METRICS).forEach(metric => {
      setCustomThreshold(metric, null);
    });
  };

  const hasActiveFilters = Object.values(customThresholds).some(threshold => threshold !== null);

  return (
    <div className="flex items-center gap-4">
      {hasActiveFilters && (
        <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-500/30 text-blue-200 rounded-md">
          Active
        </span>
      )}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-4 flex-1">
          {Object.entries(METRICS).map(([metric, config]) => (
            <div key={metric} className="flex items-center gap-3 min-w-[180px]">
              <div className="flex items-center gap-2 min-w-[80px]">
                <span className="text-sm font-medium text-gray-300">{config.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${customThresholds[metric] 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : 'bg-gray-700/50 text-gray-400'}`}>
                  {customThresholds[metric] ? `>${customThresholds[metric].value}${config.unit}` : 'Off'}
                </span>
              </div>
              <div className="relative flex-1">
                <div className="absolute w-full h-1 -mt-[2px] flex justify-between px-[2px]">
                  {[0, 25, 50, 75, 100].map((tick) => (
                    <div key={tick} className="w-0.5 h-1 bg-gray-600" />
                  ))}
                </div>
                <input
                  type="range"
                  min="0"
                  max={metric === 'network' ? '100' : '100'}
                  step={metric === 'network' ? '1' : '5'}
                  value={customThresholds[metric]?.value || 0}
                  onChange={(e) => handleSliderChange(metric, parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500
                    [&::-webkit-slider-thumb]:hover:bg-blue-400 [&::-webkit-slider-thumb]:ring-2
                    [&::-webkit-slider-thumb]:ring-blue-500/20 [&::-webkit-slider-thumb]:transition-all
                    [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:shadow-black/10
                    [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3
                    [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500
                    [&::-moz-range-thumb]:hover:bg-blue-400 [&::-moz-range-thumb]:ring-2
                    [&::-moz-range-thumb]:ring-blue-500/20 [&::-moz-range-thumb]:transition-all
                    [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:shadow-black/10
                    [&::-webkit-slider-runnable-track]:bg-blue-500/20 [&::-webkit-slider-runnable-track]:rounded-lg
                    [&::-moz-range-track]:bg-blue-500/20 [&::-moz-range-track]:rounded-lg"
                />
              </div>
            </div>
          ))}
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 bg-gray-700/50 hover:bg-gray-700 rounded transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(ThresholdFilterBar);