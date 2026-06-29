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
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            status: 'ok',
            service: 'api',
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
