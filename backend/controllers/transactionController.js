const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/transactions
 * Clerk/Manager/Admin: record a stock transaction atomically
 */
const createTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 400, errors.array().map((e) => e.msg).join(', '));
    }

    const { product: productId, type, quantity, notes } = req.body;

    // Fetch product within session
    const product = await Product.findOne({ _id: productId, isDeleted: false }).session(session);
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 404, 'Product not found');
    }

    const previousQuantity = product.quantity;
    let newQuantity;
    let delta;

    switch (type) {
      case 'stock-in':
        if (quantity <= 0) {
          await session.abortTransaction();
          session.endSession();
          return sendError(res, 400, 'Quantity must be positive for stock-in');
        }
        newQuantity = previousQuantity + quantity;
        delta = quantity;
        break;

      case 'stock-out':
        if (quantity <= 0) {
          await session.abortTransaction();
          session.endSession();
          return sendError(res, 400, 'Quantity must be positive for stock-out');
        }
        if (quantity > previousQuantity) {
          await session.abortTransaction();
          session.endSession();
          return sendError(
            res,
            400,
            `Insufficient stock: requested ${quantity}, available ${previousQuantity}`
          );
        }
        newQuantity = previousQuantity - quantity;
        delta = -quantity;
        break;

      case 'adjustment':
        if (quantity < 0) {
          await session.abortTransaction();
          session.endSession();
          return sendError(res, 400, 'Adjustment quantity cannot be negative');
        }
        newQuantity = quantity;
        delta = quantity - previousQuantity;
        break;

      default:
        await session.abortTransaction();
        session.endSession();
        return sendError(res, 400, 'Invalid transaction type');
    }

    // Update product quantity atomically
    await Product.findByIdAndUpdate(
      productId,
      { $set: { quantity: newQuantity } },
      { session }
    );

    // Create transaction record
    const [transaction] = await Transaction.create(
      [
        {
          product: productId,
          type,
          quantity,
          previousQuantity,
          delta,
          performedBy: req.user.id,
          notes,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const populated = await Transaction.findById(transaction._id)
      .populate('product', 'name sku')
      .populate('performedBy', 'name email');

    return sendSuccess(res, 201, populated, 'Transaction recorded successfully');
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

/**
 * GET /api/transactions
 * All authenticated: paginated list with optional filters
 */
const getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      product,
      type,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (product) query.product = product;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('product', 'name sku')
        .populate('performedBy', 'name email')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Transaction.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      200,
      { transactions, total, page: parseInt(page), limit: parseInt(limit) },
      'Transactions retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { createTransaction, getTransactions };
