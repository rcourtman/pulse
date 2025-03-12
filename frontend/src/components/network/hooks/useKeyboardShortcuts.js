import { useState, useEffect, useCallback } from 'react';

const useKeyboardShortcuts = ({
  openFilters,
  openSearch,
  openColumnMenu,
  resetFilters,
  closeAllPopovers,
  handleSearchButtonClick,
  searchButtonRef,
  setSearchTerm,
  showNotification
}) => {
  const [escRecentlyPressed, setEscRecentlyPressed] = useState(false);

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Immediately return if search popover is open
      if (openSearch) {
        return;
      }
      
      // Don't trigger shortcuts if typing in an input field
      if (
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.isContentEditable
      ) {
        return;
      }
      
      // Escape key to close filters or clear search
      if (e.key === 'Escape') {
        // Close any open popovers
        closeAllPopovers();
        
        // Reset all filters
        resetFilters();
        
        // Set flag to prevent other shortcuts from triggering
        setEscRecentlyPressed(true);
        setTimeout(() => setEscRecentlyPressed(false), 300);
        
        // Show notification
        showNotification('All filters have been cleared', 'info');
        return;
      }
      
      // Ctrl+F or Cmd+F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        handleSearchButtonClick({ currentTarget: searchButtonRef.current });
        return;
      }
      
      // / to focus search
      if (e.key === '/' && !escRecentlyPressed) {
        e.preventDefault();
        handleSearchButtonClick({ currentTarget: searchButtonRef.current });
        return;
      }
      
      // Capture typing for search (only if it's a single printable character)
      const isPrintableChar = 
        e.key.length === 1 && 
        !e.ctrlKey && 
        !e.metaKey && 
        !e.altKey && 
        !e.key.match(/^F\d+$/); // Exclude function keys like F1-F12
      
      if (isPrintableChar && !openSearch) {
        // Open search popover and set the search term to the pressed key
        handleSearchButtonClick({ currentTarget: searchButtonRef.current });
        // Set a small timeout to ensure the search input is ready
        setTimeout(() => {
          setSearchTerm(e.key);
        }, 50);
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [
    openFilters, 
    openSearch, 
    openColumnMenu, 
    escRecentlyPressed,
    resetFilters,
    closeAllPopovers,
    handleSearchButtonClick,
    searchButtonRef,
    setSearchTerm,
    showNotification
  ]);

  return {
    escRecentlyPressed
  };
};

export default useKeyboardShortcuts; 