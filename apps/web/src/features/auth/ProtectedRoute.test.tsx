import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  session: {
    data: null as { user: { id: string; email: string } } | null,
    error: null as Error | null,
    isPending: false,
  },
}));

const apiMock = vi.hoisted(() => ({
  me: {
    data: undefined as { user: { role: 'admin' | 'member' } } | undefined,
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
    useQuery: () => apiMock.me,
  },
}));

import { ProtectedRoute } from './ProtectedRoute';

function renderProtectedRoute(requiredRole?: 'admin' | 'member') {
  return render(
    <MemoryRouter>
      <ProtectedRoute requiredRole={requiredRole}>
        <p>Protected content</p>
      </ProtectedRoute>
    </MemoryRouter>,
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

  it('shows a forbidden state when the signed-in user lacks the required role', () => {
    authMock.session.data = { user: { id: 'user_1', email: 'member@example.com' } };
    apiMock.me.data = { user: { role: 'member' } };

    renderProtectedRoute('admin');

    expect(screen.getByRole('status')).toHaveTextContent('Admin access required');
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children when the signed-in user has the required role', () => {
    authMock.session.data = { user: { id: 'user_1', email: 'admin@example.com' } };
    apiMock.me.data = { user: { role: 'admin' } };

    renderProtectedRoute('admin');

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
