/**
 * Feature: smart-inventory-management, Property 10: Category with associated products cannot be deleted
 * Validates: Requirements 5.5
 */
const request = require('supertest');
const mongoose = require('mongoose');
const fc = require('fast-check');
const Category = require('../../models/Category');
const { app } = require('../../server');
const { connectDB, clearDB, createAdmin, createCategory, createSupplier, createProduct } = require('../setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('P10: Category with associated products cannot be deleted', () => {
  let adminToken, sup;

  beforeEach(async () => {
    const result = await createAdmin();
    adminToken = result.token;
    sup = await createSupplier({ contactEmail: `p10-${Date.now()}@sup.com` });
  });

  it('delete category with 1-N products returns 400 and category remains', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (productCount) => {
          const cat = await createCategory(`P10Cat-${Date.now()}-${Math.random()}`);

          // Create N products in this category
          for (let i = 0; i < productCount; i++) {
            await createProduct(cat._id, sup._id);
          }

          const res = await request(app)
            .delete(`/api/categories/${cat._id}`)
            .set('Authorization', `Bearer ${adminToken}`);

          expect(res.status).toBe(400);
          expect(res.body.success).toBe(false);

          // Category should still exist
          const stillExists = await Category.findById(cat._id);
          expect(stillExists).not.toBeNull();
        }
      ),
      { numRuns: 30 }
    );
  });
});
