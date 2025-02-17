import React, { useCallback, useState } from 'react';
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
    pinnedServices,
    togglePinned,
    getAlertScore,
    loading,
    searchTerms,
    addSearchTerm,
    clearSearchTerms,
    clearCustomThresholds,
    customThresholds
  } = useContainerStore();

  const { thresholds, userPreferences } = useSettingsStore();
  const { compactMode } = userPreferences;

  const [searchInput, setSearchInput] = useState('');

  // Get filtered and sorted containers
  const containers = getSortedContainers(getFilteredContainers()).filter(container => {
    // First apply search term filter
    if (searchTerms.length > 0) {
      const containerName = container.name.toLowerCase();
      return searchTerms.some(term => containerName.includes(term.toLowerCase()));
    }
    // Then apply pinned filter
    if (pinnedServices.size > 0) {
      return pinnedServices.has(container.id);
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
          isPinned={pinnedServices.has(container.id)}
          onTogglePin={togglePinned}
          getAlertScore={getAlertScore}
          hasPinnedContainers={pinnedServices.size > 0}
          thresholds={thresholds}
          compact={compactMode}
        />
      </div>
    );
  }, [containers, pinnedServices, togglePinned, getAlertScore, thresholds, compactMode]);

  // Calculate list height based on viewport and number of containers
  const calculateListHeight = () => {
    const totalHeight = 600;
    const headerHeight = 40;
    return totalHeight - headerHeight;
  };

  const rowHeight = compactMode ? CONTAINER_ROW_HEIGHT * 0.75 : CONTAINER_ROW_HEIGHT;
  const listHeight = calculateListHeight();

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (searchInput) {
        addSearchTerm(searchInput);
        setSearchInput('');
      }
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    clearSearchTerms();
  };

  return (
    <div className="flex flex-col h-[600px] bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800/50">
      {/* Header section with integrated filters and search */}
      <div className="flex flex-col px-4 py-2.5 bg-gray-800/80 backdrop-blur-md border-b border-gray-700/50 shadow-lg shadow-black/10">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1.2fr_40px] gap-4 w-full">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Search className="text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyPress={handleSearchKeyPress}
                placeholder="Search by name"
                className="bg-gray-700 text-white rounded-md px-2 py-1 focus:outline-none flex-1"
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchTerms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {searchTerms.map((term, index) => (
                  <div key={index} className="flex items-center gap-1 bg-gray-700/50 px-2 py-0.5 rounded text-sm text-gray-300">
                    <span>{term}</span>
                    <button
                      onClick={() => removeSearchTerm(term)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={clearSearch}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
          <HeaderCell metric="cpu" label="CPU" />
          <HeaderCell metric="memory" label="Memory" />
          <HeaderCell metric="disk" label="Disk" />
          <HeaderCell metric="network" label="Network" unit="MB/s" />
          <div className="flex items-center justify-end">
            {Object.keys(customThresholds).length > 0 && (
              <button
                onClick={clearCustomThresholds}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
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
            {pinnedServices.size > 0
              ? "No pinned containers found. Unpin some containers to see all available ones."
              : thresholds?.some(t => t.enabled)
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