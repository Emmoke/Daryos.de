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

export const api = {
  integrations: () => request<IntegrationStatus>('GET', '/integrations'),
  compare: (input: unknown) => request<CompareResponse>('POST', '/compare', input),
  status: (id: string) => request<PublicRequestStatus>('GET', `/requests/${encodeURIComponent(id)}`),
  contact: (id: string, body: unknown) => request<ContactResponse>('POST', `/requests/${encodeURIComponent(id)}/contact`, body),
  chat: (messages: { role: 'user' | 'assistant'; text: string }[]) =>
    request<{ reply: string; disclaimer: string }>('POST', '/chat', { messages }),
  ask: (id: string, question: string) =>
    request<{ answer: string; disclaimer: string }>('POST', `/requests/${encodeURIComponent(id)}/assistant`, { question }),
};

export const eur = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
export const dateTime = (iso: string) => new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
