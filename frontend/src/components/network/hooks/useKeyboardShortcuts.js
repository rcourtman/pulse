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
  showNotification,
  searchInputRef
}) => {
  const [escRecentlyPressed, setEscRecentlyPressed] = useState(false);

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
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
      
      // Ctrl+F or Cmd+F to focus search without setting a term
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        handleSearchButtonClick({ currentTarget: searchButtonRef.current });
        return;
      }
      
      // / to focus search without setting a term
      if (e.key === '/' && !escRecentlyPressed) {
        e.preventDefault();
        handleSearchButtonClick({ currentTarget: searchButtonRef.current });
        return;
      }
      
      // Enter to focus search without setting a term
      if (e.key === 'Enter' && !escRecentlyPressed) {
        e.preventDefault();
        handleSearchButtonClick({ currentTarget: searchButtonRef.current });
        return;
      }
      
      // Capture single printable characters to both open search AND start typing
      const isPrintableChar = 
        e.key.length === 1 && 
        !e.ctrlKey && 
        !e.metaKey && 
        !e.altKey && 
        !e.key.match(/^F\d+$/); // Exclude function keys
      
      if (isPrintableChar && !openSearch) {
        e.preventDefault();
        
        // Store the first character
        const firstChar = e.key;
        
        // Open the search popover and focus the input field
        handleSearchButtonClick({ currentTarget: searchButtonRef.current });
        
        // Set the search term after a short delay to ensure input is focused
        setTimeout(() => {
          setSearchTerm(firstChar);
        }, 10);
      }
      
      // NOTE: We no longer activate search on random typing - only explicit shortcuts
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