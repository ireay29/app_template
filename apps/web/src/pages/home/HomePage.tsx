import { ShieldCheck } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/feedback-state';
import { AuthNotesDemo } from '@/features/auth/AuthNotesDemo';
import { ApiStatusCard } from '@/features/health/ApiStatusCard';

const DesignSystemCard = lazy(() =>
  import('@/features/design-system/DesignSystemCard').then((module) => ({
    default: module.DesignSystemCard,
  })),
);

export function HomePage() {
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
          <div className="mt-5">
            <Button asChild variant="outline">
              <Link to="/admin">
                <ShieldCheck aria-hidden="true" />
                Admin area
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <ApiStatusCard />
          <Suspense fallback={<LoadingState title="Loading design system examples..." />}>
            <DesignSystemCard />
          </Suspense>
        </div>

        <div className="mt-4">
          <AuthNotesDemo />
        </div>
      </section>
    </main>
  );
}
