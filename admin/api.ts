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

export type BriefingItem = { level: 'wichtig' | 'hinweis' | 'info' | 'ok'; text: string; href?: string };

export type ConnectionField = { key: string; label: string; secret: boolean; required: boolean; placeholder?: string; hint?: string; source: 'verwaltung' | 'server' | null; display: string };
export type Connections = {
  writable: boolean;
  lastUpdate: { updatedAt?: string; updatedBy?: string };
  groups: Record<'gemini' | 'email' | 'whatsapp', ConnectionField[]>;
  status: Record<'gemini' | 'email' | 'whatsapp', { configured: boolean; detail: string; mode?: string }>;
  twoFactor: { active: boolean; source: 'verwaltung' | 'server' | null };
  webhookUrl: string;
  adminEmail?: string;
};

export type AdminUser = { role: 'eigentuemer'; email: string; name: string };

export const api = {
  authConfig: () => request<{ configured: boolean; twoFactor: boolean }>('GET', '/admin/auth-config'),
  me: () => request<{ user: AdminUser; twoFactor: boolean }>('GET', '/admin/me'),
  login: (password: string, code?: string) => request<{ user: AdminUser }>('POST', '/admin/login', { password, code }),
  logout: () => request<{ ok: true }>('POST', '/admin/logout', {}),
  overview: () => request<any>('GET', '/admin/overview'),
  integrations: () => request<Record<string, any>>('GET', '/admin/integrations'),
  partners: () => request<{ partners: any[] }>('GET', '/admin/partners'),
  createPartner: (p: unknown) => request<{ partner: any }>('POST', '/admin/partners', p),
  updatePartner: (id: string, p: unknown) => request<{ partner: any }>('PUT', `/admin/partners/${id}`, p),
  deletePartner: (id: string) => request<{ ok: true }>('DELETE', `/admin/partners/${id}`),
  applicationFields: () => request<{ fields: any[]; statusLabels: Record<string, string> }>('GET', '/admin/application-fields'),
  saveApplication: (id: string, partnerId: string | undefined, fields: Record<string, string>) => request<{ request: any }>('PUT', `/admin/requests/${encodeURIComponent(id)}/application`, { partnerId, fields }),
  prefillApplication: (id: string) => request<{ suggestions: Record<string, string> }>('POST', `/admin/requests/${encodeURIComponent(id)}/application/prefill`, {}),
  extractApplication: (id: string, documentId: string) => request<{ suggestions: Record<string, string> }>('POST', `/admin/requests/${encodeURIComponent(id)}/application/extract`, { documentId }),
  requestApplicationData: (id: string) => request<{ request: any }>('POST', `/admin/requests/${encodeURIComponent(id)}/application/request-data`, { confirm: true }),
  applicationSubmitted: (id: string, portalRef: string) => request<{ request: any }>('POST', `/admin/requests/${encodeURIComponent(id)}/application/submitted`, { portalRef }),
  copilotBriefing: () => request<{ since: string | null; items: BriefingItem[]; aiAvailable: boolean; generatedAt: string }>('GET', '/admin/copilot/briefing'),
  copilotSeen: () => request<{ ok: true }>('POST', '/admin/copilot/seen', {}),
  copilotChat: (messages: { role: 'user' | 'assistant'; text: string }[]) => request<{ reply: string }>('POST', '/admin/copilot/chat', { messages }),
  connections: () => request<Connections>('GET', '/admin/connections'),
  saveConnection: (group: string, values: Record<string, string>, clear: string[], password: string) =>
    request<Connections>('PUT', `/admin/connections/${group}`, { values, clear, password }),
  testConnection: (group: string) => request<{ ok: true; message: string }>('POST', `/admin/connections/${group}/test`, {}),
  totpSetup: (password: string) => request<{ secret: string; otpauth: string }>('POST', '/admin/2fa/setup', { password }),
  totpEnable: (code: string) => request<{ ok: true; twoFactor: boolean }>('POST', '/admin/2fa/enable', { code }),
  totpDisable: (password: string, code: string) => request<{ ok: true; twoFactor: boolean }>('POST', '/admin/2fa/disable', { password, code }),
  requests: (status?: string) => request<{ requests: any[] }>('GET', `/admin/requests${status ? `?status=${status}` : ''}`),
  request: (id: string) => request<{ request: any }>('GET', `/admin/requests/${encodeURIComponent(id)}`),
  requestAction: (id: string, body: { action: string; note?: string; providerConfirmationRef?: string }) =>
    request<{ request: any }>('POST', `/admin/requests/${encodeURIComponent(id)}/action`, body),
  requestDraft: (id: string, offerId?: string) => request<{ request: any }>('POST', `/admin/requests/${encodeURIComponent(id)}/draft`, { offerId }),
  saveDraft: (id: string, draftId: string, subject: string, body: string) =>
    request<{ request: any }>('PUT', `/admin/requests/${encodeURIComponent(id)}/drafts/${draftId}`, { subject, body }),
  deleteDocument: (id: string, docId: string) => request<{ request: any }>('DELETE', `/admin/requests/${encodeURIComponent(id)}/documents/${docId}`),
  sendDraft: (id: string, draftId: string) => request<{ request: any }>('POST', `/admin/requests/${encodeURIComponent(id)}/drafts/${draftId}/send`, { confirm: true }),
  assistant: () => request<{ settings: any; stats: any; configured: boolean; detail: string }>('GET', '/admin/assistant'),
  saveAssistant: (settings: unknown) => request<{ settings: any }>('PUT', '/admin/assistant', settings),
  chatSessions: () => request<{ sessions: any[] }>('GET', '/admin/assistant/sessions'),
  chatSession: (id: string) => request<{ session: any }>('GET', `/admin/assistant/sessions/${id}`),
  deleteChatSession: (id: string) => request<{ ok: boolean }>('DELETE', `/admin/assistant/sessions/${id}`),
  testAssistant: (question: string) => request<{ reply: string }>('POST', '/admin/assistant/test', { question }),
  tariffs: () => request<{ tariffs: any[]; currentCount: number; source: { name: string; isDemo: boolean } }>('GET', '/admin/tariffs'),
  createTariff: (t: unknown) => request<{ tariff: any }>('POST', '/admin/tariffs', t),
  updateTariff: (id: string, t: unknown) => request<{ tariff: any }>('PUT', `/admin/tariffs/${id}`, t),
  deleteTariff: (id: string) => request<{ ok: true }>('DELETE', `/admin/tariffs/${id}`),
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
