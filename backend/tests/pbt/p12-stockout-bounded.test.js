// Feature: smart-inventory-management, Property 12: Stock-out is bounded by available stock
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

describe('P12: Stock-out is bounded by available stock', () => {
  it('for q ≤ Q: succeeds and new quantity === Q - q; for q > Q: 400 and quantity unchanged', async () => {
    const { token } = await createAdmin();
    const cat = await createCategory();
    const sup = await createSupplier();

    await fc.assert(
      fc.asyncProperty(
        fc.nat({ max: 200 }).chain((Q) =>
          fc.nat({ max: 250 }).map((q) => ({ Q, q }))
        ),
        async ({ Q, q }) => {
          await clearDB();
          const { token: t } = await createAdmin();
          const c = await createCategory();
          const s = await createSupplier();
          const product = await createProduct(c._id, s._id, { quantity: Q });

          const res = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${t}`)
            .send({ product: product._id, type: 'stock-out', quantity: q > 0 ? q : 1 });

          const qty = q > 0 ? q : 1;
          const updated = await Product.findById(product._id);

          if (qty <= Q) {
            // Should succeed
            expect(res.status).toBe(201);
            expect(updated.quantity).toBe(Q - qty);
          } else {
            // Should fail
            expect(res.status).toBe(400);
            expect(updated.quantity).toBe(Q); // unchanged
          }
        }
      ),
      { numRuns: 30 }
    );
  }, 60000);
});
