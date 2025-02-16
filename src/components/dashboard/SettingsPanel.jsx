import React from 'react';
import { Button } from "../ui/button";
import { useSettingsStore } from '../../stores/settingsStore';

const SettingsPanel = ({ onClose }) => {
  const {
    userPreferences,
    setUserPreferences,
    resetAll
  } = useSettingsStore();

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
        {/* User Preferences */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-200">User Preferences</h4>
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
          variant="destructive"
          size="sm"
          onClick={resetAll}
          className="w-full"
        >
          Reset All Settings
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;