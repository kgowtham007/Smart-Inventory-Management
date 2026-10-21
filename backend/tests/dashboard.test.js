const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const {
  connectDB, clearDB,
  createAdmin, createClerk,
  createCategory, createSupplier, createProduct,
} = require('./setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('Dashboard Analytics', () => {
  let adminToken, clerkToken, product;

  beforeEach(async () => {
    const [a, c] = await Promise.all([createAdmin(), createClerk()]);
    adminToken = a.token;
    clerkToken = c.token;

    const cat = await createCategory();
    const sup = await createSupplier();
    product = await createProduct(cat._id, sup._id, { quantity: 100, unitPrice: 10, reorderThreshold: 5 });

    // Create a low-stock product
    await createProduct(cat._id, sup._id, { quantity: 2, unitPrice: 5, reorderThreshold: 10 });

    // Record some transactions
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product: product._id, type: 'stock-in', quantity: 50 });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product: product._id, type: 'stock-out', quantity: 30 });
  });

  it('GET /api/dashboard/summary returns correct metrics', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalProducts).toBeGreaterThanOrEqual(2);
    expect(res.body.data.totalStockValue).toBeGreaterThan(0);
    expect(res.body.data.lowStockCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.recentTransactions).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/dashboard/top-products returns up to 5 items', async () => {
    const res = await request(app)
      .get('/api/dashboard/top-products')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });

  it('GET /api/dashboard/stock-movement returns 30 days of data', async () => {
    const res = await request(app)
      .get('/api/dashboard/stock-movement')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(30);
    // Each entry has date, stockIn, stockOut
    res.body.data.forEach((entry) => {
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('stockIn');
      expect(entry).toHaveProperty('stockOut');
    });
  });

  it('clerk cannot access dashboard (403)', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${clerkToken}`);

    expect(res.status).toBe(403);
  });
});
