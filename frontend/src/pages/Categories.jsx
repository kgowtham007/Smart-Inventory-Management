import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import CategoryForm from '../forms/CategoryForm';
import RoleGuard from '../components/RoleGuard';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/api/categories');
      setCategories(data.data || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/api/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const openEdit = (cat) => { setEditTarget(cat); setShowForm(true); };
  const openCreate = () => { setEditTarget(null); setShowForm(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Categories</h2>
        <RoleGuard roles={['manager', 'admin']}>
          <button
            onClick={openCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            + New Category
          </button>
        </RoleGuard>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.length === 0 ? (
                <tr><td colSpan={3} className="py-8 text-center text-gray-400">No categories found</td></tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{cat.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{cat.description || '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <RoleGuard roles={['manager', 'admin']}>
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(cat)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(cat._id)} className="text-red-600 hover:underline text-xs font-medium">Delete</button>
                        </div>
                      </RoleGuard>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CategoryForm
          initial={editTarget}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); fetchCategories(); }}
        />
      )}
    </div>
  );
};

export default Categories;
