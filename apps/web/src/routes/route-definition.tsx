import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';

import { type RouteAccess, RouteAccessGuard } from './route-access';

type AppRoute = RouteObject & {
  element: ReactNode;
  handle: {
    access: RouteAccess;
  };
};

export function defineRoute({ element, handle, ...route }: AppRoute): RouteObject {
  return {
    ...route,
    element: <RouteAccessGuard access={handle.access}>{element}</RouteAccessGuard>,
    handle,
  } as RouteObject;
}
