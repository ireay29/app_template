import type { paths } from '@/generated/openapi';
import { apiQuery } from '@/lib/api/query';

export type MaintenanceStatus =
  paths['/api/maintenance']['get']['responses'][200]['content']['application/json'];

export function useMaintenanceQuery() {
  return apiQuery.useQuery('get', '/api/maintenance', undefined, {
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
