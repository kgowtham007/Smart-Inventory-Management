/**
 * Feature: smart-inventory-management, Property 4: Unique constraint violations always return HTTP 409
 * Validates: Requirements 1.2, 4.2, 5.2, 6.2
 */
const request = require('supertest');
const mongoose = require('mongoose');
const fc = require('fast-check');
const { app } = require('../../server');
const { connectDB, clearDB, createAdmin, createCategory, createSupplier } = require('../setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('P4: Unique constraint violations always return HTTP 409', () => {
  let adminToken, cat, sup;

  beforeEach(async () => {
    const result = await createAdmin();
    adminToken = result.token;
    cat = await createCategory(`BaseCat-${Date.now()}`);
    sup = await createSupplier();
  });

  it('duplicate email on user registration → 409', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        async (email) => {
          // First registration succeeds
          await request(app)
            .post('/api/auth/register')
            .send({ name: 'User', email, password: 'password123' });

          // Second with same email → 409
          const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'User2', email, password: 'password123' });

          expect(res.status).toBe(409);
          expect(res.body.success).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('duplicate SKU on product creation → 409', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 10, unit: 'binary-ascii' }).map((s) =>
          s.replace(/[^a-zA-Z0-9]/g, 'X').toUpperCase().padEnd(3, 'X')
        ),
        async (sku) => {
          const uniqueSku = `P4-${sku}-${Date.now()}`;
          const base = { name: 'Product', category: String(cat._id), quantity: 10, unitPrice: 5.99, reorderThreshold: 2, supplier: String(sup._id) };

          await request(app).post('/api/products').set('Authorization', `Bearer ${adminToken}`).send({ ...base, sku: uniqueSku });
          const res = await request(app).post('/api/products').set('Authorization', `Bearer ${adminToken}`).send({ ...base, sku: uniqueSku });

          expect(res.status).toBe(409);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('duplicate name on category creation → 409', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 20 }).map((s) => s.replace(/[^\w]/g, 'A').slice(0, 15).padEnd(3, 'A')),
        async (name) => {
          const uniqueName = `C4-${name}-${Date.now()}`;
          await request(app).post('/api/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: uniqueName });
          const res = await request(app).post('/api/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: uniqueName });
          expect(res.status).toBe(409);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('duplicate contactEmail on supplier creation → 409', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        async (email) => {
          const uniqueEmail = `s4-${Date.now()}-${email}`.replace(/[^a-zA-Z0-9@._-]/g, '').slice(0, 50) + '@test.com';
          const base = { name: 'Supplier', contactEmail: uniqueEmail, leadTimeDays: 3 };
          await request(app).post('/api/suppliers').set('Authorization', `Bearer ${adminToken}`).send(base);
          const res = await request(app).post('/api/suppliers').set('Authorization', `Bearer ${adminToken}`).send(base);
          expect(res.status).toBe(409);
        }
      ),
      { numRuns: 20 }
    );
  });
});
