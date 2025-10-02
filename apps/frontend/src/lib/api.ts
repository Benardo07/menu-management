const fallback = 'http://localhost:8080';

export function getBackendBaseUrl() {
  return process.env.BACKEND_API_URL || fallback;
}

export type ParsedResponse<T = unknown> = {
  status: number;
  statusText: string;
  ok: boolean;
  payload: T;
};

function applyJsonDefaults(init?: RequestInit): RequestInit {
  const headers = {
    'Content-Type': 'application/json',
    ...(init?.headers || {}),
  };

  return {
    ...init,
    headers,
    cache: init?.cache ?? 'no-store',
  };
}

async function parsePayload(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function requestJson<T = unknown>(input: RequestInfo | URL, init?: RequestInit): Promise<ParsedResponse<T>> {
  const response = await fetch(input, applyJsonDefaults(init));
  const payload = (await parsePayload(response)) as T;

  return {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    payload,
  };
}

export async function proxyToBackend<T = unknown>(path: string, init?: RequestInit) {
  const base = getBackendBaseUrl();
  const url = `${base.replace(/\/$/, '')}${path}`;
  return requestJson<T>(url, init);
}
