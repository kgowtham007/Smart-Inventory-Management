import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import MetricCard from '../components/ui/MetricCard';
import StockMovementChart from '../components/charts/StockMovementChart';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [movement, setMovement] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sumRes, movRes, lowRes, topRes] = await Promise.all([
          api.get('/api/dashboard/summary'),
          api.get('/api/dashboard/stock-movement'),
          api.get('/api/products?lowStock=true&limit=10'),
          api.get('/api/dashboard/top-products'),
        ]);
        setSummary(sumRes.data.data);
        setMovement(movRes.data.data || []);
        setLowStockProducts(lowRes.data.data?.products || []);
        setTopProducts(topRes.data.data || []);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-400 py-16">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Products"
          value={summary?.totalProducts}
          color="blue"
        />
        <MetricCard
          title="Total Stock Value"
          value={summary?.totalStockValue !== undefined ? `$${summary.totalStockValue.toFixed(2)}` : '—'}
          color="green"
        />
        <MetricCard
          title="Low Stock Items"
          value={summary?.lowStockCount}
          color="red"
        />
        <MetricCard
          title="Transactions (30d)"
          value={summary?.recentTransactions}
          color="purple"
        />
      </div>

      {/* Stock movement chart */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
        <h3 className="mb-4 text-base font-semibold text-gray-700">Stock Movement (Last 30 Days)</h3>
        <StockMovementChart data={movement} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low stock alert */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="mb-4 text-base font-semibold text-gray-700">Low Stock Alerts</h3>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-400">No low stock items</p>
          ) : (
            <ul className="space-y-2">
              {lowStockProducts.map((p) => (
                <li key={p._id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm">
                  <span className="font-medium text-red-700">{p.name}</span>
                  <span className="text-red-500">
                    {p.quantity} / {p.reorderThreshold} (threshold)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top products */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="mb-4 text-base font-semibold text-gray-700">Top Products by Outbound (30d)</h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">No outbound activity</p>
          ) : (
            <ol className="space-y-2">
              {topProducts.map((p, i) => (
                <li key={p.productId || i} className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm">
                  <span className="font-medium text-blue-700">
                    {i + 1}. {p.productName || 'Unknown'}
                  </span>
                  <span className="text-blue-500">{p.totalOutbound} units</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
