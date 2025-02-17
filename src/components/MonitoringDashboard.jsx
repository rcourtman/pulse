import React, { useEffect, useState, useRef } from 'react';
import { Settings2, Pin, Gauge, RotateCcw, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";
import { useContainerStore } from '../stores/containerStore';
import { useSettingsStore } from '../stores/settingsStore';
import VirtualizedContainerList from './dashboard/VirtualizedContainerList';
import SettingsPanel from './dashboard/SettingsPanel';
import useContainerData from './useContainerData';
import HeaderThresholdSlider from './dashboard/HeaderThresholdSlider';

const SortableHeader = ({ field, label, className = "" }) => {
  const { sortConfig, setSortConfig } = useContainerStore();
  const isActive = sortConfig.field === field;

  const handleSort = (e) => {
    e.stopPropagation();
    setSortConfig({ field });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleSort}
        className={`flex items-center gap-1 cursor-pointer hover:text-white transition-colors ${isActive ? 'text-blue-400' : 'text-gray-400'}`}
      >
        <span>{label}</span>
        <div className="flex items-center">
          {isActive ? (
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${sortConfig.direction === 'desc' ? 'rotate-0' : 'rotate-180'}`} />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          )}
        </div>
      </button>
    </div>
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

const ThresholdsRow = ({ showThresholds }) => {
  const { thresholds } = useSettingsStore();
  const [isHovered, setIsHovered] = useState(false);
  if (!thresholds.enabled) return null;

  return (
    <>
      {showThresholds && isHovered && (
        <div className="fixed inset-0 bg-black/30 pointer-events-none transition-opacity duration-300 ease-in-out z-10" />
      )}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative grid grid-cols-[1fr_1fr_1fr_1fr_1fr_40px] gap-4 px-3 py-2 bg-gray-800/50 border-y border-gray-700 overflow-hidden transition-all duration-300 ease-in-out z-20 ${showThresholds ? 'max-h-[80px] opacity-60 hover:opacity-100' : 'max-h-0 opacity-0 py-0 border-y-0'}`}
      >
        <div className="flex items-center">
          <span className="text-xs font-medium text-gray-400">Resource Thresholds</span>
        </div>
        <HeaderThresholdSlider field="cpu" />
        <HeaderThresholdSlider field="memory" />
        <HeaderThresholdSlider field="disk" />
        <HeaderThresholdSlider field="network" />
        <div /> {/* Empty space for actions column */}
      </div>
    </>
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

  const [showThresholds, setShowThresholds] = useState(true);

  return (
    <div className="min-h-screen bg-gray-900 p-6 flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">All Systems</h1>
          <p className="text-gray-400">Updated in real time.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowThresholds(!showThresholds)}
            className={`relative group bg-gray-800 hover:bg-gray-700
              ${thresholds.enabled ? 'text-blue-400 border-blue-400' : 'text-gray-400 border-gray-600'}
              transition-all duration-300 ease-out`}
            title={`${showThresholds ? 'Hide' : 'Show'} Thresholds`}
          >
            {showThresholds ? 
              <ChevronUp className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" /> :
              <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            }
          </Button>
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
          <div className="flex-1 flex flex-col rounded-lg border border-gray-800 bg-gray-900/50 p-0.5 min-h-0 h-full">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_40px] gap-2 px-3 py-1.5 text-sm font-medium text-gray-400">
              <SearchHeader />
              <div>
                <SortableHeader field="cpu" label="CPU" />
              </div>
              <div>
                <SortableHeader field="memory" label="Memory" />
              </div>
              <div>
                <SortableHeader field="disk" label="Disk" />
              </div>
              <div>
                <SortableHeader field="network" label="Network" />
              </div>
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
            
            <ThresholdsRow showThresholds={showThresholds} />

            <div className="flex-1 overflow-auto min-h-0">
              <VirtualizedContainerList />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonitoringDashboard;
