/**
 * TEST SUITE: Auth Module
 * Coverage: Login (happy path, bad creds, invalid format), getMe, protected routes
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Auth Module', () => {
  let adminToken: string;
  let adminRefreshToken: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bepnhaminh.vn', password: 'Admin@123456' });
    adminToken = res.body.data.accessToken;
    adminRefreshToken = res.body.data.refreshToken;
  });

  // ── Login ──────────────────────────────────────────────────────────────────

  it('LOGIN-01: Valid admin credentials → 200 with token + user profile', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bepnhaminh.vn', password: 'Admin@123456' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user).toMatchObject({
      email: 'admin@bepnhaminh.vn',
      storeId: expect.any(String),
    });
    expect(res.body.data.user.roles).toContain('ADMIN');
  });

  it('LOGIN-02: Valid kitchen credentials → 200 with KITCHEN role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bep@bepnhaminh.vn', password: 'Kitchen@123456' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.roles).toContain('KITCHEN');
  });

  it('LOGIN-03: Wrong password → 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bepnhaminh.vn', password: 'WRONG_PASSWORD' });

    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty('code');
  });

  it('LOGIN-04: Non-existent user → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@fake.com', password: 'Password123' });

    expect(res.status).toBe(401);
  });

  it('LOGIN-05: Missing email → 400 Validation error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Password123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('LOGIN-06: Invalid email format → 400 Validation error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'Password123' });

    expect(res.status).toBe(400);
  });

  it('LOGIN-07: Password too short → 400 Validation error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bepnhaminh.vn', password: 'short' });

    expect(res.status).toBe(400);
  });

  // ── Refresh token ─────────────────────────────────────────────────────────

  it('REFRESH-01: Valid refresh token → 200 with new access token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: adminRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data).toHaveProperty('expiresIn');
  });

  it('REFRESH-02: Missing refresh token → 400 Validation error', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // ── Protected routes ───────────────────────────────────────────────────────

  it('AUTH-01: GET /api/internal/me with valid token → 200 with user info', async () => {
    const res = await request(app)
      .get('/api/internal/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user).toHaveProperty('storeId');
    expect(res.body.data.user).toHaveProperty('roles');
  });

  it('AUTH-02: GET /api/internal/me without token → 401', async () => {
    const res = await request(app).get('/api/internal/me');
    expect(res.status).toBe(401);
  });

  it('AUTH-03: GET /api/internal/me with malformed token → 401', async () => {
    const res = await request(app)
      .get('/api/internal/me')
      .set('Authorization', 'Bearer TOTALLY_INVALID_JWT');
    expect(res.status).toBe(401);
  });

  it('AUTH-04: KITCHEN role cannot access ADMIN-only endpoint (POST /categories)', async () => {
    const kitchenRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bep@bepnhaminh.vn', password: 'Kitchen@123456' });
    const kitchenToken = kitchenRes.body.data.accessToken;

    const res = await request(app)
      .post('/api/internal/categories')
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ name: 'Hack Attempt' });

    expect(res.status).toBe(403);
  });

  it('AUTH-05: Health endpoint is public (no auth needed)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});
