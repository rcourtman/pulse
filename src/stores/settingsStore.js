import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_USER_PREFERENCES = {
  refreshRate: 2000,
  theme: 'dark'
};

const INITIAL_STATE = {
  credentials: null,
  isLoading: true,
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
        userPreferences: state.userPreferences
      })
    }
  )
);

// Export for type checking
export const getDefaultState = () => INITIAL_STATE;