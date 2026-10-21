const { validationResult } = require('express-validator');
const Supplier = require('../models/Supplier');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/suppliers
 * Manager/Admin: create a supplier
 */
const createSupplier = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, errors.array().map((e) => e.msg).join(', '));
    }

    const { name, contactEmail, phone, leadTimeDays } = req.body;

    // Check for duplicate email
    const existing = await Supplier.findOne({ contactEmail: contactEmail.toLowerCase() });
    if (existing) {
      return sendError(res, 409, 'Contact email already in use');
    }

    const supplier = await Supplier.create({
      name,
      contactEmail: contactEmail.toLowerCase(),
      phone,
      leadTimeDays,
    });

    return sendSuccess(res, 201, supplier, 'Supplier created successfully');
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 409, 'Contact email already in use');
    }
    next(err);
  }
};

/**
 * GET /api/suppliers
 * All authenticated: list non-deleted suppliers
 */
const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ isDeleted: false }).sort({ name: 1 });
    return sendSuccess(res, 200, suppliers, 'Suppliers retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/suppliers/:id
 * Manager/Admin: update supplier fields
 */
const updateSupplier = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, errors.array().map((e) => e.msg).join(', '));
    }

    const { id } = req.params;
    const { name, contactEmail, phone, leadTimeDays } = req.body;

    const supplier = await Supplier.findOne({ _id: id, isDeleted: false });
    if (!supplier) {
      return sendError(res, 404, 'Supplier not found');
    }

    // Check email uniqueness if changing
    if (contactEmail && contactEmail.toLowerCase() !== supplier.contactEmail) {
      const existing = await Supplier.findOne({
        contactEmail: contactEmail.toLowerCase(),
        _id: { $ne: id },
      });
      if (existing) {
        return sendError(res, 409, 'Contact email already in use');
      }
    }

    if (name !== undefined) supplier.name = name;
    if (contactEmail !== undefined) supplier.contactEmail = contactEmail.toLowerCase();
    if (phone !== undefined) supplier.phone = phone;
    if (leadTimeDays !== undefined) supplier.leadTimeDays = leadTimeDays;

    await supplier.save();

    return sendSuccess(res, 200, supplier, 'Supplier updated successfully');
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 409, 'Contact email already in use');
    }
    next(err);
  }
};

/**
 * DELETE /api/suppliers/:id
 * Manager/Admin: soft-delete a supplier
 */
const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findOne({ _id: id, isDeleted: false });
    if (!supplier) {
      return sendError(res, 404, 'Supplier not found');
    }

    supplier.isDeleted = true;
    await supplier.save();

    return sendSuccess(res, 200, null, 'Supplier deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { createSupplier, getSuppliers, updateSupplier, deleteSupplier };
