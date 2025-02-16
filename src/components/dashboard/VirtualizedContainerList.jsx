import React, { useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useContainerStore } from '../../stores/containerStore';
import { useSettingsStore } from '../../stores/settingsStore';
import ContainerRow from './ContainerRow';

const CONTAINER_ROW_HEIGHT = 48; // Reduced from 64 to 48 for more compact rows
const MIN_LIST_HEIGHT = CONTAINER_ROW_HEIGHT * 3;

const VirtualizedContainerList = () => {
  const {
    getFilteredContainers,
    getSortedContainers,
    pinnedServices,
    togglePinned,
    getAlertScore,
    loading
  } = useContainerStore();

  const { thresholds, userPreferences } = useSettingsStore();
  const { compactMode } = userPreferences;

  // Get filtered and sorted containers
  const containers = getSortedContainers(getFilteredContainers());
  
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
    const maxContainers = 10; // Maximum number of containers to show before scrolling
    const rowHeight = compactMode ? CONTAINER_ROW_HEIGHT * 0.75 : CONTAINER_ROW_HEIGHT;
    const totalHeight = Math.max(
      MIN_LIST_HEIGHT,
      Math.min(containers.length * rowHeight, maxContainers * rowHeight)
    );
    return totalHeight;
  };

  if (containers.length === 0 && !loading) {
    return (
      <div 
        className="text-gray-400 text-center py-8"
        style={{ minHeight: MIN_LIST_HEIGHT }}
      >
        No containers found
      </div>
    );
  }

  const rowHeight = compactMode ? CONTAINER_ROW_HEIGHT * 0.75 : CONTAINER_ROW_HEIGHT;
  const listHeight = calculateListHeight();

  return (
    <div style={{ height: listHeight }} className="relative">
      <List
        height={listHeight}
        itemCount={containers.length}
        itemSize={rowHeight}
        width="100%"
        className="container-list"
      >
        {Row}
      </List>
      
      {/* Overlay loading indicator for subsequent updates */}
      {loading && containers.length > 0 && (
        <div className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 rounded-full text-sm text-gray-300">
          <div className="animate-spin h-3 w-3 border border-gray-400 border-t-white rounded-full" />
          <span>Updating...</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(VirtualizedContainerList);