const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');

// POST /api/transactions
const createTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { product: productId, type, quantity, notes } = req.body;

    if (!productId || !type || quantity === undefined) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 'product, type, and quantity are required', 400);
    }

    const validTypes = ['stock-in', 'stock-out', 'adjustment'];
    if (!validTypes.includes(type)) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, `type must be one of: ${validTypes.join(', ')}`, 400);
    }

    if (quantity < 0) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 'quantity cannot be negative', 400);
    }

    if (type === 'stock-in' && quantity <= 0) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 'stock-in quantity must be greater than 0', 400);
    }

    const product = await Product.findOne({ _id: productId, isDeleted: false }).session(session);
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 'Product not found', 404);
    }

    const previousQuantity = product.quantity;
    let newQuantity;
    let delta;

    if (type === 'stock-in') {
      newQuantity = previousQuantity + quantity;
      delta = quantity;
    } else if (type === 'stock-out') {
      if (quantity > previousQuantity) {
        await session.abortTransaction();
        session.endSession();
        return sendError(
          res,
          `Insufficient stock. Current stock: ${previousQuantity}, requested: ${quantity}`,
          400
        );
      }
      newQuantity = previousQuantity - quantity;
      delta = -quantity;
    } else {
      // adjustment
      newQuantity = quantity;
      delta = quantity - previousQuantity;
    }

    await Product.findByIdAndUpdate(productId, { quantity: newQuantity }, { session });

    const [transaction] = await Transaction.create(
      [
        {
          product: productId,
          type,
          quantity,
          previousQuantity,
          delta,
          performedBy: req.user.id,
          notes: notes || '',
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const populated = await Transaction.findById(transaction._id)
      .populate('product', 'name sku')
      .populate('performedBy', 'name email');

    return sendSuccess(res, populated, 'Transaction recorded successfully', 201);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// GET /api/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, product, type, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (product) filter.product = product;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('product', 'name sku')
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      { transactions, total, page: parseInt(page), limit: parseInt(limit) },
      'Transactions retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { createTransaction, getTransactions };
