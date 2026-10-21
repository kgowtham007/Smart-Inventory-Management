/**
 * Feature: smart-inventory-management, Property 7: RBAC enforcement is exhaustive
 * Validates: Requirements 3.1, 3.2, 3.5
 */
const request = require('supertest');
const mongoose = require('mongoose');
const fc = require('fast-check');
const { app } = require('../../server');
const { connectDB, clearDB, createUser, createCategory, createSupplier, createProduct } = require('../setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('P7: RBAC enforcement is exhaustive across roles and routes', () => {
  it('clerk attempting product mutations → 403', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('clerk'),
        async (role) => {
          const { token } = await createUser({ role, email: `rbac-${Date.now()}-${Math.random()}@test.com` });
          const cat = await createCategory(`RbacCat-${Date.now()}`);
          const sup = await createSupplier({ contactEmail: `rbac-${Date.now()}-${Math.random()}@supplier.com` });

          const mutationRoutes = [
            () => request(app).post('/api/products').set('Authorization', `Bearer ${token}`).send({ name: 'X', sku: 'X', category: cat._id, quantity: 1, unitPrice: 1, reorderThreshold: 0, supplier: sup._id }),
            () => request(app).put(`/api/products/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${token}`).send({ name: 'X' }),
            () => request(app).delete(`/api/products/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${token}`),
          ];

          for (const route of mutationRoutes) {
            const res = await route();
            expect(res.status).toBe(403);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('manager/clerk attempting user mutations → 403', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('manager', 'clerk'),
        async (role) => {
          const { token } = await createUser({ role, email: `rbacU-${Date.now()}-${Math.random()}@test.com` });
          const fakeId = new mongoose.Types.ObjectId();

          const res = await request(app)
            .put(`/api/users/${fakeId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ role: 'admin' });

          expect(res.status).toBe(403);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('clerk/manager cannot access dashboard', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('clerk'),
        async (role) => {
          const { token } = await createUser({ role, email: `rbacD-${Date.now()}-${Math.random()}@test.com` });
          const res = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${token}`);
          expect(res.status).toBe(403);
        }
      ),
      { numRuns: 20 }
    );
  });
});
