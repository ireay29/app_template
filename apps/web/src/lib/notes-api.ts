export type DemoNote = {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
  updatedAt: string;
};

async function readApiError(response: Response) {
  const fallback = `API request failed with ${response.status}`;

  try {
    const body = (await response.json()) as { error?: string; message?: string };
    return body.error ?? body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getNotes(signal?: AbortSignal): Promise<DemoNote[]> {
  const response = await fetch('/api/notes', {
    credentials: 'include',
    signal,
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const body = (await response.json()) as { notes: DemoNote[] };
  return body.notes;
}

export async function createNote(input: { title: string; body?: string }): Promise<DemoNote> {
  const response = await fetch('/api/notes', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const body = (await response.json()) as { note: DemoNote };
  return body.note;
}
