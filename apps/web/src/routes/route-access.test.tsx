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

import { RouteAccessGuard } from './route-access';
import { defineRoute } from './route-definition';

function renderGuard(access: 'public' | 'authenticated' | 'admin') {
  return render(
    <MemoryRouter>
      <RouteAccessGuard access={access}>
        <p>Route content</p>
      </RouteAccessGuard>
    </MemoryRouter>,
  );
}

describe('RouteAccessGuard', () => {
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

  it('renders public routes without a session', () => {
    renderGuard('public');

    expect(screen.getByText('Route content')).toBeInTheDocument();
  });

  it('preserves route access metadata while wrapping its element', () => {
    const route = defineRoute({
      element: <p>Route content</p>,
      handle: { access: 'public' },
      path: '/projects',
    });

    render(<MemoryRouter>{route.element}</MemoryRouter>);

    expect(route.handle).toEqual({ access: 'public' });
    expect(screen.getByText('Route content')).toBeInTheDocument();
  });

  it('blocks signed-out users from authenticated routes', () => {
    renderGuard('authenticated');

    expect(screen.getByRole('status')).toHaveTextContent('Authentication required');
    expect(screen.queryByText('Route content')).not.toBeInTheDocument();
  });

  it('renders authenticated routes for signed-in users', () => {
    authMock.session.data = { user: { id: 'user_1', email: 'member@example.com' } };

    renderGuard('authenticated');

    expect(screen.getByText('Route content')).toBeInTheDocument();
  });

  it('requires the admin role for admin routes', () => {
    authMock.session.data = { user: { id: 'user_1', email: 'member@example.com' } };
    apiMock.me.data = { user: { role: 'member' } };

    renderGuard('admin');

    expect(screen.getByRole('status')).toHaveTextContent('Admin access required');
  });
});
