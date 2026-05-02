import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Auth API', () => {
  it('should return 401 if login is incorrect', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@email.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  it('should login successfully with demo user', async () => {
    // Nota: Para este teste passar, o banco precisa estar com o seed do demo user
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'paul@demo.com',
        password: 'demo1234'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe('paul@demo.com');
  });
});
