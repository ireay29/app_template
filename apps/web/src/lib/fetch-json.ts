type ErrorMessageFactory = (response: Response) => string;

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    return body.error ?? body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  createErrorMessage: ErrorMessageFactory = (response) =>
    `API request failed with ${response.status}`,
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(await readApiError(response, createErrorMessage(response)));
  }

  return response.json() as Promise<T>;
}
