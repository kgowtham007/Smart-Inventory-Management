const Category = require('../models/Category');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');

// POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return sendError(res, 'Category name is required', 400);
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return sendError(res, 'Category name already exists', 409);
    }

    const category = await Category.create({ name: name.trim(), description });
    return sendSuccess(res, category, 'Category created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return sendSuccess(res, categories, 'Categories retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (name) {
      const existing = await Category.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
      if (existing) {
        return sendError(res, 'Category name already exists', 409);
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name: name.trim() }), ...(description !== undefined && { description }) },
      { new: true, runValidators: true }
    );

    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    return sendSuccess(res, category, 'Category updated successfully');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    const productCount = await Product.countDocuments({ category: req.params.id, isDeleted: false });
    if (productCount > 0) {
      return sendError(
        res,
        `Cannot delete category: ${productCount} product(s) are assigned to it`,
        400
      );
    }

    await Category.findByIdAndDelete(req.params.id);
    return sendSuccess(res, null, 'Category deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };
