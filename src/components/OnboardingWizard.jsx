import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';

const STEPS = {
  WELCOME: 'welcome',
  CREATE_TOKEN: 'create_token',
  SET_PERMISSIONS: 'set_permissions',
  VALIDATION: 'validation',
  COMPLETE: 'complete',
};

export default function OnboardingWizard({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(STEPS.WELCOME);
  const [formData, setFormData] = useState({
    proxmoxUrl: '',
    apiToken: '',
    apiTokenSecret: '',
  });
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validateToken = async () => {
    setIsValidating(true);
    setError('');
    
    try {
      const response = await axios.post('/api/validate-token', formData);
      if (response.data.valid) {
        // Store credentials
        localStorage.setItem('proxmox_credentials', JSON.stringify(formData));
        setCurrentStep(STEPS.COMPLETE);
        onComplete(formData);
      } else {
        setError('Invalid token. Please check your credentials and try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to validate token. Please check your credentials.');
    } finally {
      setIsValidating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.WELCOME:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Welcome to Pulse!</h2>
            <p className="text-gray-300">
              Let's get you set up with your Proxmox VE dashboard. 
              This wizard will guide you through connecting Pulse to your Proxmox server.
            </p>
            <Button 
              onClick={() => setCurrentStep(STEPS.CREATE_TOKEN)}
              className="w-full text-white"
            >
              Get Started
            </Button>
          </div>
        );

      case STEPS.CREATE_TOKEN:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Create & Enter Your API Token</h2>
            <div className="bg-gray-800 p-4 rounded-lg space-y-2">
              <p className="text-gray-300">First, create your token:</p>
              <ol className="list-decimal list-inside text-gray-300 space-y-2">
                <li>Log in to your Proxmox VE web interface</li>
                <li>Navigate to Datacenter → Permissions → API Tokens</li>
                <li>Click "Add" to create a new API token</li>
                <li>Select a user (e.g., root@pam)</li>
                <li>Enter "pulse" as the token ID</li>
                <li>⚠️ IMPORTANT: Uncheck "Privilege Separation"</li>
                <li>Click "Add" and copy the token value</li>
              </ol>
            </div>

            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Proxmox URL
                </label>
                <input
                  type="text"
                  placeholder="https://your-proxmox:8006"
                  className="mt-1 w-full rounded-md bg-gray-800 border-gray-700 text-white px-4 py-2"
                  value={formData.proxmoxUrl}
                  onChange={(e) => setFormData({ ...formData, proxmoxUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  API Token (e.g., root@pam!pulse)
                </label>
                <input
                  type="text"
                  placeholder="user@realm!tokenid"
                  className="mt-1 w-full rounded-md bg-gray-800 border-gray-700 text-white px-4 py-2"
                  value={formData.apiToken}
                  onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  API Token Secret
                </label>
                <input
                  type="password"
                  placeholder="Your token secret"
                  className="mt-1 w-full rounded-md bg-gray-800 border-gray-700 text-white px-4 py-2"
                  value={formData.apiTokenSecret}
                  onChange={(e) => setFormData({ ...formData, apiTokenSecret: e.target.value })}
                />
              </div>
            </div>

            <Button 
              onClick={() => setCurrentStep(STEPS.SET_PERMISSIONS)}
              className="w-full text-white"
              disabled={!formData.proxmoxUrl || !formData.apiToken || !formData.apiTokenSecret}
            >
              Continue to Permissions
            </Button>
          </div>
        );

      case STEPS.SET_PERMISSIONS:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Set Token Permissions</h2>
            <div className="bg-gray-800 p-4 rounded-lg space-y-2">
              <p className="text-gray-300">Now let's give your token the required permissions:</p>
              <ol className="list-decimal list-inside text-gray-300 space-y-2">
                <li>Go to Datacenter → Permissions → Add → API Token Permission</li>
                <li>Select your token from the dropdown (e.g., root@pam!pulse)</li>
                <li>Set the following permissions:
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>Path: /</li>
                    <li>Role: PVEAuditor</li>
                    <li>Propagate: ✓ (checked)</li>
                  </ul>
                </li>
                <li>Click "Add"</li>
                <li className="mt-2 text-yellow-400">Note: The PVEAuditor role provides read-only access needed for monitoring.</li>
              </ol>
            </div>
            <Button 
              onClick={() => setCurrentStep(STEPS.VALIDATION)}
              className="w-full text-white"
            >
              Validate Connection
            </Button>
          </div>
        );

      case STEPS.VALIDATION:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Validating Your Token</h2>
            <p className="text-gray-300">
              We'll now verify your Proxmox connection. This may take a moment...
            </p>
            {isValidating ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <Button 
                onClick={validateToken}
                className="w-full text-white"
              >
                Validate Connection
              </Button>
            )}
            {error && (
              <div className="text-red-400 text-sm mt-2">
                {error}
              </div>
            )}
          </div>
        );

      case STEPS.COMPLETE:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Setup Complete! 🎉</h2>
            <p className="text-gray-300">
              Your Proxmox connection has been successfully configured. 
              You'll now be redirected to your dashboard.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 p-6 rounded-lg border border-gray-800">
        {renderStep()}
      </div>
    </div>
  );
}