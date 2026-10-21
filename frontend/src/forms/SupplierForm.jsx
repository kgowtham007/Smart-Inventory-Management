import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';

const SupplierForm = ({ initial = null, onClose, onSuccess }) => {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name || '',
    contactEmail: initial?.contactEmail || '',
    phone: initial?.phone || '',
    leadTimeDays: initial?.leadTimeDays ?? '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.contactEmail) errs.contactEmail = 'Contact email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.contactEmail)) errs.contactEmail = 'Enter a valid email';
    if (form.leadTimeDays === '' || form.leadTimeDays === undefined) errs.leadTimeDays = 'Lead time is required';
    else if (parseInt(form.leadTimeDays) < 0) errs.leadTimeDays = 'Lead time cannot be negative';
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
      const payload = { ...form, leadTimeDays: parseInt(form.leadTimeDays) };
      if (isEdit) {
        await api.put(`/api/suppliers/${initial._id}`, payload);
        toast.success('Supplier updated');
      } else {
        await api.post('/api/suppliers', payload);
        toast.success('Supplier created');
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

  const fields = [
    { id: 'name', label: 'Name *', type: 'text' },
    { id: 'contactEmail', label: 'Contact Email *', type: 'email' },
    { id: 'phone', label: 'Phone', type: 'tel' },
    { id: 'leadTimeDays', label: 'Lead Time (days) *', type: 'number' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">{isEdit ? 'Edit Supplier' : 'New Supplier'}</h2>
        <form onSubmit={handleSubmit} noValidate>
          {fields.map(({ id, label, type }) => (
            <div key={id} className="mb-4">
              <label htmlFor={`sup-${id}`} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                id={`sup-${id}`}
                name={id}
                type={type}
                value={form[id]}
                onChange={handleChange}
                min={type === 'number' ? 0 : undefined}
                className={inputClass(id)}
                aria-describedby={errors[id] ? `sup-${id}-error` : undefined}
              />
              {errors[id] && <p id={`sup-${id}-error`} className="mt-1 text-xs text-red-600" role="alert">{errors[id]}</p>}
            </div>
          ))}
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

export default SupplierForm;
