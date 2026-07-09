import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Button } from './button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { EmptyState, ErrorState, LoadingState, UnauthorizedState } from './feedback-state';
import { ToastProvider } from './toast';
import { useToast } from './use-toast';

function ToastButton() {
  const { toast } = useToast();

  return (
    <Button
      onClick={() =>
        toast({
          description: 'The toast body is visible.',
          title: 'Toast created',
        })
      }
      type="button"
    >
      Show toast
    </Button>
  );
}

describe('UI primitives', () => {
  it('renders feedback states with stable roles', () => {
    render(
      <div>
        <LoadingState title="Loading data" />
        <EmptyState title="No records" />
        <UnauthorizedState title="Sign in required" />
        <ErrorState title="Could not save" />
      </div>,
    );

    expect(screen.getAllByRole('status')).toHaveLength(3);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save');
  });

  it('opens and closes the shared dialog', async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button">Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
            <DialogDescription>Review the action before continuing.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Close dialog</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Open dialog' }));

    expect(screen.getByRole('dialog', { name: 'Confirm action' })).toBeInTheDocument();
    expect(screen.getByText('Review the action before continuing.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows and dismisses a toast', async () => {
    render(
      <ToastProvider>
        <ToastButton />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Show toast' }));

    expect(await screen.findByText('Toast created')).toBeInTheDocument();
    expect(screen.getByText('The toast body is visible.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByText('Toast created')).not.toBeInTheDocument());
  });
});
