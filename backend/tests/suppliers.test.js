const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const {
  connectDB, clearDB,
  createAdmin, createSupplier,
} = require('./setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('Suppliers CRUD', () => {
  let adminToken;

  beforeEach(async () => {
    const { token } = await createAdmin();
    adminToken = token;
  });

  it('POST /api/suppliers creates a supplier (201)', async () => {
    const res = await request(app)
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Acme Corp', contactEmail: 'acme@corp.com', phone: '555-1234', leadTimeDays: 7 });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Acme Corp');
  });

  it('POST /api/suppliers returns 409 for duplicate email', async () => {
    await createSupplier({ contactEmail: 'dup@supplier.com' });
    const res = await request(app)
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Another', contactEmail: 'dup@supplier.com', leadTimeDays: 3 });

    expect(res.status).toBe(409);
  });

  it('GET /api/suppliers returns non-deleted suppliers', async () => {
    await createSupplier();
    await createSupplier();
    const res = await request(app)
      .get('/api/suppliers')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('PUT /api/suppliers/:id updates partial fields', async () => {
    const sup = await createSupplier({ name: 'OldName', leadTimeDays: 5 });
    const res = await request(app)
      .put(`/api/suppliers/${sup._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'NewName' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('NewName');
    expect(res.body.data.leadTimeDays).toBe(5); // unchanged
  });

  it('DELETE /api/suppliers/:id soft-deletes', async () => {
    const sup = await createSupplier();
    const res = await request(app)
      .delete(`/api/suppliers/${sup._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    // Should not appear in list
    const listRes = await request(app)
      .get('/api/suppliers')
      .set('Authorization', `Bearer ${adminToken}`);
    const found = listRes.body.data.find((s) => s._id.toString() === sup._id.toString());
    expect(found).toBeUndefined();
  });
});
