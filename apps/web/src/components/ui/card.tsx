import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'border-border bg-card text-card-foreground rounded-lg border shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />;
}

function CardTitle({ className, ...props }: ComponentProps<'h2'>) {
  return <h2 className={cn('text-lg leading-none font-semibold', className)} {...props} />;
}

function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle };
