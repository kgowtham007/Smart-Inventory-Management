/**
 * Frontend Form Validation Tests
 * Validates: Requirements 9.1, 9.2, 9.3
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios before importing components
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

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

import Login from '../pages/Login';
import Register from '../pages/Register';
import CategoryForm from '../forms/CategoryForm';
import SupplierForm from '../forms/SupplierForm';
import ProductForm from '../forms/ProductForm';
import TransactionForm from '../forms/TransactionForm';
import { AuthProvider } from '../contexts/AuthContext';
import api from '../lib/axios';

const renderWithRouter = (ui) =>
  render(<AuthProvider><MemoryRouter>{ui}</MemoryRouter></AuthProvider>);

describe('Login Form Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error for empty email and password on submit', async () => {
    renderWithRouter(<Login />);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows error for invalid email format', async () => {
    renderWithRouter(<Login />);
    await userEvent.type(screen.getByLabelText(/email/i), 'notanemail');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('does not call API when fields are empty', () => {
    renderWithRouter(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe('Register Form Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error for all empty required fields on submit', async () => {
    renderWithRouter(<Register />);
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows error when password is shorter than 8 characters', async () => {
    renderWithRouter(<Register />);
    await userEvent.type(screen.getByLabelText(/full name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'short');
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows error for invalid email format', async () => {
    renderWithRouter(<Register />);
    await userEvent.type(screen.getByLabelText(/full name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'bademail');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe('CategoryForm Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error for empty name on submit', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    render(<CategoryForm onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText('Category name is required')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe('SupplierForm Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows errors for all empty required fields', async () => {
    render(<SupplierForm onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Contact email is required')).toBeInTheDocument();
    expect(screen.getByText('Lead time is required')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows error for invalid email format', async () => {
    render(<SupplierForm onClose={vi.fn()} onSuccess={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/name/i), 'Acme Corp');
    await userEvent.type(screen.getByLabelText(/contact email/i), 'bademail');
    await userEvent.type(screen.getByLabelText(/lead time/i), '5');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe('ProductForm Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { data: [] } });
  });

  it('shows errors for all empty required fields', async () => {
    render(<ProductForm onClose={vi.fn()} onSuccess={vi.fn()} />);
    // Wait for categories/suppliers to load
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText('Product name is required')).toBeInTheDocument();
    expect(screen.getByText('SKU is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
    expect(screen.getByText('Quantity is required')).toBeInTheDocument();
    expect(screen.getByText('Unit price is required')).toBeInTheDocument();
    expect(screen.getByText('Supplier is required')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe('TransactionForm Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { data: { products: [] } } });
  });

  it('shows error for missing product on submit', async () => {
    render(<TransactionForm onClose={vi.fn()} onSuccess={vi.fn()} />);
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    await userEvent.type(screen.getByLabelText(/quantity/i), '10');
    fireEvent.click(screen.getByRole('button', { name: /record/i }));

    expect(screen.getByText('Product is required')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
});
