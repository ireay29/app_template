import { describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import { getMaintenanceSettings } from '../config/maintenance.js';
import { createAccessFixture } from '../test/access-fixture.js';
import { getRouteAccessManifest } from './route-registry.js';

const expectedPolicy: [string, string, string][] = [
  ['ALL', '/api/auth/*', 'public'],
  ['GET', '/api/admin/summary', 'admin'],
  ['GET', '/api/docs', 'public'],
  ['GET', '/api/greeting', 'public'],
  ['GET', '/api/health', 'public'],
  ['GET', '/api/maintenance', 'public'],
  ['GET', '/api/me', 'authenticated'],
  ['GET', '/api/notes', 'authenticated'],
  ['GET', '/api/openapi.json', 'public'],
  ['GET', '/api/ready', 'public'],
  ['POST', '/api/notes', 'authenticated'],
];

describe('application access policy inventory', () => {
  it('requires explicit review of every endpoint, including non-OpenAPI public adapters', () => {
    const { dependencies } = createAccessFixture();
    const app = createApp(dependencies, getMaintenanceSettings());
    const actual = getRouteAccessManifest(app).map(({ method, path, access }) => [
      method,
      path,
      access,
    ]);
    expect(actual).toEqual(expectedPolicy);
  });

  it('keeps every OpenAPI operation aligned with the expected access policy', () => {
    const { dependencies } = createAccessFixture();
    const app = createApp(dependencies, getMaintenanceSettings());
    const schema = app.getOpenAPIDocument({
      openapi: '3.0.3',
      info: { title: 'Policy test', version: '1' },
    });
    const operations = Object.entries(schema.paths ?? {}).flatMap(([path, item]) =>
      Object.entries(item ?? {}).flatMap(([method, operation]) =>
        ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'].includes(method)
          ? [[method.toUpperCase(), path, (operation as { 'x-access'?: string })['x-access']]]
          : [],
      ),
    );
    const adapters = ['/api/auth/*', '/api/docs', '/api/openapi.json'];
    expect(operations.sort()).toEqual(
      expectedPolicy.filter(([, path]) => !adapters.includes(path)).sort(),
    );
  });
});
