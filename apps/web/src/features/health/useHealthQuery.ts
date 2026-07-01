import { apiQuery } from '@/lib/api/query';

export function useHealthQuery() {
  return apiQuery.useQuery('get', '/api/health');
}
