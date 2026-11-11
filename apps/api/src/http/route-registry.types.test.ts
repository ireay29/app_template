import { createRoute, z } from '@hono/zod-openapi';
import { expectTypeOf, it } from 'vitest';

import type { createRouteRegistry, RouteRegistrar } from './route-registry.js';

const route = createRoute({
  method: 'get',
  path: '/api/typed',
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.object({ value: z.string() }) } },
    },
  },
});

// Checked by tsc, never executed: invalid declarations must remain compile errors.
function checkRegistrationTypes(registrar: RouteRegistrar) {
  // @ts-expect-error An explicit access declaration is required.
  registrar.openapi(route, (c) => c.json({ value: 'x' }, 200));
  // @ts-expect-error Arbitrary role names cannot replace an access policy.
  registrar.openapi(route, 'member', (c) => c.json({ value: 'x' }, 200));
  registrar.openapi(route, 'public', (c) => {
    // @ts-expect-error A public handler has no guaranteed principal.
    const role = c.get('principal').role;
    return c.json({ value: role }, 200);
  });
  registrar.openapi(route, 'authenticated', (c) => {
    const principal = c.get('principal');
    expectTypeOf(principal.authSession.user.id).toEqualTypeOf<string>();
    return c.json({ value: principal.authSession.user.id }, 200);
  });
  registrar.openapi(route, 'admin', (c) => {
    expectTypeOf(c.get('principal').role).toEqualTypeOf<'admin'>();
    return c.json({ value: c.get('principal').role }, 200);
  });
}

it('preserves typed principal access without exposing raw Hono registration', () => {
  expectTypeOf(checkRegistrationTypes).toBeFunction();
  expectTypeOf<RouteRegistrar>().not.toHaveProperty('get');
  expectTypeOf<RouteRegistrar>().not.toHaveProperty('use');
  expectTypeOf<ReturnType<typeof createRouteRegistry>>().not.toHaveProperty('use');
});
