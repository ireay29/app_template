import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import MuiButton from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { ExternalLink, PlayCircle, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <main className="bg-background text-foreground min-h-screen">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-12">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-teal-700 uppercase">
            TypeScript workspace
          </p>
          <h1 className="mt-3 text-4xl leading-tight font-semibold text-zinc-950 sm:text-5xl">
            Vite React frontend with a Hono API.
          </h1>
          <p className="mt-5 text-base leading-7 text-zinc-600 md:text-lg">
            A compact workspace with Tailwind CSS, OpenAPI, design-system examples, and verification
            commands already wired together.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>API status</CardTitle>
                <CardDescription>Read through the Vite dev proxy.</CardDescription>
              </div>
              <StatusChip state={state.status} />
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-zinc-950 p-4 font-mono text-sm text-zinc-50">
                <span className="sr-only">API health response</span>
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

          <Card>
            <CardHeader>
              <CardTitle>Design systems</CardTitle>
              <CardDescription>
                Material UI and shadcn/ui components are ready to use.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/40 rounded-md border p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="size-4 text-teal-700" aria-hidden="true" />
                  shadcn/ui
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm">
                    <PlayCircle aria-hidden="true" />
                    Primary
                  </Button>
                  <Button size="sm" variant="secondary">
                    Secondary
                  </Button>
                </div>
              </div>

              <div className="rounded-md border bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Material UI</span>
                  <Chip color="primary" label="ready" size="small" variant="outlined" />
                </div>
                <MuiButton
                  component="a"
                  endIcon={<OpenInNewRoundedIcon fontSize="small" />}
                  href="/api/health"
                  size="small"
                  variant="contained"
                >
                  Check health
                </MuiButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function StatusChip({ state }: { state: LoadState['status'] }) {
  const label = state === 'ready' ? 'API online' : state === 'error' ? 'API offline' : 'Checking';
  const color = state === 'ready' ? 'success' : state === 'error' ? 'error' : 'default';

  return <Chip color={color} label={label} size="small" variant="outlined" />;
}
