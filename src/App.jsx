import React from 'react';
import MonitoringDashboard from './components/MonitoringDashboard';
import OnboardingWizard from './components/OnboardingWizard';
import { useSettingsStore } from './stores/settingsStore';

function App() {
  const { 
    credentials,
    setCredentials,
    isLoading
  } = useSettingsStore();

  const handleOnboardingComplete = (newCredentials) => {
    setCredentials(newCredentials);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!credentials) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <MonitoringDashboard credentials={credentials} />
    </div>
  );
}

export default App;
