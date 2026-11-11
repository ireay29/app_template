import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  data: null as { user: { id: string }; session: { id: string } } | null,
}));
vi.mock('@/lib/auth-client', () => ({
  authClient: { useSession: () => ({ data: authMock.data, isPending: false }) },
}));

import {
  getProtectedQueryKey,
  getProtectedQueryScope,
  protectedQueryOptions,
} from '@/lib/api/protected-query';
import { apiQuery } from '@/lib/api/query';
import { createAppQueryClient } from '@/lib/query-client';

import { ProtectedQueryBoundary } from './protected-query-boundary';

afterEach(() => {
  cleanup();
  authMock.data = null;
  vi.unstubAllGlobals();
});

it('isolates generated queries across users and sessions and clears them on sign-out', async () => {
  const client = createAppQueryClient();
  client.setQueryData(['get', '/api/health'], { status: 'ok' });
  const fetchMock = vi.fn(async (request: Request) => {
    expect(new URL(request.url).pathname).toBe('/api/me');
    expect(request.credentials).toBe('include');
    return new Response(JSON.stringify({ user: { id: authMock.data?.user.id } }), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);

  function Identity() {
    const query = useQuery(
      protectedQueryOptions(
        getProtectedQueryScope(authMock.data),
        apiQuery.queryOptions('get', '/api/me'),
      ),
    );
    return <p>{query.data?.user.id ?? 'No identity'}</p>;
  }
  const tree = () => (
    <QueryClientProvider client={client}>
      <ProtectedQueryBoundary>
        <Identity />
      </ProtectedQueryBoundary>
    </QueryClientProvider>
  );

  authMock.data = { user: { id: 'admin' }, session: { id: 'admin-session' } };
  const adminScope = getProtectedQueryScope(authMock.data);
  const view = render(tree());
  expect(await screen.findByText('admin')).toBeInTheDocument();

  authMock.data = { user: { id: 'member' }, session: { id: 'member-session' } };
  view.rerender(tree());
  expect(screen.queryByText('admin')).not.toBeInTheDocument();
  expect(await screen.findByText('member')).toBeInTheDocument();
  expect(client.getQueryData(getProtectedQueryKey(adminScope, ['get', '/api/me']))).toBeUndefined();

  // A new session for the same user must not reuse the previous session's data.
  authMock.data = { user: { id: 'member' }, session: { id: 'new-member-session' } };
  view.rerender(tree());
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  expect(await screen.findByText('member')).toBeInTheDocument();
  authMock.data = null;
  view.rerender(tree());
  expect(screen.getByText('No identity')).toBeInTheDocument();
  expect(
    client
      .getQueryCache()
      .findAll({ queryKey: ['protected'] })
      .filter((q) => q.state.data !== undefined),
  ).toHaveLength(0);
  expect(client.getQueryData(['get', '/api/health'])).toEqual({ status: 'ok' });
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

it('cancels a previous identity request and ignores its late response', async () => {
  const client = createAppQueryClient();
  let oldSignal: AbortSignal | undefined;
  let resolveOld: (value: string) => void = () => {
    throw new Error('Request not started');
  };
  const oldResponse = new Promise<string>((resolve) => {
    resolveOld = resolve;
  });
  const queryFn = vi.fn(({ signal }: { signal: AbortSignal }) => {
    if (authMock.data?.user.id === 'admin') {
      oldSignal = signal;
      return oldResponse;
    }
    return Promise.resolve('member data');
  });
  function Data() {
    const query = useQuery(
      protectedQueryOptions(getProtectedQueryScope(authMock.data), {
        queryKey: ['private'],
        queryFn,
      }),
    );
    return <p>{query.data ?? 'Loading'}</p>;
  }
  const tree = () => (
    <QueryClientProvider client={client}>
      <ProtectedQueryBoundary>
        <Data />
      </ProtectedQueryBoundary>
    </QueryClientProvider>
  );
  authMock.data = { user: { id: 'admin' }, session: { id: 'admin-session' } };
  const oldKey = getProtectedQueryKey(getProtectedQueryScope(authMock.data), ['private']);
  const view = render(tree());
  await waitFor(() => expect(queryFn).toHaveBeenCalledOnce());
  authMock.data = { user: { id: 'member' }, session: { id: 'member-session' } };
  view.rerender(tree());
  expect(await screen.findByText('member data')).toBeInTheDocument();
  expect(oldSignal?.aborted).toBe(true);
  await act(async () => {
    resolveOld('admin secret');
    await oldResponse;
  });
  expect(screen.queryByText('admin secret')).not.toBeInTheDocument();
  expect(client.getQueryData(oldKey)).toBeUndefined();
});
