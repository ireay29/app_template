import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { ErrorState, LoadingState } from '@/components/ui/feedback-state';
import { HomePage } from '@/pages/home/HomePage';

import { defineRoute } from './route-definition';

// The lazy route page is intentionally colocated with router configuration.
// eslint-disable-next-line react-refresh/only-export-components
const AdminPage = lazy(() =>
  import('@/pages/admin/AdminPage').then((module) => ({ default: module.AdminPage })),
);

export const router = createBrowserRouter([
  defineRoute({
    element: <HomePage />,
    errorElement: (
      <main className="bg-background text-foreground flex min-h-screen items-center justify-center p-6">
        <ErrorState
          description="The requested route could not be rendered."
          title="Something went wrong"
        />
      </main>
    ),
    handle: { access: 'public' },
    path: '/',
  }),
  defineRoute({
    element: (
      <Suspense
        fallback={
          <main className="bg-background text-foreground flex min-h-screen items-center justify-center p-6">
            <LoadingState title="Loading admin area..." />
          </main>
        }
      >
        <AdminPage />
      </Suspense>
    ),
    handle: { access: 'admin' },
    path: '/admin',
  }),
]);
