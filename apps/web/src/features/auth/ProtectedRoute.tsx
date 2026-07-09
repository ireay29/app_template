import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
  UnauthorizedState,
} from '@/components/ui/feedback-state';
import { apiQuery } from '@/lib/api/query';
import { authClient } from '@/lib/auth-client';
import { getErrorMessage } from '@/lib/errors';

type UserRole = 'admin' | 'member';

function ProtectedRouteFrame({ children }: PropsWithChildren) {
  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl">{children}</div>
    </main>
  );
}

type ProtectedRouteProps = PropsWithChildren<{
  requiredRole?: UserRole;
}>;

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const session = authClient.useSession();
  const currentUser = apiQuery.useQuery('get', '/api/me', undefined, {
    enabled: Boolean(session.data?.user && requiredRole),
  });

  if (session.isPending) {
    return (
      <ProtectedRouteFrame>
        <LoadingState title="Checking session..." />
      </ProtectedRouteFrame>
    );
  }

  if (session.error) {
    return (
      <ProtectedRouteFrame>
        <ErrorState
          description={getErrorMessage(session.error, 'Could not check the current session.')}
          title="Session check failed"
        />
      </ProtectedRouteFrame>
    );
  }

  if (!session.data?.user) {
    return (
      <ProtectedRouteFrame>
        <UnauthorizedState
          action={
            <Button asChild variant="outline">
              <Link to="/">Back to sign in</Link>
            </Button>
          }
          description="Sign in before opening this protected page."
          title="Authentication required"
        />
      </ProtectedRouteFrame>
    );
  }

  if (requiredRole && currentUser.isPending) {
    return (
      <ProtectedRouteFrame>
        <LoadingState title="Checking access..." />
      </ProtectedRouteFrame>
    );
  }

  if (requiredRole && currentUser.isError) {
    return (
      <ProtectedRouteFrame>
        <ErrorState
          description={getErrorMessage(currentUser.error, 'Could not check the current user role.')}
          title="Access check failed"
        />
      </ProtectedRouteFrame>
    );
  }

  if (requiredRole && currentUser.data?.user.role !== requiredRole) {
    return (
      <ProtectedRouteFrame>
        <ForbiddenState
          action={
            <Button asChild variant="outline">
              <Link to="/">Back to dashboard</Link>
            </Button>
          }
          description="Your account does not have access to this page."
          title="Admin access required"
        />
      </ProtectedRouteFrame>
    );
  }

  return children;
}
