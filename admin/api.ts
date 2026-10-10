// API-Zugriffe der Verwaltungs-App. Sitzung über HttpOnly-Cookie (Pfad /api).
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly fields: Record<string, string> = {}) {
    super(message);
  }
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Keine Verbindung zum Server.', 0);
  }
  if (!(res.headers.get('content-type') || '').includes('application/json')) {
    throw new ApiError('Der Server ist nicht erreichbar. Die Verwaltung funktioniert nur auf dem Daryos-Server, nicht auf GitHub Pages.', 503);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== '/admin/login' && path !== '/admin/me') window.dispatchEvent(new Event('daryos:unauthorized'));
    throw new ApiError(json?.error || `Fehler ${res.status}`, res.status, json?.fields);
  }
  return json as T;
}

export type AdminUser = { role: 'eigentuemer'; email: string; name: string };

export const api = {
  authConfig: () => request<{ configured: boolean; twoFactor: boolean }>('GET', '/admin/auth-config'),
  me: () => request<{ user: AdminUser; twoFactor: boolean }>('GET', '/admin/me'),
  login: (password: string, code?: string) => request<{ user: AdminUser }>('POST', '/admin/login', { password, code }),
  logout: () => request<{ ok: true }>('POST', '/admin/logout', {}),
  overview: () => request<any>('GET', '/admin/overview'),
  integrations: () => request<Record<string, any>>('GET', '/admin/integrations'),
  requests: (status?: string) => request<{ requests: any[] }>('GET', `/admin/requests${status ? `?status=${status}` : ''}`),
  request: (id: string) => request<{ request: any }>('GET', `/admin/requests/${encodeURIComponent(id)}`),
  requestAction: (id: string, body: { action: string; note?: string; providerConfirmationRef?: string }) =>
    request<{ request: any }>('POST', `/admin/requests/${encodeURIComponent(id)}/action`, body),
  requestDraft: (id: string) => request<{ request: any }>('POST', `/admin/requests/${encodeURIComponent(id)}/draft`, {}),
  waList: () => request<{ configured: boolean; conversations: any[] }>('GET', '/admin/whatsapp/conversations'),
  waGet: (waId: string) => request<{ conversation: any; canReply: boolean }>('GET', `/admin/whatsapp/conversations/${encodeURIComponent(waId)}`),
  waReply: (waId: string, text: string) => request<{ conversation: any }>('POST', `/admin/whatsapp/conversations/${encodeURIComponent(waId)}/reply`, { text }),
  waBot: (waId: string, needsHuman: boolean) => request<{ conversation: any }>('POST', `/admin/whatsapp/conversations/${encodeURIComponent(waId)}/bot`, { needsHuman }),
  settings: () => request<{ settings: any; missing: string[] }>('GET', '/admin/accounting/settings'),
  saveSettings: (s: unknown) => request<{ settings: any; missing: string[] }>('PUT', '/admin/accounting/settings', s),
  summary: (year: string) => request<any>('GET', `/admin/accounting/summary?year=${year}`),
  invoices: () => request<{ invoices: any[] }>('GET', '/admin/accounting/invoices'),
  createInvoice: (b: unknown) => request<{ invoice: any }>('POST', '/admin/accounting/invoices', b),
  markPaid: (id: string, paidAt?: string) => request<{ invoice: any }>('POST', `/admin/accounting/invoices/${id}/paid`, { paidAt }),
  cancelInvoice: (id: string, reason: string) => request<{ invoice: any; storno: any }>('POST', `/admin/accounting/invoices/${id}/cancel`, { reason }),
  bookings: (year: string) => request<{ bookings: any[]; categories: { einnahme: string[]; ausgabe: string[] } }>('GET', `/admin/accounting/bookings?year=${year}`),
  addBooking: (b: unknown) => request<{ booking: any }>('POST', '/admin/accounting/bookings', b),
  reverseBooking: (id: string) => request<{ booking: any }>('POST', `/admin/accounting/bookings/${id}/reverse`, {}),
};

export const eur = (cents: number) => (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
export const dateTime = (iso: string) => new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
export const date = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('de-DE');
