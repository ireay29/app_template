import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { createNote, type DemoNote, getNotes } from '@/lib/api/notes';
import { authClient } from '@/lib/auth-client';
import { getErrorMessage } from '@/lib/errors';

import {
  authFormSchema,
  type AuthFormValues,
  noteFormSchema,
  type NoteFormValues,
  signInFormSchema,
  type SignInFormValues,
} from './auth-notes-demo-schema';
import {
  authMessages,
  type Feedback,
  getNotesQueryKey,
  getPendingSubmitAction,
  notesQueryRoot,
} from './auth-notes-demo-state';

export type { Feedback, SubmitAction } from './auth-notes-demo-state';

const demoEmail = `demo-${Math.random().toString(36).slice(2, 8)}@example.com`;

export function useAuthNotesDemo() {
  const queryClient = useQueryClient();
  const { data: session, isPending: isSessionPending, refetch } = authClient.useSession();
  const [feedback, setFeedback] = useState<Feedback>({ type: 'idle' });

  const authForm = useForm<AuthFormValues>({
    defaultValues: {
      email: demoEmail,
      name: 'Template User',
      password: 'password1234',
    },
    resolver: zodResolver(authFormSchema),
  });
  const noteForm = useForm<NoteFormValues>({
    defaultValues: {
      body: 'Saved through an authenticated Hono route.',
      title: 'First note',
    },
    resolver: zodResolver(noteFormSchema),
  });
  const signedIn = Boolean(session?.user);
  const currentNotesQueryKey = getNotesQueryKey(session?.user?.id);
  const userLabel = session?.user?.email ?? 'Signed out';

  const notesQuery = useQuery({
    enabled: signedIn,
    queryFn: ({ signal }) => getNotes(signal),
    queryKey: currentNotesQueryKey,
  });

  const signUpMutation = useMutation({
    mutationFn: async (values: AuthFormValues) => {
      const result = await authClient.signUp.email(values);
      if (result.error) {
        throw new Error(result.error.message ?? authMessages.signup.error);
      }
    },
  });
  const signInMutation = useMutation({
    mutationFn: async (values: SignInFormValues) => {
      const result = await authClient.signIn.email({ ...values, rememberMe: true });
      if (result.error) {
        throw new Error(result.error.message ?? authMessages.signin.error);
      }
    },
  });
  const signOutMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut();
      if (result.error) {
        throw new Error(result.error.message ?? authMessages.signout.error);
      }
    },
  });
  const createNoteMutation = useMutation({
    mutationFn: async (values: NoteFormValues) =>
      createNote({
        body: values.body.trim() || undefined,
        title: values.title.trim(),
      }),
    onSuccess: (note) => {
      queryClient.setQueryData<DemoNote[]>(currentNotesQueryKey, (current) => [
        note,
        ...(current ?? []),
      ]);
      noteForm.reset({ body: '', title: '' });
    },
  });

  const submitting = getPendingSubmitAction({
    note: createNoteMutation.isPending,
    signin: signInMutation.isPending,
    signout: signOutMutation.isPending,
    signup: signUpMutation.isPending,
  });

  async function refreshSessionNotes() {
    queryClient.removeQueries({ queryKey: notesQueryRoot });
    await refetch();
  }

  async function runWithFeedback(action: () => Promise<void>, success: string, error: string) {
    setFeedback({ type: 'idle' });

    try {
      await action();
      setFeedback({ type: 'success', message: success });
    } catch (caughtError) {
      setFeedback({ type: 'error', message: getErrorMessage(caughtError, error) });
    }
  }

  const handleSignUp: SubmitHandler<AuthFormValues> = async (values) => {
    await runWithFeedback(
      async () => {
        await signUpMutation.mutateAsync(values);
        await refreshSessionNotes();
      },
      authMessages.signup.success,
      authMessages.signup.error,
    );
  };

  async function handleSignIn() {
    setFeedback({ type: 'idle' });
    authForm.clearErrors();

    const result = signInFormSchema.safeParse(authForm.getValues());
    if (!result.success) {
      for (const issue of result.error.issues) {
        const [field] = issue.path;
        if (field === 'email' || field === 'password') {
          authForm.setError(field, { message: issue.message, type: 'manual' });
        }
      }
      return;
    }

    await runWithFeedback(
      async () => {
        await signInMutation.mutateAsync(result.data);
        await refreshSessionNotes();
      },
      authMessages.signin.success,
      authMessages.signin.error,
    );
  }

  async function handleSignOut() {
    await runWithFeedback(
      async () => {
        await signOutMutation.mutateAsync();
        await refreshSessionNotes();
      },
      authMessages.signout.success,
      authMessages.signout.error,
    );
  }

  const handleCreateNote: SubmitHandler<NoteFormValues> = async (values) => {
    await runWithFeedback(
      async () => {
        await createNoteMutation.mutateAsync(values);
      },
      authMessages.note.success,
      authMessages.note.error,
    );
  };

  return {
    authForm,
    feedback,
    handleCreateNote,
    handleSignIn,
    handleSignOut,
    handleSignUp,
    isPending: isSessionPending,
    noteForm,
    notes: signedIn ? (notesQuery.data ?? []) : [],
    notesQuery,
    signedIn,
    submitting,
    userLabel,
  };
}

export type AuthNotesDemoModel = ReturnType<typeof useAuthNotesDemo>;
