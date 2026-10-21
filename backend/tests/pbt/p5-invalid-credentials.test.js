/**
 * Feature: smart-inventory-management, Property 5: Invalid credentials never issue a JWT
 * Validates: Requirements 2.2, 2.3
 */
const request = require('supertest');
const mongoose = require('mongoose');
const fc = require('fast-check');
const { app } = require('../../server');
const { connectDB, clearDB } = require('../setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('P5: Invalid credentials never issue a JWT', () => {
  it('random email/password pairs not matching any user → 401, no JWT', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 20 }),
        async (email, password) => {
          const res = await request(app)
            .post('/api/auth/login')
            .send({ email, password });

          // Either invalid input format (400) or missing user (401)
          expect([400, 401]).toContain(res.status);
          if (res.status === 401) {
            expect(res.body.message).toBe('Invalid credentials');
            // No token in response
            expect(res.body.data?.token).toBeUndefined();
            expect(res.body.data).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('correct email but wrong password never issues JWT', async () => {
    // Register a user first
    const email = `p5test-${Date.now()}@example.com`;
    const correctPassword = 'correctPassword123';
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'P5 User', email, password: correctPassword });

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 30 }).filter((p) => p !== correctPassword),
        async (wrongPassword) => {
          const res = await request(app)
            .post('/api/auth/login')
            .send({ email, password: wrongPassword });

          expect(res.status).toBe(401);
          expect(res.body.message).toBe('Invalid credentials');
          expect(res.body.data).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
