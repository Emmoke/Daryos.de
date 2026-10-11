// Einwilligung (Banner) und datensparsame Statistik. Ohne Zustimmung wird nichts gesendet und nichts gespeichert –
// außer der Entscheidung selbst (technisch notwendig, damit das Banner nicht bei jedem Aufruf erscheint).
const KEY = 'daryos-consent';
const VERSION = 1;

export type Consent = { statistik: boolean; at: string; v: number };

export function getConsent(): Consent | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null') as Consent | null;
    return c && c.v === VERSION ? c : null;
  } catch {
    return null;
  }
}

export function setConsent(statistik: boolean) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ statistik, at: new Date().toISOString(), v: VERSION }));
    if (!statistik) sessionStorage.removeItem('daryos-visit');
  } catch { /* privater Modus */ }
  window.dispatchEvent(new Event('daryos:consent-changed'));
}

export const openConsentSettings = () => window.dispatchEvent(new Event('daryos:consent-open'));

function routeName(hash: string) {
  if (hash.startsWith('#/vergleich')) return 'vergleich';
  if (hash.startsWith('#/status')) return 'status';
  if (hash.startsWith('#/konto')) return 'konto';
  return 'start';
}

function send(body: Record<string, unknown>) {
  fetch('/api/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, consent: true }), keepalive: true }).catch(() => {});
}

/** Seitenaufruf zählen – nur mit Einwilligung */
export function trackView(hash: string) {
  if (!getConsent()?.statistik) return;
  const route = routeName(hash);
  let first = false;
  try {
    first = !sessionStorage.getItem('daryos-visit');
    if (first) sessionStorage.setItem('daryos-visit', '1');
  } catch { /* egal */ }
  if (first) {
    let referrer = '';
    try {
      const r = document.referrer ? new URL(document.referrer).hostname : '';
      referrer = r && r !== location.hostname ? r : '';
    } catch { /* egal */ }
    send({ type: 'visit', route, referrer, device: window.innerWidth < 768 ? 'mobil' : 'desktop' });
  } else {
    send({ type: 'view', route });
  }
}
