import React, { useCallback, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useContainerStore } from '../../stores/containerStore';
import { useSettingsStore } from '../../stores/settingsStore';
import ContainerRow from './ContainerRow';

import HeaderCell from './HeaderCell';
import { Search, X, FilterX } from 'lucide-react';

const CONTAINER_ROW_HEIGHT = 48;
const MIN_LIST_HEIGHT = CONTAINER_ROW_HEIGHT * 3;

const VirtualizedContainerList = () => {
  const {
    getFilteredContainers,
    getSortedContainers,
    getAlertScore,
    loading,
    searchTerms,
    addSearchTerm,
    removeSearchTerm,
    clearSearchTerms,
    clearCustomThresholds,
    customThresholds
  } = useContainerStore();

  const { thresholds, userPreferences } = useSettingsStore();
  const { compactMode } = userPreferences;

  const [searchInput, setSearchInput] = useState('');

  // Handler for the search input key events
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && searchInput) {
      addSearchTerm(searchInput);
      setSearchInput('');
      e.preventDefault();
    }
  };
  
  // Combine applied search terms with the live in-progress filter.
  const effectiveFilters = [...searchTerms];
  if (searchInput) {
      effectiveFilters.push(searchInput);
  }
  
  // Get filtered and sorted containers and apply full effective filter.
  const containers = getSortedContainers(getFilteredContainers()).filter(container => {
    const containerName = container.name.toLowerCase();

    // Combine applied (searchTerms) and current live input (searchInput) filters.
    if (effectiveFilters.length > 0 && !effectiveFilters.some(term => containerName.includes(term.toLowerCase()))) {
        return false;
    }

    return true;
  });
  
  // Memoized row renderer for react-window
  const Row = useCallback(({ index, style }) => {
    const container = containers[index];
    if (!container) return null;

    return (
      <div style={style}>
        <ContainerRow
          container={container}
          getAlertScore={getAlertScore}
          thresholds={thresholds}
          compact={compactMode}
        />
      </div>
    );
  }, [containers, getAlertScore, thresholds, compactMode]);

  // Calculate list height based on viewport and number of containers
  const calculateListHeight = () => {
    const totalHeight = 600;
    const headerHeight = 40;
    return totalHeight - headerHeight;
  };

  const rowHeight = compactMode ? CONTAINER_ROW_HEIGHT * 0.75 : CONTAINER_ROW_HEIGHT;
  const listHeight = calculateListHeight();

  // Global keyboard input handler
  useEffect(() => {
    const handleGlobalKeyPress = (e) => {
      // Ignore if Control/Meta key is pressed
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a') {
          e.preventDefault(); // Prevent default select all behavior
          // Implement logic to "select" all filter bubbles
          console.log('Select all filters');
          return;
        }
        return;
      }

      // Handle Enter key press globally
      if (e.key === 'Enter' && searchInput) {
        addSearchTerm(searchInput); // Add the current search input as a term
        setSearchInput(''); // Clear the input field
        return;
      }

      // Ignore other keys if the target is an input element
      if (e.target.tagName === 'INPUT') {
        return;
      }

      // Only handle alphanumeric keys, space, and common punctuation
      if (e.key.length === 1 && /[\w\s.,!?-]/.test(e.key)) {
        setSearchInput(prev => prev + e.key);
      } else if (e.key === 'Backspace') {
        setSearchInput(prev => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        clearSearch();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyPress);
    return () => window.removeEventListener('keydown', handleGlobalKeyPress);
  }, [searchInput, addSearchTerm]);

  const clearSearch = () => {
    setSearchInput('');
    clearSearchTerms();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 rounded-xl overflow-hidden">
      {/* Header section with improved styling */}
      <div className="flex flex-col px-4 py-3 border-b border-gray-800/50 bg-gradient-to-b from-gray-800/30 to-gray-800/10 backdrop-blur-sm">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1.2fr_40px] gap-4 w-full">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center gap-2 group flex-shrink-0">
              <Search className="absolute left-3 text-gray-400 w-4 h-4 group-hover:text-white transition-colors duration-300" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Type to search"
                autoFocus
                className="bg-gray-800/30 text-white rounded-lg pl-9 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-full transition-all duration-300 hover:bg-gray-800/40 placeholder-gray-500"
                onKeyDown={handleInputKeyDown}
              />
              {searchInput && (
                <button 
                  onClick={() => setSearchInput('')} 
                  className="absolute right-3 text-gray-400 hover:text-white transition-colors duration-300 p-1 hover:bg-gray-700/50 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <HeaderCell metric="cpu" label="CPU" />
          <HeaderCell metric="memory" label="Memory" />
          <HeaderCell metric="disk" label="Disk" />
          <HeaderCell metric="network" label="Network" unit="MB/s" />
          <div className="flex items-center justify-end">
            {Object.keys(customThresholds).length > 0 && (
              <button
                onClick={clearCustomThresholds}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                title="Reset all thresholds"
              >
                <FilterX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Container list section */}
      <div className="flex-1 relative">
        {containers.length === 0 && !loading ? (
          <div className="text-gray-400 text-center py-8">
            {thresholds?.some(t => t.enabled)
              ? "No containers match the current threshold filters. Try adjusting the thresholds."
              : "No containers found"}
          </div>
        ) : (
          <List
            height={listHeight}
            itemCount={containers.length}
            itemSize={rowHeight}
            width="100%"
            className="container-list"
          >
            {Row}
          </List>
        )}
        
        {/* Overlay loading indicator for subsequent updates */}
        {loading && containers.length > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 rounded-full text-sm text-gray-300">
            <div className="animate-spin h-3 w-3 border border-gray-400 border-t-white rounded-full" />
            <span>Updating...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(VirtualizedContainerList);