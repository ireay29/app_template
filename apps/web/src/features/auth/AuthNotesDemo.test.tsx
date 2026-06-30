import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  sessionState: {
    data: null as {
      user: { id: string; email: string; name: string; image: string | null };
      session: { id: string; expiresAt: string };
    } | null,
    isPending: false,
  },
  refetch: vi.fn(),
  signUpEmail: vi.fn(),
  signInEmail: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({
      data: authMock.sessionState.data,
      isPending: authMock.sessionState.isPending,
      isRefetching: false,
      error: null,
      refetch: authMock.refetch,
    }),
    signUp: {
      email: authMock.signUpEmail,
    },
    signIn: {
      email: authMock.signInEmail,
    },
    signOut: authMock.signOut,
  },
}));

import { AuthNotesDemo } from './AuthNotesDemo';

describe('AuthNotesDemo', () => {
  beforeEach(() => {
    authMock.sessionState.data = null;
    authMock.sessionState.isPending = false;
    authMock.refetch.mockResolvedValue(undefined);
    authMock.signUpEmail.mockResolvedValue({ data: {}, error: null });
    authMock.signInEmail.mockResolvedValue({ data: {}, error: null });
    authMock.signOut.mockResolvedValue({ data: {}, error: null });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('shows the signed-out state', () => {
    render(<AuthNotesDemo />);

    expect(screen.getByText('Signed out')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save note' })).toBeDisabled();
  });

  it('creates a note for a signed-in user', async () => {
    authMock.sessionState.data = {
      user: {
        id: 'user_123',
        email: 'user@example.com',
        name: 'User',
        image: null,
      },
      session: {
        id: 'session_123',
        expiresAt: '2026-07-01T00:00:00.000Z',
      },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'POST') {
          return new Response(
            JSON.stringify({
              note: {
                id: '01234567-89ab-cdef-0123-456789abcdef',
                title: 'Created note',
                body: 'Saved in the test.',
                createdAt: '2026-06-30T00:00:00.000Z',
                updatedAt: '2026-06-30T00:00:00.000Z',
              },
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 201,
            },
          );
        }

        return new Response(JSON.stringify({ notes: [] }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        });
      }),
    );

    render(<AuthNotesDemo />);
    await waitFor(() => expect(screen.getByText('No notes yet.')).toBeInTheDocument());

    await userEvent.clear(screen.getByLabelText('Note title'));
    await userEvent.type(screen.getByLabelText('Note title'), 'Created note');
    await userEvent.clear(screen.getByLabelText('Body'));
    await userEvent.type(screen.getByLabelText('Body'), 'Saved in the test.');
    await userEvent.click(screen.getByRole('button', { name: 'Save note' }));

    expect(await screen.findByText('Created note')).toBeInTheDocument();
    expect(screen.getByText('Saved in the test.')).toBeInTheDocument();
  });
});
