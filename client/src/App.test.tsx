import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock the socket.io-client
vi.mock('socket.io-client', () => ({
  io: () => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: () => 'test-uuid'
}));

// Mock node context with a test node
vi.mock('./contexts/NodeContext', () => ({
  NodeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useNodes: () => ({
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
    dispatch: vi.fn()
  })
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header', () => {
    render(<App />);
    expect(screen.getByText(/Pulse - Proxmox Monitoring Dashboard/i)).toBeDefined();
  });

  it('renders the dashboard by default', () => {
    render(<App />);
    expect(screen.getByTestId('dashboard-page')).toBeDefined();
  });

  it('displays node information', () => {
    render(<App />);
    expect(screen.getByText('Test Node')).toBeDefined();
    expect(screen.getByText(/https:\/\/test.proxmox:8006/)).toBeDefined();
    expect(screen.getByText(/test@pam!token/)).toBeDefined();
  });

  it('shows node status', () => {
    render(<App />);
    expect(screen.getByText('online')).toBeDefined();
  });

  it('has working node action buttons', () => {
    const { container } = render(<App />);
    expect(screen.getByText('Remove')).toBeDefined();
    expect(screen.getByText('View Details')).toBeDefined();
  });

  it('navigates to onboarding page', () => {
    render(<App />);
    const addButton = screen.getByText(/Add Node/i);
    fireEvent.click(addButton);
    expect(window.location.hash).toBe('#/onboarding');
  });
}); 