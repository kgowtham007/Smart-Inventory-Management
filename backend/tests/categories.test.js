const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const {
  connectDB, clearDB,
  createAdmin, createManager,
  createCategory, createSupplier, createProduct,
} = require('./setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('Categories CRUD', () => {
  let adminToken, managerToken;

  beforeEach(async () => {
    const [a, m] = await Promise.all([createAdmin(), createManager()]);
    adminToken = a.token;
    managerToken = m.token;
  });

  it('POST /api/categories creates a category (201)', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Electronics', description: 'Electronic components' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Electronics');
  });

  it('POST /api/categories returns 409 for duplicate name', async () => {
    await createCategory('Duplicate');
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Duplicate' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/categories returns all categories', async () => {
    await createCategory('Cat A');
    await createCategory('Cat B');
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('PUT /api/categories/:id updates name', async () => {
    const cat = await createCategory('OldName');
    const res = await request(app)
      .put(`/api/categories/${cat._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'NewName' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('NewName');
  });

  it('DELETE /api/categories/:id returns 400 when products are assigned', async () => {
    const cat = await createCategory('InUse');
    const sup = await createSupplier();
    await createProduct(cat._id, sup._id);

    const res = await request(app)
      .delete(`/api/categories/${cat._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('DELETE /api/categories/:id succeeds when no products assigned', async () => {
    const cat = await createCategory('Empty');
    const res = await request(app)
      .delete(`/api/categories/${cat._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('manager can create a category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Manager Category' });

    expect(res.status).toBe(201);
  });
});
