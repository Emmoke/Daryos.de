// Kleine Fetch-Hilfen für die Plattform-API.
import type { ComparisonResult, IntegrationStatus, PublicRequestStatus, RequestStatus } from '../../shared/platform';

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly fields: Record<string, string> = {}) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Keine Verbindung zum Server. Bitte prüfen Sie Ihre Internetverbindung.', 0);
  }
  const json = await res.json().catch(() => ({}));
  // 502 beim Vergleich enthält trotzdem ein auswertbares Ergebnis (Quelle gestört)
  if (!res.ok && !(res.status === 502 && json?.comparison)) {
    throw new ApiError(json?.error || `Fehler ${res.status}`, res.status, json?.fields);
  }
  return json as T;
}

export interface CompareResponse {
  requestId: string;
  status: RequestStatus;
  comparison: ComparisonResult;
}

export interface ContactResponse {
  requestId: string;
  duplicate: boolean;
  status: PublicRequestStatus;
}

export const api = {
  integrations: () => request<IntegrationStatus>('GET', '/integrations'),
  compare: (input: unknown) => request<CompareResponse>('POST', '/compare', input),
  status: (id: string) => request<PublicRequestStatus>('GET', `/requests/${encodeURIComponent(id)}`),
  contact: (id: string, body: unknown) => request<ContactResponse>('POST', `/requests/${encodeURIComponent(id)}/contact`, body),
  ask: (id: string, question: string) =>
    request<{ answer: string; disclaimer: string }>('POST', `/requests/${encodeURIComponent(id)}/assistant`, { question }),
  admin: {
    me: () => request<{ user: { role: 'eigentuemer'; email: string; name: string } }>('GET', '/admin/me'),
    login: (password: string) => request<{ user: { role: 'eigentuemer'; email: string; name: string } }>('POST', '/admin/login', { password }),
    logout: () => request<{ ok: true }>('POST', '/admin/logout', {}),
    integrations: () => request<Record<string, { configured: boolean; detail: string }>>('GET', '/admin/integrations'),
    list: (status?: string) => request<{ requests: AdminListItem[] }>('GET', `/admin/requests${status ? `?status=${status}` : ''}`),
    get: (id: string) => request<{ request: any }>('GET', `/admin/requests/${encodeURIComponent(id)}`),
    action: (id: string, body: { action: string; note?: string; providerConfirmationRef?: string }) =>
      request<{ request: any }>('POST', `/admin/requests/${encodeURIComponent(id)}/action`, body),
    draft: (id: string) => request<{ request: any }>('POST', `/admin/requests/${encodeURIComponent(id)}/draft`, {}),
  },
};

export interface AdminListItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: RequestStatus;
  energyType: 'gas' | 'strom';
  postalCode: string;
  customerName: string | null;
  selectedOffer: string | null;
  isDemo: boolean;
}

export const eur = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
export const dateTime = (iso: string) => new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
