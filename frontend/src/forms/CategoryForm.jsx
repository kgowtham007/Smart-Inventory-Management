import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';

const CategoryForm = ({ initial = null, onClose, onSuccess }) => {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Category name is required';
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
      if (isEdit) {
        await api.put(`/api/categories/${initial._id}`, form);
        toast.success('Category updated');
      } else {
        await api.post('/api/categories', form);
        toast.success('Category created');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">{isEdit ? 'Edit Category' : 'New Category'}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="cat-name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              id="cat-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              aria-describedby={errors.name ? 'cat-name-error' : undefined}
            />
            {errors.name && <p id="cat-name-error" className="mt-1 text-xs text-red-600" role="alert">{errors.name}</p>}
          </div>
          <div className="mb-6">
            <label htmlFor="cat-desc" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="cat-desc"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3">
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

export default CategoryForm;
