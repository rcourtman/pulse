import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './server'; // You'll need to export the app from server.ts

describe('Server', () => {
  it('CORS is enabled', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173');
    
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('health check endpoint works', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
}); 