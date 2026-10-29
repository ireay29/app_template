import { RouterProvider } from 'react-router-dom';

import { MaintenanceBoundary } from './features/maintenance/MaintenanceBoundary';
import { router } from './routes/router';

export function App() {
  return (
    <MaintenanceBoundary>
      <RouterProvider router={router} />
    </MaintenanceBoundary>
  );
}
