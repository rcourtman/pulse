import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

// Mock the node context
const mockDispatch = vi.fn();
const mockUseNodes = vi.fn(() => ({
  state: {
    nodes: {
      'test-node-1': {
        id: 'test-node-1',
        name: 'Test Node',
        host: 'https://test.proxmox:8006',
        tokenId: 'test@pam!token',
        status: 'online'
      }
    }
  },
  dispatch: mockDispatch
}));

vi.mock('../contexts/NodeContext', () => ({
  useNodes: () => mockUseNodes()
}));

// Mock the websocket context
vi.mock('../contexts/WebSocketContext', () => ({
  useWebSocketContext: () => ({
    isConnected: true,
    error: null
  })
}));

describe('Dashboard', () => {
  it('renders node cards', () => {
    render(
      <HashRouter>
        <Dashboard />
      </HashRouter>
    );
    
    expect(screen.getByText('Test Node')).toBeDefined();
    expect(screen.getByText(/https:\/\/test.proxmox:8006/)).toBeDefined();
  });

  it('shows connection status', () => {
    render(
      <HashRouter>
        <Dashboard />
      </HashRouter>
    );
    
    expect(screen.getByText('Connected')).toBeDefined();
  });

  it('handles node removal', () => {
    // Mock confirm to return true
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    render(
      <HashRouter>
        <Dashboard />
      </HashRouter>
    );
    
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'REMOVE_NODE',
      payload: 'test-node-1'
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('handles node selection', () => {
    render(
      <HashRouter>
        <Dashboard />
      </HashRouter>
    );
    
    const detailsButton = screen.getByText('View Details');
    fireEvent.click(detailsButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SELECT_NODE',
      payload: 'test-node-1'
    });
  });
}); 