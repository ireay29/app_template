import { serve } from '@hono/node-server';

import { app } from './app.js';
import { env } from './config/env.js';

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`API server listening on http://localhost:${info.port}`);
    console.log(`API docs available at http://localhost:${info.port}/api/docs`);
  },
);
