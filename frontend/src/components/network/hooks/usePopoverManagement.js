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
    // Save the button for blur later
    const button = event.currentTarget;
    
    // Set anchor for popover
    setSearchAnchorEl(event.currentTarget);
    
    // Immediately remove focus from the search button to prevent the ripple effect
    if (button && typeof button.blur === 'function') {
      button.blur();
    }
    
    // Use a timeout to ensure the popover is rendered
    // before trying to focus the input
    setTimeout(() => {
      // Try multiple focus approaches to ensure it works
      if (searchInputRef.current) {
        // For TextField component
        if (typeof searchInputRef.current.focus === 'function') {
          searchInputRef.current.focus();
        }
        
        // For direct DOM access - this is more reliable
        const inputElement = searchInputRef.current.querySelector ? 
          searchInputRef.current.querySelector('input') : 
          searchInputRef.current;
          
        if (inputElement && typeof inputElement.focus === 'function') {
          inputElement.focus();
          
          // If there's text, place cursor at the end
          if (inputElement.value && typeof inputElement.setSelectionRange === 'function') {
            const length = inputElement.value.length;
            inputElement.setSelectionRange(length, length);
          }
        }
      }
    }, 50); // Shorter timeout for better responsiveness
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