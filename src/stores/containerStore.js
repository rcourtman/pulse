import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';

const INITIAL_STATE = {
  containers: [],
  loading: false,
  error: null,
  sortConfig: {
    field: 'alert',
    direction: 'desc'
  },
  pinnedServices: new Set(),
  searchTerms: [],
  filters: {
    status: 'all'
  }
};

export const useContainerStore = create((set, get) => ({
  ...INITIAL_STATE,

  // Container Data Management
  setContainers: (containers) => set({ containers, error: null }),
  
  // Loading State
  setLoading: (loading) => set({ loading }),

  // Error Handling
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Sorting
  setSortConfig: (sortConfig) => {
    const currentConfig = get().sortConfig;
    if (currentConfig.field === sortConfig.field) {
      // If clicking the same field, reset to default alert sorting
      set({ sortConfig: { field: 'alert', direction: 'desc' } });
    } else {
      // New field selected, sort by highest values (desc)
      set({ sortConfig: { field: sortConfig.field, direction: 'desc' } });
    }
  },

  // Pinned Services
  togglePinned: (containerId) => set((state) => {
    const newPinned = new Set(state.pinnedServices);
    if (newPinned.has(containerId)) {
      newPinned.delete(containerId);
    } else {
      newPinned.add(containerId);
    }
    return { pinnedServices: newPinned };
  }),

  clearPinned: () => set({ pinnedServices: new Set() }),

  // Search and Filtering
  addSearchTerm: (term) => set((state) => ({
    searchTerms: [...state.searchTerms, term]
  })),
  removeSearchTerm: (term) => set((state) => ({
    searchTerms: state.searchTerms.filter(t => t !== term)
  })),
  clearSearchTerms: () => set({ searchTerms: [] }),
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters }
  })),

  // Get Filtered Containers
  getFilteredContainers: () => {
    const state = get();
    const { containers, searchTerms, filters } = state;
    
    if (!containers) return [];

    return containers.filter(container => {
      // Status filter
      if (filters.status !== 'all' && container.status !== filters.status) {
        return false;
      }

      // Search terms and metric filters
      if (searchTerms.length > 0) {
        return searchTerms.some(term => {
          // Check for metric filters (e.g., cpu>10)
          const metricMatch = term.match(/^(cpu|memory|disk|network)([<>])(\d+)%?$/);
          if (metricMatch) {
            const [_, metric, operator, value] = metricMatch;
            let containerValue;
            if (metric === 'network') {
              // For network, we use the max of in/out in KB/s
              containerValue = Math.max(container.networkIn || 0, container.networkOut || 0);
            } else {
              // For other metrics (cpu, memory, disk), use percentage values
              containerValue = container[metric];
            }
            return operator === '>' ? containerValue > parseFloat(value) : containerValue < parseFloat(value);
          }
          
          // Check for status filters
          const statusMatch = term.match(/^status:(running|stopped)$/);
          if (statusMatch) {
            return container.status === statusMatch[1];
          }
          
          // Default name search
          return container.name.toLowerCase().includes(term.toLowerCase());
        });
      }

      return true;
    });
  },

  // Get Sorted Containers
  getSortedContainers: (filteredContainers = null) => {
    const state = get();
    const { sortConfig, pinnedServices } = state;
    const containers = filteredContainers || state.getFilteredContainers();

    return [...containers].sort((a, b) => {
      // First sort by pin status
      const aPinned = pinnedServices.has(a.id);
      const bPinned = pinnedServices.has(b.id);
      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }

      // Then apply the selected sort
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      
      switch (sortConfig.field) {
        case 'cpu':
          return (a.cpu - b.cpu) * direction;
        case 'memory':
          return (a.memory - b.memory) * direction;
        case 'disk':
          return (a.disk - b.disk) * direction;
        case 'network': {
          const aNet = Math.max(a.networkIn, a.networkOut);
          const bNet = Math.max(b.networkIn, b.networkOut);
          return (aNet - bNet) * direction;
        }
        case 'name':
          return a.name.localeCompare(b.name) * direction;
        case 'alert':
        default: {
          const aScore = state.getAlertScore(a);
          const bScore = state.getAlertScore(b);
          return bScore === aScore ? 
            a.name.localeCompare(b.name) : 
            (bScore - aScore);
        }
      }
    });
  },

  // Alert Score Calculation
  getAlertScore: (container) => {
    const { thresholds } = useSettingsStore.getState();

    if (!thresholds?.enabled || container.status !== 'running') {
      return 0;
    }

    let score = 0;
    if (container.cpu >= thresholds.cpu) score++;
    if (container.memory >= thresholds.memory) score++;
    if (container.disk >= thresholds.disk) score++;
    if (container.networkIn >= thresholds.network) score++;
    if (container.networkOut >= thresholds.network) score++;

    return score > 0 ? 1 : 0;
  },

  // Reset state
  resetState: () => set(INITIAL_STATE)
}));