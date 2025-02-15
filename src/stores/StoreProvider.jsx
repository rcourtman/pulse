import React, { useEffect, useState } from 'react';
import { useSettingsStore } from './settingsStore';
import ErrorBoundary from '../components/ErrorBoundary';

function StoreProviderContent({ children }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const { setIsLoading } = useSettingsStore();

  useEffect(() => {
    let isMounted = true;

    const initializeStore = async () => {
      try {
        // Check if already hydrated first
        if (useSettingsStore.persist.hasHydrated()) {
          if (isMounted) {
            setIsHydrated(true);
            setIsLoading(false);
          }
          return;
        }

        // Set up hydration listener only if not already hydrated
        const unsubFinishHydration = useSettingsStore.persist.onFinishHydration(() => {
          if (isMounted) {
            setIsHydrated(true);
            setIsLoading(false);
          }
        });

        return () => {
          unsubFinishHydration();
        };
      } catch (error) {
        console.error('Store initialization error:', error);
        // Still set hydrated to true to prevent infinite loading
        if (isMounted) {
          setIsHydrated(true);
          setIsLoading(false);
        }
      }
    };

    initializeStore();

    return () => {
      isMounted = false;
    };
  }, [setIsLoading]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
          <p className="text-gray-400">Loading application...</p>
        </div>
      </div>
    );
  }

  return children;
}

export function StoreProvider({ children }) {
  return (
    <ErrorBoundary>
      <StoreProviderContent>{children}</StoreProviderContent>
    </ErrorBoundary>
  );
}