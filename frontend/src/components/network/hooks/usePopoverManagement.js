import { useState, useRef, useCallback } from 'react';

const usePopoverManagement = () => {
  // State for filter menu
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const openFilters = Boolean(filterAnchorEl);
  
  // State for search popover
  const [searchAnchorEl, setSearchAnchorEl] = useState(null);
  const openSearch = Boolean(searchAnchorEl);
  const searchInputRef = useRef(null);
  
  // Add a ref for the filter button
  const filterButtonRef = useRef(null);
  
  // Add a ref for the search button
  const searchButtonRef = useRef(null);
  
  // Filter popover handlers
  const handleFilterButtonClick = useCallback((event) => {
    setFilterAnchorEl(event.currentTarget);
  }, []);
  
  const handleCloseFilterPopover = useCallback(() => {
    setFilterAnchorEl(null);
  }, []);
  
  // Search popover handlers
  const handleSearchButtonClick = useCallback((event) => {
    setSearchAnchorEl(event.currentTarget);
    // Focus the search input after a short delay to ensure the popover is open
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, []);
  
  const handleCloseSearchPopover = useCallback(() => {
    setSearchAnchorEl(null);
  }, []);

  // Function to close all popovers
  const closeAllPopovers = useCallback(() => {
    setFilterAnchorEl(null);
    setSearchAnchorEl(null);
  }, []);

  return {
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
  };
};

export default usePopoverManagement; 