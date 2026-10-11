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
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  if (!isJson) {
    // z. B. GitHub Pages: dort gibt es nur die statische Seite, keinen Server
    throw new ApiError(
      'Der Tarifvergleich ist unter dieser Adresse noch nicht verfügbar (reine Vorschau ohne Server). Bitte vereinbaren Sie einen Beratungstermin oder kontaktieren Sie Daryos direkt.',
      503,
    );
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

export interface CustomerDocument { id: string; name: string; size: number; contentType: string; uploadedAt: string; byCustomer: boolean }
export interface CustomerApplication {
  fields: Record<string, string>;
  form: { key: string; label: string; group: string; required?: boolean; type?: string; options?: Record<string, string>; placeholder?: string }[];
  checks: { field?: string; level: 'fehler' | 'warnung'; message: string }[];
}
export interface CustomerAccount {
  email: string;
  uploadsEnabled: boolean;
  requests: (PublicRequestStatus & { documents: CustomerDocument[]; messages: { subject: string; body: string; sentAt: string }[]; application: CustomerApplication | null })[];
}

export const api = {
  integrations: () => request<IntegrationStatus>('GET', '/integrations'),
  compare: (input: unknown) => request<CompareResponse>('POST', '/compare', input),
  status: (id: string) => request<PublicRequestStatus>('GET', `/requests/${encodeURIComponent(id)}`),
  contact: (id: string, body: unknown) => request<ContactResponse>('POST', `/requests/${encodeURIComponent(id)}/contact`, body),
  chat: (messages: { role: 'user' | 'assistant'; text: string }[], sessionId?: string) =>
    request<{ reply: string; disclaimer: string; sessionId?: string }>('POST', '/chat', { messages, sessionId }),
  customerLogin: (email: string) => request<{ ok: true; message: string }>('POST', '/customer/login', { email }),
  customerVerify: (token: string) => request<{ email: string }>('POST', '/customer/verify', { token }),
  customerMe: () => request<CustomerAccount>('GET', '/customer/me'),
  customerLogout: () => request<{ ok: true }>('POST', '/customer/logout', {}),
  saveApplication: (id: string, fields: Record<string, string>) => request<{ status: string; checks: CustomerApplication['checks'] }>('PUT', `/customer/requests/${encodeURIComponent(id)}/application`, { fields }),
  deleteDocument: (id: string, docId: string) => request<{ ok: true }>('DELETE', `/customer/requests/${encodeURIComponent(id)}/documents/${docId}`),
  async uploadDocument(id: string, file: File) {
    let res: Response;
    try {
      res = await fetch(`/api/customer/requests/${encodeURIComponent(id)}/documents`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': file.type || 'application/octet-stream', 'x-file-name': encodeURIComponent(file.name) },
        body: file,
      });
    } catch {
      throw new ApiError('Keine Verbindung zum Server.', 0);
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(json?.error || (res.status === 413 ? 'Die Datei ist zu groß (höchstens 8 MB).' : `Fehler ${res.status}`), res.status);
    return json as { document: CustomerDocument };
  },
  ask: (id: string, question: string) =>
    request<{ answer: string; disclaimer: string }>('POST', `/requests/${encodeURIComponent(id)}/assistant`, { question }),
};

export const eur = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
export const dateTime = (iso: string) => new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
