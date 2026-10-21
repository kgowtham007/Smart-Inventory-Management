const { validationResult } = require('express-validator');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/categories
 * Manager/Admin: create a category
 */
const createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, errors.array().map((e) => e.msg).join(', '));
    }

    const { name, description } = req.body;

    // Check for duplicate name
    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return sendError(res, 409, 'Category name already exists');
    }

    const category = await Category.create({ name, description });

    return sendSuccess(res, 201, category, 'Category created successfully');
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 409, 'Category name already exists');
    }
    next(err);
  }
};

/**
 * GET /api/categories
 * All authenticated: list all categories
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    return sendSuccess(res, 200, categories, 'Categories retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/categories/:id
 * Manager/Admin: update a category
 */
const updateCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, errors.array().map((e) => e.msg).join(', '));
    }

    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    // Check name uniqueness if changing
    if (name && name !== category.name) {
      const existing = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id },
      });
      if (existing) {
        return sendError(res, 409, 'Category name already exists');
      }
    }

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;

    await category.save();

    return sendSuccess(res, 200, category, 'Category updated successfully');
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 409, 'Category name already exists');
    }
    next(err);
  }
};

/**
 * DELETE /api/categories/:id
 * Manager/Admin: delete a category (blocked if products exist)
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    // Check for associated non-deleted products
    const productCount = await Product.countDocuments({ category: id, isDeleted: false });
    if (productCount > 0) {
      return sendError(
        res,
        400,
        `Cannot delete category: ${productCount} product(s) are assigned to it`
      );
    }

    await Category.findByIdAndDelete(id);

    return sendSuccess(res, 200, null, 'Category deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };
