import React, { useEffect, useMemo } from 'react';
import useSocket from '../../hooks/useSocket';
import useFormattedMetrics from '../../hooks/useFormattedMetrics';
import useMockMetrics from '../../hooks/useMockMetrics';
import { useThemeContext } from '../../context/ThemeContext';
import { Box, CircularProgress, useTheme } from '@mui/material';

// Import hooks
import {
  useNetworkFilters,
  useColumnManagement,
  usePopoverManagement,
  useNotifications,
  useSortManagement,
  useKeyboardShortcuts,
  useActiveFilteredColumns,
  useDataProcessing
} from './hooks';

// Import components
import ConnectionErrorDisplay from './ConnectionErrorDisplay';
import {
  NetworkHeader,
  NetworkPopovers,
  NetworkNotification,
  NetworkTable
} from './components';

const NetworkDisplay = ({ selectedNode = 'all' }) => {
  const { 
    isConnected, 
    guestData, 
    metricsData, 
    error,
    connectionStatus,
    reconnect,
    nodeData
  } = useSocket();
  
  // Debug logging
  console.log('NetworkDisplay - selectedNode:', selectedNode);
  console.log('NetworkDisplay - guestData:', guestData?.length || 0, 'guests');
  console.log('NetworkDisplay - nodeData:', nodeData?.length || 0, 'nodes');
  
  // Add useEffect to log detailed data for debugging
  React.useEffect(() => {
    if (guestData && guestData.length > 0) {
      console.log('Guest data sample:', guestData[0]);
      console.log('All guests:', guestData);
    } else {
      console.warn('No guest data available');
    }
    
    if (nodeData && nodeData.length > 0) {
      console.log('Node data sample:', nodeData[0]);
    } else {
      console.warn('No node data available');
    }
    
    if (metricsData && metricsData.length > 0) {
      console.log('Metrics data sample:', metricsData[0]);
    } else {
      console.warn('No metrics data available');
    }
  }, [guestData, nodeData, metricsData]);
  
  // Use the formatted metrics hook
  const formattedMetrics = useFormattedMetrics(metricsData);
  
  // Use mock metrics for testing - but only if we're not using real mock data from the server
  const mockMetrics = useMockMetrics(guestData);
  
  // Combine real and mock metrics, preferring real metrics if available
  const combinedMetrics = useMemo(() => {
    // When using the mock data server, always use the real metrics
    const useMockData = localStorage.getItem('use_mock_data') === 'true' || 
                        localStorage.getItem('MOCK_DATA_ENABLED') === 'true';
    
    if (useMockData) {
      return formattedMetrics;
    }
    
    // Otherwise, fall back to the previous behavior
    const hasRealCpuMetrics = formattedMetrics?.cpu && Object.keys(formattedMetrics.cpu).length > 0;
    const hasRealMemoryMetrics = formattedMetrics?.memory && Object.keys(formattedMetrics.memory).length > 0;
    const hasRealDiskMetrics = formattedMetrics?.disk && Object.keys(formattedMetrics.disk).length > 0;
    const hasRealNetworkMetrics = formattedMetrics?.network && Object.keys(formattedMetrics.network).length > 0;
    
    // If we have real metrics, use them; otherwise, use mock metrics
    return {
      cpu: hasRealCpuMetrics ? formattedMetrics.cpu : mockMetrics.cpu,
      memory: hasRealMemoryMetrics ? formattedMetrics.memory : mockMetrics.memory,
      disk: hasRealDiskMetrics ? formattedMetrics.disk : mockMetrics.disk,
      network: hasRealNetworkMetrics ? formattedMetrics.network : mockMetrics.network
    };
  }, [formattedMetrics, mockMetrics]);
  
  const theme = useTheme();
  const { darkMode } = useThemeContext();
  
  // Use notification hook
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    handleSnackbarClose,
    showNotification
  } = useNotifications();
  
  // Use column management hook
  const {
    columnVisibility,
    columnOrder,
    setColumnOrder,
    columnMenuAnchorEl,
    openColumnMenu,
    forceUpdateCounter,
    toggleColumnVisibility,
    resetColumnVisibility,
    handleColumnMenuOpen,
    handleColumnMenuClose
  } = useColumnManagement(showNotification);
  
  // Use sort management hook
  const {
    sortConfig,
    requestSort
  } = useSortManagement();
  
  // Use network filters hook
  const {
    filters,
    showStopped,
    setShowStopped,
    showFilters,
    searchTerm,
    setSearchTerm,
    activeSearchTerms,
    guestTypeFilter,
    setGuestTypeFilter,
    addSearchTerm,
    removeSearchTerm,
    updateFilter,
    handleSliderDragStart,
    handleSliderDragEnd,
    clearFilter,
    resetFilters,
    clearSearchTerms,
    activeFilterCount
  } = useNetworkFilters();
  
  // Use popover management hook
  const {
    filterAnchorEl,
    openFilters,
    searchAnchorEl,
    openSearch,
    searchInputRef,
    typeAnchorEl,
    openType,
    visibilityAnchorEl,
    openVisibility,
    filterButtonRef,
    searchButtonRef,
    systemFilterButtonRef,
    handleFilterButtonClick,
    handleCloseFilterPopover,
    handleSearchButtonClick,
    handleCloseSearchPopover,
    handleTypeButtonClick,
    handleCloseTypePopover,
    handleVisibilityButtonClick,
    handleCloseVisibilityPopover,
    closeAllPopovers
  } = usePopoverManagement();
  
  // Use keyboard shortcuts hook
  useKeyboardShortcuts({
    openFilters,
    openSearch,
    openType,
    openVisibility,
    openColumnMenu,
    resetFilters,
    closeAllPopovers,
    handleSearchButtonClick,
    searchButtonRef,
    setSearchTerm,
    showNotification
  });
  
  // Use data processing hook
  const {
    extractNumericId,
    getNodeName,
    sortedAndFilteredData,
    formatPercentage,
    formatNetworkRateForFilter
  } = useDataProcessing({
    guestData,
    combinedMetrics,
    sortConfig,
    filters,
    showStopped,
    activeSearchTerms,
    searchTerm,
    selectedNode,
    guestTypeFilter,
    nodeData
  });
  
  // Use active filtered columns hook
  const activeFilteredColumns = useActiveFilteredColumns({
    filters,
    activeSearchTerms,
    searchTerm,
    guestTypeFilter,
    showStopped,
    nodeData
  });
  
  // Show loading state if not connected
  if (!isConnected && connectionStatus !== 'error' && connectionStatus !== 'disconnected') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Show error state if there's a connection error
  if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
    return (
      <ConnectionErrorDisplay 
        connectionStatus={connectionStatus} 
        error={error} 
        onReconnect={reconnect}
      />
    );
  }
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Header with buttons */}
      <NetworkHeader
        openColumnMenu={openColumnMenu}
        openSearch={openSearch}
        openType={openType}
        openVisibility={openVisibility}
        openFilters={openFilters}
        activeSearchTerms={activeSearchTerms}
        guestTypeFilter={guestTypeFilter}
        showStopped={showStopped}
        filters={filters}
        columnVisibility={columnVisibility}
        handleColumnMenuOpen={handleColumnMenuOpen}
        handleSearchButtonClick={handleSearchButtonClick}
        handleTypeButtonClick={handleTypeButtonClick}
        handleVisibilityButtonClick={handleVisibilityButtonClick}
        handleFilterButtonClick={handleFilterButtonClick}
        searchButtonRef={searchButtonRef}
        filterButtonRef={filterButtonRef}
        systemFilterButtonRef={systemFilterButtonRef}
      />
      
      {/* Popovers */}
      <NetworkPopovers
        // Search popover props
        searchAnchorEl={searchAnchorEl}
        openSearch={openSearch}
        handleCloseSearchPopover={handleCloseSearchPopover}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeSearchTerms={activeSearchTerms}
        addSearchTerm={addSearchTerm}
        removeSearchTerm={removeSearchTerm}
        searchInputRef={searchInputRef}
        clearSearchTerms={clearSearchTerms}
        
        // Type popover props
        typeAnchorEl={typeAnchorEl}
        openType={openType}
        handleCloseTypePopover={handleCloseTypePopover}
        guestTypeFilter={guestTypeFilter}
        setGuestTypeFilter={setGuestTypeFilter}
        
        // Visibility popover props
        visibilityAnchorEl={visibilityAnchorEl}
        openVisibility={openVisibility}
        handleCloseVisibilityPopover={handleCloseVisibilityPopover}
        showStopped={showStopped}
        setShowStopped={setShowStopped}
        
        // Filter popover props
        filterAnchorEl={filterAnchorEl}
        openFilters={openFilters}
        handleCloseFilterPopover={handleCloseFilterPopover}
        filters={filters}
        updateFilter={updateFilter}
        handleSliderDragStart={handleSliderDragStart}
        handleSliderDragEnd={handleSliderDragEnd}
        resetFilters={resetFilters}
        
        // Formatters
        formatPercentage={formatPercentage}
        formatNetworkRateForFilter={formatNetworkRateForFilter}
      />
      
      {/* Main data table */}
      <NetworkTable
        sortConfig={sortConfig}
        requestSort={requestSort}
        columnVisibility={columnVisibility}
        toggleColumnVisibility={toggleColumnVisibility}
        resetColumnVisibility={resetColumnVisibility}
        columnMenuAnchorEl={columnMenuAnchorEl}
        handleColumnMenuOpen={handleColumnMenuOpen}
        handleColumnMenuClose={handleColumnMenuClose}
        openColumnMenu={openColumnMenu}
        forceUpdateCounter={forceUpdateCounter}
        columnOrder={columnOrder}
        setColumnOrder={setColumnOrder}
        activeFilteredColumns={activeFilteredColumns}
        sortedAndFilteredData={sortedAndFilteredData}
        guestData={guestData}
        metricsData={combinedMetrics}
        getNodeName={getNodeName}
        extractNumericId={extractNumericId}
        resetFilters={resetFilters}
        showStopped={showStopped}
        setShowStopped={setShowStopped}
        guestTypeFilter={guestTypeFilter}
      />
      
      {/* Notification Snackbar */}
      <NetworkNotification
        snackbarOpen={snackbarOpen}
        snackbarMessage={snackbarMessage}
        snackbarSeverity={snackbarSeverity}
        handleSnackbarClose={handleSnackbarClose}
      />
    </Box>
  );
};

export default NetworkDisplay; 