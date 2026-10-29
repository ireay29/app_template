import { z } from 'zod';

export const maintenanceModeSchema = z.enum(['off', 'read-only', 'full']);

export const maintenanceEnvSchema = z.object({
  MAINTENANCE_MODE: maintenanceModeSchema.default('off'),
  MAINTENANCE_MESSAGE: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .default('ただいまメンテナンスを実施しています。'),
  MAINTENANCE_RETRY_AFTER_SECONDS: z.coerce.number().int().min(1).max(86_400).default(3600),
  MAINTENANCE_ENDS_AT: z.string().datetime({ offset: true }).optional(),
  MAINTENANCE_INFO_URL: z
    .string()
    .url()
    .refine(
      (value) => URL.canParse(value) && ['http:', 'https:'].includes(new URL(value).protocol),
      {
        message: 'MAINTENANCE_INFO_URL must use HTTP or HTTPS.',
      },
    )
    .optional(),
});

export function getMaintenanceSettings(input: z.input<typeof maintenanceEnvSchema> = {}) {
  const values = maintenanceEnvSchema.parse(input);

  return {
    mode: values.MAINTENANCE_MODE,
    message: values.MAINTENANCE_MESSAGE,
    retryAfterSeconds: values.MAINTENANCE_RETRY_AFTER_SECONDS,
    endsAt: values.MAINTENANCE_ENDS_AT ?? null,
    infoUrl: values.MAINTENANCE_INFO_URL ?? null,
  };
}

export type MaintenanceSettings = ReturnType<typeof getMaintenanceSettings>;
