const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const { sendSuccess } = require('../utils/response');

const getLast30Days = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  date.setHours(0, 0, 0, 0);
  return date;
};

// GET /api/dashboard/summary
const getSummary = async (req, res, next) => {
  try {
    const since30 = getLast30Days();

    const [productsAgg, recentTxCount] = await Promise.all([
      Product.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStockValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
            lowStockCount: {
              $sum: {
                $cond: [{ $lt: ['$quantity', '$reorderThreshold'] }, 1, 0],
              },
            },
          },
        },
      ]),
      Transaction.countDocuments({ createdAt: { $gte: since30 } }),
    ]);

    const summary = productsAgg[0] || { totalProducts: 0, totalStockValue: 0, lowStockCount: 0 };

    return sendSuccess(
      res,
      {
        totalProducts: summary.totalProducts,
        totalStockValue: Math.round(summary.totalStockValue * 100) / 100,
        lowStockCount: summary.lowStockCount,
        recentTransactions: recentTxCount,
      },
      'Dashboard summary retrieved'
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/top-products
const getTopProducts = async (req, res, next) => {
  try {
    const since30 = getLast30Days();

    const top = await Transaction.aggregate([
      { $match: { type: 'stock-out', createdAt: { $gte: since30 } } },
      { $group: { _id: '$product', totalOutbound: { $sum: '$quantity' } } },
      { $sort: { totalOutbound: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: '$product.name',
          sku: '$product.sku',
          totalOutbound: 1,
        },
      },
    ]);

    return sendSuccess(res, top, 'Top products retrieved');
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/stock-movement
const getStockMovement = async (req, res, next) => {
  try {
    const since30 = getLast30Days();

    const movements = await Transaction.aggregate([
      {
        $match: {
          type: { $in: ['stock-in', 'stock-out'] },
          createdAt: { $gte: since30 },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type',
          },
          total: { $sum: '$quantity' },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Build a map of date → { stockIn, stockOut }
    const map = {};
    movements.forEach(({ _id, total }) => {
      if (!map[_id.date]) map[_id.date] = { date: _id.date, stockIn: 0, stockOut: 0 };
      if (_id.type === 'stock-in') map[_id.date].stockIn = total;
      else map[_id.date].stockOut = total;
    });

    // Fill in all 30 days (even empty ones)
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push(map[dateStr] || { date: dateStr, stockIn: 0, stockOut: 0 });
    }

    return sendSuccess(res, result, 'Stock movement retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getTopProducts, getStockMovement };
