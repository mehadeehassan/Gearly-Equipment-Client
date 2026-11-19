const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
type ApiError = { message?: string; errors?: Record<string, string | string[]>; fieldErrors?: Record<string, string | string[]> };

const inFlightRequests = new Map<string, Promise<unknown>>();

function dedupeInFlight<T>(key: string, request: () => Promise<T>): Promise<T> {
  const pending = inFlightRequests.get(key);
  if (pending) return pending as Promise<T>;

  const promise = Promise.resolve()
    .then(request)
    .finally(() => {
      if (inFlightRequests.get(key) === promise) inFlightRequests.delete(key);
    });
  inFlightRequests.set(key, promise);
  return promise;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors: Record<string, string | string[]> = {},
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function requestToken(userScope?: string): Promise<string> {
  const request = async () => {
    const tokenResponse = await fetch('/api/backend-token', { cache: 'no-store' });
    if (!tokenResponse.ok) {
      throw new ApiRequestError(
        'Your session expired. Please sign in again.',
        tokenResponse.status,
      );
    }
    const { token } = (await tokenResponse.json()) as { token: string };
    return token;
  };
  return userScope ? dedupeInFlight(`backend-token:${userScope}`, request) : request();
}

async function performApiFetch<T>(
  path: string,
  options: RequestInit,
  userScope?: string,
): Promise<T> {
  const token = await requestToken(userScope);
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
  if (!response.ok) throw new ApiRequestError(data.message || 'Request failed', response.status, data.fieldErrors || data.errors || {});
  return data as T;
}

export function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  userScope?: string,
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isIdempotentVerification = method === 'POST' && path === '/payments/verify-session';
  if (userScope && (method === 'GET' || isIdempotentVerification) && !options.signal) {
    const bodyKey = typeof options.body === 'string' ? options.body : '';
    return dedupeInFlight(`private-request:${userScope}:${method}:${path}:${bodyKey}`, () =>
      performApiFetch<T>(path, options, userScope),
    );
  }
  return performApiFetch<T>(path, options, userScope);
}

export async function publicFetch<T = unknown>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { next: { revalidate: 30 } });
  const data = (await response.json().catch(() => ({}))) as ApiError;
  if (!response.ok) throw new Error(data.message || 'Unable to load data');
  return data as T;
}
