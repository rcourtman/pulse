import React from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { Slider } from '../ui/slider';

const formatValue = (field, value) => {
  switch (field) {
    case 'cpu':
      return `${value}%`;
    case 'memory':
      return `${value}%`;
    case 'disk':
      return `${value}%`;
    case 'network':
      return `${value} KB/s`;
    default:
      return value;
  }
};

const HeaderThresholdSlider = ({ field }) => {
  const { thresholds, setThresholds } = useSettingsStore();

  const handleThresholdChange = (value) => {
    setThresholds({ [field]: value[0] });
  };

  const getSliderConfig = (field) => {
    switch (field) {
      case 'cpu':
        return { min: 0, max: 100, step: 1, defaultValue: [thresholds.cpu] };
      case 'memory':
        return { min: 0, max: 100, step: 1, defaultValue: [thresholds.memory] };
      case 'disk':
        return { min: 0, max: 100, step: 1, defaultValue: [thresholds.disk] };
      case 'network':
        return { min: 0, max: 2048, step: 64, defaultValue: [thresholds.network] };
      default:
        return null;
    }
  };

  const config = getSliderConfig(field);
  if (!config || !thresholds.enabled) return null;

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-xs text-gray-400 w-16">
        {formatValue(field, config.defaultValue[0])}
      </span>
      <div className="flex-1">
        <Slider
          {...config}
          onValueChange={handleThresholdChange}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default HeaderThresholdSlider;