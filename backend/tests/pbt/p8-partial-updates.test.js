/**
 * Feature: smart-inventory-management, Property 8: Partial updates preserve untouched fields
 * Validates: Requirements 4.6, 5.4, 6.4
 */
const request = require('supertest');
const mongoose = require('mongoose');
const fc = require('fast-check');
const { app } = require('../../server');
const { connectDB, clearDB, createAdmin, createCategory, createSupplier, createProduct } = require('../setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('P8: Partial updates preserve untouched fields', () => {
  let adminToken;

  beforeEach(async () => {
    const result = await createAdmin();
    adminToken = result.token;
  });

  it('partial product update preserves untouched fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          newName: fc.string({ minLength: 3, maxLength: 30 }).map((s) => s.replace(/[^\w\s]/g, 'A').trim().padEnd(3, 'A')),
        }),
        async ({ newName }) => {
          const cat = await createCategory(`P8Cat-${Date.now()}`);
          const sup = await createSupplier({ contactEmail: `p8-${Date.now()}-${Math.random()}@sup.com` });
          const original = await createProduct(cat._id, sup._id, {
            name: 'Original',
            quantity: 50,
            unitPrice: 9.99,
            reorderThreshold: 5,
          });

          const res = await request(app)
            .put(`/api/products/${original._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: newName });

          expect(res.status).toBe(200);
          expect(res.body.data.quantity).toBe(50);       // preserved
          expect(res.body.data.unitPrice).toBe(9.99);    // preserved
          expect(res.body.data.reorderThreshold).toBe(5); // preserved
        }
      ),
      { numRuns: 30 }
    );
  });

  it('partial supplier update preserves untouched fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 30 }).map((s) => s.replace(/[^\w\s]/g, 'A').trim().padEnd(3, 'A')),
        async (newName) => {
          const sup = await createSupplier({
            name: 'Original Name',
            leadTimeDays: 7,
            contactEmail: `p8sup-${Date.now()}-${Math.random()}@test.com`,
          });

          const res = await request(app)
            .put(`/api/suppliers/${sup._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: newName });

          expect(res.status).toBe(200);
          expect(res.body.data.leadTimeDays).toBe(7); // preserved
        }
      ),
      { numRuns: 30 }
    );
  });

  it('partial category update preserves untouched fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 30 }).map((s) => s.replace(/[^\w\s]/g, 'A').trim().padEnd(3, 'A')),
        async (newName) => {
          const originalDesc = 'Original description that should be preserved';
          const cat = await createCategory(`P8Cat-${Date.now()}`);
          // Add description via update
          await request(app)
            .put(`/api/categories/${cat._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ description: originalDesc });

          const uniqueName = `P8-${newName}-${Date.now()}`;
          const res = await request(app)
            .put(`/api/categories/${cat._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: uniqueName });

          expect(res.status).toBe(200);
          expect(res.body.data.description).toBe(originalDesc); // preserved
        }
      ),
      { numRuns: 30 }
    );
  });
});
