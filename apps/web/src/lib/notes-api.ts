import { fetchJson } from './fetch-json';

export type DemoNote = {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
  updatedAt: string;
};

type NotesResponse = { notes: DemoNote[] };
type CreateNoteResponse = { note: DemoNote };

export async function getNotes(signal?: AbortSignal): Promise<DemoNote[]> {
  const body = await fetchJson<NotesResponse>('/api/notes', {
    credentials: 'include',
    signal,
  });

  return body.notes;
}

export async function createNote(input: { title: string; body?: string }): Promise<DemoNote> {
  const body = await fetchJson<CreateNoteResponse>('/api/notes', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return body.note;
}
