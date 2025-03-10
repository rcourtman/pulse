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
  if (selectedNode === 'all') {
    return guests;
  }
  
  // Filter guests based on the node property from the API
  return guests.filter(guest => {
    // Extract the node ID from the guest's node property
    // The node property from the API is in the format "node-1", "node-2", etc.
    // The selectedNode from the dropdown is in the format "node1", "node2", etc.
    // We need to convert between these formats
    const nodeIdFromApi = guest.node;
    
    // If the node property doesn't exist, include the guest in all nodes
    if (!nodeIdFromApi) return true;
    
    // Convert "node-1" to "node1" format
    const normalizedNodeId = nodeIdFromApi.replace('-', '');
    
    return normalizedNodeId === selectedNode;
  });
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
  
  // Filter by running status if showStopped is false
  if (!showStopped) {
    filteredData = filteredData.filter(guest => guest.status.toLowerCase() === 'running');
  }
  
  // Apply search terms
  if (activeSearchTerms.length > 0 || searchTerm) {
    const terms = [...activeSearchTerms];
    if (searchTerm && !terms.includes(searchTerm)) {
      terms.push(searchTerm);
    }
    
    if (terms.length > 0) {
      filteredData = filteredData.filter(guest => {
        // Special handling for exact type searches
        for (const term of terms) {
          const termLower = term.toLowerCase().trim();
          
          // Exact match for type terms
          if (termLower === 'ct' || termLower === 'container') {
            return guest.type === 'lxc';
          }
          
          if (termLower === 'vm' || termLower === 'virtual machine') {
            return guest.type === 'qemu';
          }
        }
        
        // For other searches, use the standard inclusion check
        const searchableText = [
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
        
        // Check if any search term is found in the searchable text
        return terms.some(term => 
          searchableText.includes(term.toLowerCase().trim())
        );
      });
    }
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
    uptime: 7    // Reduced from 8%
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