import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the API health state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input instanceof Request ? input.url : String(input);

        if (url.includes('/api/auth/get-session')) {
          return new Response(JSON.stringify(null), {
            headers: {
              'Content-Type': 'application/json',
            },
            status: 200,
          });
        }

        return new Response(
          JSON.stringify({
            status: 'ok',
            service: 'api',
            database: 'ok',
            uptime: 12.34,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
            },
            status: 200,
          },
        );
      }),
    );

    render(<App />);

    expect(await screen.findByText('API online')).toBeInTheDocument();
  });
});
