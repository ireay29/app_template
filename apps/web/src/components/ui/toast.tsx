import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { type PropsWithChildren, useCallback, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import {
  createToastRecord,
  ToastContext,
  type ToastInput,
  type ToastRecord,
} from './toast-context';

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    setToasts((current) => [...current, createToastRecord(input)]);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((toast) => (
          <ToastItem key={toast.id} onClose={() => removeToast(toast.id)} toast={toast} />
        ))}
        <ToastViewport />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

function ToastItem({ onClose, toast }: { onClose: () => void; toast: ToastRecord }) {
  return (
    <ToastPrimitive.Root
      className={cn(
        'bg-background text-foreground grid w-full max-w-sm grid-cols-[1fr_auto] items-start gap-3 rounded-md border p-4 shadow-lg',
        toast.variant === 'destructive' && 'border-destructive text-destructive',
      )}
      duration={4000}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <div className="space-y-1">
        <ToastPrimitive.Title className="text-sm font-semibold">{toast.title}</ToastPrimitive.Title>
        {toast.description && (
          <ToastPrimitive.Description className="text-muted-foreground text-sm">
            {toast.description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close className="focus-visible:ring-ring rounded-sm opacity-70 outline-none hover:opacity-100 focus-visible:ring-2">
        <X className="size-4" aria-hidden="true" />
        <span className="sr-only">Close</span>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

function ToastViewport() {
  return (
    <ToastPrimitive.Viewport className="fixed right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 outline-none" />
  );
}
