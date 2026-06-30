import { FormEvent, useEffect, useMemo, useState } from 'react';

import { authClient } from '@/lib/auth-client';
import { createNote, type DemoNote, getNotes } from '@/lib/notes-api';

export type Feedback = { type: 'idle' } | { type: 'success' | 'error'; message: string };

export type SubmitAction = 'signup' | 'signin' | 'note' | 'signout';

const demoEmail = `demo-${Math.random().toString(36).slice(2, 8)}@example.com`;

export function useAuthNotesDemo() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const [email, setEmail] = useState(demoEmail);
  const [name, setName] = useState('Template User');
  const [password, setPassword] = useState('password1234');
  const [title, setTitle] = useState('First note');
  const [body, setBody] = useState('Saved through an authenticated Hono route.');
  const [notes, setNotes] = useState<DemoNote[]>([]);
  const [submitting, setSubmitting] = useState<SubmitAction | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({ type: 'idle' });

  const signedIn = Boolean(session?.user);
  const userLabel = useMemo(() => {
    if (!session?.user) {
      return 'Signed out';
    }

    return session.user.email;
  }, [session?.user]);

  useEffect(() => {
    if (!signedIn) {
      return;
    }

    const controller = new AbortController();

    getNotes(controller.signal)
      .then((items) => setNotes(items))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setFeedback({
            type: 'error',
            message: error instanceof Error ? error.message : 'Failed to load notes.',
          });
        }
      });

    return () => controller.abort();
  }, [signedIn, session?.user?.id]);

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting('signup');
    setFeedback({ type: 'idle' });

    try {
      const result = await authClient.signUp.email({ email, password, name });
      if (result.error) {
        throw new Error(result.error.message ?? 'Sign up failed.');
      }

      await refetch();
      setFeedback({ type: 'success', message: 'Signed up.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Sign up failed.',
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleSignIn() {
    setSubmitting('signin');
    setFeedback({ type: 'idle' });

    try {
      const result = await authClient.signIn.email({ email, password, rememberMe: true });
      if (result.error) {
        throw new Error(result.error.message ?? 'Sign in failed.');
      }

      await refetch();
      setFeedback({ type: 'success', message: 'Signed in.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Sign in failed.',
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleSignOut() {
    setSubmitting('signout');
    setFeedback({ type: 'idle' });

    try {
      const result = await authClient.signOut();
      if (result.error) {
        throw new Error(result.error.message ?? 'Sign out failed.');
      }

      setNotes([]);
      await refetch();
      setFeedback({ type: 'success', message: 'Signed out.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Sign out failed.',
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCreateNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting('note');
    setFeedback({ type: 'idle' });

    try {
      const note = await createNote({ title, body: body || undefined });
      setNotes((current) => [note, ...current]);
      setTitle('');
      setBody('');
      setFeedback({ type: 'success', message: 'Note saved.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not save note.',
      });
    } finally {
      setSubmitting(null);
    }
  }

  return {
    body,
    email,
    feedback,
    handleCreateNote,
    handleSignIn,
    handleSignOut,
    handleSignUp,
    isPending,
    name,
    notes,
    password,
    setBody,
    setEmail,
    setName,
    setPassword,
    setTitle,
    signedIn,
    submitting,
    title,
    userLabel,
  };
}

export type AuthNotesDemoModel = ReturnType<typeof useAuthNotesDemo>;
