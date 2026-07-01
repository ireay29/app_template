import { fetchJson } from './fetch-json';

export type HealthResponse = {
  status: 'ok';
  service: string;
  uptime: number;
  database: 'ok' | 'unavailable';
};

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return fetchJson<HealthResponse>(
    '/api/health',
    { signal },
    (response) => `API health check failed with ${response.status}`,
  );
}
