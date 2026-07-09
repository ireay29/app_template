import { lazy, Suspense } from 'react';

import { LoadingState } from '@/components/ui/feedback-state';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';

const AdminPage = lazy(() =>
  import('@/pages/admin/AdminPage').then((module) => ({ default: module.AdminPage })),
);

export function AdminRoute() {
  return (
    <ProtectedRoute requiredRole="admin">
      <Suspense
        fallback={
          <main className="bg-background text-foreground flex min-h-screen items-center justify-center p-6">
            <LoadingState title="Loading admin area..." />
          </main>
        }
      >
        <AdminPage />
      </Suspense>
    </ProtectedRoute>
  );
}
