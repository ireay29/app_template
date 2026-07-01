function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const { error: errorMessage, message } = error as { error?: unknown; message?: unknown };

    if (typeof errorMessage === 'string') {
      return errorMessage;
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}

export function requireApiData<TData>(
  result: { data?: TData; error?: unknown; response: Response },
  fallback: string,
): TData {
  if (result.error) {
    throw new Error(getApiErrorMessage(result.error, fallback));
  }

  if (result.data === undefined) {
    throw new Error(fallback);
  }

  return result.data;
}
