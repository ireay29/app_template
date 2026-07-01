import { useQuery } from '@tanstack/react-query';

import { getHealth } from '@/lib/api';

export function useHealthQuery() {
  return useQuery({
    queryFn: ({ signal }) => getHealth(signal),
    queryKey: ['health'],
  });
}
