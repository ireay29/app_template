import { describe, expect, it } from 'vitest';
import { app } from './app.js';

describe('api app', () => {
  it('returns health status', async () => {
    const response = await app.request('/api/health');
    const body = (await response.json()) as { status: string; service: string };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: 'ok',
      service: 'api',
    });
  });

  it('returns a greeting', async () => {
    const response = await app.request('/api/greeting?name=Sam');
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(200);
    expect(body.message).toBe('Hello, Sam.');
  });
});
