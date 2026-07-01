import type { MethodResponse } from 'openapi-fetch';

import { apiClient } from './api/client';
import { requireApiData } from './api/response';

type NotesResponse = MethodResponse<typeof apiClient, 'get', '/api/notes'>;

export type DemoNote = NotesResponse['notes'][number];

export async function getNotes(signal?: AbortSignal): Promise<DemoNote[]> {
  const result = await apiClient.GET('/api/notes', { signal });
  const body = requireApiData(result, `Notes request failed with ${result.response.status}`);

  return body.notes;
}

export async function createNote(input: { title: string; body?: string }): Promise<DemoNote> {
  const result = await apiClient.POST('/api/notes', { body: input });
  const body = requireApiData(result, `Note creation failed with ${result.response.status}`);

  return body.note;
}
