import React from 'react';
import MonitoringDashboard from './components/MonitoringDashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <MonitoringDashboard 
        proxmoxUrl="https://192.168.0.132:8006"
        apiToken="root@pam!monitoring"
        apiTokenSecret="134e4338-1b20-438b-94c0-6dfe0e3f87c9"
      />
    </div>
  );
}

export default App;
