import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import MuiButton from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { Bell, Info, PlayCircle, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

export function DesignSystemCard() {
  const { toast } = useToast();

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
            <Button
              onClick={() =>
                toast({
                  description: 'The shared toast provider is mounted at the app root.',
                  title: 'Toast ready',
                })
              }
              size="sm"
              variant="outline"
            >
              <Bell aria-hidden="true" />
              Toast
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Info aria-hidden="true" />
                  Dialog
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Shared dialog</DialogTitle>
                  <DialogDescription>
                    Dialog primitives are available for confirmations and focused workflows.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button">Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
