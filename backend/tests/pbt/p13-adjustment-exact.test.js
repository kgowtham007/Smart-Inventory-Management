// Feature: smart-inventory-management, Property 13: Adjustment sets quantity to exactly the specified value
const fc = require('fast-check');
const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../server');
const Product = require('../../models/Product');
const {
  connectDB, clearDB,
  createAdmin, createCategory, createSupplier, createProduct,
} = require('../setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('P13: Adjustment sets quantity to exactly the specified value', () => {
  it('after adjustment, product quantity === adjustment value regardless of prior quantity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.nat({ max: 500 }), // initial quantity Q
        fc.nat({ max: 500 }), // adjustment target v
        async (Q, v) => {
          await clearDB();
          const { token } = await createAdmin();
          const cat = await createCategory();
          const sup = await createSupplier();
          const product = await createProduct(cat._id, sup._id, { quantity: Q });

          const res = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({ product: product._id, type: 'adjustment', quantity: v });

          expect(res.status).toBe(201);

          const updated = await Product.findById(product._id);
          expect(updated.quantity).toBe(v);
        }
      ),
      { numRuns: 30 }
    );
  }, 60000);
});
