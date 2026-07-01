import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { authClient } from '@/lib/auth-client';
import { createNote, type DemoNote, getNotes } from '@/lib/notes-api';

export type Feedback = { type: 'idle' } | { type: 'success' | 'error'; message: string };

export type SubmitAction = 'signup' | 'signin' | 'note' | 'signout';

const demoEmail = `demo-${Math.random().toString(36).slice(2, 8)}@example.com`;
const notesQueryRoot = ['notes'] as const;
const signedOutNotesQueryKey = [...notesQueryRoot, 'signed-out'] as const;

function notesQueryKey(userId: string) {
  return [...notesQueryRoot, userId] as const;
}

const signInFormSchema = z.object({
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

const authFormSchema = signInFormSchema.extend({
  name: z.string().min(1, 'Name is required.'),
});

const noteFormSchema = z.object({
  body: z.string(),
  title: z
    .string()
    .trim()
    .min(1, 'Note title is required.')
    .max(120, 'Use 120 characters or fewer.'),
});

export type AuthFormValues = z.infer<typeof authFormSchema>;
type SignInFormValues = z.infer<typeof signInFormSchema>;
export type NoteFormValues = z.infer<typeof noteFormSchema>;

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
  const currentNotesQueryKey = session?.user?.id
    ? notesQueryKey(session.user.id)
    : signedOutNotesQueryKey;
  const userLabel = useMemo(() => {
    if (!session?.user) {
      return 'Signed out';
    }

    return session.user.email;
  }, [session?.user]);

  const notesQuery = useQuery({
    enabled: signedIn,
    queryFn: ({ signal }) => getNotes(signal),
    queryKey: currentNotesQueryKey,
  });

  const signUpMutation = useMutation({
    mutationFn: async (values: AuthFormValues) => {
      const result = await authClient.signUp.email(values);
      if (result.error) {
        throw new Error(result.error.message ?? 'Sign up failed.');
      }
    },
  });
  const signInMutation = useMutation({
    mutationFn: async (values: SignInFormValues) => {
      const result = await authClient.signIn.email({ ...values, rememberMe: true });
      if (result.error) {
        throw new Error(result.error.message ?? 'Sign in failed.');
      }
    },
  });
  const signOutMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut();
      if (result.error) {
        throw new Error(result.error.message ?? 'Sign out failed.');
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

  const submitting: SubmitAction | null = signUpMutation.isPending
    ? 'signup'
    : signInMutation.isPending
      ? 'signin'
      : createNoteMutation.isPending
        ? 'note'
        : signOutMutation.isPending
          ? 'signout'
          : null;

  const handleSignUp: SubmitHandler<AuthFormValues> = async (values) => {
    setFeedback({ type: 'idle' });

    try {
      await signUpMutation.mutateAsync(values);
      queryClient.removeQueries({ queryKey: notesQueryRoot });
      await refetch();
      setFeedback({ type: 'success', message: 'Signed up.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Sign up failed.',
      });
    }
  };

  async function handleSignIn() {
    setFeedback({ type: 'idle' });
    authForm.clearErrors();

    const result = signInFormSchema.safeParse(authForm.getValues());
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field === 'email' || field === 'password') {
          authForm.setError(field, { message: issue.message, type: 'manual' });
        }
      }
      return;
    }

    try {
      await signInMutation.mutateAsync(result.data);
      queryClient.removeQueries({ queryKey: notesQueryRoot });
      await refetch();
      setFeedback({ type: 'success', message: 'Signed in.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Sign in failed.',
      });
    }
  }

  async function handleSignOut() {
    setFeedback({ type: 'idle' });

    try {
      await signOutMutation.mutateAsync();
      queryClient.removeQueries({ queryKey: notesQueryRoot });
      await refetch();
      setFeedback({ type: 'success', message: 'Signed out.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Sign out failed.',
      });
    }
  }

  const handleCreateNote: SubmitHandler<NoteFormValues> = async (values) => {
    setFeedback({ type: 'idle' });

    try {
      await createNoteMutation.mutateAsync(values);
      setFeedback({ type: 'success', message: 'Note saved.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not save note.',
      });
    }
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
