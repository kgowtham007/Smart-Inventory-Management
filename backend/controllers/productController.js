const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/products
 * Manager/Admin: create a product
 */
const createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, errors.array().map((e) => e.msg).join(', '));
    }

    const { name, sku, category, quantity, unitPrice, reorderThreshold, supplier } = req.body;

    // Check for duplicate SKU
    const existing = await Product.findOne({ sku: sku.toUpperCase() });
    if (existing) {
      return sendError(res, 409, 'SKU already exists');
    }

    const product = await Product.create({
      name,
      sku: sku.toUpperCase(),
      category,
      quantity,
      unitPrice,
      reorderThreshold,
      supplier,
    });

    const populated = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('supplier', 'name');

    return sendSuccess(res, 201, populated, 'Product created successfully');
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 409, 'SKU already exists');
    }
    next(err);
  }
};

/**
 * GET /api/products
 * All authenticated: paginated list with optional filters
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      supplier,
      lowStock,
    } = req.query;

    const query = { isDeleted: false };

    if (category) query.category = category;
    if (supplier) query.supplier = supplier;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let products = await Product.find(query)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Filter by lowStock after population (virtual field)
    if (lowStock === 'true') {
      products = products.filter((p) => p.lowStock);
    }

    const total = lowStock === 'true'
      ? products.length
      : await Product.countDocuments(query);

    return sendSuccess(
      res,
      200,
      { products, total, page: parseInt(page), limit: parseInt(limit) },
      'Products retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id
 * All authenticated: single product with populated refs
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, isDeleted: false })
      .populate('category', 'name description')
      .populate('supplier', 'name contactEmail phone leadTimeDays');

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    return sendSuccess(res, 200, product, 'Product retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/products/:id
 * Manager/Admin: update a product
 */
const updateProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, errors.array().map((e) => e.msg).join(', '));
    }

    const { id } = req.params;
    const { name, sku, category, quantity, unitPrice, reorderThreshold, supplier } = req.body;

    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    // Check SKU uniqueness if changing
    if (sku && sku.toUpperCase() !== product.sku) {
      const existing = await Product.findOne({ sku: sku.toUpperCase(), _id: { $ne: id } });
      if (existing) {
        return sendError(res, 409, 'SKU already exists');
      }
    }

    if (name !== undefined) product.name = name;
    if (sku !== undefined) product.sku = sku.toUpperCase();
    if (category !== undefined) product.category = category;
    if (quantity !== undefined) product.quantity = quantity;
    if (unitPrice !== undefined) product.unitPrice = unitPrice;
    if (reorderThreshold !== undefined) product.reorderThreshold = reorderThreshold;
    if (supplier !== undefined) product.supplier = supplier;

    await product.save();

    const updated = await Product.findById(id)
      .populate('category', 'name')
      .populate('supplier', 'name');

    return sendSuccess(res, 200, updated, 'Product updated successfully');
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 409, 'SKU already exists');
    }
    next(err);
  }
};

/**
 * DELETE /api/products/:id
 * Manager/Admin: soft-delete a product
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    product.isDeleted = true;
    await product.save();

    return sendSuccess(res, 200, null, 'Product deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };
