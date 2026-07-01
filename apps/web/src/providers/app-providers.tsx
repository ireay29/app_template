import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useState } from 'react';

import { ToastProvider } from '@/components/ui/toast';
import { createAppQueryClient } from '@/lib/query-client';

import { DesignSystemProvider } from './design-system-provider';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => createAppQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <DesignSystemProvider>
        <ToastProvider>{children}</ToastProvider>
      </DesignSystemProvider>
    </QueryClientProvider>
  );
}
