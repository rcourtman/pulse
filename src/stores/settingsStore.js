import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_THRESHOLDS = {
  cpu: 5,
  memory: 80,
  disk: 80,
  network: 1024,
  enabled: true
};

const DEFAULT_ALERT_CONFIG = {
  includeStoppedContainers: false
};

const DEFAULT_USER_PREFERENCES = {
  refreshRate: 2000,
  highContrastMode: false,
  compactMode: false,
  theme: 'dark'
};

const INITIAL_STATE = {
  credentials: null,
  isLoading: true,
  showSettings: false,
  thresholds: DEFAULT_THRESHOLDS,
  alertConfig: DEFAULT_ALERT_CONFIG,
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
        set((state) => ({ 
          thresholds: { ...state.thresholds, ...newThresholds }
        })),
      resetThresholds: () => 
        set({ thresholds: DEFAULT_THRESHOLDS }),

      // Alert Configuration
      setAlertConfig: (newConfig) =>
        set((state) => ({ 
          alertConfig: { ...state.alertConfig, ...newConfig }
        })),
      resetAlertConfig: () =>
        set({ alertConfig: DEFAULT_ALERT_CONFIG }),

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
        alertConfig: state.alertConfig,
        userPreferences: state.userPreferences
      })
    }
  )
);

// Export for type checking
export const getDefaultState = () => INITIAL_STATE;