import type { MethodResponse } from 'openapi-fetch';

import { apiClient } from './api/client';
import { requireApiData } from './api/response';

export type HealthResponse = MethodResponse<typeof apiClient, 'get', '/api/health'>;

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const result = await apiClient.GET('/api/health', { signal });

  return requireApiData(result, `API health check failed with ${result.response.status}`);
}
