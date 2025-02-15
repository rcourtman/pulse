import React from 'react';
import { Button } from "../ui/button";
import { useSettingsStore } from '../../stores/settingsStore';

const ThresholdSlider = ({ label, value, onChange, min = 0, max = 100, step = 1 }) => (
  <div className="space-y-2">
    <label className="text-gray-300 text-sm flex justify-between">
      <span>{label}</span>
      <span>{value}{label === 'Network' ? ' KB/s' : '%'}</span>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-blue-500"
    />
  </div>
);

const SettingsPanel = ({ onClose }) => {
  const {
    thresholds,
    setThresholds,
    alertConfig,
    setAlertConfig,
    userPreferences,
    setUserPreferences,
    resetAll
  } = useSettingsStore();

  const handleThresholdChange = (key, value) => {
    setThresholds({ [key]: value });
  };

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
        {/* Threshold Values */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-200">Threshold Values</h4>
          <div className="space-y-4">
            <ThresholdSlider
              label="CPU"
              value={thresholds.cpu}
              onChange={(value) => handleThresholdChange('cpu', value)}
            />
            <ThresholdSlider
              label="Memory"
              value={thresholds.memory}
              onChange={(value) => handleThresholdChange('memory', value)}
            />
            <ThresholdSlider
              label="Disk"
              value={thresholds.disk}
              onChange={(value) => handleThresholdChange('disk', value)}
            />
            <ThresholdSlider
              label="Network"
              value={thresholds.network}
              onChange={(value) => handleThresholdChange('network', value)}
              max={5000}
              step={100}
            />
          </div>
        </div>

        {/* Alert Configuration */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-200">Alert Settings</h4>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={alertConfig.includeStoppedContainers}
              onChange={(e) => setAlertConfig({ includeStoppedContainers: e.target.checked })}
              className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-gray-300 text-sm">Include stopped containers</span>
          </label>
        </div>

        {/* User Preferences */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-200">Display Settings</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={userPreferences.compactMode}
                onChange={(e) => setUserPreferences({ compactMode: e.target.checked })}
                className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-gray-300 text-sm">Compact mode</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={userPreferences.highContrastMode}
                onChange={(e) => setUserPreferences({ highContrastMode: e.target.checked })}
                className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-gray-300 text-sm">High contrast mode</span>
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-gray-300 text-sm block">Refresh Rate</label>
            <select
              value={userPreferences.refreshRate}
              onChange={(e) => setUserPreferences({ refreshRate: Number(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded-md text-white px-3 py-1"
            >
              <option value={1000}>1 second</option>
              <option value={2000}>2 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="pt-4 mt-6 border-t border-gray-700">
        <Button
          variant="ghost"
          onClick={resetAll}
          className="w-full text-white hover:bg-gray-700"
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;