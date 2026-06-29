import { useEffect, useState } from 'react';
import { getHealth, type HealthResponse } from './lib/api';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: HealthResponse }
  | { status: 'error'; message: string };

export function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    getHealth(controller.signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown API error',
        });
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            TypeScript workspace
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
            Vite React frontend with a Hono API.
          </h1>
          <p className="mt-5 text-base leading-7 text-zinc-600">
            A small production-leaning template with Tailwind CSS, OpenAPI, linting, formatting, and
            tests already wired together.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">API status</h2>
                <p className="mt-1 text-sm text-zinc-500">Read through the Vite dev proxy.</p>
              </div>
              <StatusBadge state={state.status} />
            </div>

            <div className="mt-6 rounded-md bg-zinc-950 p-4 font-mono text-sm text-zinc-50">
              {state.status === 'loading' && <span>Checking /api/health...</span>}
              {state.status === 'error' && <span>{state.message}</span>}
              {state.status === 'ready' && (
                <pre className="overflow-x-auto">
                  {JSON.stringify(
                    {
                      status: state.data.status,
                      service: state.data.service,
                      uptime: Number(state.data.uptime.toFixed(2)),
                    },
                    null,
                    2,
                  )}
                </pre>
              )}
            </div>
          </section>

          <aside className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Local links</h2>
            <div className="mt-4 grid gap-3">
              <a
                className="rounded-md border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-800 transition hover:border-teal-300 hover:bg-teal-50"
                href="/api/docs"
                rel="noreferrer"
                target="_blank"
              >
                API docs
              </a>
              <a
                className="rounded-md border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-800 transition hover:border-teal-300 hover:bg-teal-50"
                href="/api/openapi.json"
                rel="noreferrer"
                target="_blank"
              >
                OpenAPI JSON
              </a>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function StatusBadge({ state }: { state: LoadState['status'] }) {
  const label = state === 'ready' ? 'API online' : state === 'error' ? 'API offline' : 'Checking';
  const className =
    state === 'ready'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : state === 'error'
        ? 'bg-red-50 text-red-700 ring-red-200'
        : 'bg-zinc-100 text-zinc-700 ring-zinc-200';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${className}`}>
      {label}
    </span>
  );
}
