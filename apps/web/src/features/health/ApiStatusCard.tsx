import { ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/feedback-state';
import { getErrorMessage } from '@/lib/errors';

import { useHealthQuery } from './useHealthQuery';

export function ApiStatusCard() {
  const health = useHealthQuery();
  const state = health.isPending ? 'loading' : health.isError ? 'error' : 'ready';

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>API status</CardTitle>
          <CardDescription>Read through the Vite dev proxy.</CardDescription>
        </div>
        <StatusChip state={state} />
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-zinc-950 p-4 font-mono text-sm text-zinc-50">
          <span className="sr-only">API health response</span>
          {health.isPending && (
            <LoadingState
              className="min-h-24 border-zinc-800 bg-zinc-900 text-zinc-50"
              title="Checking /api/health..."
            />
          )}
          {health.isError && (
            <ErrorState
              className="min-h-24 border-zinc-800 bg-zinc-900 text-zinc-50"
              description={getErrorMessage(health.error, 'Unknown API error')}
              title="API health check failed"
            />
          )}
          {health.isSuccess && (
            <pre className="overflow-x-auto">
              {JSON.stringify(
                {
                  service: health.data.service,
                  status: health.data.status,
                  uptime: Number(health.data.uptime.toFixed(2)),
                },
                null,
                2,
              )}
            </pre>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild>
            <a href="/api/docs" rel="noreferrer" target="_blank">
              <ExternalLink aria-hidden="true" />
              API docs
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/openapi.json" rel="noreferrer" target="_blank">
              OpenAPI JSON
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusChip({ state }: { state: 'loading' | 'ready' | 'error' }) {
  const label = state === 'ready' ? 'API online' : state === 'error' ? 'API offline' : 'Checking';
  const className =
    state === 'ready'
      ? 'border-teal-200 bg-teal-50 text-teal-700'
      : state === 'error'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-zinc-200 bg-zinc-50 text-zinc-600';

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
