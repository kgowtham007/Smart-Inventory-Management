const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const {
  connectDB, clearDB,
  createAdmin, createManager, createClerk,
  createCategory, createSupplier, createProduct,
} = require('./setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('Role-Based Access Control', () => {
  let adminToken, managerToken, clerkToken;
  let cat, sup, product;

  beforeEach(async () => {
    const [a, m, c] = await Promise.all([createAdmin(), createManager(), createClerk()]);
    adminToken = a.token;
    managerToken = m.token;
    clerkToken = c.token;
    cat = await createCategory();
    sup = await createSupplier();
    product = await createProduct(cat._id, sup._id);
  });

  // Clerk should NOT mutate products
  it('clerk cannot create a product (403)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${clerkToken}`)
      .send({ name: 'X', sku: 'X-01', category: cat._id, quantity: 1, unitPrice: 1, reorderThreshold: 0, supplier: sup._id });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('clerk cannot update a product (403)', async () => {
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${clerkToken}`)
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('clerk cannot delete a product (403)', async () => {
    const res = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${clerkToken}`);
    expect(res.status).toBe(403);
  });

  it('clerk cannot create a supplier (403)', async () => {
    const res = await request(app)
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${clerkToken}`)
      .send({ name: 'Acme', contactEmail: 'acme@test.com', leadTimeDays: 5 });
    expect(res.status).toBe(403);
  });

  // Manager should NOT access user management
  it('manager cannot list users (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  });

  it('manager cannot update user role (403)', async () => {
    const { user } = await createClerk();
    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ role: 'admin' });
    expect(res.status).toBe(403);
  });

  // Admin should access everything
  it('admin can list users (200)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('admin can create a product (201)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Admin Product', sku: 'ADM-01', category: cat._id, quantity: 10, unitPrice: 5.00, reorderThreshold: 2, supplier: sup._id });
    expect(res.status).toBe(201);
  });

  // Clerk CAN read products
  it('clerk can list products (200)', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${clerkToken}`);
    expect(res.status).toBe(200);
  });

  // Clerk CAN record transactions
  it('clerk can record a transaction (201)', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${clerkToken}`)
      .send({ product: product._id, type: 'stock-in', quantity: 5 });
    expect(res.status).toBe(201);
  });
});
