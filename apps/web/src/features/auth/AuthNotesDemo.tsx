import { Loader2, LogIn, LogOut, NotebookPen, Plus, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  UnauthorizedState,
} from '@/components/ui/feedback-state';
import { FormField, TextArea, TextInput } from '@/components/ui/form-field';
import type { DemoNote } from '@/lib/notes-api';

import { type AuthNotesDemoModel, type Feedback, useAuthNotesDemo } from './useAuthNotesDemo';

export function AuthNotesDemo() {
  const model = useAuthNotesDemo();

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>Auth and notes</CardTitle>
          <CardDescription>{model.userLabel}</CardDescription>
        </div>
        {model.isPending ? (
          <Loader2
            className="text-muted-foreground size-5 animate-spin"
            aria-label="Checking session"
          />
        ) : model.signedIn ? (
          <Button
            disabled={model.submitting === 'signout'}
            onClick={model.handleSignOut}
            size="sm"
            type="button"
            variant="outline"
          >
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <AuthForm model={model} />
        <NotesPanel model={model} />
      </CardContent>
    </Card>
  );
}

function AuthForm({ model }: { model: AuthNotesDemoModel }) {
  const disabled = model.submitting !== null || model.isPending;
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = model.authForm;

  return (
    <form className="space-y-3" onSubmit={handleSubmit(model.handleSignUp)}>
      <FormField error={errors.name?.message} label="Name">
        <TextInput {...register('name')} />
      </FormField>
      <FormField error={errors.email?.message} label="Email">
        <TextInput type="email" {...register('email')} />
      </FormField>
      <FormField error={errors.password?.message} label="Password">
        <TextInput type="password" {...register('password')} />
      </FormField>
      <div className="flex flex-wrap gap-2">
        <Button disabled={disabled} type="submit">
          <UserPlus aria-hidden="true" />
          Sign up
        </Button>
        <Button
          disabled={disabled}
          onClick={() => void model.handleSignIn()}
          type="button"
          variant="secondary"
        >
          <LogIn aria-hidden="true" />
          Sign in
        </Button>
      </div>
      <FeedbackMessage feedback={model.feedback} />
    </form>
  );
}

function NotesPanel({ model }: { model: AuthNotesDemoModel }) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = model.noteForm;
  const title = watch('title');

  return (
    <div className="space-y-4">
      <form className="space-y-3" onSubmit={handleSubmit(model.handleCreateNote)}>
        <FormField error={errors.title?.message} label="Note title">
          <TextInput disabled={!model.signedIn} maxLength={120} {...register('title')} />
        </FormField>
        <FormField error={errors.body?.message} label="Body">
          <TextArea disabled={!model.signedIn} {...register('body')} />
        </FormField>
        <Button
          disabled={!model.signedIn || model.submitting !== null || title.trim().length === 0}
          type="submit"
        >
          <Plus aria-hidden="true" />
          Save note
        </Button>
      </form>

      <NotesList
        error={model.notesQuery.error}
        loading={model.notesQuery.isPending && model.signedIn}
        notes={model.notes}
        signedIn={model.signedIn}
      />
    </div>
  );
}

function NotesList({
  error,
  loading,
  notes,
  signedIn,
}: {
  error: unknown;
  loading: boolean;
  notes: DemoNote[];
  signedIn: boolean;
}) {
  if (!signedIn) {
    return <UnauthorizedState title="Sign in to manage notes." />;
  }

  if (loading) {
    return <LoadingState title="Loading notes..." />;
  }

  if (error) {
    return (
      <ErrorState
        description={error instanceof Error ? error.message : 'Failed to load notes.'}
        title="Could not load notes"
      />
    );
  }

  return (
    <div className="rounded-md border bg-zinc-50 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <NotebookPen className="size-4 text-teal-700" aria-hidden="true" />
        Notes
      </div>
      {notes.length === 0 && <EmptyState className="min-h-20" title="No notes yet." />}
      {notes.length > 0 && (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li className="rounded-md border bg-white p-3" key={note.id}>
              <p className="text-sm font-medium">{note.title}</p>
              {note.body && <p className="text-muted-foreground mt-1 text-sm">{note.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (feedback.type === 'idle') {
    return null;
  }

  return (
    <p
      className={
        feedback.type === 'success'
          ? 'text-sm font-medium text-teal-700'
          : 'text-sm font-medium text-red-700'
      }
      role="status"
    >
      {feedback.message}
    </p>
  );
}
