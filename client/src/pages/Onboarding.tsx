import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TokenFormData } from '../types/proxmox';
import { useNodes } from '../contexts/NodeContext';
import { v4 as uuidv4 } from 'uuid';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useNodes();
  const [formData, setFormData] = useState<TokenFormData>({
    tokenId: '',
    tokenSecret: '',
    host: '',
    node: ''
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (data: TokenFormData): string | null => {
    if (!data.host) return 'Host URL is required';
    if (!data.host.startsWith('http')) return 'Host URL must start with http:// or https://';
    if (!data.tokenId) return 'Token ID is required';
    if (!data.tokenSecret) return 'Token Secret is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/proxmox/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate token');
      }

      // Add the node to our local state
      dispatch({
        type: 'ADD_NODE',
        payload: {
          id: data.nodeId,
          name: data.nodeName,
          host: formData.host,
          tokenId: formData.tokenId,
          status: 'online'
        }
      });

      setSuccess('Node added successfully! Redirecting...');
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (err) {
      console.error('Validation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to validate token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div data-testid="onboarding-page" className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6">Add Proxmox Node</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="host" className="block text-sm font-medium text-gray-700">
            Proxmox Host URL
          </label>
          <input
            type="text"
            id="host"
            name="host"
            value={formData.host}
            onChange={handleChange}
            placeholder="https://proxmox.example.com:8006"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="tokenId" className="block text-sm font-medium text-gray-700">
            API Token ID
          </label>
          <input
            type="text"
            id="tokenId"
            name="tokenId"
            value={formData.tokenId}
            onChange={handleChange}
            placeholder="user@pam!token_name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="tokenSecret" className="block text-sm font-medium text-gray-700">
            API Token Secret
          </label>
          <input
            type="password"
            id="tokenSecret"
            name="tokenSecret"
            value={formData.tokenSecret}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="node" className="block text-sm font-medium text-gray-700">
            Node Name (Optional)
          </label>
          <input
            type="text"
            id="node"
            name="node"
            value={formData.node}
            onChange={handleChange}
            placeholder="pve"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Validating...' : 'Add Node'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Onboarding;