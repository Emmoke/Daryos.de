// HTTP-API der Daryos-Plattform. createApp() erhält alle Abhängigkeiten, damit Tests sie austauschen können.
import express, { type Request, type Response, type NextFunction } from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { STATUS_LABELS, type ComparisonResult, type IntegrationStatus, type PublicRequestStatus } from '../shared/platform';
import { rankOffers } from './comparison';
import { fetchWithTimeout, OfferProviderError, type OfferProvider } from './offers';
import { newRequestId, REQUEST_ID_PATTERN, type RequestRecord, type RequestStore } from './store';
import { validateComparisonInput, validateContactInput } from './validation';
import { logNote, transition, TransitionError } from './workflow';
import { RateLimiter, rateLimit, readCookie, sameOriginOnly, SESSION_COOKIE, SessionManager, verifyPassword, type AdminUser } from './security';
import { notifierFromEnv, type Notifier } from './notifier';
import { AssistantNotConfiguredError, assistantFromEnv, buildSystemSummary, type Assistant, type ChatTurn } from './assistant';
import { generateTotpSecret, verifyTotp } from './totp';
import { CustomerAuth, normalizeEmail } from './customers';
import { buildBriefing, buildCopilotContext, buildCopilotPrompt, COPILOT_RULES, type CopilotStore } from './copilot';
import { detectUploadType, MAX_DOCUMENTS_PER_REQUEST, MAX_UPLOAD_BYTES, safeFileName, UPLOAD_TYPES, type FileStorage } from './files';
import { INTEGRATION_FIELDS, IntegrationError, type IntegrationGroup, type IntegrationStore } from './integrations';
import { TariffError, type TariffCatalog } from './tariffs';
import { AssistantConfigError, SESSION_ID_PATTERN, toolInstructions, type AssistantConfigStore } from './assistantConfig';
import { AccountingError, EXPENSE_CATEGORIES, INCOME_CATEGORIES, settingsComplete, type AccountingStore } from './accounting';
import { CloudApiSender, ConversationStore, handleWebhook, whatsappConfigFromEnv, sendAndLog, verifyChallenge, verifySignature, withinServiceWindow, type WhatsAppConfig, type WhatsAppSender } from './whatsapp';

export interface AppDeps {
  store: RequestStore;
  offerProvider: OfferProvider;
  notifier: Notifier;
  assistant: Assistant;
  sessions: SessionManager;
  admin: { email: string; name: string; passwordHash?: string; totpSecret?: string };
  accounting?: AccountingStore;
  tariffs?: TariffCatalog;
  assistantConfig?: AssistantConfigStore;
  /** Anzeigename des Datenspeichers (z. B. Cloud Firestore) */
  storageName?: string;
  whatsappNumber?: string;
  /** Automatisierte WhatsApp-Anbindung über die Business Platform (optional) */
  whatsapp?: { config: WhatsAppConfig; store: ConversationStore; sender: WhatsAppSender };
  /** Zugangsdaten aus der Verwaltung (verschlüsselt gespeichert); ohne diese Angabe nur Server-Variablen */
  /** Dateispeicher für Kundenunterlagen; ohne Angabe ist das Hochladen ausgeschaltet */
  files?: FileStorage;
  customers?: CustomerAuth;
  /** KI-Mitarbeiter der Verwaltung (merkt sich den letzten Besuch) */
  copilot?: CopilotStore;
  integrations?: { store: IntegrationStore; baseEnv: NodeJS.ProcessEnv; conversations?: ConversationStore };
  appUrl?: string;
  secureCookies: boolean;
  offerTimeoutMs?: number;
  retentionDays?: { comparison: number; contact: number };
  limits?: { compare: RateLimiter; contact: RateLimiter; login: RateLimiter; assistant: RateLimiter; status: RateLimiter; chat?: RateLimiter };
  now?: () => Date;
}

const SYSTEM = 'system';
const DUPLICATE_WINDOW_MS = 30 * 60 * 1000;
const ADMIN_ACTIONS: unknown[] = ['approve', 'reject', 'submit', 'complete', 'retry', 'request_info', 'note'];

type AdminRequest = Request & { admin?: AdminUser };

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

export function createApp(deps: AppDeps) {
  const now = deps.now ?? (() => new Date());
  const retention = deps.retentionDays ?? { comparison: 30, contact: 180 };
  const limits = deps.limits ?? {
    compare: new RateLimiter(20, 10 * 60_000),
    contact: new RateLimiter(5, 10 * 60_000),
    login: new RateLimiter(5, 15 * 60_000),
    assistant: new RateLimiter(10, 10 * 60_000),
    status: new RateLimiter(60, 10 * 60_000),
  };
  const chatLimiter = limits.chat ?? new RateLimiter(30, 10 * 60_000);
  let wa = deps.whatsapp;
  const chatOptions = () => {
    const c = deps.assistantConfig?.getSettings();
    return c ? { extraInstructions: c.extraInstructions, knowledge: c.knowledge, toolInstructions: toolInstructions(c.tools) } : {};
  };
  const buildWaDeps = () =>
    wa && {
      chatOptions,
      store: wa.store,
      sender: wa.sender,
      get assistant() {
        return deps.assistant;
      },
      requests: deps.store,
      autoReply: wa.config.autoReply,
      retentionDays: retention.contact,
      now,
    };
  let waDeps = buildWaDeps();

  // Nach dem Speichern von Zugangsdaten in der Verwaltung: Verbindungen ohne Neustart neu aufbauen
  const applyIntegrations = () => {
    const i = deps.integrations;
    if (!i) return;
    const env = i.store.merged(i.baseEnv);
    deps.assistant = assistantFromEnv(env);
    deps.notifier = notifierFromEnv(env);
    deps.whatsappNumber = env.WHATSAPP_NUMBER?.replace(/\D/g, '') || undefined;
    deps.admin.totpSecret = env.ADMIN_TOTP_SECRET || undefined;
    const cfg = whatsappConfigFromEnv(env);
    wa = cfg && i.conversations ? { config: cfg, store: i.conversations, sender: new CloudApiSender(cfg) } : undefined;
    waDeps = buildWaDeps();
  };
  const whatsappStatus = () =>
    wa
      ? { configured: true, mode: 'business_api' as const, detail: `WhatsApp Business Platform aktiv (automatische Antworten: ${wa.config.autoReply ? 'an' : 'aus'})`, number: deps.whatsappNumber }
      : deps.whatsappNumber
        ? { configured: true, mode: 'click_to_chat' as const, detail: 'WhatsApp-Chat-Link (keine automatisierte Business-API)', number: deps.whatsappNumber }
        : { configured: false, mode: 'none' as const, detail: 'WhatsApp ist noch nicht eingerichtet.' };
  const daysFromNow = (d: number) => new Date(now().getTime() + d * 86_400_000).toISOString();

  const app = express.Router();
  // Rohdaten aufbewahren: nötig für die Signaturprüfung des WhatsApp-Webhooks
  app.use(express.json({ limit: '20kb', verify: (req, _res, buf) => ((req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf)) }));
  app.use(sameOriginOnly);
  app.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  // ---------- Öffentliche Endpunkte ----------

  app.get('/integrations', (_req, res) => {
    const status: IntegrationStatus = {
      offerProvider: deps.offerProvider.info,
      email: { configured: deps.notifier.configured, detail: deps.notifier.configured ? 'eingerichtet' : 'nicht eingerichtet' },
      whatsapp: whatsappStatus(),
      assistant: { configured: deps.assistant.configured, detail: deps.assistant.configured ? 'aktiv' : 'nicht eingerichtet' },
      chat: { configured: deps.assistant.configured, storesTranscripts: deps.assistantConfig?.getSettings().storeTranscripts ?? false },
    };
    res.json(status);
  });

  // Webseiten-Chat: Antworten nur aus der freigegebenen Wissensbasis, keine Speicherung des Gesprächs
  app.post(
    '/chat',
    rateLimit(chatLimiter, 'chat'),
    asyncHandler(async (req, res) => {
      const raw = Array.isArray(req.body?.messages) ? req.body.messages : null;
      if (!raw || raw.length === 0 || raw.length > 20) return res.status(400).json({ error: 'Ungültiger Gesprächsverlauf.' });
      const history: ChatTurn[] = [];
      for (const m of raw) {
        if ((m?.role !== 'user' && m?.role !== 'assistant') || typeof m?.text !== 'string' || !m.text.trim() || m.text.length > 1000) {
          return res.status(400).json({ error: 'Nachrichten müssen 1 bis 1.000 Zeichen lang sein.' });
        }
        history.push({ role: m.role, text: m.text.trim() });
      }
      if (history.at(-1)!.role !== 'user') return res.status(400).json({ error: 'Die letzte Nachricht muss vom Kunden stammen.' });
      const sessionId = typeof req.body?.sessionId === 'string' && SESSION_ID_PATTERN.test(req.body.sessionId) ? req.body.sessionId : undefined;
      const question = history.at(-1)!.text;
      try {
        const reply = await deps.assistant.chat(history.slice(-12), chatOptions());
        const sid = await deps.assistantConfig?.record(sessionId, question, reply).catch(() => undefined);
        res.json({ reply, sessionId: sid, disclaimer: 'Automatischer Assistent – unverbindliche Auskunft, keine Tarifzusage.' });
      } catch (err) {
        await deps.assistantConfig?.record(sessionId, question, null).catch(() => undefined);
        if (err instanceof AssistantNotConfiguredError) {
          return res.status(503).json({ error: 'Der Chat-Assistent ist noch nicht eingerichtet.' });
        }
        res.status(502).json({ error: 'Der Chat-Assistent ist gerade nicht erreichbar.' });
      }
    }),
  );

  // ---------- WhatsApp Business Platform (Webhook von Meta) ----------

  app.get('/whatsapp/webhook', (req, res) => {
    if (!wa) return res.status(404).json({ error: 'WhatsApp ist nicht eingerichtet.' });
    const challenge = verifyChallenge(req.query as Record<string, unknown>, wa.config.verifyToken);
    if (!challenge) return res.status(403).send('Forbidden');
    res.type('text/plain').send(challenge);
  });

  app.post(
    '/whatsapp/webhook',
    asyncHandler(async (req, res) => {
      if (!wa || !waDeps) return res.status(404).json({ error: 'WhatsApp ist nicht eingerichtet.' });
      if (!verifySignature((req as Request & { rawBody?: Buffer }).rawBody, req.get('x-hub-signature-256'), wa.config.appSecret)) {
        return res.status(401).json({ error: 'Ungültige Signatur.' });
      }
      const processed = await handleWebhook(req.body, waDeps);
      res.json({ ok: true, processed });
    }),
  );

  app.post(
    '/compare',
    rateLimit(limits.compare, 'compare'),
    asyncHandler(async (req, res) => {
      const parsed = validateComparisonInput(req.body, now());
      if (!parsed.ok) return res.status(400).json({ error: 'Bitte prüfen Sie Ihre Angaben.', fields: parsed.errors });
      const input = parsed.value;
      const createdAt = now().toISOString();
      const record: RequestRecord = {
        id: newRequestId(),
        createdAt,
        updatedAt: createdAt,
        status: 'NEW',
        history: [{ at: createdAt, actor: 'kunde', from: null, to: 'NEW' }],
        input,
        comparison: null,
        drafts: [],
        notifications: [],
        deleteAfter: daysFromNow(retention.comparison),
      };
      transition(record, 'VALIDATING', SYSTEM, undefined, now());
      await deps.store.create(record);

      const info = deps.offerProvider.info;
      let comparison: ComparisonResult;
      try {
        const fetched = await fetchWithTimeout(deps.offerProvider, input, deps.offerTimeoutMs ?? 10_000);
        const ranked = rankOffers(fetched.offers, input);
        comparison = {
          status: ranked.offers.length ? 'ok' : 'no_offers',
          message: ranked.offers.length ? undefined : 'Für Ihre Angaben wurden aktuell keine passenden Angebote gefunden.',
          providerId: info.id,
          providerName: info.name,
          isDemo: info.isDemo,
          fetchedAt: fetched.fetchedAt,
          ...ranked,
        };
      } catch (err) {
        const notConfigured = err instanceof OfferProviderError && err.kind === 'not_configured';
        comparison = {
          status: notConfigured ? 'provider_not_configured' : 'provider_error',
          message: err instanceof OfferProviderError ? err.message : 'Die Angebotsquelle ist derzeit nicht erreichbar.',
          providerId: info.id,
          providerName: info.name,
          isDemo: info.isDemo,
          fetchedAt: now().toISOString(),
          offers: [],
          cheapestFlagValid: false,
          excludedIncompleteCount: 0,
        };
      }

      const updated = await deps.store.update(record.id, (r) => {
        r.comparison = comparison;
        if (comparison.status === 'ok') transition(r, 'OFFERS_FOUND', SYSTEM, `${comparison.offers.length} Angebote (${info.name})`, now());
        else transition(r, 'ERROR', SYSTEM, comparison.message, now());
      });
      res.status(comparison.status === 'provider_error' ? 502 : 200).json({ requestId: record.id, status: updated!.status, comparison });
    }),
  );

  const loadPublic = async (req: Request, res: Response): Promise<RequestRecord | undefined> => {
    const id = String(req.params.id || '').toUpperCase();
    if (!REQUEST_ID_PATTERN.test(id)) {
      res.status(400).json({ error: 'Ungültige Anfrage-ID.' });
      return undefined;
    }
    const record = await deps.store.get(id);
    if (!record) res.status(404).json({ error: 'Anfrage nicht gefunden. Bitte prüfen Sie die Anfrage-ID.' });
    return record;
  };

  app.get(
    '/requests/:id',
    rateLimit(limits.status, 'status'),
    asyncHandler(async (req, res) => {
      const r = await loadPublic(req, res);
      if (!r) return;
      res.json(toPublicStatus(r));
    }),
  );

  app.post(
    '/requests/:id/contact',
    rateLimit(limits.contact, 'contact'),
    asyncHandler(async (req, res) => {
      if (typeof req.body?.website === 'string' && req.body.website.trim()) {
        return res.status(400).json({ error: 'Anfrage abgelehnt.' }); // Honeypot-Feld wurde ausgefüllt
      }
      const r = await loadPublic(req, res);
      if (!r) return;
      const parsed = validateContactInput(req.body);
      if (!parsed.ok) return res.status(400).json({ error: 'Bitte prüfen Sie Ihre Angaben.', fields: parsed.errors });
      const contact = parsed.value;

      // Fingerprint über Angebot + E-Mail erkennt Doppelklicks und erneutes Absenden (auch anfrageübergreifend)
      const fingerprint = createHash('sha256').update(`${contact.offerId}|${contact.email}`).digest('hex');
      if (r.contactFingerprint === fingerprint) {
        return res.json({ requestId: r.id, duplicate: true, status: toPublicStatus(r) });
      }
      const globalDup = await deps.store.findByFingerprint(fingerprint, new Date(now().getTime() - DUPLICATE_WINDOW_MS).toISOString());
      if (globalDup) return res.json({ requestId: globalDup.id, duplicate: true, status: toPublicStatus(globalDup) });

      if (r.status !== 'OFFERS_FOUND') {
        return res.status(409).json({ error: 'Zu dieser Anfrage wurde bereits ein Angebot angefragt. Bitte starten Sie einen neuen Vergleich oder kontaktieren Sie Daryos.' });
      }
      const ranked = r.comparison?.offers.find((o) => o.offer.id === contact.offerId);
      if (!ranked) return res.status(400).json({ error: 'Das gewählte Angebot gehört nicht zu dieser Anfrage.', fields: { offerId: 'Unbekanntes Angebot.' } });

      let updated = await deps.store.update(r.id, (rec) => {
        rec.contact = { ...contact, consentAt: now().toISOString() };
        rec.selectedOfferId = contact.offerId;
        rec.contactFingerprint = fingerprint;
        rec.deleteAfter = daysFromNow(retention.contact);
        transition(rec, 'CUSTOMER_CONTACTED', 'kunde', `Kontaktanfrage zu ${ranked.offer.providerName} – ${ranked.offer.tariffName}`, now());
      });

      // KI-/Regel-Vorbereitung für den Administrator
      let summary = buildSystemSummary(updated!);
      try {
        summary = await deps.assistant.improveSummary(updated!, summary);
      } catch {
        summary.warnings.push('KI-Zusammenfassung fehlgeschlagen – regelbasierte Prüfung angezeigt.');
      }
      updated = await deps.store.update(r.id, (rec) => {
        rec.summary = summary;
        transition(rec, 'WAITING_FOR_ADMIN', SYSTEM, 'Zusammenfassung und Vollständigkeitsprüfung erstellt', now());
      });

      const log = await deps.notifier.notifyAdminNewRequest(r.id, `${deps.appUrl ?? ''}/#/admin`);
      updated = await deps.store.update(r.id, (rec) => {
        rec.notifications.push(log);
      });

      res.status(201).json({ requestId: r.id, duplicate: false, status: toPublicStatus(updated!) });
    }),
  );

  app.post(
    '/requests/:id/assistant',
    rateLimit(limits.assistant, 'assistant'),
    asyncHandler(async (req, res) => {
      const r = await loadPublic(req, res);
      if (!r) return;
      const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
      if (question.length < 3 || question.length > 500) return res.status(400).json({ error: 'Bitte eine Frage mit 3 bis 500 Zeichen stellen.' });
      try {
        const answer = await deps.assistant.answerCustomer(r, question);
        res.json({ answer, generatedBy: 'gemini', disclaimer: 'KI-generierte Erläuterung auf Basis der angezeigten Angebotsdaten. Unverbindlich.' });
      } catch (err) {
        if (err instanceof AssistantNotConfiguredError) {
          return res.status(503).json({ error: 'Der KI-Assistent ist noch nicht eingerichtet. Bitte nutzen Sie die Kontaktanfrage – Daryos beantwortet Ihre Frage persönlich.' });
        }
        res.status(502).json({ error: 'Der KI-Assistent ist gerade nicht verfügbar. Bitte nutzen Sie die Kontaktanfrage.' });
      }
    }),
  );

  // ---------- Administrator ----------

  const setSessionCookie = (res: Response, token: string, maxAgeS: number) => {
    const parts = [`${SESSION_COOKIE}=${token}`, 'Path=/api', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAgeS}`];
    if (deps.secureCookies) parts.push('Secure');
    res.setHeader('Set-Cookie', parts.join('; '));
  };

  app.post(
    '/admin/login',
    rateLimit(limits.login, 'login'),
    asyncHandler(async (req, res) => {
      if (!deps.admin.passwordHash) {
        return res.status(503).json({ error: 'Der Administrator-Zugang ist noch nicht eingerichtet (ADMIN_PASSWORD_HASH fehlt).' });
      }
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      const code = typeof req.body?.code === 'string' ? req.body.code.replace(/\s/g, '') : '';
      const passwordOk = !!password && password.length <= 200 && verifyPassword(password, deps.admin.passwordHash);
      // Bei aktivierter Zwei-Faktor-Anmeldung müssen Passwort UND Code stimmen; die Fehlermeldung verrät nicht, was falsch war
      const codeOk = !deps.admin.totpSecret || verifyTotp(deps.admin.totpSecret, code, now().getTime());
      if (!passwordOk || !codeOk) {
        return res.status(401).json({ error: 'Anmeldung fehlgeschlagen.' });
      }
      const user: AdminUser = { role: 'eigentuemer', email: deps.admin.email, name: deps.admin.name };
      setSessionCookie(res, deps.sessions.create(user), 8 * 60 * 60);
      res.json({ user });
    }),
  );

  app.post('/admin/logout', (req, res) => {
    deps.sessions.destroy(readCookie(req, SESSION_COOKIE));
    setSessionCookie(res, '', 0);
    res.json({ ok: true });
  });

  const requireAdmin = (req: AdminRequest, res: Response, next: NextFunction) => {
    const user = deps.sessions.get(readCookie(req, SESSION_COOKIE));
    if (!user) return res.status(401).json({ error: 'Nicht angemeldet.' });
    req.admin = user;
    next();
  };

  app.get('/admin/auth-config', (_req, res) => res.json({ configured: !!deps.admin.passwordHash, twoFactor: !!deps.admin.totpSecret }));

  app.get('/admin/me', requireAdmin, (req: AdminRequest, res) => res.json({ user: req.admin, twoFactor: !!deps.admin.totpSecret }));

  // ---------- Übersicht ----------
  app.get(
    '/admin/overview',
    requireAdmin,
    asyncHandler(async (_req, res) => {
      const all = await deps.store.list();
      const byStatus: Record<string, number> = {};
      for (const r of all) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      const year = now().toISOString().slice(0, 4);
      const conversations = wa?.store.list() ?? [];
      res.json({
        requests: { total: all.length, byStatus, waiting: byStatus.WAITING_FOR_ADMIN ?? 0, recent: all.slice(0, 5).map((r) => ({ id: r.id, status: r.status, createdAt: r.createdAt, customerName: r.contact?.name ?? null, energyType: r.input.energyType })) },
        whatsapp: { configured: !!wa, conversations: conversations.length, needsHuman: conversations.filter((c) => c.needsHuman && !c.optedOut).length },
        accounting: deps.accounting ? { ...deps.accounting.summary(year), settingsMissing: settingsComplete(deps.accounting.getSettings()) } : null,
      });
    }),
  );

  // ---------- Buchhaltung ----------
  const acc = (res: Response) => {
    if (!deps.accounting) {
      res.status(404).json({ error: 'Buchhaltung ist nicht aktiviert.' });
      return undefined;
    }
    return deps.accounting;
  };
  const accHandler =
    (fn: (req: AdminRequest, res: Response, a: AccountingStore) => Promise<unknown> | unknown) =>
    asyncHandler(async (req: AdminRequest, res) => {
      const a = acc(res);
      if (!a) return;
      try {
        await fn(req, res, a);
      } catch (err) {
        if (err instanceof AccountingError) return res.status(err.status).json({ error: err.message, fields: err.fields });
        throw err;
      }
    });
  const actorOf = (req: AdminRequest) => `admin:${req.admin!.email}`;
  const yearParam = (req: Request) => (typeof req.query.year === 'string' && /^\d{4}$/.test(req.query.year) ? req.query.year : now().toISOString().slice(0, 4));

  app.get('/admin/accounting/settings', requireAdmin, accHandler((_q, res, a) => res.json({ settings: a.getSettings(), missing: settingsComplete(a.getSettings()) })));
  app.put('/admin/accounting/settings', requireAdmin, accHandler(async (req, res, a) => {
    const settings = await a.updateSettings(req.body);
    res.json({ settings, missing: settingsComplete(settings) });
  }));
  app.get('/admin/accounting/summary', requireAdmin, accHandler((req, res, a) => res.json(a.summary(yearParam(req)))));
  app.get('/admin/accounting/invoices', requireAdmin, accHandler((_q, res, a) => res.json({ invoices: a.listInvoices() })));
  app.post('/admin/accounting/invoices', requireAdmin, accHandler(async (req, res, a) => res.status(201).json({ invoice: await a.createInvoice(req.body, actorOf(req)) })));
  app.post('/admin/accounting/invoices/:id/paid', requireAdmin, accHandler(async (req, res, a) => res.json({ invoice: await a.markPaid(String(req.params.id), req.body?.paidAt, actorOf(req)) })));
  app.post('/admin/accounting/invoices/:id/cancel', requireAdmin, accHandler(async (req, res, a) => res.json(await a.cancelInvoice(String(req.params.id), req.body?.reason, actorOf(req)))));
  app.get('/admin/accounting/bookings', requireAdmin, accHandler((req, res, a) => res.json({ bookings: a.listBookings(yearParam(req)), categories: { einnahme: INCOME_CATEGORIES, ausgabe: EXPENSE_CATEGORIES } })));
  app.post('/admin/accounting/bookings', requireAdmin, accHandler(async (req, res, a) => res.status(201).json({ booking: await a.addBooking(req.body, actorOf(req)) })));
  app.post('/admin/accounting/bookings/:id/reverse', requireAdmin, accHandler(async (req, res, a) => res.status(201).json({ booking: await a.reverseBooking(String(req.params.id), actorOf(req)) })));
  app.get('/admin/accounting/export.csv', requireAdmin, accHandler((req, res, a) => {
    const year = yearParam(req);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Daryos-Buchungen-${year}.csv"`);
    res.send(a.bookingsCsv(year));
  }));

  app.get(
    '/admin/integrations',
    requireAdmin,
    (_req, res) => {
      res.json({
        offerProvider: deps.offerProvider.info,
        email: { configured: deps.notifier.configured, detail: deps.notifier.detail },
        whatsapp: wa
          ? whatsappStatus()
          : deps.whatsappNumber
            ? { configured: true, mode: 'click_to_chat', detail: `Nur Chat-Link auf ${deps.whatsappNumber}. Für den Bot WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_APP_SECRET und WHATSAPP_VERIFY_TOKEN setzen.` }
            : { configured: false, mode: 'none', detail: 'WhatsApp nicht eingerichtet.' },
        assistant: { configured: deps.assistant.configured, detail: deps.assistant.detail },
        storage: { configured: /firestore/i.test(deps.storageName ?? ''), detail: deps.storageName ?? 'Arbeitsspeicher' },
      });
    },
  );

  app.get(
    '/admin/requests',
    requireAdmin,
    asyncHandler(async (req, res) => {
      const status = typeof req.query.status === 'string' && req.query.status in STATUS_LABELS ? (req.query.status as RequestRecord['status']) : undefined;
      const list = await deps.store.list(status ? { status } : undefined);
      res.json({
        requests: list.map((r) => {
          const sel = r.comparison?.offers.find((o) => o.offer.id === r.selectedOfferId);
          return {
            id: r.id,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            status: r.status,
            energyType: r.input.energyType,
            postalCode: r.input.postalCode,
            customerName: r.contact?.name ?? null,
            selectedOffer: sel ? `${sel.offer.providerName} – ${sel.offer.tariffName}` : null,
            isDemo: r.comparison?.isDemo ?? false,
          };
        }),
      });
    }),
  );

  app.get(
    '/admin/requests/:id',
    requireAdmin,
    asyncHandler(async (req, res) => {
      const r = await deps.store.get(String(req.params.id));
      if (!r) return res.status(404).json({ error: 'Anfrage nicht gefunden.' });
      res.json({ request: r });
    }),
  );

  app.post(
    '/admin/requests/:id/action',
    requireAdmin,
    asyncHandler(async (req: AdminRequest, res) => {
      const action = req.body?.action;
      const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 2000) : '';
      const confirmationRef = typeof req.body?.providerConfirmationRef === 'string' ? req.body.providerConfirmationRef.trim().slice(0, 200) : '';
      const actor = `admin:${req.admin!.email}`;
      const existing = await deps.store.get(String(req.params.id));
      if (!existing) return res.status(404).json({ error: 'Anfrage nicht gefunden.' });
      const demo = existing.comparison?.isDemo ? ' [DEMO – kein echter Anbietervorgang]' : '';

      if (!ADMIN_ACTIONS.includes(action)) return res.status(400).json({ error: 'Unbekannte Aktion.' });
      if ((action === 'reject' || action === 'request_info' || action === 'note') && !note) {
        return res.status(400).json({ error: 'Bitte eine Begründung bzw. Notiz angeben.' });
      }
      if (action === 'complete' && !confirmationRef) {
        return res.status(400).json({ error: 'Abschluss nur mit Bestätigungsreferenz der Anbieterplattform möglich.' });
      }

      try {
        const updated = await deps.store.update(existing.id, (r) => {
          switch (action) {
            case 'approve':
              transition(r, 'APPROVED', actor, (note || 'Kundendaten, Tarif und Bedingungen geprüft') + demo, now());
              break;
            case 'reject':
              transition(r, 'REJECTED', actor, note, now());
              break;
            case 'submit':
              transition(r, 'SUBMITTED', actor, (note || 'Beim Anbieter eingereicht') + demo, now());
              break;
            case 'complete':
              transition(r, 'COMPLETED', actor, `Anbieterbestätigung: ${confirmationRef}${demo}`, now());
              break;
            case 'retry':
              transition(r, 'WAITING_FOR_ADMIN', actor, note || 'Erneut zur Prüfung', now());
              break;
            case 'request_info':
              logNote(r, actor, `Nachfrage beim Kunden: ${note}`, now());
              break;
            case 'note':
              logNote(r, actor, note, now());
              break;
          }
        });
        res.json({ request: updated });
      } catch (err) {
        if (err instanceof TransitionError) {
          return res.status(409).json({ error: err.message });
        }
        throw err;
      }
    }),
  );

  app.post(
    '/admin/requests/:id/draft',
    requireAdmin,
    asyncHandler(async (req: AdminRequest, res) => {
      const r = await deps.store.get(String(req.params.id));
      if (!r) return res.status(404).json({ error: 'Anfrage nicht gefunden.' });
      if (!r.contact) return res.status(409).json({ error: 'Ohne Kontaktanfrage kann kein Entwurf erstellt werden.' });
      const offerId = typeof req.body?.offerId === 'string' ? req.body.offerId : undefined;
      if (offerId && !r.comparison?.offers.some((o) => o.offer.id === offerId)) return res.status(400).json({ error: 'Das Angebot gehört nicht zu dieser Anfrage.' });
      let draft;
      try {
        draft = await deps.assistant.draftEmail(r, offerId);
      } catch {
        return res.status(502).json({ error: 'Der Entwurf konnte nicht erstellt werden.' });
      }
      const updated = await deps.store.update(r.id, (rec) => {
        rec.drafts.push(draft);
        logNote(rec, `admin:${req.admin!.email}`, `Entwurf erstellt (${draft.createdBy}) – nicht versendet`, now());
      });
      res.status(201).json({ request: updated, draft });
    }),
  );

  // Entwurf bearbeiten (nur solange er nicht versendet ist)
  app.put(
    '/admin/requests/:id/drafts/:draftId',
    requireAdmin,
    asyncHandler(async (req: AdminRequest, res) => {
      const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
      const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
      if (subject.length < 3 || subject.length > 200 || body.length < 20 || body.length > 20000) {
        return res.status(400).json({ error: 'Betreff (3–200 Zeichen) und Text (20–20.000 Zeichen) angeben.' });
      }
      const r = await deps.store.get(String(req.params.id));
      const d = r?.drafts.find((x) => x.id === req.params.draftId);
      if (!r || !d) return res.status(404).json({ error: 'Entwurf nicht gefunden.' });
      if (d.sentAt) return res.status(409).json({ error: 'Versendete E-Mails können nicht mehr geändert werden.' });
      const updated = await deps.store.update(r.id, (rec) => {
        const dr = rec.drafts.find((x) => x.id === d.id)!;
        dr.subject = subject;
        dr.body = body;
        dr.editedAt = now().toISOString();
      });
      res.json({ request: updated });
    }),
  );

  // Entwurf an den Kunden senden – nur auf ausdrückliche Freigabe des Administrators
  app.post(
    '/admin/requests/:id/drafts/:draftId/send',
    requireAdmin,
    asyncHandler(async (req: AdminRequest, res) => {
      if (req.body?.confirm !== true) return res.status(400).json({ error: 'Bitte den Versand ausdrücklich bestätigen.' });
      const r = await deps.store.get(String(req.params.id));
      const d = r?.drafts.find((x) => x.id === req.params.draftId);
      if (!r || !d) return res.status(404).json({ error: 'Entwurf nicht gefunden.' });
      if (d.sentAt) return res.status(409).json({ error: 'Diese E-Mail wurde bereits versendet.' });
      if (d.offerIsDemo) return res.status(409).json({ error: 'Der Entwurf enthält ein DEMO-Testangebot. DEMO-Angebote dürfen nicht an Kunden versendet werden.' });
      if (!r.contact?.email) return res.status(409).json({ error: 'Für diese Anfrage liegt keine E-Mail-Adresse vor.' });
      if (!deps.notifier.configured) return res.status(503).json({ error: 'Der E-Mail-Versand ist noch nicht eingerichtet (SMTP). Siehe Einstellungen → Verbindungen.' });
      const log = await deps.notifier.sendCustomerEmail(r.contact.email, d.subject, d.body);
      const actor = `admin:${req.admin!.email}`;
      const updated = await deps.store.update(r.id, (rec) => {
        rec.notifications.push(log);
        if (log.status === 'sent') {
          const dr = rec.drafts.find((x) => x.id === d.id)!;
          dr.sentAt = log.at;
          dr.sentTo = rec.contact!.email;
          dr.sentBy = actor;
          dr.approvedBy = actor;
          logNote(rec, actor, `E-Mail „${d.subject}“ an den Kunden gesendet`, now());
        } else {
          logNote(rec, actor, `E-Mail-Versand fehlgeschlagen: ${log.detail}`, now());
        }
      });
      if (log.status !== 'sent') return res.status(502).json({ error: `Versand fehlgeschlagen: ${log.detail}`, request: updated });
      res.json({ request: updated });
    }),
  );

  // ---------- KI-Assistent steuern ----------
  const cfgHandler =
    (fn: (req: AdminRequest, res: Response, c: AssistantConfigStore) => Promise<unknown> | unknown) =>
    asyncHandler(async (req: AdminRequest, res) => {
      if (!deps.assistantConfig) return res.status(404).json({ error: 'Nicht aktiviert.' });
      try {
        await fn(req, res, deps.assistantConfig);
      } catch (err) {
        if (err instanceof AssistantConfigError) return res.status(400).json({ error: err.message, fields: err.fields });
        throw err;
      }
    });
  app.get('/admin/assistant', requireAdmin, cfgHandler((_q, res, c) => res.json({ settings: c.getSettings(), stats: c.stats(), configured: deps.assistant.configured, detail: deps.assistant.detail })));
  app.put('/admin/assistant', requireAdmin, cfgHandler(async (req, res, c) => res.json({ settings: await c.updateSettings(req.body, `admin:${req.admin!.email}`) })));
  app.get('/admin/assistant/sessions', requireAdmin, cfgHandler((_q, res, c) => res.json({ sessions: c.listSessions().map((s) => ({ id: s.id, startedAt: s.startedAt, updatedAt: s.updatedAt, messages: s.messages.length, handover: s.handover, failed: s.failed, firstQuestion: s.messages.find((m) => m.role === 'user')?.text.slice(0, 120) ?? '' })) })));
  app.get('/admin/assistant/sessions/:id', requireAdmin, cfgHandler((req, res, c) => {
    const s = c.getSession(String(req.params.id));
    if (!s) return res.status(404).json({ error: 'Gespräch nicht gefunden.' });
    res.json({ session: s });
  }));
  app.delete('/admin/assistant/sessions/:id', requireAdmin, cfgHandler(async (req, res, c) => res.json({ ok: await c.deleteSession(String(req.params.id)) })));
  // Testfrage mit den aktuellen Einstellungen (wird nicht gespeichert)
  app.post('/admin/assistant/test', requireAdmin, cfgHandler(async (req, res) => {
    const q = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    if (q.length < 3 || q.length > 1000) return res.status(400).json({ error: 'Bitte eine Testfrage mit 3–1.000 Zeichen eingeben.' });
    try {
      res.json({ reply: await deps.assistant.chat([{ role: 'user', text: q }], chatOptions()) });
    } catch (err) {
      if (err instanceof AssistantNotConfiguredError) return res.status(503).json({ error: 'Der KI-Assistent ist noch nicht eingerichtet (GEMINI_API_KEY fehlt).' });
      res.status(502).json({ error: 'Der KI-Assistent ist gerade nicht erreichbar.' });
    }
  }));

  // ---------- KI-Mitarbeiter der Verwaltung ----------
  const copilotLimiter = new RateLimiter(60, 10 * 60_000);
  const copilotInput = async (since?: string) => {
    const conversations = wa?.store.list() ?? [];
    return {
      now: now(),
      since,
      requests: await deps.store.list(),
      tariffs: deps.tariffs?.list() ?? [],
      invoices: deps.accounting?.listInvoices() ?? [],
      settingsMissing: deps.accounting ? settingsComplete(deps.accounting.getSettings()) : [],
      whatsapp: { configured: !!wa, conversations: conversations.length, needsHuman: conversations.filter((c) => c.needsHuman && !c.optedOut).length },
      connections: { gemini: deps.assistant.configured, email: deps.notifier.configured },
      chat: deps.assistantConfig?.stats(),
      chatConfig: deps.assistantConfig?.getSettings(),
      chatProblems: (deps.assistantConfig?.listSessions() ?? [])
        .filter((x) => x.handover || x.failed)
        .slice(0, 10)
        .map((x) => x.messages.find((m) => m.role === 'user')?.text.slice(0, 160) ?? '')
        .filter(Boolean),
    };
  };
  app.get(
    '/admin/copilot/briefing',
    requireAdmin,
    asyncHandler(async (req: AdminRequest, res) => {
      const since = deps.copilot?.lastSeen(req.admin!.email);
      res.json({ since: since ?? null, items: buildBriefing(await copilotInput(since)), aiAvailable: deps.assistant.configured, generatedAt: now().toISOString() });
    }),
  );
  app.post(
    '/admin/copilot/seen',
    requireAdmin,
    asyncHandler(async (req: AdminRequest, res) => {
      await deps.copilot?.markSeen(req.admin!.email, now().toISOString());
      res.json({ ok: true });
    }),
  );
  app.post(
    '/admin/copilot/chat',
    requireAdmin,
    rateLimit(copilotLimiter, 'copilot'),
    asyncHandler(async (req: AdminRequest, res) => {
      const raw = Array.isArray(req.body?.messages) ? req.body.messages.slice(-20) : [];
      const history = raw
        .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.text === 'string' && m.text.trim())
        .map((m: any) => ({ role: m.role as 'user' | 'assistant', text: String(m.text).slice(0, 4000) }));
      if (!history.length || history[history.length - 1].role !== 'user') return res.status(400).json({ error: 'Bitte eine Frage eingeben.' });
      if (!deps.assistant.configured) return res.status(503).json({ error: 'Gemini ist noch nicht verbunden (Einstellungen → Verbindungen). Das Lagebild oben funktioniert trotzdem.' });
      const input = await copilotInput(deps.copilot?.lastSeen(req.admin!.email));
      const context = buildCopilotContext(input, buildBriefing(input));
      try {
        res.json({ reply: await deps.assistant.adminChat(buildCopilotPrompt(history, context), COPILOT_RULES) });
      } catch (err) {
        console.error('[daryos] Verwaltungs-Assistent:', (err as Error)?.message);
        res.status(502).json({ error: 'Gemini ist gerade nicht erreichbar. Bitte später erneut versuchen oder unter Einstellungen → Verbindungen „Testen“.' });
      }
    }),
  );

  // ---------- Kundenkonto (Anmeldung per E-Mail-Link) und Unterlagen ----------
  const customers = deps.customers ?? new CustomerAuth(() => now().getTime());
  const ownRequests = async (email: string) => (await deps.store.list()).filter((r) => r.contact?.email && normalizeEmail(r.contact.email) === email);
  const requireCustomer = (req: Request & { customerEmail?: string }, res: Response, next: NextFunction) => {
    const email = customers.get(readCookie(req, SESSION_COOKIE));
    if (!email) return res.status(401).json({ error: 'Bitte melden Sie sich an.' });
    req.customerEmail = email;
    next();
  };
  type CustomerRequest = Request & { customerEmail?: string };
  const publicDocument = (d: NonNullable<RequestRecord['documents']>[number]) => ({ id: d.id, name: d.name, size: d.size, contentType: d.contentType, uploadedAt: d.uploadedAt, byCustomer: d.uploadedBy === 'kunde' });

  app.post(
    '/customer/login',
    rateLimit(limits.contact, 'customer-login'),
    asyncHandler(async (req, res) => {
      const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : '';
      if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'Bitte eine gültige E-Mail-Adresse eingeben.', fields: { email: 'Ungültige E-Mail-Adresse.' } });
      if (!deps.notifier.configured) return res.status(503).json({ error: 'Das Kundenkonto ist in Kürze verfügbar. Bis dahin finden Sie den Stand Ihrer Anfrage unter „Status“ mit Ihrer Anfrage-ID.' });
      // Gleiche Antwort, ob ein Konto existiert oder nicht (keine Rückschlüsse auf Kunden möglich)
      const generic = { ok: true, message: 'Falls zu dieser Adresse eine Anfrage vorliegt, haben wir Ihnen einen Anmeldelink geschickt. Er gilt 15 Minuten.' };
      if (!(await ownRequests(email)).length) return res.json(generic);
      const link = `${deps.appUrl ?? ''}/#/konto/anmelden/${customers.createLink(email)}`;
      const log = await deps.notifier.sendCustomerEmail(email, 'Ihr Anmeldelink für Daryos', `Guten Tag,\n\nmit diesem Link melden Sie sich in Ihrem Daryos-Kundenkonto an (gültig 15 Minuten, nur einmal verwendbar):\n\n${link}\n\nFalls Sie keinen Link angefordert haben, können Sie diese E-Mail ignorieren.\n\nIhr Daryos-Team`);
      if (log.status !== 'sent') console.error('[daryos] Anmeldelink konnte nicht gesendet werden:', log.detail);
      res.json(generic);
    }),
  );
  app.post('/customer/verify', rateLimit(limits.login, 'customer-verify'), (req, res) => {
    const r = customers.redeem(typeof req.body?.token === 'string' ? req.body.token : '');
    if (!r) return res.status(401).json({ error: 'Der Anmeldelink ist abgelaufen oder wurde schon verwendet. Bitte fordern Sie einen neuen an.' });
    setSessionCookie(res, r.session, 2 * 60 * 60);
    res.json({ email: r.email });
  });
  app.post('/customer/logout', (req, res) => {
    customers.destroy(readCookie(req, SESSION_COOKIE));
    setSessionCookie(res, '', 0);
    res.json({ ok: true });
  });
  app.get(
    '/customer/me',
    requireCustomer,
    asyncHandler(async (req: CustomerRequest, res) => {
      const list = await ownRequests(req.customerEmail!);
      res.json({
        email: req.customerEmail,
        uploadsEnabled: !!deps.files,
        requests: list.map((r) => ({
          ...toPublicStatus(r),
          documents: (r.documents ?? []).map(publicDocument),
          // Nur E-Mails, die Daryos nach Prüfung tatsächlich gesendet hat
          messages: r.drafts.filter((d) => d.sentAt).map((d) => ({ subject: d.subject, body: d.body, sentAt: d.sentAt })),
        })),
      });
    }),
  );
  const loadOwn = async (req: CustomerRequest, res: Response) => {
    const r = await deps.store.get(String(req.params.id));
    if (!r || !r.contact?.email || normalizeEmail(r.contact.email) !== req.customerEmail) {
      res.status(404).json({ error: 'Anfrage nicht gefunden.' });
      return undefined;
    }
    return r;
  };
  app.post(
    '/customer/requests/:id/documents',
    requireCustomer,
    rateLimit(limits.contact, 'upload'),
    express.raw({ type: Object.keys(UPLOAD_TYPES), limit: MAX_UPLOAD_BYTES }),
    asyncHandler(async (req: CustomerRequest, res) => {
      if (!deps.files) return res.status(503).json({ error: 'Das Hochladen ist noch nicht eingerichtet.' });
      const r = await loadOwn(req, res);
      if (!r) return;
      const data = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      const type = detectUploadType(data);
      if (!data.length || !type || type !== req.get('content-type')) return res.status(415).json({ error: 'Bitte nur PDF-, JPG- oder PNG-Dateien hochladen.' });
      if ((r.documents ?? []).length >= MAX_DOCUMENTS_PER_REQUEST) return res.status(409).json({ error: `Höchstens ${MAX_DOCUMENTS_PER_REQUEST} Dateien pro Anfrage.` });
      const id = randomUUID();
      const storageKey = `requests/${r.id}/${id}`;
      await deps.files.put(storageKey, data, type);
      const doc = { id, name: safeFileName(req.get('x-file-name'), type), contentType: type, size: data.length, uploadedAt: now().toISOString(), uploadedBy: 'kunde', storageKey };
      try {
        await deps.store.update(r.id, (rec) => {
          rec.documents = [...(rec.documents ?? []), doc];
          logNote(rec, 'kunde', `Unterlage hochgeladen: ${doc.name}`, now());
        });
      } catch (err) {
        await deps.files.remove(storageKey).catch(() => {});
        throw err;
      }
      res.status(201).json({ document: publicDocument(doc) });
    }),
  );
  const sendDocument = async (res: Response, d: NonNullable<RequestRecord['documents']>[number]) => {
    const data = await deps.files?.get(d.storageKey);
    if (!data) return res.status(404).json({ error: 'Datei nicht gefunden.' });
    res.setHeader('Content-Type', d.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${d.name.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(d.name)}`);
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.end(data);
  };
  app.get(
    '/customer/requests/:id/documents/:docId',
    requireCustomer,
    asyncHandler(async (req: CustomerRequest, res) => {
      const r = await loadOwn(req, res);
      const d = r?.documents?.find((x) => x.id === req.params.docId);
      if (!r) return;
      if (!d) return res.status(404).json({ error: 'Datei nicht gefunden.' });
      await sendDocument(res, d);
    }),
  );
  app.delete(
    '/customer/requests/:id/documents/:docId',
    requireCustomer,
    asyncHandler(async (req: CustomerRequest, res) => {
      const r = await loadOwn(req, res);
      if (!r) return;
      const d = r.documents?.find((x) => x.id === req.params.docId && x.uploadedBy === 'kunde');
      if (!d) return res.status(404).json({ error: 'Datei nicht gefunden.' });
      await deps.store.update(r.id, (rec) => {
        rec.documents = (rec.documents ?? []).filter((x) => x.id !== d.id);
        logNote(rec, 'kunde', `Unterlage gelöscht: ${d.name}`, now());
      });
      await deps.files?.remove(d.storageKey).catch(() => {});
      res.json({ ok: true });
    }),
  );
  app.get(
    '/admin/requests/:id/documents/:docId',
    requireAdmin,
    asyncHandler(async (req, res) => {
      const d = (await deps.store.get(String(req.params.id)))?.documents?.find((x) => x.id === req.params.docId);
      if (!d) return res.status(404).json({ error: 'Datei nicht gefunden.' });
      await sendDocument(res, d);
    }),
  );
  app.delete(
    '/admin/requests/:id/documents/:docId',
    requireAdmin,
    asyncHandler(async (req: AdminRequest, res) => {
      const r = await deps.store.get(String(req.params.id));
      const d = r?.documents?.find((x) => x.id === req.params.docId);
      if (!r || !d) return res.status(404).json({ error: 'Datei nicht gefunden.' });
      const updated = await deps.store.update(r.id, (rec) => {
        rec.documents = (rec.documents ?? []).filter((x) => x.id !== d.id);
        logNote(rec, `admin:${req.admin!.email}`, `Unterlage gelöscht: ${d.name}`, now());
      });
      await deps.files?.remove(d.storageKey).catch(() => {});
      res.json({ request: updated });
    }),
  );

  // ---------- Verbindungen: Zugangsdaten in der Verwaltung eintragen ----------
  const GROUPS = Object.keys(INTEGRATION_FIELDS) as IntegrationGroup[];
  const passwordConfirmed = (req: Request) => {
    const pw = typeof req.body?.password === 'string' ? req.body.password : '';
    return !!deps.admin.passwordHash && !!pw && pw.length <= 200 && verifyPassword(pw, deps.admin.passwordHash);
  };
  const integrationHandler =
    (fn: (req: AdminRequest, res: Response, store: IntegrationStore) => Promise<unknown> | unknown) =>
    asyncHandler(async (req: AdminRequest, res) => {
      if (!deps.integrations) return res.status(404).json({ error: 'Nicht aktiviert.' });
      try {
        await fn(req, res, deps.integrations.store);
      } catch (err) {
        if (err instanceof IntegrationError) return res.status(err.status).json({ error: err.message, fields: err.fields });
        throw err;
      }
    });
  const connectionsView = (store: IntegrationStore) => {
    const env = deps.integrations!.baseEnv;
    return {
      writable: store.writable,
      lastUpdate: store.lastUpdate,
      groups: Object.fromEntries(GROUPS.map((g) => [g, store.describe(g, env)])),
      status: {
        gemini: { configured: deps.assistant.configured, detail: deps.assistant.detail },
        email: { configured: deps.notifier.configured, detail: deps.notifier.detail },
        whatsapp: whatsappStatus(),
      },
      twoFactor: { active: !!deps.admin.totpSecret, source: store.get('ADMIN_TOTP_SECRET') ? 'verwaltung' : deps.admin.totpSecret ? 'server' : null },
      webhookUrl: `${deps.appUrl ?? ''}/api/whatsapp/webhook`,
      adminEmail: deps.admin.email,
    };
  };
  const isGroup = (g: string): g is IntegrationGroup => (GROUPS as string[]).includes(g);

  app.get('/admin/connections', requireAdmin, integrationHandler((_q, res, store) => res.json(connectionsView(store))));
  app.put(
    '/admin/connections/:group',
    requireAdmin,
    rateLimit(limits.login, 'confirm'),
    integrationHandler(async (req, res, store) => {
      const group = String(req.params.group);
      if (!isGroup(group)) return res.status(404).json({ error: 'Unbekannte Verbindung.' });
      if (!passwordConfirmed(req)) return res.status(403).json({ error: 'Bitte bestätigen Sie mit Ihrem Verwaltungs-Passwort.', fields: { password: 'Passwort stimmt nicht.' } });
      const values = req.body?.values && typeof req.body.values === 'object' ? req.body.values : {};
      const clear = Array.isArray(req.body?.clear) ? req.body.clear.filter((k: unknown): k is string => typeof k === 'string') : [];
      await store.update(group, values, clear, `admin:${req.admin!.email}`, now());
      applyIntegrations();
      console.log(`[daryos] Verbindung „${group}“ in der Verwaltung geändert von ${req.admin!.email}`);
      res.json(connectionsView(store));
    }),
  );
  app.post(
    '/admin/connections/:group/test',
    requireAdmin,
    rateLimit(limits.assistant, 'conntest'),
    integrationHandler(async (req, res) => {
      const group = String(req.params.group);
      if (group === 'gemini') {
        if (!deps.assistant.configured) return res.status(503).json({ error: 'Noch kein Gemini-Schlüssel eingetragen.' });
        try {
          const reply = await deps.assistant.chat([{ role: 'user', text: 'Antworte nur mit einem kurzen Gruß.' }]);
          return res.json({ ok: true, message: `Verbunden (${deps.assistant.detail}) – Antwort: „${reply.slice(0, 120)}“` });
        } catch (err) {
          const m = String((err as Error)?.message ?? '');
          const hint = /API key not valid|API_KEY_INVALID|UNAUTHENTICATED|permission|401|403/i.test(m) ? 'Der Schlüssel wird von Google abgelehnt – bitte neu kopieren oder neuen Schlüssel erstellen.' : /quota|429|RESOURCE_EXHAUSTED/i.test(m) ? 'Kontingent erschöpft – später erneut versuchen.' : /not found|404/i.test(m) ? 'Kein passendes Modell gefunden – Feld „Modell“ leeren und speichern.' : 'Gemini ist nicht erreichbar.';
          // Technische Meldung von Google (ohne Schlüssel) zur Fehlersuche mitgeben
          const technical = m.replace(/(AIza|AQ\.)[\w.-]+/g, '…').slice(0, 300);
          return res.status(502).json({ error: `${hint} (Google: ${technical})` });
        }
      }
      if (group === 'email') {
        const to = deps.integrations!.store.merged(deps.integrations!.baseEnv).ADMIN_NOTIFY_EMAIL;
        if (!deps.notifier.configured || !to) return res.status(503).json({ error: 'E-Mail ist noch nicht vollständig eingerichtet (Server, Absender, Benachrichtigung an).' });
        const log = await deps.notifier.sendCustomerEmail(to, 'Daryos – Test-E-Mail', 'Diese Test-E-Mail bestätigt, dass der E-Mail-Versand aus der Daryos-Verwaltung funktioniert.');
        return log.status === 'sent' ? res.json({ ok: true, message: `Test-E-Mail an ${to} gesendet.` }) : res.status(502).json({ error: `Versand fehlgeschlagen: ${log.detail}` });
      }
      if (group === 'whatsapp') {
        const st = whatsappStatus();
        return st.mode === 'none' ? res.status(503).json({ error: st.detail }) : res.json({ ok: true, message: st.detail });
      }
      res.status(404).json({ error: 'Unbekannte Verbindung.' });
    }),
  );

  // Zwei-Faktor-Anmeldung direkt in der Verwaltung einrichten (Schlüssel bleibt bis zur Bestätigung nur im Arbeitsspeicher)
  let pendingTotp: { secret: string; email: string; expires: number } | null = null;
  app.post(
    '/admin/2fa/setup',
    requireAdmin,
    rateLimit(limits.login, 'confirm'),
    integrationHandler(async (req, res, store) => {
      if (!passwordConfirmed(req)) return res.status(403).json({ error: 'Passwort stimmt nicht.', fields: { password: 'Passwort stimmt nicht.' } });
      if (!store.writable) throw new IntegrationError('Speichern ist noch nicht möglich: Auf dem Server fehlt CONFIG_ENCRYPTION_KEY. Bitte einmal „bash scripts/cloudrun-deploy.sh“ ausführen.', 503);
      const secret = generateTotpSecret();
      pendingTotp = { secret, email: req.admin!.email, expires: now().getTime() + 10 * 60_000 };
      const label = encodeURIComponent(`Daryos:${req.admin!.email}`);
      res.json({ secret, otpauth: `otpauth://totp/${label}?secret=${secret}&issuer=Daryos` });
    }),
  );
  app.post(
    '/admin/2fa/enable',
    requireAdmin,
    rateLimit(limits.login, 'confirm'),
    integrationHandler(async (req, res, store) => {
      const code = typeof req.body?.code === 'string' ? req.body.code.replace(/\s/g, '') : '';
      if (!pendingTotp || pendingTotp.email !== req.admin!.email || pendingTotp.expires < now().getTime()) return res.status(409).json({ error: 'Bitte zuerst „Einrichtung starten“ (gilt 10 Minuten).' });
      if (!verifyTotp(pendingTotp.secret, code, now().getTime())) return res.status(400).json({ error: 'Der Code stimmt nicht. Bitte den aktuellen Code aus der App eingeben.', fields: { code: 'Code stimmt nicht.' } });
      await store.setExtra('ADMIN_TOTP_SECRET', pendingTotp.secret, `admin:${req.admin!.email}`, now());
      pendingTotp = null;
      applyIntegrations();
      res.json({ ok: true, twoFactor: true });
    }),
  );
  app.post(
    '/admin/2fa/disable',
    requireAdmin,
    rateLimit(limits.login, 'confirm'),
    integrationHandler(async (req, res, store) => {
      const code = typeof req.body?.code === 'string' ? req.body.code.replace(/\s/g, '') : '';
      if (!passwordConfirmed(req) || !deps.admin.totpSecret || !verifyTotp(deps.admin.totpSecret, code, now().getTime())) return res.status(403).json({ error: 'Passwort oder Code stimmt nicht.' });
      if (!store.get('ADMIN_TOTP_SECRET')) return res.status(409).json({ error: 'Die Zwei-Faktor-Anmeldung wurde auf dem Server eingerichtet und kann nur dort entfernt werden.' });
      await store.setExtra('ADMIN_TOTP_SECRET', undefined, `admin:${req.admin!.email}`, now());
      applyIntegrations();
      res.json({ ok: true, twoFactor: !!deps.admin.totpSecret });
    }),
  );

  // ---------- Tarifkatalog ----------
  const tariffHandler =
    (fn: (req: AdminRequest, res: Response, c: TariffCatalog) => Promise<unknown> | unknown) =>
    asyncHandler(async (req: AdminRequest, res) => {
      if (!deps.tariffs) return res.status(404).json({ error: 'Tarifkatalog ist nicht aktiviert.' });
      try {
        await fn(req, res, deps.tariffs);
      } catch (err) {
        if (err instanceof TariffError) return res.status(err.status).json({ error: err.message, fields: err.fields });
        throw err;
      }
    });
  app.get('/admin/tariffs', requireAdmin, tariffHandler((_q, res, c) => res.json({ tariffs: c.list(), currentCount: c.current().length, source: deps.offerProvider.info })));
  app.post('/admin/tariffs', requireAdmin, tariffHandler(async (req, res, c) => res.status(201).json({ tariff: await c.create(req.body, `admin:${req.admin!.email}`) })));
  app.put('/admin/tariffs/:id', requireAdmin, tariffHandler(async (req, res, c) => res.json({ tariff: await c.update(String(req.params.id), req.body, `admin:${req.admin!.email}`) })));
  app.delete('/admin/tariffs/:id', requireAdmin, tariffHandler(async (req, res, c) => {
    await c.remove(String(req.params.id));
    res.json({ ok: true });
  }));

  // ---------- WhatsApp-Postfach für Administratoren ----------

  app.get('/admin/whatsapp/conversations', requireAdmin, (_req, res) => {
    if (!wa) return res.json({ configured: false, conversations: [] });
    res.json({
      configured: true,
      conversations: wa.store.list().map((c) => ({
        waId: c.waId,
        name: c.name ?? null,
        updatedAt: c.updatedAt,
        needsHuman: c.needsHuman,
        optedOut: c.optedOut,
        linkedRequestId: c.linkedRequestId ?? null,
        lastMessage: c.messages.at(-1)?.text.slice(0, 120) ?? '',
        canReply: withinServiceWindow(c, now()),
      })),
    });
  });

  app.get('/admin/whatsapp/conversations/:waId', requireAdmin, (req, res) => {
    const c = wa?.store.get(String(req.params.waId));
    if (!c) return res.status(404).json({ error: 'Unterhaltung nicht gefunden.' });
    res.json({ conversation: c, canReply: withinServiceWindow(c, now()) });
  });

  app.post(
    '/admin/whatsapp/conversations/:waId/reply',
    requireAdmin,
    asyncHandler(async (req: AdminRequest, res) => {
      if (!wa || !waDeps) return res.status(404).json({ error: 'WhatsApp ist nicht eingerichtet.' });
      const c = wa.store.get(String(req.params.waId));
      if (!c) return res.status(404).json({ error: 'Unterhaltung nicht gefunden.' });
      const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
      if (!text || text.length > 4000) return res.status(400).json({ error: 'Bitte eine Nachricht mit 1 bis 4.000 Zeichen eingeben.' });
      if (c.optedOut) return res.status(409).json({ error: 'Der Kunde hat WhatsApp-Nachrichten abbestellt.' });
      if (!withinServiceWindow(c, now())) {
        return res.status(409).json({ error: 'Das 24-Stunden-Fenster ist abgelaufen. Außerhalb davon sind nur freigegebene WhatsApp-Vorlagen erlaubt.' });
      }
      const updated = await sendAndLog(c.waId, text, `admin:${req.admin!.email}`, waDeps);
      const last = updated.messages.at(-1)!;
      res.status(last.status === 'sent' ? 200 : 502).json({ conversation: updated, ...(last.error ? { error: `Versand fehlgeschlagen: ${last.error}` } : {}) });
    }),
  );

  app.post(
    '/admin/whatsapp/conversations/:waId/bot',
    requireAdmin,
    asyncHandler(async (req, res) => {
      if (!wa) return res.status(404).json({ error: 'WhatsApp ist nicht eingerichtet.' });
      if (!wa.store.get(String(req.params.waId))) return res.status(404).json({ error: 'Unterhaltung nicht gefunden.' });
      const needsHuman = req.body?.needsHuman === true;
      const conversation = await wa.store.upsert(String(req.params.waId), (c) => (c.needsHuman = needsHuman), now(), retention.contact);
      res.json({ conversation });
    }),
  );

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if ((err as { type?: string })?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Ungültiges JSON.' });
    if ((err as { type?: string })?.type === 'entity.too.large') return res.status(413).json({ error: 'Anfrage zu groß.' });
    console.error('[api] Unerwarteter Fehler:', (err as Error)?.message);
    res.status(500).json({ error: 'Interner Fehler. Bitte später erneut versuchen.' });
  });

  return app;
}

export function toPublicStatus(r: RequestRecord): PublicRequestStatus {
  const sel = r.comparison?.offers.find((o) => o.offer.id === r.selectedOfferId);
  return {
    requestId: r.id,
    status: r.status,
    statusLabel: STATUS_LABELS[r.status],
    energyType: r.input.energyType,
    selectedOffer: sel ? { providerName: sel.offer.providerName, tariffName: sel.offer.tariffName, isDemo: sel.offer.source.isDemo } : null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    // Interne Notizen der Administratoren werden Kunden nicht angezeigt; nur Statuswechsel
    history: r.history.filter((h) => h.from !== h.to).map((h) => ({ at: h.at, statusLabel: STATUS_LABELS[h.to] })),
  };
}
