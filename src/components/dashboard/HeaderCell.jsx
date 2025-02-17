import React from 'react';
import { useContainerStore } from '../../stores/containerStore';

const HeaderCell = ({ metric, label, unit = '%' }) => {
  const { setCustomThreshold, customThresholds, setSortConfig, sortConfig } = useContainerStore();

  const handleSliderChange = (value) => {
    if (value === 0) {
      setCustomThreshold(metric, null);
    } else {
      setCustomThreshold(metric, {
        operator: '>',
        value: value
      });
    }
  };

  const handleSort = () => {
    setSortConfig({ field: metric });
  };

  return (
    <div className={`flex flex-col gap-1 min-w-[120px] transition-opacity duration-200 ${!customThresholds[metric] ? 'opacity-75 hover:opacity-90' : ''}`}>
      <div className={`flex items-center justify-between cursor-pointer transition-all duration-200 ${customThresholds[metric] ? 'bg-blue-500/15 px-2 py-1 -mx-2 rounded-lg shadow-sm shadow-blue-500/10' : 'hover:bg-gray-700/50 px-2 py-1 -mx-2 rounded-lg'}`} onClick={handleSort}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${customThresholds[metric] ? 'text-blue-100' : 'text-gray-300'}`}>{label}</span>
          {sortConfig.field === metric && (
            <span className="text-xs text-blue-300">
              {sortConfig.direction === 'asc' ? '▲' : '▼'}
            </span>
          )}
        </div>
        {customThresholds[metric] ? (
          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full shadow-sm shadow-green-500/10 transition-colors duration-200 hover:bg-green-500/30">
            {`>${customThresholds[metric].value}${unit}`}
          </span>
        ) : (
          <span className="text-xs bg-gray-600/30 text-gray-400 px-2 py-0.5 rounded-full transition-colors duration-200 hover:bg-gray-600/40">Off</span>
        )}
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
          onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
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
  );
};

export default React.memo(HeaderCell);