import { createBrowserRouter } from 'react-router-dom';

import { ErrorState } from '@/components/ui/feedback-state';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { AdminPage } from '@/pages/admin/AdminPage';
import { HomePage } from '@/pages/home/HomePage';

export const router = createBrowserRouter([
  {
    element: <HomePage />,
    errorElement: (
      <main className="bg-background text-foreground flex min-h-screen items-center justify-center p-6">
        <ErrorState
          description="The requested route could not be rendered."
          title="Something went wrong"
        />
      </main>
    ),
    path: '/',
  },
  {
    element: (
      <ProtectedRoute>
        <AdminPage />
      </ProtectedRoute>
    ),
    path: '/admin',
  },
]);
