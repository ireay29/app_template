import { useQueryClient } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect } from 'react';

import { discardProtectedQueries, getProtectedQueryScope } from '@/lib/api/protected-query';
import { authClient } from '@/lib/auth-client';

export function ProtectedQueryBoundary({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const session = authClient.useSession();
  const scope = getProtectedQueryScope(session.data);

  useEffect(() => {
    if (!session.isPending) discardProtectedQueries(queryClient, scope);
  }, [queryClient, scope, session.isPending]);

  return children;
}
