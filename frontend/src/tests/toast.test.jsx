/**
 * Frontend Toast Notification Tests
 * Validates: Requirements 9.4, 9.5
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('react-hot-toast', () => ({
  default: {
    success: (...args) => mockToastSuccess(...args),
    error: (...args) => mockToastError(...args),
  },
  Toaster: () => null,
}));

vi.mock('../lib/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

import CategoryForm from '../forms/CategoryForm';
import SupplierForm from '../forms/SupplierForm';
import api from '../lib/axios';

describe('Toast on CategoryForm success', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
  });

  it('calls toast.success when category is created successfully', async () => {
    api.post.mockResolvedValueOnce({ data: { data: { _id: '123', name: 'Electronics' }, message: 'ok' } });
    const onSuccess = vi.fn();

    render(<CategoryForm onClose={vi.fn()} onSuccess={onSuccess} />);
    await userEvent.type(screen.getByLabelText(/name/i), 'Electronics');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/categories', expect.objectContaining({ name: 'Electronics' }));
      expect(mockToastSuccess).toHaveBeenCalledWith('Category created');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('calls toast.error when category creation fails', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: 'Category name already exists' } },
    });

    render(<CategoryForm onClose={vi.fn()} onSuccess={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/name/i), 'Duplicate');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Category name already exists');
    });
  });
});

describe('Toast on SupplierForm success', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
  });

  it('calls toast.success when supplier is created successfully', async () => {
    api.post.mockResolvedValueOnce({ data: { data: { _id: '456', name: 'Acme' }, message: 'ok' } });
    const onSuccess = vi.fn();

    render(<SupplierForm onClose={vi.fn()} onSuccess={onSuccess} />);
    await userEvent.type(screen.getByLabelText(/^name/i), 'Acme Corp');
    await userEvent.type(screen.getByLabelText(/contact email/i), 'acme@example.com');
    await userEvent.type(screen.getByLabelText(/lead time/i), '7');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Supplier created');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('calls toast.error when supplier creation fails with server message', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: 'Contact email already in use' } },
    });

    render(<SupplierForm onClose={vi.fn()} onSuccess={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/^name/i), 'Acme Corp');
    await userEvent.type(screen.getByLabelText(/contact email/i), 'dup@example.com');
    await userEvent.type(screen.getByLabelText(/lead time/i), '3');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Contact email already in use');
    });
  });
});
