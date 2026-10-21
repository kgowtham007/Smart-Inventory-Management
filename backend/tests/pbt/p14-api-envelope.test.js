// Feature: smart-inventory-management, Property 14: API response envelope invariant
const fc = require('fast-check');
const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../server');
const {
  connectDB, clearDB,
  createAdmin, createCategory, createSupplier, createProduct,
} = require('../setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

const assertEnvelope = (body) => {
  expect(typeof body.success).toBe('boolean');
  expect(body).toHaveProperty('data');
  expect(typeof body.message).toBe('string');
};

describe('P14: Every API response has the { success, data, message } envelope', () => {
  let adminToken, product;

  beforeEach(async () => {
    const { token } = await createAdmin();
    adminToken = token;
    const cat = await createCategory();
    const sup = await createSupplier();
    product = await createProduct(cat._id, sup._id);
  });

  it('success responses have the envelope', async () => {
    const routes = [
      () => request(app).get('/api/categories').set('Authorization', `Bearer ${adminToken}`),
      () => request(app).get('/api/suppliers').set('Authorization', `Bearer ${adminToken}`),
      () => request(app).get('/api/products').set('Authorization', `Bearer ${adminToken}`),
      () => request(app).get('/api/transactions').set('Authorization', `Bearer ${adminToken}`),
      () => request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${adminToken}`),
    ];

    for (const routeFn of routes) {
      const res = await routeFn();
      assertEnvelope(res.body);
    }
  });

  it('error responses have the envelope (4xx)', async () => {
    const errorRoutes = [
      // No token → 401
      () => request(app).get('/api/products'),
      // Invalid token → 401
      () => request(app).get('/api/products').set('Authorization', 'Bearer bad.token.here'),
      // 404 not found
      () => request(app).get(`/api/products/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${adminToken}`),
      // 404 unknown route
      () => request(app).get('/api/nonexistent').set('Authorization', `Bearer ${adminToken}`),
    ];

    for (const routeFn of errorRoutes) {
      const res = await routeFn();
      assertEnvelope(res.body);
    }
  });

  it('validates envelope across varied string payloads via PBT', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        async (randomToken) => {
          const res = await request(app)
            .get('/api/products')
            .set('Authorization', `Bearer ${randomToken}`);
          assertEnvelope(res.body);
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);
});
