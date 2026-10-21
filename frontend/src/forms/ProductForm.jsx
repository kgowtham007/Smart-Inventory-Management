import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';

const ProductForm = ({ initial = null, onClose, onSuccess }) => {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name || '',
    sku: initial?.sku || '',
    category: initial?.category?._id || initial?.category || '',
    quantity: initial?.quantity ?? '',
    unitPrice: initial?.unitPrice ?? '',
    reorderThreshold: initial?.reorderThreshold ?? '',
    supplier: initial?.supplier?._id || initial?.supplier || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catRes, supRes] = await Promise.all([
          api.get('/api/categories'),
          api.get('/api/suppliers'),
        ]);
        setCategories(catRes.data.data || []);
        setSuppliers(supRes.data.data || []);
      } catch {
        toast.error('Failed to load options');
      }
    };
    fetchOptions();
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.sku.trim()) errs.sku = 'SKU is required';
    if (!form.category) errs.category = 'Category is required';
    if (form.quantity === '' || form.quantity === undefined) errs.quantity = 'Quantity is required';
    else if (parseInt(form.quantity) < 0) errs.quantity = 'Quantity cannot be negative';
    if (!form.unitPrice) errs.unitPrice = 'Unit price is required';
    else if (parseFloat(form.unitPrice) <= 0) errs.unitPrice = 'Unit price must be greater than 0';
    if (form.reorderThreshold === '' || form.reorderThreshold === undefined) errs.reorderThreshold = 'Reorder threshold is required';
    else if (parseInt(form.reorderThreshold) < 0) errs.reorderThreshold = 'Reorder threshold cannot be negative';
    if (!form.supplier) errs.supplier = 'Supplier is required';
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
    const payload = {
      ...form,
      quantity: parseInt(form.quantity),
      unitPrice: parseFloat(form.unitPrice),
      reorderThreshold: parseInt(form.reorderThreshold),
    };

    try {
      if (isEdit) {
        await api.put(`/api/products/${initial._id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/api/products', payload);
        toast.success('Product created');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field] ? 'border-red-500' : 'border-gray-300'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl my-4">
        <h2 className="mb-4 text-lg font-bold text-gray-800">{isEdit ? 'Edit Product' : 'New Product'}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Name */}
            <div className="sm:col-span-2">
              <label htmlFor="prod-name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input id="prod-name" name="name" value={form.name} onChange={handleChange} className={inputClass('name')} aria-describedby={errors.name ? 'prod-name-error' : undefined} />
              {errors.name && <p id="prod-name-error" className="mt-1 text-xs text-red-600" role="alert">{errors.name}</p>}
            </div>
            {/* SKU */}
            <div>
              <label htmlFor="prod-sku" className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input id="prod-sku" name="sku" value={form.sku} onChange={handleChange} className={inputClass('sku')} aria-describedby={errors.sku ? 'prod-sku-error' : undefined} />
              {errors.sku && <p id="prod-sku-error" className="mt-1 text-xs text-red-600" role="alert">{errors.sku}</p>}
            </div>
            {/* Unit Price */}
            <div>
              <label htmlFor="prod-price" className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($) *</label>
              <input id="prod-price" name="unitPrice" type="number" step="0.01" min="0.01" value={form.unitPrice} onChange={handleChange} className={inputClass('unitPrice')} aria-describedby={errors.unitPrice ? 'prod-price-error' : undefined} />
              {errors.unitPrice && <p id="prod-price-error" className="mt-1 text-xs text-red-600" role="alert">{errors.unitPrice}</p>}
            </div>
            {/* Quantity */}
            <div>
              <label htmlFor="prod-qty" className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input id="prod-qty" name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={handleChange} className={inputClass('quantity')} aria-describedby={errors.quantity ? 'prod-qty-error' : undefined} />
              {errors.quantity && <p id="prod-qty-error" className="mt-1 text-xs text-red-600" role="alert">{errors.quantity}</p>}
            </div>
            {/* Reorder Threshold */}
            <div>
              <label htmlFor="prod-threshold" className="block text-sm font-medium text-gray-700 mb-1">Reorder Threshold *</label>
              <input id="prod-threshold" name="reorderThreshold" type="number" min="0" step="1" value={form.reorderThreshold} onChange={handleChange} className={inputClass('reorderThreshold')} aria-describedby={errors.reorderThreshold ? 'prod-threshold-error' : undefined} />
              {errors.reorderThreshold && <p id="prod-threshold-error" className="mt-1 text-xs text-red-600" role="alert">{errors.reorderThreshold}</p>}
            </div>
            {/* Category */}
            <div>
              <label htmlFor="prod-cat" className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select id="prod-cat" name="category" value={form.category} onChange={handleChange} className={inputClass('category')} aria-describedby={errors.category ? 'prod-cat-error' : undefined}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.category && <p id="prod-cat-error" className="mt-1 text-xs text-red-600" role="alert">{errors.category}</p>}
            </div>
            {/* Supplier */}
            <div>
              <label htmlFor="prod-sup" className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              <select id="prod-sup" name="supplier" value={form.supplier} onChange={handleChange} className={inputClass('supplier')} aria-describedby={errors.supplier ? 'prod-sup-error' : undefined}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              {errors.supplier && <p id="prod-sup-error" className="mt-1 text-xs text-red-600" role="alert">{errors.supplier}</p>}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
