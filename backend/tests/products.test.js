const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const { connectDB, clearDB, createAdmin, createManager, createCategory, createSupplier, createProduct } = require('./setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('Products CRUD', () => {
  let adminToken, cat, sup;

  beforeEach(async () => {
    const result = await createAdmin();
    adminToken = result.token;
    cat = await createCategory('Electronics');
    sup = await createSupplier();
  });

  it('POST /api/products creates a product (201)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Laptop', sku: 'LAP-001', category: cat._id, quantity: 50, unitPrice: 999.99, reorderThreshold: 5, supplier: sup._id });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Laptop');
    expect(res.body.data.sku).toBe('LAP-001');
  });

  it('POST /api/products returns 409 for duplicate SKU', async () => {
    await createProduct(cat._id, sup._id, { sku: 'DUP-001' });
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Another', sku: 'DUP-001', category: cat._id, quantity: 10, unitPrice: 5.99, reorderThreshold: 2, supplier: sup._id });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/products returns paginated list', async () => {
    await createProduct(cat._id, sup._id);
    await createProduct(cat._id, sup._id);
    const res = await request(app)
      .get('/api/products?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.products).toBeInstanceOf(Array);
    expect(res.body.data.total).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/products/:id returns 404 for non-existent id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/products/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/products/:id returns product with populated refs', async () => {
    const product = await createProduct(cat._id, sup._id);
    const res = await request(app)
      .get(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.category.name).toBeDefined();
    expect(res.body.data.supplier.name).toBeDefined();
  });

  it('PUT /api/products/:id updates only supplied fields', async () => {
    const product = await createProduct(cat._id, sup._id, { name: 'OldName', quantity: 100 });
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'NewName' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('NewName');
    expect(res.body.data.quantity).toBe(100); // unchanged
  });

  it('DELETE /api/products/:id soft-deletes the product', async () => {
    const product = await createProduct(cat._id, sup._id);
    const res = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    // Product should not be in list anymore
    const listRes = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${adminToken}`);
    const found = listRes.body.data.products.find((p) => p._id.toString() === product._id.toString());
    expect(found).toBeUndefined();
  });

  it('includes lowStock flag when quantity < reorderThreshold', async () => {
    const product = await createProduct(cat._id, sup._id, { quantity: 3, reorderThreshold: 10 });
    const res = await request(app)
      .get(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.lowStock).toBe(true);
  });

  it('lowStock flag is false when quantity >= reorderThreshold', async () => {
    const product = await createProduct(cat._id, sup._id, { quantity: 15, reorderThreshold: 10 });
    const res = await request(app)
      .get(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.lowStock).toBe(false);
  });
});
