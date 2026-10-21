import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import DataTable from '../components/ui/DataTable';
import TransactionForm from '../forms/TransactionForm';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ type: '', startDate: '', endDate: '' });
  const limit = 15;

  const fetchTransactions = async (pg = page) => {
    setLoading(true);
    try {
      const params = { page: pg, limit };
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const { data } = await api.get('/api/transactions', { params });
      setTransactions(data.data?.transactions || []);
      setTotal(data.data?.total || 0);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(page); }, [page, filters]);

  const typeBadge = (type) => {
    const map = {
      'stock-in': 'bg-green-100 text-green-700',
      'stock-out': 'bg-red-100 text-red-700',
      'adjustment': 'bg-yellow-100 text-yellow-700',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[type] || ''}`}>
        {type}
      </span>
    );
  };

  const columns = [
    { key: 'product', label: 'Product', render: (row) => row.product?.name || '—' },
    { key: 'type', label: 'Type', render: (row) => typeBadge(row.type) },
    { key: 'quantity', label: 'Qty' },
    { key: 'previousQuantity', label: 'Prev Qty' },
    { key: 'delta', label: 'Delta', render: (row) => (
      <span className={row.delta >= 0 ? 'text-green-600' : 'text-red-600'}>
        {row.delta >= 0 ? '+' : ''}{row.delta}
      </span>
    )},
    { key: 'performedBy', label: 'By', render: (row) => row.performedBy?.name || '—' },
    { key: 'createdAt', label: 'Date', render: (row) => new Date(row.createdAt).toLocaleString() },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Transactions</h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          + Record Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-200">
        <select
          value={filters.type}
          onChange={(e) => { setFilters((f) => ({ ...f, type: e.target.value })); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All types</option>
          <option value="stock-in">Stock In</option>
          <option value="stock-out">Stock Out</option>
          <option value="adjustment">Adjustment</option>
        </select>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => { setFilters((f) => ({ ...f, startDate: e.target.value })); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Start date"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => { setFilters((f) => ({ ...f, endDate: e.target.value })); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="End date"
        />
        <button
          onClick={() => { setFilters({ type: '', startDate: '', endDate: '' }); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No transactions found"
      />

      {showForm && (
        <TransactionForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); fetchTransactions(page); }}
        />
      )}
    </div>
  );
};

export default Transactions;
