import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState, UnauthorizedState } from '@/components/ui/feedback-state';
import { authClient } from '@/lib/auth-client';
import { getErrorMessage } from '@/lib/errors';

function ProtectedRouteFrame({ children }: PropsWithChildren) {
  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl">{children}</div>
    </main>
  );
}

export function ProtectedRoute({ children }: PropsWithChildren) {
  const session = authClient.useSession();

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

  return children;
}
