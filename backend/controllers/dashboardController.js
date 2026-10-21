const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const { sendSuccess } = require('../utils/response');

const thirtyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
};

/**
 * GET /api/dashboard/summary
 * Manager/Admin: key inventory metrics
 */
const getSummary = async (req, res, next) => {
  try {
    const since = thirtyDaysAgo();

    const [products, transactionCount] = await Promise.all([
      Product.find({ isDeleted: false }),
      Transaction.countDocuments({ createdAt: { $gte: since } }),
    ]);

    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
    const lowStockCount = products.filter((p) => p.quantity < p.reorderThreshold).length;

    return sendSuccess(
      res,
      200,
      {
        totalProducts,
        totalStockValue,
        lowStockCount,
        recentTransactions: transactionCount,
      },
      'Dashboard summary retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/top-products
 * Manager/Admin: top 5 products by outbound volume (last 30 days)
 */
const getTopProducts = async (req, res, next) => {
  try {
    const since = thirtyDaysAgo();

    const topProducts = await Transaction.aggregate([
      {
        $match: {
          type: 'stock-out',
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: '$product',
          totalOutbound: { $sum: '$quantity' },
        },
      },
      { $sort: { totalOutbound: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $project: {
          product: { $arrayElemAt: ['$productInfo', 0] },
          totalOutbound: 1,
        },
      },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          productSku: '$product.sku',
          totalOutbound: 1,
        },
      },
    ]);

    return sendSuccess(res, 200, topProducts, 'Top products retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/stock-movement
 * Manager/Admin: daily stock-in/out totals for last 30 days
 */
const getStockMovement = async (req, res, next) => {
  try {
    const since = thirtyDaysAgo();

    const movements = await Transaction.aggregate([
      {
        $match: {
          type: { $in: ['stock-in', 'stock-out'] },
          createdAt: { $gte: since },
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
      {
        $group: {
          _id: '$_id.date',
          stockIn: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'stock-in'] }, '$total', 0],
            },
          },
          stockOut: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'stock-out'] }, '$total', 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          stockIn: 1,
          stockOut: 1,
        },
      },
    ]);

    return sendSuccess(res, 200, movements, 'Stock movement data retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getTopProducts, getStockMovement };
