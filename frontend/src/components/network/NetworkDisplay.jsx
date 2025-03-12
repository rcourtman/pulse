import React, { useEffect, useMemo } from 'react';
import useSocket from '../../hooks/useSocket';
import useFormattedMetrics from '../../hooks/useFormattedMetrics';
import useMockMetrics from '../../hooks/useMockMetrics';
import { useThemeContext } from '../../context/ThemeContext';
import { Box, CircularProgress, useTheme, Typography, Button } from '@mui/material';

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
  
  // Use notification hook - MOVED UP before it's used in the migration event listener
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    handleSnackbarClose,
    showNotification
  } = useNotifications();
  
  // Listen for migration events and show notifications
  React.useEffect(() => {
    const handleMigrationEvent = (event) => {
      try {
        console.log('Migration event received in NetworkDisplay:', event.detail);
        
        const { guestId, guestName, fromNode, toNode } = event.detail;
        
        // Get node names for better display
        const fromNodeName = nodeData?.find(n => n.id === fromNode)?.name || fromNode;
        const toNodeName = nodeData?.find(n => n.id === toNode)?.name || toNode;
        
        // Show a notification about the migration
        showNotification(
          `Migration: ${guestName || 'Guest'} migrated from ${fromNodeName} to ${toNodeName}`,
          'info'
        );
        
        // Show browser notification if supported and permission granted
        if ('Notification' in window) {
          // Check if permission is already granted
          if (Notification.permission === 'granted') {
            showBrowserNotification(guestName || 'Guest', fromNodeName, toNodeName);
          } 
          // Ask for permission if not denied
          else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                showBrowserNotification(guestName || 'Guest', fromNodeName, toNodeName);
              }
            });
          }
        }
        
        console.log(`Migration event: ${guestName} (${guestId}) migrated from ${fromNodeName} to ${toNodeName}`);
      } catch (error) {
        console.error('Error handling migration event:', error);
      }
    };
    
    // Function to show browser notification
    const showBrowserNotification = (guestName, fromNode, toNode) => {
      try {
        const notification = new Notification('Proxmox Migration', {
          body: `${guestName} migrated from ${fromNode} to ${toNode}`,
          icon: '/favicon.ico'
        });
        
        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    };
    
    // Add event listener
    window.addEventListener('proxmox:migration', handleMigrationEvent);
    
    // Clean up
    return () => {
      window.removeEventListener('proxmox:migration', handleMigrationEvent);
    };
  }, [nodeData, showNotification]);
  
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
    filterButtonRef,
    searchButtonRef,
    handleFilterButtonClick,
    handleCloseFilterPopover,
    handleSearchButtonClick,
    handleCloseSearchPopover,
    closeAllPopovers
  } = usePopoverManagement();
  
  // Use keyboard shortcuts hook
  useKeyboardShortcuts({
    openFilters,
    openSearch,
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
    // Check if we're using mock data
    const useMockData = localStorage.getItem('use_mock_data') === 'true' || 
                        localStorage.getItem('MOCK_DATA_ENABLED') === 'true';
    
    // If we're using mock data, we can still show the UI even if not connected
    if (!useMockData) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      );
    }
  }
  
  // Show error state if there's a connection error
  if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
    // Check if we're using mock data
    const useMockData = localStorage.getItem('use_mock_data') === 'true' || 
                        localStorage.getItem('MOCK_DATA_ENABLED') === 'true';
    
    // If we're using mock data, we can still show the UI even if there's a connection error
    if (!useMockData) {
      return (
        <ConnectionErrorDisplay 
          connectionStatus={connectionStatus} 
          error={error} 
          onReconnect={reconnect}
        />
      );
    }
  }
  
  // If we have no data but we're connected, show a message
  if (isConnected && (!guestData || guestData.length === 0)) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h5" gutterBottom>No guest data available</Typography>
        <Typography variant="body1" color="text.secondary">
          The application is connected but no guest data was received.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => {
            if (isConnected) {
              // Request fresh data
              reconnect();
            }
          }}
        >
          Refresh Data
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Header with buttons */}
      <NetworkHeader
        openColumnMenu={openColumnMenu}
        openSearch={openSearch}
        openFilters={openFilters}
        activeSearchTerms={activeSearchTerms}
        filters={filters}
        columnVisibility={columnVisibility}
        handleColumnMenuOpen={handleColumnMenuOpen}
        handleSearchButtonClick={handleSearchButtonClick}
        handleFilterButtonClick={handleFilterButtonClick}
        searchButtonRef={searchButtonRef}
        filterButtonRef={filterButtonRef}
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
        setGuestTypeFilter={setGuestTypeFilter}
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