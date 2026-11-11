import { describe, expect, it } from 'vitest';

import { getMaintenanceSettings, maintenanceEnvSchema } from './maintenance.js';

describe('maintenance configuration', () => {
  it('defaults to normal operation', () => {
    expect(getMaintenanceSettings()).toMatchObject({
      mode: 'off',
      retryAfterSeconds: 3600,
      endsAt: null,
      infoUrl: null,
    });
  });

  it('accepts an offset timestamp and a public status URL', () => {
    expect(
      getMaintenanceSettings({
        MAINTENANCE_MODE: 'read-only',
        MAINTENANCE_RETRY_AFTER_SECONDS: '900',
        MAINTENANCE_ENDS_AT: '2026-11-01T15:00:00+09:00',
        MAINTENANCE_INFO_URL: 'https://status.example.com/',
      }),
    ).toMatchObject({
      mode: 'read-only',
      retryAfterSeconds: 900,
      endsAt: '2026-11-01T15:00:00+09:00',
      infoUrl: 'https://status.example.com/',
    });
  });

  it.each([
    { MAINTENANCE_MODE: 'invalid' },
    { MAINTENANCE_MESSAGE: ' ' },
    { MAINTENANCE_RETRY_AFTER_SECONDS: '0' },
    { MAINTENANCE_RETRY_AFTER_SECONDS: '86401' },
    { MAINTENANCE_ENDS_AT: 'tomorrow' },
    { MAINTENANCE_INFO_URL: 'javascript:alert(1)' },
    { MAINTENANCE_INFO_URL: 'ftp://status.example.com/' },
  ])('rejects invalid settings: %j', (input) => {
    expect(() => maintenanceEnvSchema.parse(input)).toThrow();
  });
});
