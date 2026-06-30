import { Loader2, LogIn, LogOut, NotebookPen, Plus, UserPlus } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DemoNote } from '@/lib/notes-api';

import { type AuthNotesDemoModel, type Feedback, useAuthNotesDemo } from './useAuthNotesDemo';

const inputClassName =
  'h-9 w-full rounded-md border bg-white px-3 text-sm outline-none focus:border-teal-700';
const textareaClassName =
  'min-h-20 w-full resize-y rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-teal-700';

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

  return (
    <form className="space-y-3" onSubmit={model.handleSignUp}>
      <Field label="Name">
        <input
          className={inputClassName}
          onChange={(event) => model.setName(event.target.value)}
          value={model.name}
        />
      </Field>
      <Field label="Email">
        <input
          className={inputClassName}
          onChange={(event) => model.setEmail(event.target.value)}
          type="email"
          value={model.email}
        />
      </Field>
      <Field label="Password">
        <input
          className={inputClassName}
          onChange={(event) => model.setPassword(event.target.value)}
          type="password"
          value={model.password}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button disabled={disabled} type="submit">
          <UserPlus aria-hidden="true" />
          Sign up
        </Button>
        <Button disabled={disabled} onClick={model.handleSignIn} type="button" variant="secondary">
          <LogIn aria-hidden="true" />
          Sign in
        </Button>
      </div>
      <FeedbackMessage feedback={model.feedback} />
    </form>
  );
}

function NotesPanel({ model }: { model: AuthNotesDemoModel }) {
  return (
    <div className="space-y-4">
      <form className="space-y-3" onSubmit={model.handleCreateNote}>
        <Field label="Note title">
          <input
            className={inputClassName}
            disabled={!model.signedIn}
            maxLength={120}
            onChange={(event) => model.setTitle(event.target.value)}
            value={model.title}
          />
        </Field>
        <Field label="Body">
          <textarea
            className={textareaClassName}
            disabled={!model.signedIn}
            onChange={(event) => model.setBody(event.target.value)}
            value={model.body}
          />
        </Field>
        <Button
          disabled={!model.signedIn || model.submitting !== null || model.title.trim().length === 0}
          type="submit"
        >
          <Plus aria-hidden="true" />
          Save note
        </Button>
      </form>

      <NotesList notes={model.notes} />
    </div>
  );
}

function NotesList({ notes }: { notes: DemoNote[] }) {
  return (
    <div className="rounded-md border bg-zinc-50 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <NotebookPen className="size-4 text-teal-700" aria-hidden="true" />
        Notes
      </div>
      {notes.length === 0 && <p className="text-muted-foreground text-sm">No notes yet.</p>}
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

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
