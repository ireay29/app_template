import { serve } from '@hono/node-server';

import { app } from './app.js';
import { env } from './config/env.js';
import { closeDatabase } from './db/client.js';

const server = serve(
  {
    fetch: app.fetch,
    hostname: env.HOST,
    port: env.PORT,
  },
  (info) => {
    console.log(`API server listening on http://${env.HOST}:${info.port}`);
    console.log(`API docs available at http://${env.HOST}:${info.port}/api/docs`);
  },
);

async function shutdown(signal: NodeJS.Signals) {
  console.log(`Received ${signal}. Shutting down API server.`);
  server.close();
  await closeDatabase();
}

process.once('SIGINT', (signal) => {
  void shutdown(signal).finally(() => process.exit(0));
});

process.once('SIGTERM', (signal) => {
  void shutdown(signal).finally(() => process.exit(0));
});
