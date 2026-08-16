import type { PropsWithChildren } from 'react';

import { ProtectedRoute } from '@/features/auth/ProtectedRoute';

export type RouteAccess = 'public' | 'authenticated' | 'admin';

type RouteAccessGuardProps = PropsWithChildren<{
  access: RouteAccess;
}>;

export function RouteAccessGuard({ access, children }: RouteAccessGuardProps) {
  if (access === 'public') {
    return children;
  }

  return (
    <ProtectedRoute requiredRole={access === 'admin' ? 'admin' : undefined}>
      {children}
    </ProtectedRoute>
  );
}
