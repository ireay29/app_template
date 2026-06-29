export type HealthResponse = {
  status: 'ok';
  service: string;
  uptime: number;
};

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch('/api/health', { signal });

  if (!response.ok) {
    throw new Error(`API health check failed with ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}
