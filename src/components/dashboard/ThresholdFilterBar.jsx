import React, { useState } from 'react';
import { useContainerStore } from '../../stores/containerStore';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const METRICS = {
  cpu: { name: 'CPU', unit: '%' },
  memory: { name: 'Memory', unit: '%' },
  network: { name: 'Network', unit: 'MB/s' }
};

const ThresholdFilterBar = () => {
  const { setCustomThreshold, customThresholds } = useContainerStore();
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700/50 shadow-lg shadow-black/10 transition-all duration-300 ease-in-out overflow-hidden">
      <div 
        className={`px-4 flex justify-between items-center cursor-pointer hover:bg-gray-700/30 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'py-3' : 'py-2.5'}`}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-2">
          <h3 className={`font-medium text-gray-300 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${!isExpanded ? 'text-xs translate-y-px' : 'text-sm translate-y-0'}`}>Filters</h3>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-500/30 text-blue-200 rounded-md transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
              Active
            </span>
          )}
        </div>
        <div
          className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
            <ChevronDownIcon className="w-4 h-4 text-gray-400 hover:text-gray-300 transition-colors duration-200" />
          </div>
        </div>
        <div
          className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-top ${isExpanded ? 'max-h-96 opacity-100 scale-y-100' : 'max-h-0 opacity-0 scale-y-95 pointer-events-none'}`}
        >
        <div className="px-4 pb-4 pt-1">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-wrap gap-4 flex-1">
              {Object.entries(METRICS).map(([metric, config]) => (
                <div key={metric} className="flex flex-col gap-1.5 min-w-[140px]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-300">{config.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${customThresholds[metric] 
                      ? 'bg-blue-500/20 text-blue-300' 
                      : 'bg-gray-700/50 text-gray-400'}`}>
                      {customThresholds[metric] ? `>${customThresholds[metric].value}${config.unit}` : 'Off'}
                    </span>
                  </div>
                  <div className="relative">
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
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500
                        [&::-webkit-slider-thumb]:hover:bg-blue-400 [&::-webkit-slider-thumb]:ring-2
                        [&::-webkit-slider-thumb]:ring-blue-500/20 [&::-webkit-slider-thumb]:transition-all
                        [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:shadow-black/10
                        [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
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
      </div>
    </div>
  );
};

export default ThresholdFilterBar;