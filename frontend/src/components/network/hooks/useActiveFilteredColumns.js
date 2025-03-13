import { useMemo } from 'react';

const useActiveFilteredColumns = ({
  filters,
  activeSearchTerms,
  searchTerm,
  guestTypeFilter,
  showStopped,
  nodeData
}) => {
  // Determine which columns have active filters
  const activeFilteredColumns = useMemo(() => {
    const result = {};
    
    // Resource filters
    if (filters.cpu > 0) result.cpu = true;
    if (filters.memory > 0) result.memory = true;
    if (filters.disk > 0) result.disk = true;
    if (filters.download > 0) result.netIn = true;
    if (filters.upload > 0) result.netOut = true;
    
    // Search terms - determine which column to highlight based on the search term
    if (activeSearchTerms.length > 0 || searchTerm) {
      const allTerms = [...activeSearchTerms];
      if (searchTerm) allTerms.push(searchTerm);
      
      // Check each term and determine which column(s) to highlight
      allTerms.forEach(term => {
        const termLower = term.trim().toLowerCase();
        
        // Handle column-specific searches (using prefixes)
        if (termLower.includes(':')) {
          const [prefix, value] = termLower.split(':', 2);
          
          switch (prefix.trim()) {
            case 'name':
              result.name = true;
              return; // Skip other checks for this term
            case 'id':
              result.id = true;
              return; // Skip other checks for this term
            case 'node':
              result.node = true;
              return; // Skip other checks for this term
            case 'status':
              result.status = true;
              return; // Skip other checks for this term
            case 'type':
              result.type = true;
              return; // Skip other checks for this term
          }
        }
        
        // Check for exact type matches
        if (termLower === 'ct' || termLower === 'container') {
          result.type = true;
          return; // Skip other checks for this term
        }
        
        if (termLower === 'vm' || termLower === 'virtual machine') {
          result.type = true;
          return; // Skip other checks for this term
        }
        
        // Check if term is a numeric ID
        if (/^\d+$/.test(termLower)) {
          result.id = true;
        } 
        // Check if term matches type-related keywords
        else if (['qemu', 'lxc'].includes(termLower)) {
          result.type = true;
        }
        // Check if term matches status-related keywords
        else if (['running', 'stopped', 'online', 'offline', 'active', 'inactive'].includes(termLower)) {
          result.status = true;
        }
        // Check if term might be a node name
        else if (nodeData && nodeData.some(node => 
          (node.name && node.name.toLowerCase().includes(termLower)) || 
          (node.id && node.id.toLowerCase().includes(termLower))
        )) {
          result.node = true;
        }
        // Default to name column for other terms
        else {
          result.name = true;
        }
      });
    }
    
    // Guest type filter affects the type column
    if (guestTypeFilter !== 'all') {
      result.type = true;
    }
    
    // Highlight status column when we're filtering by status (not showing all)
    if (showStopped !== null) {
      result.status = true;
    }
    
    return result;
  }, [filters, activeSearchTerms, searchTerm, guestTypeFilter, showStopped, nodeData]);

  return activeFilteredColumns;
};

export default useActiveFilteredColumns; 