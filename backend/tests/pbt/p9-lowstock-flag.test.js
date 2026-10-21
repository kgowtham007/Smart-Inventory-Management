/**
 * Feature: smart-inventory-management, Property 9: Low-stock flag is always consistent with reorder threshold
 * Validates: Requirements 4.8
 */
const request = require('supertest');
const mongoose = require('mongoose');
const fc = require('fast-check');
const { app } = require('../../server');
const { connectDB, clearDB, createAdmin, createCategory, createSupplier, createProduct } = require('../setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('P9: Low-stock flag is always consistent with the reorder threshold', () => {
  let adminToken, cat, sup;

  beforeEach(async () => {
    const result = await createAdmin();
    adminToken = result.token;
    cat = await createCategory(`P9Cat-${Date.now()}`);
    sup = await createSupplier({ contactEmail: `p9-${Date.now()}@sup.com` });
  });

  it('lowStock === (quantity < reorderThreshold) for all nat pairs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.nat(500),     // quantity
        fc.nat(500),     // reorderThreshold
        async (quantity, reorderThreshold) => {
          const product = await createProduct(cat._id, sup._id, { quantity, reorderThreshold });
          const res = await request(app)
            .get(`/api/products/${product._id}`)
            .set('Authorization', `Bearer ${adminToken}`);

          expect(res.status).toBe(200);
          expect(res.body.data.lowStock).toBe(quantity < reorderThreshold);
        }
      ),
      { numRuns: 100 }
    );
  });
});
