import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * StockMovementChart - Recharts bar chart with grouped bars for stockIn/stockOut
 * over the last 30 days
 */
const StockMovementChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 text-sm">
        No stock movement data for the last 30 days
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
        aria-label="Stock movement chart for the last 30 days"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickFormatter={(v) => v.slice(5)} // Show MM-DD
        />
        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="stockIn" name="Stock In" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="stockOut" name="Stock Out" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default StockMovementChart;
