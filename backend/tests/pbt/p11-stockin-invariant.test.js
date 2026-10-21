/**
 * Feature: smart-inventory-management, Property 11: Stock-in always increases quantity by exactly the transaction amount
 * Validates: Requirements 7.1, 7.6
 */
const request = require('supertest');
const mongoose = require('mongoose');
const fc = require('fast-check');
const Product = require('../../models/Product');
const { app } = require('../../server');
const { connectDB, clearDB, createAdmin, createCategory, createSupplier, createProduct } = require('../setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('P11: Stock-in always increases quantity by exactly the transaction amount', () => {
  let adminToken, cat, sup;

  beforeEach(async () => {
    const result = await createAdmin();
    adminToken = result.token;
    cat = await createCategory(`P11Cat-${Date.now()}`);
    sup = await createSupplier({ contactEmail: `p11-${Date.now()}@sup.com` });
  });

  it('after stock-in: quantity === Q + q and transaction records previousQuantity and delta', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.nat(1000),            // initial quantity Q
        fc.integer({ min: 1, max: 500 }),  // transaction quantity q (must be > 0)
        async (Q, q) => {
          const product = await createProduct(cat._id, sup._id, { quantity: Q });
          const res = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ product: product._id, type: 'stock-in', quantity: q });

          expect(res.status).toBe(201);
          expect(res.body.data.previousQuantity).toBe(Q);
          expect(res.body.data.delta).toBe(q);

          const updated = await Product.findById(product._id);
          expect(updated.quantity).toBe(Q + q);
        }
      ),
      { numRuns: 100 }
    );
  });
});
