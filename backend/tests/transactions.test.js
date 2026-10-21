const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const { connectDB, clearDB, createAdmin, createClerk, createCategory, createSupplier, createProduct } = require('./setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('Transactions', () => {
  let adminToken, clerkToken, product;

  beforeEach(async () => {
    const adminResult = await createAdmin();
    adminToken = adminResult.token;
    const clerkResult = await createClerk();
    clerkToken = clerkResult.token;
    const cat = await createCategory();
    const sup = await createSupplier();
    product = await createProduct(cat._id, sup._id, { quantity: 50, reorderThreshold: 5 });
  });

  it('stock-in increases product quantity', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product: product._id, type: 'stock-in', quantity: 20 });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('stock-in');
    expect(res.body.data.delta).toBe(20);

    const updated = await Product.findById(product._id);
    expect(updated.quantity).toBe(70); // 50 + 20
  });

  it('stock-out decreases product quantity', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product: product._id, type: 'stock-out', quantity: 10 });

    expect(res.status).toBe(201);
    expect(res.body.data.delta).toBe(-10);

    const updated = await Product.findById(product._id);
    expect(updated.quantity).toBe(40); // 50 - 10
  });

  it('stock-out overdraft returns 400', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product: product._id, type: 'stock-out', quantity: 100 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    // Quantity should be unchanged
    const updated = await Product.findById(product._id);
    expect(updated.quantity).toBe(50);
  });

  it('adjustment sets quantity to exact value', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product: product._id, type: 'adjustment', quantity: 75 });

    expect(res.status).toBe(201);
    const updated = await Product.findById(product._id);
    expect(updated.quantity).toBe(75);
  });

  it('stores previousQuantity and delta on transaction', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product: product._id, type: 'stock-in', quantity: 15 });

    expect(res.body.data.previousQuantity).toBe(50);
    expect(res.body.data.delta).toBe(15);
  });

  it('clerk can record a transaction', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${clerkToken}`)
      .send({ product: product._id, type: 'stock-in', quantity: 5 });

    expect(res.status).toBe(201);
  });

  it('GET /api/transactions returns paginated list', async () => {
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${adminToken}`).send({ product: product._id, type: 'stock-in', quantity: 5 });
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${adminToken}`).send({ product: product._id, type: 'stock-in', quantity: 5 });

    const res = await request(app)
      .get('/api/transactions?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions).toBeInstanceOf(Array);
    expect(res.body.data.total).toBeGreaterThanOrEqual(2);
  });

  it('atomic rollback: quantity unchanged if transaction fails', async () => {
    // Mock Transaction.create to throw after product update
    const origCreate = Transaction.create.bind(Transaction);
    const spy = jest.spyOn(Transaction, 'create').mockRejectedValueOnce(new Error('DB failure'));

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product: product._id, type: 'stock-in', quantity: 25 });

    expect(res.status).toBe(500);
    const updated = await Product.findById(product._id);
    expect(updated.quantity).toBe(50); // unchanged

    spy.mockRestore();
  });
});
