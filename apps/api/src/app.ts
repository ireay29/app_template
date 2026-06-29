import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';
import { greetingRoute } from './routes/greeting.js';
import { healthRoute } from './routes/health.js';

export function createApp() {
  const app = new OpenAPIHono();

  app.use('*', timing());
  app.use(
    '/api/*',
    cors({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    }),
  );

  app.openapi(healthRoute, (c) => {
    return c.json({
      status: 'ok',
      service: 'api',
      uptime: process.uptime(),
    });
  });

  app.openapi(greetingRoute, (c) => {
    const query = c.req.valid('query');
    const name = query.name ?? 'friend';

    return c.json({
      message: `Hello, ${name}.`,
    });
  });

  app.doc('/api/openapi.json', {
    openapi: '3.0.3',
    info: {
      title: 'App Template API',
      version: '0.1.0',
    },
  });

  app.get(
    '/api/docs',
    swaggerUI({
      url: '/api/openapi.json',
    }),
  );

  app.notFound((c) => {
    return c.json(
      {
        error: 'Not Found',
      },
      404,
    );
  });

  app.onError((error, c) => {
    console.error(error);

    return c.json(
      {
        error: 'Internal Server Error',
      },
      500,
    );
  });

  return app;
}

export const app = createApp();
export type AppType = typeof app;
