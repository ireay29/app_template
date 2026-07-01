import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import MuiButton from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { PlayCircle, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DesignSystemCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Design systems</CardTitle>
        <CardDescription>Material UI and shadcn/ui components are ready to use.</CardDescription>
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
  );
}
