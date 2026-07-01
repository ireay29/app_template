import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type FormFieldProps = {
  children: ReactNode;
  error?: string;
  label: string;
};

export function FormField({ children, error, label }: FormFieldProps) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error && (
        <span className="block text-xs font-medium text-red-700" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-md border bg-white px-3 text-sm outline-none focus:border-teal-700 disabled:cursor-not-allowed disabled:bg-zinc-100',
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'min-h-20 w-full resize-y rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-teal-700 disabled:cursor-not-allowed disabled:bg-zinc-100',
        className,
      )}
      {...props}
    />
  );
}
