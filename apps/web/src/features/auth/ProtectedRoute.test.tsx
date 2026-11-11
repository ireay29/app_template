import { QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  session: {
    data: null as { user: { id: string; email: string }; session: { id: string } } | null,
    error: null as Error | null,
    isPending: false,
  },
}));

const apiMock = vi.hoisted(() => ({
  me: {
    data: undefined as { user: { id: string; role: 'admin' | 'member' } } | undefined,
    error: null as Error | null,
    isError: false,
    isPending: false,
  },
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => authMock.session,
  },
}));

vi.mock('@/lib/api/query', () => ({
  apiQuery: {
    queryOptions: () => ({ queryKey: ['get', '/api/me'], queryFn: async () => apiMock.me.data }),
  },
}));

import { createAppQueryClient } from '@/lib/query-client';

import { ProtectedRoute } from './ProtectedRoute';

function renderProtectedRoute(requiredRole?: 'admin' | 'member') {
  return render(
    <QueryClientProvider client={createAppQueryClient()}>
      <MemoryRouter>
        <ProtectedRoute requiredRole={requiredRole}>
          <p>Protected content</p>
        </ProtectedRoute>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authMock.session.data = null;
    authMock.session.error = null;
    authMock.session.isPending = false;
    apiMock.me.data = undefined;
    apiMock.me.error = null;
    apiMock.me.isError = false;
    apiMock.me.isPending = false;
  });

  afterEach(() => {
    cleanup();
  });

  it('shows an unauthorized state for signed-out users', () => {
    renderProtectedRoute('admin');

    expect(screen.getByRole('status')).toHaveTextContent('Authentication required');
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('shows a forbidden state when the signed-in user lacks the required role', async () => {
    authMock.session.data = {
      user: { id: 'user_1', email: 'member@example.com' },
      session: { id: 'session_1' },
    };
    apiMock.me.data = { user: { id: 'user_1', role: 'member' } };

    renderProtectedRoute('admin');

    expect(await screen.findByText('Admin access required')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children when the signed-in user has the required role', async () => {
    authMock.session.data = {
      user: { id: 'user_1', email: 'admin@example.com' },
      session: { id: 'session_1' },
    };
    apiMock.me.data = { user: { id: 'user_1', role: 'admin' } };

    renderProtectedRoute('admin');

    expect(await screen.findByText('Protected content')).toBeInTheDocument();
  });

  it('rejects an admin role response for a different session user', async () => {
    authMock.session.data = {
      user: { id: 'member', email: 'member@example.com' },
      session: { id: 'member-session' },
    };
    apiMock.me.data = { user: { id: 'old-admin', role: 'admin' } };
    renderProtectedRoute('admin');
    expect(await screen.findByText('Admin access required')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
});
