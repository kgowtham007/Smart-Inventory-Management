import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import DataTable from '../components/ui/DataTable';
import ProductForm from '../forms/ProductForm';
import RoleGuard from '../components/RoleGuard';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const limit = 10;

  const fetchProducts = async (pg = page) => {
    setLoading(true);
    try {
      const params = { page: pg, limit };
      if (filterLowStock) params.lowStock = 'true';
      const { data } = await api.get('/api/products', { params });
      setProducts(data.data?.products || []);
      setTotal(data.data?.total || 0);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(page); }, [page, filterLowStock]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      toast.success('Product deleted');
      fetchProducts(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const openEdit = (p) => { setEditTarget(p); setShowForm(true); };
  const openCreate = () => { setEditTarget(null); setShowForm(true); };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'sku', label: 'SKU' },
    {
      key: 'category',
      label: 'Category',
      render: (row) => row.category?.name || '—',
    },
    { key: 'quantity', label: 'Qty' },
    {
      key: 'unitPrice',
      label: 'Unit Price',
      render: (row) => `$${row.unitPrice.toFixed(2)}`,
    },
    {
      key: 'lowStock',
      label: 'Status',
      render: (row) =>
        row.lowStock ? (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            Low Stock
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            OK
          </span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <RoleGuard roles={['manager', 'admin']}>
          <div className="flex gap-2">
            <button onClick={() => openEdit(row)} className="text-blue-600 hover:underline text-xs font-medium">
              Edit
            </button>
            <button onClick={() => handleDelete(row._id)} className="text-red-600 hover:underline text-xs font-medium">
              Delete
            </button>
          </div>
        </RoleGuard>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800">Products</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={(e) => { setFilterLowStock(e.target.checked); setPage(1); }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Low stock only
          </label>
          <RoleGuard roles={['manager', 'admin']}>
            <button
              onClick={openCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              + New Product
            </button>
          </RoleGuard>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No products found"
      />

      {showForm && (
        <ProductForm
          initial={editTarget}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); fetchProducts(page); }}
        />
      )}
    </div>
  );
};

export default Products;
