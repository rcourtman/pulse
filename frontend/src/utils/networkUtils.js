import { sliderValueToNetworkRate } from './formatters';

// Helper function to extract numeric ID from strings like "node-1-ct-105"
export const extractNumericId = (fullId) => {
  if (!fullId) return '';
  
  // Try to extract the last numeric part from the ID
  const match = fullId.match(/(\d+)$/);
  if (match && match[1]) {
    return match[1];
  }
  
  // Fallback to the original ID if no numeric part is found
  return fullId;
};

// Helper function to get the node name from the node ID
export const getNodeName = (nodeId, nodeData) => {
  if (!nodeId || !nodeData || nodeData.length === 0) return nodeId;
  
  // Find the node in the nodeData array
  const node = nodeData.find(node => node.id === nodeId);
  
  // Return the node name if found, otherwise return the node ID
  return node ? node.name : nodeId;
};

// Function to get metrics for a specific guest
export const getMetricsForGuest = (guestId, metricsData) => {
  if (!metricsData || !guestId) return null;
  
  return {
    cpu: metricsData.cpu?.[guestId] || null,
    memory: metricsData.memory?.[guestId] || null,
    disk: metricsData.disk?.[guestId] || null,
    network: metricsData.network?.[guestId] || null
  };
};

// Function to filter guests based on selected node
export const getNodeFilteredGuests = (guests, selectedNode) => {
  if (!guests || !Array.isArray(guests)) {
    console.warn('getNodeFilteredGuests: guests is not an array', guests);
    return [];
  }
  
  if (selectedNode === 'all') {
    return guests;
  }
  
  console.log('Filtering guests for node:', selectedNode);
  
  // Filter guests based on the node property from the API
  const filteredGuests = guests.filter(guest => {
    // Extract the node ID from the guest's node property
    const nodeIdFromApi = guest.node;
    
    // If the node property doesn't exist, include the guest in all nodes
    if (!nodeIdFromApi) {
      console.log('Guest has no node property:', guest.id, guest.name);
      return true;
    }
    
    // Convert node IDs between formats
    // The API might return "node-1" or just "node-1"
    // The selectedNode from the dropdown is in the format "node1", "node2", etc.
    
    // First, try direct match
    if (nodeIdFromApi === selectedNode) {
      return true;
    }
    
    // Try converting "node-1" to "node1" format
    const normalizedNodeId = nodeIdFromApi.replace('-', '');
    if (normalizedNodeId === selectedNode) {
      return true;
    }
    
    // Try extracting just the number part for comparison
    const nodeNumber = nodeIdFromApi.match(/\d+$/)?.[0];
    const selectedNodeNumber = selectedNode.match(/\d+$/)?.[0];
    
    if (nodeNumber && selectedNodeNumber && nodeNumber === selectedNodeNumber) {
      return true;
    }
    
    // Try matching by prefix (e.g., "pve" in "pve-1" matches "pve1")
    const nodePrefix = nodeIdFromApi.match(/^([a-zA-Z]+)/)?.[1];
    const selectedPrefix = selectedNode.match(/^([a-zA-Z]+)/)?.[1];
    
    if (nodePrefix && selectedPrefix && nodePrefix === selectedPrefix) {
      const nodeNum = nodeIdFromApi.match(/\d+$/)?.[0];
      const selectedNum = selectedNode.match(/\d+$/)?.[0];
      
      if (nodeNum && selectedNum && nodeNum === selectedNum) {
        return true;
      }
    }
    
    return false;
  });
  
  console.log('Filtered guests:', filteredGuests.length, 'of', guests.length);
  return filteredGuests;
};

// Function to sort and filter data
export const getSortedAndFilteredData = (
  data,
  sortConfig,
  filters,
  showStopped,
  activeSearchTerms,
  searchTerm,
  metricsData,
  guestTypeFilter,
  nodeData
) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  // Filter by guest type if specified
  let filteredData = [...data];
  if (guestTypeFilter !== 'all') {
    const isVM = guestTypeFilter === 'vm';
    filteredData = filteredData.filter(guest => 
      isVM ? guest.type === 'qemu' : guest.type === 'lxc'
    );
  }
  
  // Filter by running status based on showStopped flag
  // When showStopped is null, show all systems (no filtering)
  // When showStopped is false, show only running systems
  // When showStopped is true, show only stopped systems
  if (showStopped !== null) {
    if (showStopped) {
      filteredData = filteredData.filter(guest => guest.status.toLowerCase() !== 'running');
    } else {
      filteredData = filteredData.filter(guest => guest.status.toLowerCase() === 'running');
    }
  }
  
  // Apply search terms
  if (activeSearchTerms.length > 0 || searchTerm) {
    const terms = [...activeSearchTerms];
    if (searchTerm && !terms.includes(searchTerm)) {
      terms.push(searchTerm);
    }
    
    if (terms.length > 0) {
      filteredData = filteredData.filter(guest => {
        // Check each search term
        return terms.every(term => {
          const termLower = term.toLowerCase().trim();
          
          // Handle OR search with spaces
          const spaceTerms = termLower.split(' ').map(t => t.trim()).filter(t => t);
          if (spaceTerms.length > 1) {
            // For OR search, at least one term must match
            return spaceTerms.some(spaceTerm => {
              return matchesTerm(guest, spaceTerm, nodeData);
            });
          }
          
          // Handle OR search with pipe character (backward compatibility)
          if (termLower.includes('|')) {
            const orTerms = termLower.split('|').map(t => t.trim()).filter(t => t);
            // For OR search, at least one term must match
            return orTerms.some(orTerm => {
              return matchesTerm(guest, orTerm, nodeData);
            });
          }
          
          // Regular term matching (single term)
          return matchesTerm(guest, termLower, nodeData);
        });
      });
    }
  }
  
  // Function to check if a guest matches a single term
  function matchesTerm(guest, termLower, nodeData) {
    // Special handling for exact type searches
    if (termLower === 'ct' || termLower === 'container') {
      return guest.type === 'lxc';
    }
    
    if (termLower === 'vm' || termLower === 'virtual machine') {
      return guest.type === 'qemu';
    }
    
    // Handle column-specific searches (using prefixes)
    if (termLower.includes(':')) {
      const [prefix, value] = termLower.split(':', 2);
      
      // If there's no value after the colon, just do a regular search
      if (!value || value.trim() === '') {
        return searchableText(guest, nodeData).includes(termLower);
      }
      
      const searchValue = value.trim();
      
      // Column-specific search logic
      switch (prefix.trim()) {
        case 'name':
          return String(guest.name || '').toLowerCase().includes(searchValue);
        case 'id':
          return String(guest.id || '').toLowerCase().includes(searchValue);
        case 'node':
          return String(guest.node || '').toLowerCase().includes(searchValue) ||
                 String(getNodeName(guest.node, nodeData) || '').toLowerCase().includes(searchValue);
        case 'status':
          return String(guest.status || '').toLowerCase().includes(searchValue);
        case 'type':
          if (searchValue === 'vm' || searchValue === 'virtual' || searchValue === 'machine') {
            return guest.type === 'qemu';
          }
          if (searchValue === 'ct' || searchValue === 'container' || searchValue === 'lxc') {
            return guest.type === 'lxc';
          }
          return String(guest.type || '').toLowerCase().includes(searchValue);
        default:
          // If we don't recognize the prefix, treat it as a regular search
          return searchableText(guest, nodeData).includes(termLower);
      }
    }
    
    // For regular searches, check if the term is in the searchable text
    return searchableText(guest, nodeData).includes(termLower);
  }
  
  // Function to get searchable text for a guest
  function searchableText(guest, nodeData) {
    return [
      guest.name || '',
      guest.id || '',
      guest.status || '',
      guest.type || '',
      guest.node || '',
      // Include friendly node name
      getNodeName(guest.node, nodeData) || '',
      // Include type labels for better searching
      guest.type === 'qemu' ? 'vm virtual machine' : '',
      guest.type === 'lxc' ? 'ct container' : '',
      // Include status labels for better searching
      guest.status?.toLowerCase() === 'running' ? 'online active' : 'offline inactive stopped'
    ].map(val => String(val).toLowerCase()).join(' ');
  }
  
  // Apply metric filters
  if (filters) {
    // CPU filter
    if (filters.cpu > 0) {
      filteredData = filteredData.filter(guest => {
        const metrics = metricsData?.cpu?.[guest.id];
        return metrics && metrics.usage >= filters.cpu;
      });
    }
    
    // Memory filter
    if (filters.memory > 0) {
      filteredData = filteredData.filter(guest => {
        const metrics = metricsData?.memory?.[guest.id];
        return metrics && metrics.usagePercent >= filters.memory;
      });
    }
    
    // Disk filter
    if (filters.disk > 0) {
      filteredData = filteredData.filter(guest => {
        const metrics = metricsData?.disk?.[guest.id];
        return metrics && metrics.usagePercent >= filters.disk;
      });
    }
    
    // Download filter
    if (filters.download > 0) {
      const bytesPerSecondThreshold = sliderValueToNetworkRate(filters.download);
      filteredData = filteredData.filter(guest => {
        const metrics = metricsData?.network?.[guest.id];
        return metrics && metrics.inRate >= bytesPerSecondThreshold;
      });
    }
    
    // Upload filter
    if (filters.upload > 0) {
      const bytesPerSecondThreshold = sliderValueToNetworkRate(filters.upload);
      filteredData = filteredData.filter(guest => {
        const metrics = metricsData?.network?.[guest.id];
        return metrics && metrics.outRate >= bytesPerSecondThreshold;
      });
    }
  }
  
  // Apply sorting
  if (sortConfig) {
    filteredData.sort((a, b) => {
      // Handle special cases for metrics-based sorting
      if (sortConfig.key === 'cpu') {
        const aMetrics = metricsData?.cpu?.[a.id];
        const bMetrics = metricsData?.cpu?.[b.id];
        const aValue = aMetrics ? aMetrics.usage : 0;
        const bValue = bMetrics ? bMetrics.usage : 0;
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (sortConfig.key === 'memory') {
        const aMetrics = metricsData?.memory?.[a.id];
        const bMetrics = metricsData?.memory?.[b.id];
        const aValue = aMetrics ? aMetrics.usagePercent : 0;
        const bValue = bMetrics ? bMetrics.usagePercent : 0;
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (sortConfig.key === 'disk') {
        const aMetrics = metricsData?.disk?.[a.id];
        const bMetrics = metricsData?.disk?.[b.id];
        const aValue = aMetrics ? aMetrics.usagePercent : 0;
        const bValue = bMetrics ? bMetrics.usagePercent : 0;
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (sortConfig.key === 'download') {
        const aMetrics = metricsData?.network?.[a.id];
        const bMetrics = metricsData?.network?.[b.id];
        const aValue = aMetrics ? aMetrics.inRate : 0;
        const bValue = bMetrics ? bMetrics.inRate : 0;
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (sortConfig.key === 'upload') {
        const aMetrics = metricsData?.network?.[a.id];
        const bMetrics = metricsData?.network?.[b.id];
        const aValue = aMetrics ? aMetrics.outRate : 0;
        const bValue = bMetrics ? bMetrics.outRate : 0;
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (sortConfig.key === 'uptime') {
        const aValue = a.uptime || 0;
        const bValue = b.uptime || 0;
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // For string-based properties
      if (sortConfig.key === 'id') {
        // Extract numeric part for better sorting
        const aId = extractNumericId(a.id);
        const bId = extractNumericId(b.id);
        
        // Try to convert to numbers for numeric sorting
        const aNum = parseInt(aId, 10);
        const bNum = parseInt(bId, 10);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // Fallback to string comparison
        return sortConfig.direction === 'asc' 
          ? aId.localeCompare(bId) 
          : bId.localeCompare(aId);
      }
      
      // Special case for status column (running status should be first)
      if (sortConfig.key === 'status') {
        // Normalize status values for consistent sorting
        const statusPriority = {
          'running': 1,
          'paused': 2,
          'suspended': 3,
          'stopped': 4
        };
        
        const aStatus = (a.status || '').toLowerCase();
        const bStatus = (b.status || '').toLowerCase();
        
        // Get priority or default to highest number (end of sort)
        const aPriority = statusPriority[aStatus] || 999;
        const bPriority = statusPriority[bStatus] || 999;
        
        // Sort by priority number
        if (sortConfig.direction === 'asc') {
          return aPriority - bPriority;
        } else {
          return bPriority - aPriority;
        }
      }
      
      // Special case for type column (normalize qemu/lxc to vm/ct)
      if (sortConfig.key === 'type') {
        // Normalize type values
        const getTypeValue = (type) => {
          const typeStr = (type || '').toLowerCase();
          if (typeStr === 'qemu') return 'vm';
          if (typeStr === 'lxc') return 'ct';
          return typeStr;
        };
        
        const aType = getTypeValue(a.type);
        const bType = getTypeValue(b.type);
        
        return sortConfig.direction === 'asc'
          ? aType.localeCompare(bType)
          : bType.localeCompare(aType);
      }
      
      // Default string comparison for other fields
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      return sortConfig.direction === 'asc' 
        ? String(aValue).localeCompare(String(bValue)) 
        : String(bValue).localeCompare(String(aValue));
    });
  }
  
  return filteredData;
};

/**
 * Calculate dynamic column widths based on visible columns
 * @param {Object} columnVisibility - Object containing column visibility state
 * @returns {Object} - Object with column IDs as keys and percentage width strings as values
 */
export const calculateDynamicColumnWidths = (columnVisibility) => {
  // Base widths (adjusted to be more space conservative)
  const baseWidths = {
    node: 7,     // Reduced from 8%
    type: 3,     // Reduced from 4% to make it more compact
    id: 6,       // Reduced from 7%
    status: 3,   // Small width since it's only an icon now
    name: 15,    // Increased slightly to use the space saved from type
    cpu: 13,     // Reduced from 15%
    memory: 13,  // Reduced from 15%
    disk: 13,    // Reduced from 15%
    download: 9, // Reduced from 10%
    upload: 9,   // Reduced from 10%
    uptime: 8    // Increased from 7% to accommodate longer uptime strings
  };
  
  // Get total width of visible columns
  const visibleColumns = Object.keys(columnVisibility).filter(key => columnVisibility[key].visible);
  
  // If no columns are visible, return default widths
  // This prevents issues when all columns are hidden
  if (visibleColumns.length === 0) {
    // Return a default object with all columns at their base widths
    // This ensures the table doesn't break when no columns are visible
    const defaultWidths = {};
    Object.keys(baseWidths).forEach(key => {
      defaultWidths[key] = `${baseWidths[key]}%`;
    });
    return defaultWidths;
  }
  
  const totalBaseWidth = visibleColumns.reduce((sum, key) => sum + baseWidths[key], 0);
  
  // Calculate scaling factor to make total width 100%
  const scalingFactor = totalBaseWidth > 0 ? 100 / totalBaseWidth : 1;
  
  // Calculate adjusted widths
  const adjustedWidths = {};
  visibleColumns.forEach(key => {
    adjustedWidths[key] = `${baseWidths[key] * scalingFactor}%`;
  });
  
  return adjustedWidths;
}; 