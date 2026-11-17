import type {
  QueryClient,
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
} from '@tanstack/react-query';

type SessionIdentity = { user: { id: string }; session: { id: string } };

export const protectedQueryRoot = ['protected'] as const;

export function getProtectedQueryScope(session?: SessionIdentity | null) {
  return session ? JSON.stringify([session.user.id, session.session.id]) : null;
}

export function getProtectedQueryKey(scope: string | null, key: QueryKey) {
  return [...protectedQueryRoot, scope, ...key] as const;
}

export function discardProtectedQueries(queryClient: QueryClient, keepScope: string | null = null) {
  const filters = {
    queryKey: protectedQueryRoot,
    predicate: (query: { queryKey: QueryKey }) =>
      keepScope === null || query.queryKey[1] !== keepScope,
  };
  void queryClient.cancelQueries(filters);
  queryClient.removeQueries(filters);
}

export function protectedQueryOptions<TData, TKey extends QueryKey>(
  scope: string | null,
  options: { queryKey: TKey; queryFn: QueryFunction<TData, TKey> },
  enabled = true,
) {
  return {
    enabled: scope !== null && enabled,
    queryKey: getProtectedQueryKey(scope, options.queryKey),
    queryFn: (context: QueryFunctionContext) =>
      options.queryFn({ ...context, queryKey: options.queryKey }),
  };
}
