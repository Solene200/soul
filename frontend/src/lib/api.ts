import { clearAuthSession, getAccessToken, notifyUnauthorized } from '@/lib/auth';

type QueryValue = string | number | boolean | null | undefined;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  auth?: boolean;
  body?: BodyInit | null;
  json?: unknown;
  query?: Record<string, QueryValue>;
};

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, '');

export function buildApiUrl(path: string, query?: Record<string, QueryValue>) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function parseJsonSafely<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  return (await response.json()) as T;
}

async function getErrorMessage(response: Response) {
  const payload = await parseJsonSafely<{ detail?: string; message?: string }>(response);

  if (payload?.detail) {
    return payload.detail;
  }

  if (payload?.message) {
    return payload.message;
  }

  return response.statusText || '请求失败';
}

export async function apiFetch(path: string, options: ApiRequestOptions = {}) {
  const { auth = true, json, query, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (auth) {
    const token = getAccessToken();

    if (!token) {
      notifyUnauthorized();
      throw new ApiError('请先登录', 401);
    }

    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (json !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildApiUrl(path, query), {
    ...rest,
    headers: requestHeaders,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearAuthSession();
      notifyUnauthorized();
    }

    throw new ApiError(await getErrorMessage(response), response.status);
  }

  return response;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const response = await apiFetch(path, options);

  return parseJsonSafely<T>(response);
}
