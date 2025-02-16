import React, { useEffect, useState } from 'react';
import { Settings2, Pin, Gauge, RotateCcw, Search } from "lucide-react";
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

const SearchBar = () => {
  const { searchTerms, addSearchTerm, removeSearchTerm, clearSearchTerms, filters, setFilters } = useContainerStore();
  const [inputValue, setInputValue] = useState('');
  const [activeFilters, setActiveFilters] = useState(() => {
    const filters = [];
    if (filters.status !== 'all') {
      filters.push({ type: 'status', value: filters.status });
    }
    searchTerms.forEach(term => {
      const parsed = parseFilter(term);
      filters.push(parsed);
    });
    return filters;
  });

  const presetFilters = [
    { label: 'High CPU', filter: 'cpu>80' },
    { label: 'High Memory', filter: 'memory>80' },
    { label: 'High Disk', filter: 'disk>80' },
    { label: 'High Network', filter: 'network>1000' },
    { label: 'Running', filter: 'status:running' },
    { label: 'Stopped', filter: 'status:stopped' }
  ];

  const parseFilter = (input) => {
    const metricMatch = input.match(/^(cpu|memory|disk|network)([<>])(\d+)$/);
    const statusMatch = input.match(/^status:(running|stopped)$/);

    if (metricMatch) {
      const [_, metric, operator, value] = metricMatch;
      return {
        type: 'metric',
        metric,
        operator,
        value: parseFloat(value),
        display: `${metric}${operator}${value}%`,
        raw: input
      };
    } else if (statusMatch) {
      const [_, status] = statusMatch;
      return {
        type: 'status',
        value: status,
        display: `status:${status}`,
        raw: input
      };
    }
    
    return {
      type: 'search',
      value: input,
      display: input,
      raw: input
    };
  };

  const handleSearch = (e) => {
    setInputValue(e.target.value);
  };

  const isFilterConflicting = (newFilter, currentFilters) => {
    // Check for duplicate metric type
    if (newFilter.type === 'metric') {
      return currentFilters.some(f => f.type === 'metric' && f.metric === newFilter.metric);
    }
    // Check for duplicate status
    if (newFilter.type === 'status') {
      return currentFilters.some(f => f.type === 'status');
    }
    // Check for duplicate search term
    if (newFilter.type === 'search') {
      return currentFilters.some(f => f.type === 'search' && f.value === newFilter.value);
    }
    return false;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const newTerm = inputValue.trim();
      const parsedFilter = parseFilter(newTerm);
      
      if (!isFilterConflicting(parsedFilter, activeFilters)) {
        setActiveFilters(prev => [...prev, parsedFilter]);
        addSearchTerm(newTerm);
        setInputValue('');
      }
    }
  };

  const handleStatusChange = (status) => {
    const statusFilter = { type: 'status', value: status, display: `status:${status}`, raw: `status:${status}` };
    if (status === 'all') {
      setActiveFilters(prev => prev.filter(f => f.type !== 'status'));
      setFilters({ status: 'all' });
    } else if (!isFilterConflicting(statusFilter, activeFilters)) {
      setActiveFilters(prev => [...prev.filter(f => f.type !== 'status'), statusFilter]);
      setFilters({ status });
    }
  };

  const removeFilter = (filter) => {
    setActiveFilters(prev => prev.filter(f => f.raw !== filter.raw));
    if (filter.type === 'status') {
      setFilters({ status: 'all' });
    } else {
      removeSearchTerm(filter.raw);
    }
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    clearSearchTerms();
    setFilters({ status: 'all' });
  };

  const handlePresetFilter = (filter) => {
    const parsedFilter = parseFilter(filter);
    if (!isFilterConflicting(parsedFilter, activeFilters)) {
      setActiveFilters(prev => [...prev, parsedFilter]);
      if (parsedFilter.type === 'status') {
        setFilters({ status: parsedFilter.value });
      } else {
        addSearchTerm(filter);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={inputValue}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
            placeholder="Search by name or add filters (e.g., cpu>80, memory>90)"
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {presetFilters.map((preset, index) => (
          <button
            key={index}
            onClick={() => handlePresetFilter(preset.filter)}
            className={`px-3 py-1 text-sm ${activeFilters.some(f => f.raw === preset.filter) ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'} rounded-full transition-colors`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilters.map((filter, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
            >
              <span>{filter.display}</span>
              <button
                onClick={() => removeFilter(filter)}
                className="hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          ))}
          {activeFilters.length > 1 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const MonitoringDashboard = ({ credentials }) => {
  const { initialLoad } = useContainerData(credentials);
  const { 
    pinnedServices, 
    clearPinned,
    error 
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
          <SearchBar />

          <div className="space-y-1 rounded-lg border border-gray-800 bg-gray-900/50 p-1">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_40px] gap-4 px-4 py-2 text-sm font-medium text-gray-400">
              <span className="text-gray-400">Name</span>
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
