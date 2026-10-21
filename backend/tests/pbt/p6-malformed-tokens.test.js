/**
 * Feature: smart-inventory-management, Property 6: Malformed or absent tokens are always rejected
 * Validates: Requirements 2.4, 2.5
 */
const request = require('supertest');
const mongoose = require('mongoose');
const fc = require('fast-check');
const { app } = require('../../server');
const { connectDB, clearDB } = require('../setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('P6: Malformed or absent tokens are always rejected', () => {
  it('random string as Bearer token → 401 on protected route', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (tokenString) => {
          const res = await request(app)
            .get('/api/products')
            .set('Authorization', `Bearer ${tokenString}`);

          expect(res.status).toBe(401);
          expect(res.body.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no authorization header → 401 on protected route', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('non-Bearer authorization scheme → 401', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (tokenString) => {
          const res = await request(app)
            .get('/api/categories')
            .set('Authorization', `Basic ${tokenString}`);

          expect(res.status).toBe(401);
        }
      ),
      { numRuns: 50 }
    );
  });
});
