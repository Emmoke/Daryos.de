// Einstiegspunkt: Express-Server mit API unter /api; im Entwicklungsmodus mit Vite-Middleware,
// im Produktivmodus (Cloud Run) mit den gebauten Dateien aus dist/.
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './server/app';
import { MemoryRequestStore } from './server/store';
import { backendFromEnv } from './server/persistence';
import { offerProviderFromEnv } from './server/offers';
import { notifierFromEnv } from './server/notifier';
import { assistantFromEnv } from './server/assistant';
import { hashPassword, SessionManager } from './server/security';
import { AccountingStore } from './server/accounting';
import { CatalogOrFallbackProvider, TariffCatalog } from './server/tariffs';
import { AssistantConfigStore } from './server/assistantConfig';
import { CloudApiSender, ConversationStore, whatsappConfigFromEnv } from './server/whatsapp';
import { encryptionKeyFromEnv, IntegrationStore } from './server/integrations';
import { fileStorageFromEnv } from './server/files';
import { CopilotStore } from './server/copilot';
import { PartnerStore } from './server/partners';
import { AnalyticsStore } from './server/analytics';

const root = path.dirname(fileURLToPath(import.meta.url));
const env = process.env;
const isProd = env.NODE_ENV === 'production';
const port = Number(env.PORT || 3000);

let passwordHash = env.ADMIN_PASSWORD_HASH || undefined;
if (!passwordHash && env.ADMIN_PASSWORD) {
  if (isProd) {
    console.warn('[daryos] ADMIN_PASSWORD (Klartext) wird im Produktivbetrieb ignoriert – bitte ADMIN_PASSWORD_HASH setzen.');
  } else {
    passwordHash = hashPassword(env.ADMIN_PASSWORD);
  }
}

// Datenspeicher und API werden im Hintergrund gestartet. Der Server nimmt sofort Verbindungen an
// (wichtig für Cloud Run), und bei einem Datenbankproblem wird der Grund klar gemeldet und automatisch erneut versucht.
let startupError: string | null = null;
let apiHandler: express.RequestHandler = (_req, res) => {
  res.status(503).json({ error: startupError ? `Die Datenbank ist nicht erreichbar: ${startupError}` : 'Der Server startet gerade. Bitte in wenigen Sekunden erneut versuchen.' });
};

function explainStorageError(err: unknown): string {
  const msg = (err as Error)?.message ?? String(err);
  if (/NOT_FOUND|does not exist|database .* not found/i.test(msg)) {
    return `${msg} → Firestore-Datenbank fehlt. Anlegen: gcloud firestore databases create --location=europe-west3 --type=firestore-native`;
  }
  if (/PERMISSION_DENIED|permission|403/i.test(msg)) {
    return `${msg} → Dem Cloud-Run-Dienstkonto fehlt die Rolle "Cloud Datastore User" (roles/datastore.user).`;
  }
  if (/SERVICE_DISABLED|has not been used|is disabled/i.test(msg)) {
    return `${msg} → Firestore-API einschalten: gcloud services enable firestore.googleapis.com`;
  }
  return msg;
}

const withTimeout = <T,>(p: Promise<T>, ms: number, what: string) =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Zeitüberschreitung nach ${ms / 1000} s beim ${what}`)), ms).unref())]);

async function initApi(attempt = 1): Promise<void> {
  try {
    const backend = await backendFromEnv(env, root);
    console.log(`[daryos] Datenspeicher: ${backend.name}`);
    const files = await fileStorageFromEnv(env, root);
    console.log(`[daryos] Dateispeicher: ${files.name}`);
    const [store, accounting, tariffs, assistantConfig, waStore, integrations, copilot, partners, analytics] = await withTimeout(
      Promise.all([MemoryRequestStore.open(backend), AccountingStore.open(backend), TariffCatalog.open(backend), AssistantConfigStore.open(backend), ConversationStore.open(backend), IntegrationStore.open(backend, encryptionKeyFromEnv(env, isProd)), CopilotStore.open(backend), PartnerStore.open(backend), AnalyticsStore.open(backend)]),
      30_000,
      'Laden der Daten',
    );
    // In der Verwaltung eingetragene Zugangsdaten haben Vorrang vor Server-Variablen
    const cfg = integrations.merged(env);
    const waConfig = whatsappConfigFromEnv(cfg);
    apiHandler = createApp({
      store,
      offerProvider: new CatalogOrFallbackProvider(tariffs, offerProviderFromEnv(env)),
      tariffs,
      assistantConfig,
      notifier: notifierFromEnv(cfg),
      assistant: assistantFromEnv(cfg),
      sessions: new SessionManager(),
      admin: { email: env.ADMIN_EMAIL || 'admin@daryos.de', name: env.ADMIN_NAME || 'Daryos Inhaber', passwordHash, totpSecret: cfg.ADMIN_TOTP_SECRET || undefined },
      accounting,
      storageName: backend.name,
      whatsappNumber: cfg.WHATSAPP_NUMBER?.replace(/\D/g, '') || undefined,
      whatsapp: waConfig ? { config: waConfig, store: waStore, sender: new CloudApiSender(waConfig) } : undefined,
      files,
      copilot,
      partners,
      analytics,
      integrations: { store: integrations, baseEnv: env, conversations: waStore },
      appUrl: env.APP_URL && env.APP_URL !== 'MY_APP_URL' ? env.APP_URL.replace(/\/$/, '') : `http://localhost:${port}`,
      secureCookies: isProd,
      retentionDays: { comparison: Number(env.RETENTION_DAYS_COMPARISON || 30), contact: Number(env.RETENTION_DAYS_CONTACT || 180) },
    });
    startupError = null;
    console.log('[daryos] Datenspeicher geladen – API bereit.');

    // Abgelaufene Anfragen regelmäßig löschen (Aufbewahrungsfristen)
    const purge = async () => {
      try {
        // Unterlagen abgelaufener Anfragen zuerst aus dem Dateispeicher löschen
        const nowIso = new Date().toISOString();
        for (const r of await store.list()) {
          if (r.deleteAfter < nowIso) for (const d of r.documents ?? []) await files.remove(d.storageKey);
        }
        const n = await store.purgeExpired(new Date());
        const w = await waStore.purgeExpired(new Date());
        await assistantConfig.purgeExpired(new Date());
        await analytics.purgeExpired(new Date());
        if (n || w) console.log(`[daryos] ${n} Anfrage(n) und ${w} WhatsApp-Unterhaltung(en) nach Ablauf der Frist gelöscht`);
      } catch (err) {
        console.error('[daryos] Löschen abgelaufener Daten fehlgeschlagen:', (err as Error).message);
      }
    };
    purge();
    setInterval(purge, 6 * 60 * 60 * 1000).unref();
  } catch (err) {
    startupError = explainStorageError(err);
    const wait = Math.min(300, 15 * attempt);
    console.error(`[daryos] FEHLER beim Laden des Datenspeichers (Versuch ${attempt}): ${startupError} – neuer Versuch in ${wait} s`);
    setTimeout(() => initApi(attempt + 1), wait * 1000).unref();
  }
}

const app = express();
app.disable('x-powered-by');
if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY === 'true' ? true : env.TRUST_PROXY);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  if (isProd) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
  }
  next();
});
app.use('/api', (req, res, next) => apiHandler(req, res, next));

// Die Verwaltungs-App ist eine eigene Anwendung unter /verwaltung (eigener Build, nicht Teil der öffentlichen Seite)
const ADMIN_BASE = '/verwaltung';
app.use(ADMIN_BASE, (_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

if (isProd) {
  const distAdmin = path.join(root, 'dist-admin');
  app.use(ADMIN_BASE, express.static(distAdmin, { index: false, maxAge: '1h' }));
  app.get(new RegExp(`^${ADMIN_BASE}(/.*)?$`), (_req, res) => res.sendFile(path.join(distAdmin, 'index.html')));
  const dist = path.join(root, 'dist');
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  const { createServer } = await import('vite');
  const viteAdmin = await createServer({ configFile: path.join(root, 'vite.admin.config.ts'), server: { middlewareMode: true }, appType: 'spa' });
  app.use(viteAdmin.middlewares);
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`[daryos] Server läuft auf http://localhost:${port} (${isProd ? 'Produktion' : 'Entwicklung'}) – Verwaltung: http://localhost:${port}${ADMIN_BASE}/`);
  if (!passwordHash) console.warn('[daryos] Admin-Zugang deaktiviert: ADMIN_PASSWORD_HASH (oder lokal ADMIN_PASSWORD) setzen.');
  initApi();
});
