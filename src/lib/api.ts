const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
type ApiError = { message?: string };

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const tokenResponse = await fetch('/api/backend-token', { cache: 'no-store' });
  if (!tokenResponse.ok) throw new Error('Your session expired. Please sign in again.');
  const { token } = (await tokenResponse.json()) as { token: string };
  const response = await fetch(`${API}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as ApiError;
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

export async function publicFetch<T = unknown>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { cache: 'no-store' });
  const data = (await response.json().catch(() => ({}))) as ApiError;
  if (!response.ok) throw new Error(data.message || 'Unable to load data');
  return data as T;
}
