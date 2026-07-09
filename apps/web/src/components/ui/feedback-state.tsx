import { AlertCircle, Ban, Inbox, Loader2, ShieldX } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type FeedbackStateProps = {
  action?: ReactNode;
  className?: string;
  description?: string;
  title: string;
  variant: 'loading' | 'empty' | 'error' | 'forbidden' | 'unauthorized';
};

const icons = {
  empty: Inbox,
  error: AlertCircle,
  forbidden: ShieldX,
  loading: Loader2,
  unauthorized: Ban,
};

export function FeedbackState({
  action,
  className,
  description,
  title,
  variant,
}: FeedbackStateProps) {
  const Icon = icons[variant];

  return (
    <div
      className={cn(
        'flex min-h-28 flex-col items-center justify-center rounded-md border bg-zinc-50 p-5 text-center',
        className,
      )}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <Icon
        aria-hidden="true"
        className={cn('mb-3 size-5 text-teal-700', variant === 'loading' && 'animate-spin')}
      />
      <p className="text-sm font-medium text-zinc-950">{title}</p>
      {description && <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState(props: Omit<FeedbackStateProps, 'variant'>) {
  return <FeedbackState {...props} variant="loading" />;
}

export function EmptyState(props: Omit<FeedbackStateProps, 'variant'>) {
  return <FeedbackState {...props} variant="empty" />;
}

export function ErrorState(props: Omit<FeedbackStateProps, 'variant'>) {
  return <FeedbackState {...props} variant="error" />;
}

export function ForbiddenState(props: Omit<FeedbackStateProps, 'variant'>) {
  return <FeedbackState {...props} variant="forbidden" />;
}

export function UnauthorizedState(props: Omit<FeedbackStateProps, 'variant'>) {
  return <FeedbackState {...props} variant="unauthorized" />;
}
