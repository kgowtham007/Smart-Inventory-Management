const Supplier = require('../models/Supplier');
const { sendSuccess, sendError } = require('../utils/response');

// POST /api/suppliers
const createSupplier = async (req, res, next) => {
  try {
    const { name, contactEmail, phone, leadTimeDays } = req.body;

    if (!name || !contactEmail || leadTimeDays === undefined) {
      return sendError(res, 'Name, contactEmail, and leadTimeDays are required', 400);
    }

    const existing = await Supplier.findOne({ contactEmail: contactEmail.toLowerCase() });
    if (existing) {
      return sendError(res, 'A supplier with this contact email already exists', 409);
    }

    const supplier = await Supplier.create({ name, contactEmail: contactEmail.toLowerCase(), phone, leadTimeDays });
    return sendSuccess(res, supplier, 'Supplier created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/suppliers
const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ isDeleted: false }).sort({ name: 1 });
    return sendSuccess(res, suppliers, 'Suppliers retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /api/suppliers/:id
const updateSupplier = async (req, res, next) => {
  try {
    const { name, contactEmail, phone, leadTimeDays } = req.body;

    if (contactEmail) {
      const existing = await Supplier.findOne({
        contactEmail: contactEmail.toLowerCase(),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return sendError(res, 'A supplier with this contact email already exists', 409);
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (contactEmail !== undefined) updates.contactEmail = contactEmail.toLowerCase();
    if (phone !== undefined) updates.phone = phone;
    if (leadTimeDays !== undefined) updates.leadTimeDays = leadTimeDays;

    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return sendError(res, 'Supplier not found', 404);
    }

    return sendSuccess(res, supplier, 'Supplier updated successfully');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/suppliers/:id
const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!supplier) {
      return sendError(res, 'Supplier not found', 404);
    }

    return sendSuccess(res, null, 'Supplier deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { createSupplier, getSuppliers, updateSupplier, deleteSupplier };
