const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const { connectDB, clearDB, createUser } = require('./setup/testHelpers');

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await mongoose.disconnect(); });

describe('POST /api/auth/register', () => {
  it('should register a user and return JWT + user data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(res.body.data.user.role).toBe('clerk');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('should return 409 for duplicate email', async () => {
    await createUser({ email: 'dup@example.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'dup@example.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Charlie', email: 'charlie@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for missing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dave', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for malformed email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Eve', email: 'notanemail', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should default role to clerk', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Frank', email: 'frank@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('clerk');
  });
});

describe('POST /api/auth/login', () => {
  it('should return JWT and user on valid credentials', async () => {
    await createUser({ email: 'login@example.com', password: 'password123' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('login@example.com');
  });

  it('should return 401 for wrong password', async () => {
    await createUser({ email: 'wrongpw@example.com', password: 'correctpassword' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrongpw@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
    expect(res.body.data).toBeNull();
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('should return 401 for missing authorization on protected route', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for expired/invalid token on protected route', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
