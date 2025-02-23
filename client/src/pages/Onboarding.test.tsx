import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import Onboarding from './Onboarding';

describe('Onboarding', () => {
  it('renders the form fields', () => {
    render(
      <HashRouter>
        <Onboarding />
      </HashRouter>
    );
    
    expect(screen.getByLabelText(/API Token ID/i)).toBeDefined();
    expect(screen.getByLabelText(/API Token Secret/i)).toBeDefined();
    expect(screen.getByLabelText(/Proxmox Host URL/i)).toBeDefined();
  });

  it('handles form submission', async () => {
    const mockFetch = vi.fn(() => 
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    );
    global.fetch = mockFetch;

    render(
      <HashRouter>
        <Onboarding />
      </HashRouter>
    );

    fireEvent.change(screen.getByLabelText(/API Token ID/i), {
      target: { value: 'user@pam!token' }
    });
    fireEvent.change(screen.getByLabelText(/API Token Secret/i), {
      target: { value: 'secret123' }
    });
    fireEvent.change(screen.getByLabelText(/Proxmox Host URL/i), {
      target: { value: 'https://proxmox.example.com:8006' }
    });

    fireEvent.click(screen.getByText('Add Node'));

    expect(mockFetch).toHaveBeenCalledWith('/api/proxmox/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenId: 'user@pam!token',
        tokenSecret: 'secret123',
        host: 'https://proxmox.example.com:8006',
        node: ''
      }),
    });
  });

  it('shows success message on successful validation', async () => {
    const mockFetch = vi.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', message: 'Token validated successfully' })
      })
    );
    global.fetch = mockFetch;

    render(
      <HashRouter>
        <Onboarding />
      </HashRouter>
    );

    fireEvent.change(screen.getByLabelText(/API Token ID/i), {
      target: { value: 'user@pam!token' }
    });
    fireEvent.change(screen.getByLabelText(/API Token Secret/i), {
      target: { value: 'secret123' }
    });
    fireEvent.change(screen.getByLabelText(/Proxmox Host URL/i), {
      target: { value: 'https://proxmox.example.com:8006' }
    });

    fireEvent.click(screen.getByText('Add Node'));

    await waitFor(() => {
      expect(screen.getByText(/Token validated successfully/i)).toBeDefined();
    });
  });
}); 