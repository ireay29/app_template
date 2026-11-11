import type { PropsWithChildren } from 'react';

import { MaintenanceNotice } from '@/components/ui/maintenance-notice';

import { MaintenanceModeContext } from './maintenance-context';
import { useMaintenanceQuery } from './queries';

export function MaintenanceBoundary({ children }: PropsWithChildren) {
  const { data } = useMaintenanceQuery();
  const mode = data?.mode ?? 'off';

  return (
    <MaintenanceModeContext value={mode}>
      {data && mode !== 'off' && <MaintenanceNotice {...data} fullPage={mode === 'full'} />}
      {mode !== 'full' && children}
    </MaintenanceModeContext>
  );
}
