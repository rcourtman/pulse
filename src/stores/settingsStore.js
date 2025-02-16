import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_THRESHOLDS = {
  cpu: 5,
  memory: 80,
  disk: 80,
  network: 1024,
  enabled: true,
  wasManuallyDisabled: false
};

const DEFAULT_USER_PREFERENCES = {
  refreshRate: 2000,
  theme: 'dark'
};

const INITIAL_STATE = {
  credentials: null,
  isLoading: true,
  showSettings: false,
  thresholds: DEFAULT_THRESHOLDS,
  userPreferences: DEFAULT_USER_PREFERENCES
};

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // Credentials Management
      setCredentials: (credentials) => {
        set({ credentials });
        if (credentials) {
          localStorage.setItem('proxmox_credentials', JSON.stringify(credentials));
        } else {
          localStorage.removeItem('proxmox_credentials');
        }
      },

      // Loading State
      setIsLoading: (isLoading) => set({ isLoading }),

      // Settings Panel Visibility
      setShowSettings: (show) => set({ showSettings: show }),

      // Thresholds
      setThresholds: (newThresholds) => 
        set((state) => {
          // If newThresholds is a function, execute it with current state
          const updatedThresholds = typeof newThresholds === 'function' ?
            newThresholds(state.thresholds) :
            { ...state.thresholds, ...newThresholds };

          // If enabled is being explicitly set, mark it as manual
          if ('enabled' in newThresholds) {
            updatedThresholds.wasManuallyDisabled = !newThresholds.enabled;
          }

          return { thresholds: updatedThresholds };
        }),
      resetThresholds: () => 
        set({ thresholds: DEFAULT_THRESHOLDS }),

      // User Preferences
      setUserPreferences: (newPreferences) =>
        set((state) => ({ 
          userPreferences: { ...state.userPreferences, ...newPreferences }
        })),
      resetUserPreferences: () =>
        set({ userPreferences: DEFAULT_USER_PREFERENCES }),

      // Reset all settings
      resetAll: () => {
        const currentCredentials = get().credentials;
        set({
          ...INITIAL_STATE,
          credentials: currentCredentials,
          isLoading: false
        });
      }
    }),
    {
      name: 'pulse-settings-storage',
      version: 1,
      partialize: (state) => ({
        credentials: state.credentials,
        thresholds: state.thresholds,
        userPreferences: state.userPreferences
      })
    }
  )
);

// Export for type checking
export const getDefaultState = () => INITIAL_STATE;