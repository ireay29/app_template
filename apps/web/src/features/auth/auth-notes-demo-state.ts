import { getProtectedQueryKey } from '@/lib/api/protected-query';

export type Feedback = { type: 'idle' } | { type: 'success' | 'error'; message: string };

export type SubmitAction = 'signup' | 'signin' | 'note' | 'signout';

export const authMessages = {
  note: {
    error: 'Could not save note.',
    success: 'Note saved.',
  },
  signin: {
    error: 'Sign in failed.',
    success: 'Signed in.',
  },
  signout: {
    error: 'Sign out failed.',
    success: 'Signed out.',
  },
  signup: {
    error: 'Sign up failed.',
    success: 'Signed up.',
  },
} satisfies Record<SubmitAction, { error: string; success: string }>;

export const notesQueryRoot = ['notes'] as const;

const submitActions = ['signup', 'signin', 'note', 'signout'] as const;

export function getNotesQueryKey(scope: string | null) {
  return getProtectedQueryKey(scope, notesQueryRoot);
}

export function getPendingSubmitAction(states: Record<SubmitAction, boolean>): SubmitAction | null {
  for (const action of submitActions) {
    if (states[action]) {
      return action;
    }
  }

  return null;
}
