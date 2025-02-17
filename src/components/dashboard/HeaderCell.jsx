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
    <div className="flex flex-col gap-1 min-w-[120px]">
      <div className="flex items-center justify-between cursor-pointer" onClick={handleSort}>
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 ${sortConfig.field === metric 
          ? 'bg-blue-500/20 text-blue-300' 
          : 'bg-gray-700/50 text-gray-400'}`}>
          {sortConfig.field === metric ? (sortConfig.direction === 'asc' ? '▲' : '▼') : (
            customThresholds[metric] ? (
              <span className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">
                {`>${customThresholds[metric].value}${unit}`}
              </span>
            ) : (
              <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">Off</span>
            )
          )}
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