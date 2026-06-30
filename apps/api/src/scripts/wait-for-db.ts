import { checkDatabase, closeDatabase } from '../db/client.js';

const maxAttempts = Number(process.env.DB_WAIT_ATTEMPTS ?? 60);
const intervalMs = Number(process.env.DB_WAIT_INTERVAL_MS ?? 1000);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    await checkDatabase();
    console.log('Database is ready.');
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    if (attempt === maxAttempts) {
      console.error('Database did not become ready in time.');
      console.error(error);
      await closeDatabase().catch(() => undefined);
      process.exit(1);
    }

    await wait(intervalMs);
  }
}
