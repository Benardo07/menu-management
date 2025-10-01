const fallback = 'http://localhost:8080';

export function getBackendBaseUrl() {
  return process.env.BACKEND_API_URL || fallback;
}

export async function proxyToBackend(path: string, init?: RequestInit) {
  const base = getBackendBaseUrl();
  const url = `${base.replace(/\/$/, '')}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (error) {
      payload = text;
    }
  }

  return {
    status: response.status,
    ok: response.ok,
    payload,
  };
}
