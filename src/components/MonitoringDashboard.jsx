import React, { useEffect, useState, useRef } from 'react';
import { Settings2, Pin, Gauge, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { useContainerStore } from '../stores/containerStore';
import { useSettingsStore } from '../stores/settingsStore';
import VirtualizedContainerList from './dashboard/VirtualizedContainerList';
import SettingsPanel from './dashboard/SettingsPanel';
import useContainerData from './useContainerData';

const SortableHeader = ({ field, children, className = "" }) => {
  const { sortConfig, setSortConfig } = useContainerStore();
  const isActive = sortConfig.field === field;

  const handleSort = () => {
    if (field === 'alert') return;
    setSortConfig({ field });
  };

  return (
    <button
      onClick={handleSort}
      className={`flex items-center gap-2 hover:text-white transition-colors ${isActive ? 'text-blue-400' : 'text-gray-400'} ${className}`}
    >
      {children}
      {isActive && (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      )}
    </button>
  );
};

const SearchHeader = () => {
  const { searchTerms, addSearchTerm, clearSearchTerms } = useContainerStore();
  const [inputValue, setInputValue] = useState('');

  const handleSearch = (e) => {
    const value = e.target.value;
    setInputValue(value);
    clearSearchTerms();
    if (value) {
      addSearchTerm(value);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={inputValue}
        onChange={handleSearch}
        placeholder="Search by name"
        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
};

const MonitoringDashboard = ({ credentials }) => {
  const { initialLoad } = useContainerData(credentials);
  const { 
    pinnedServices, 
    clearPinned,
    error,
  } = useContainerStore();
  const { 
    thresholds, 
    setThresholds, 
    showSettings, 
    setShowSettings 
  } = useSettingsStore();

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
            onClick={() => setThresholds({ enabled: !thresholds.enabled })}
            className={`relative group bg-gray-800 hover:bg-gray-700
              ${thresholds.enabled ? 'text-blue-400 border-blue-400' : 'text-gray-400 border-gray-600'}
              transition-all duration-300 ease-out`}
            title={`Alert Thresholds ${thresholds.enabled ? 'On' : 'Off'}`}
          >
            <Gauge className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="bg-gray-800 hover:bg-gray-700 text-white"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showSettings && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowSettings(false)}
          />
          <SettingsPanel onClose={() => setShowSettings(false)} />
        </>
      )}

      {/* Initial loading state */}
      {initialLoad && (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-gray-500 border-t-white rounded-full mb-2" />
            <p className="text-gray-400">Loading containers...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="text-red-500 mb-4 p-4 bg-red-900/20 rounded-lg">
          Error: {error}
        </div>
      )}

      {!initialLoad && (
        <>
          <div className="space-y-1 rounded-lg border border-gray-800 bg-gray-900/50 p-1">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_40px] gap-4 px-4 py-2 text-sm font-medium text-gray-400">
              <SearchHeader />
              <SortableHeader field="cpu">CPU</SortableHeader>
              <SortableHeader field="memory">Memory</SortableHeader>
              <SortableHeader field="disk">Disk</SortableHeader>
              <SortableHeader field="network">Network</SortableHeader>
              <div className="w-8 flex justify-center">
                {pinnedServices.size > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearPinned}
                    className="h-5 w-5 text-gray-400 hover:text-white"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="min-h-[200px]">
              <VirtualizedContainerList />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonitoringDashboard;
