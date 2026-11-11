import { createContext } from 'react';

import type { MaintenanceStatus } from './queries';

export const MaintenanceModeContext = createContext<MaintenanceStatus['mode']>('off');
