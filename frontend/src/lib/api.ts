export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string[] | undefined>,
  ) {
    super(message);
  }
}

/** Fetch wrapper: JSON in/out, session cookie, CSRF header on every request. */
export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown; form?: FormData; signal?: AbortSignal } = {}): Promise<T> {
  const headers: Record<string, string> = { 'X-Requested-With': 'esc-portal', Accept: 'application/json' };
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { method: opts.method ?? (body ? 'POST' : 'GET'), headers, body, credentials: 'same-origin', signal: opts.signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(0, 'The server could not be reached. Please check your connection and try again.');
  }
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`, data?.fields);
  return data as T;
}

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export const fmtDate = (d?: string | null, withTime = false) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      })
    : '—';

export const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 ** 2).toFixed(1)} MB`);
