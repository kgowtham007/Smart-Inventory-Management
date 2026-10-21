const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Category = require('../../models/Category');
const Supplier = require('../../models/Supplier');
const Product = require('../../models/Product');
const Transaction = require('../../models/Transaction');

/**
 * Connect to the in-memory MongoDB
 */
const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
};

/**
 * Disconnect and clean up
 */
const disconnectDB = async () => {
  await mongoose.disconnect();
};

/**
 * Clear all collections between tests
 */
const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Create a user and return token + user object
 */
const createUser = async (overrides = {}) => {
  const defaults = {
    name: 'Test User',
    email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'password123',
    role: 'clerk',
  };
  const data = { ...defaults, ...overrides };
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await User.create({ name: data.name, email: data.email, passwordHash, role: data.role });
  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  return { user, token };
};

/**
 * Create tokens for different roles
 */
const createAdmin = (overrides = {}) => createUser({ role: 'admin', email: `admin-${Date.now()}@example.com`, ...overrides });
const createManager = (overrides = {}) => createUser({ role: 'manager', email: `manager-${Date.now()}@example.com`, ...overrides });
const createClerk = (overrides = {}) => createUser({ role: 'clerk', email: `clerk-${Date.now()}@example.com`, ...overrides });

/**
 * Create a category
 */
const createCategory = async (name = `Category-${Date.now()}`) => {
  return Category.create({ name });
};

/**
 * Create a supplier
 */
const createSupplier = async (overrides = {}) => {
  return Supplier.create({
    name: 'Test Supplier',
    contactEmail: `supplier-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    leadTimeDays: 5,
    ...overrides,
  });
};

/**
 * Create a product
 */
const createProduct = async (categoryId, supplierId, overrides = {}) => {
  return Product.create({
    name: 'Test Product',
    sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2).toUpperCase()}`,
    category: categoryId,
    quantity: 100,
    unitPrice: 9.99,
    reorderThreshold: 10,
    supplier: supplierId,
    ...overrides,
  });
};

module.exports = {
  connectDB,
  disconnectDB,
  clearDB,
  createUser,
  createAdmin,
  createManager,
  createClerk,
  createCategory,
  createSupplier,
  createProduct,
};
