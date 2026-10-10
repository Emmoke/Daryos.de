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
import { CloudApiSender, ConversationStore, whatsappConfigFromEnv } from './server/whatsapp';

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

const backend = await backendFromEnv(env, root);
console.log(`[daryos] Datenspeicher: ${backend.name}`);
const store = await MemoryRequestStore.open(backend);
const accounting = await AccountingStore.open(backend);
const waConfig = whatsappConfigFromEnv(env);
const waStore = waConfig ? await ConversationStore.open(backend) : undefined;
const api = createApp({
  store,
  offerProvider: offerProviderFromEnv(env),
  notifier: notifierFromEnv(env),
  assistant: assistantFromEnv(env),
  sessions: new SessionManager(),
  admin: { email: env.ADMIN_EMAIL || 'admin@daryos.de', name: env.ADMIN_NAME || 'Daryos Inhaber', passwordHash, totpSecret: env.ADMIN_TOTP_SECRET || undefined },
  accounting,
  storageName: backend.name,
  whatsappNumber: env.WHATSAPP_NUMBER?.replace(/\D/g, '') || undefined,
  whatsapp: waConfig && waStore ? { config: waConfig, store: waStore, sender: new CloudApiSender(waConfig) } : undefined,
  appUrl: env.APP_URL && env.APP_URL !== 'MY_APP_URL' ? env.APP_URL.replace(/\/$/, '') : `http://localhost:${port}`,
  secureCookies: isProd,
  retentionDays: { comparison: Number(env.RETENTION_DAYS_COMPARISON || 30), contact: Number(env.RETENTION_DAYS_CONTACT || 180) },
});

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
app.use('/api', api);

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

// Abgelaufene Anfragen regelmäßig löschen (Aufbewahrungsfristen)
const purge = async () => {
  const n = await store.purgeExpired(new Date());
  const w = (await waStore?.purgeExpired(new Date())) ?? 0;
  if (n || w) console.log(`[daryos] ${n} Anfrage(n) und ${w} WhatsApp-Unterhaltung(en) nach Ablauf der Frist gelöscht`);
};
purge();
setInterval(purge, 6 * 60 * 60 * 1000).unref();

app.listen(port, '0.0.0.0', () => {
  console.log(`[daryos] Server läuft auf http://localhost:${port} (${isProd ? 'Produktion' : 'Entwicklung'}) – Verwaltung: http://localhost:${port}${ADMIN_BASE}/`);
  if (!passwordHash) console.warn('[daryos] Admin-Zugang deaktiviert: ADMIN_PASSWORD_HASH (oder lokal ADMIN_PASSWORD) setzen.');
});
