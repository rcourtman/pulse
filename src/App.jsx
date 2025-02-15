import React, { useState, useEffect } from 'react';
import MonitoringDashboard from './components/MonitoringDashboard';
import OnboardingWizard from './components/OnboardingWizard';

function App() {
  const [credentials, setCredentials] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored credentials on component mount
    const storedCredentials = localStorage.getItem('proxmox_credentials');
    if (storedCredentials) {
      try {
        setCredentials(JSON.parse(storedCredentials));
      } catch (error) {
        console.error('Failed to parse stored credentials:', error);
        localStorage.removeItem('proxmox_credentials');
      }
    }
    setIsLoading(false);
  }, []);

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
