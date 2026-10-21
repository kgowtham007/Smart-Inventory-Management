const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');

// POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const { name, sku, category, quantity, unitPrice, reorderThreshold, supplier } = req.body;

    if (!name || !sku || !category || !supplier) {
      return sendError(res, 'name, sku, category, and supplier are required', 400);
    }
    if (unitPrice === undefined || unitPrice <= 0) {
      return sendError(res, 'unitPrice must be greater than 0', 400);
    }
    if (quantity !== undefined && quantity < 0) {
      return sendError(res, 'quantity cannot be negative', 400);
    }

    const existing = await Product.findOne({ sku: sku.trim().toUpperCase() });
    if (existing) {
      return sendError(res, `Product with SKU "${sku}" already exists`, 409);
    }

    const product = await Product.create({
      name,
      sku: sku.trim().toUpperCase(),
      category,
      quantity: quantity || 0,
      unitPrice,
      reorderThreshold: reorderThreshold || 0,
      supplier,
    });

    const populated = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('supplier', 'name');

    return sendSuccess(res, populated, 'Product created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, supplier, lowStock } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { isDeleted: false };
    if (category) filter.category = category;
    if (supplier) filter.supplier = supplier;

    let products = await Product.find(filter)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Apply lowStock filter after population (virtual field)
    if (lowStock === 'true') {
      products = products.filter((p) => p.lowStock);
    }

    const total = await Product.countDocuments(filter);

    return sendSuccess(res, { products, total, page: parseInt(page), limit: parseInt(limit) }, 'Products retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false })
      .populate('category', 'name')
      .populate('supplier', 'name');

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    return sendSuccess(res, product, 'Product retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const { name, sku, category, quantity, unitPrice, reorderThreshold, supplier } = req.body;

    if (unitPrice !== undefined && unitPrice <= 0) {
      return sendError(res, 'unitPrice must be greater than 0', 400);
    }
    if (quantity !== undefined && quantity < 0) {
      return sendError(res, 'quantity cannot be negative', 400);
    }

    if (sku) {
      const existing = await Product.findOne({
        sku: sku.trim().toUpperCase(),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return sendError(res, `Product with SKU "${sku}" already exists`, 409);
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (sku !== undefined) updates.sku = sku.trim().toUpperCase();
    if (category !== undefined) updates.category = category;
    if (quantity !== undefined) updates.quantity = quantity;
    if (unitPrice !== undefined) updates.unitPrice = unitPrice;
    if (reorderThreshold !== undefined) updates.reorderThreshold = reorderThreshold;
    if (supplier !== undefined) updates.supplier = supplier;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    )
      .populate('category', 'name')
      .populate('supplier', 'name');

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    return sendSuccess(res, product, 'Product updated successfully');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id (soft-delete)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    return sendSuccess(res, null, 'Product deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };
