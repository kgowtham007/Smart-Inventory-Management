import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';

const TransactionForm = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    product: '',
    type: 'stock-in',
    quantity: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/api/products?limit=100');
        setProducts(data.data?.products || []);
      } catch {
        toast.error('Failed to load products');
      }
    };
    fetchProducts();
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.product) errs.product = 'Product is required';
    if (!form.type) errs.type = 'Transaction type is required';
    if (form.quantity === '' || form.quantity === undefined) errs.quantity = 'Quantity is required';
    else if (parseInt(form.quantity) < 0) errs.quantity = 'Quantity cannot be negative';
    else if (form.type !== 'adjustment' && parseInt(form.quantity) <= 0) errs.quantity = 'Quantity must be positive';
    return errs;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await api.post('/api/transactions', {
        ...form,
        quantity: parseInt(form.quantity),
      });
      toast.success('Transaction recorded');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record transaction');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field] ? 'border-red-500' : 'border-gray-300'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">Record Transaction</h2>
        <form onSubmit={handleSubmit} noValidate>
          {/* Product */}
          <div className="mb-4">
            <label htmlFor="txn-product" className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
            <select id="txn-product" name="product" value={form.product} onChange={handleChange} className={inputClass('product')} aria-describedby={errors.product ? 'txn-product-error' : undefined}>
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.sku}) — qty: {p.quantity}</option>
              ))}
            </select>
            {errors.product && <p id="txn-product-error" className="mt-1 text-xs text-red-600" role="alert">{errors.product}</p>}
          </div>

          {/* Type */}
          <div className="mb-4">
            <label htmlFor="txn-type" className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select id="txn-type" name="type" value={form.type} onChange={handleChange} className={inputClass('type')}>
              <option value="stock-in">Stock In</option>
              <option value="stock-out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <label htmlFor="txn-qty" className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input
              id="txn-qty"
              name="quantity"
              type="number"
              min="0"
              step="1"
              value={form.quantity}
              onChange={handleChange}
              className={inputClass('quantity')}
              aria-describedby={errors.quantity ? 'txn-qty-error' : undefined}
            />
            {errors.quantity && <p id="txn-qty-error" className="mt-1 text-xs text-red-600" role="alert">{errors.quantity}</p>}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="txn-notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea id="txn-notes" name="notes" value={form.notes} onChange={handleChange} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {loading ? 'Recording...' : 'Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
