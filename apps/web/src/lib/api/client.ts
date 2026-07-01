import createFetchClient from 'openapi-fetch';

import type { paths } from '@/generated/openapi';

const apiBaseUrl = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;

export const apiClient = createFetchClient<paths>({
  baseUrl: apiBaseUrl,
  credentials: 'include',
  fetch: (request) => fetch(request),
});
