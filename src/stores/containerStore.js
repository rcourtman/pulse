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
  searchTerms: []
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
  togglePinned: (containerId) => {
    set((state) => {
      const newPinned = new Set(state.pinnedServices);
      if (newPinned.has(containerId)) {
        newPinned.delete(containerId);
      } else {
        newPinned.add(containerId);
      }
      return { pinnedServices: newPinned };
    });
  },

  clearPinned: () => set({ pinnedServices: new Set() }),

  // Search
  addSearchTerm: (term) => set((state) => ({
    searchTerms: [...state.searchTerms, term]
  })),
  removeSearchTerm: (term) => set((state) => ({
    searchTerms: state.searchTerms.filter(t => t !== term)
  })),
  clearSearchTerms: () => set({ searchTerms: [] }),

  // Get Filtered Containers
  getFilteredContainers: () => {
    const state = get();
    const { containers, searchTerms } = state;
    const { thresholds } = useSettingsStore.getState();
    
    if (!containers) return [];

    let filteredContainers = containers;

    // Apply search term filtering
    if (searchTerms.length > 0) {
      filteredContainers = filteredContainers.filter(container => {
        return searchTerms.some(term => 
          container.name.toLowerCase().includes(term.toLowerCase())
        );
      });
    }

    return filteredContainers;
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
    return container.status === 'running' ? 0 : 0;
  },

  // Reset state
  resetState: () => set(INITIAL_STATE)
}));