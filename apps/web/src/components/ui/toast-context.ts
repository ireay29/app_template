import { createContext, type ReactNode } from 'react';

export type ToastVariant = 'default' | 'destructive';

export type ToastInput = {
  description?: ReactNode;
  title: ReactNode;
  variant?: ToastVariant;
};

export type ToastRecord = Required<Pick<ToastInput, 'title' | 'variant'>> &
  Pick<ToastInput, 'description'> & {
    id: string;
  };

export type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function createToastRecord(input: ToastInput): ToastRecord {
  const id = `toast-${toastCounter}`;
  toastCounter += 1;

  return {
    id,
    description: input.description,
    title: input.title,
    variant: input.variant ?? 'default',
  };
}
