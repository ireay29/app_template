import Chip from '@mui/material/Chip';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/feedback-state';
import { apiQuery } from '@/lib/api/query';
import { getErrorMessage } from '@/lib/errors';

export function AdminPage() {
  const adminSummary = apiQuery.useQuery('get', '/api/admin/summary');

  return (
    <main className="bg-background text-foreground min-h-screen">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Admin area</CardTitle>
              <CardDescription>Protected page and admin-only API example.</CardDescription>
            </div>
            <Chip color="success" label="admin" size="small" variant="outlined" />
          </CardHeader>
          <CardContent className="space-y-4">
            {adminSummary.isPending && <LoadingState title="Checking admin access..." />}
            {adminSummary.isError && (
              <ErrorState
                description={getErrorMessage(
                  adminSummary.error,
                  'The current user cannot access the admin API.',
                )}
                title="Admin API access failed"
              />
            )}
            {adminSummary.isSuccess && (
              <div className="rounded-md border bg-zinc-50 p-4">
                <p className="text-sm font-medium text-zinc-950">{adminSummary.data.message}</p>
                <p className="text-muted-foreground mt-1 text-sm">Role: {adminSummary.data.role}</p>
              </div>
            )}
            <Button asChild variant="outline">
              <Link to="/">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
