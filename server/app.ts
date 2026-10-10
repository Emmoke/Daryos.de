// HTTP-API der Daryos-Plattform. createApp() erhält alle Abhängigkeiten, damit Tests sie austauschen können.
import express, { type Request, type Response, type NextFunction } from 'express';
import { createHash } from 'node:crypto';
import { STATUS_LABELS, type ComparisonResult, type IntegrationStatus, type PublicRequestStatus } from '../shared/platform';
import { rankOffers } from './comparison';
import { fetchWithTimeout, OfferProviderError, type OfferProvider } from './offers';
import { newRequestId, REQUEST_ID_PATTERN, type RequestRecord, type RequestStore } from './store';
import { validateComparisonInput, validateContactInput } from './validation';
import { logNote, transition, TransitionError } from './workflow';
import { RateLimiter, rateLimit, readCookie, sameOriginOnly, SESSION_COOKIE, SessionManager, verifyPassword, type AdminUser } from './security';
import type { Notifier } from './notifier';
import { AssistantNotConfiguredError, buildSystemSummary, type Assistant } from './assistant';

export interface AppDeps {
  store: RequestStore;
  offerProvider: OfferProvider;
  notifier: Notifier;
  assistant: Assistant;
  sessions: SessionManager;
  admin: { email: string; name: string; passwordHash?: string };
  whatsappNumber?: string;
  appUrl?: string;
  secureCookies: boolean;
  offerTimeoutMs?: number;
  retentionDays?: { comparison: number; contact: number };
  limits?: { compare: RateLimiter; contact: RateLimiter; login: RateLimiter; assistant: RateLimiter; status: RateLimiter };
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
  const daysFromNow = (d: number) => new Date(now().getTime() + d * 86_400_000).toISOString();

  const app = express.Router();
  app.use(express.json({ limit: '20kb' }));
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
      whatsapp: deps.whatsappNumber
        ? { configured: true, mode: 'click_to_chat', detail: 'WhatsApp-Chat-Link (keine automatisierte Business-API)', number: deps.whatsappNumber }
        : { configured: false, mode: 'none', detail: 'WhatsApp ist noch nicht eingerichtet.' },
      assistant: { configured: deps.assistant.configured, detail: deps.assistant.configured ? 'aktiv' : 'nicht eingerichtet' },
    };
    res.json(status);
  });

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
      if (!password || password.length > 200 || !verifyPassword(password, deps.admin.passwordHash)) {
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

  app.get('/admin/me', requireAdmin, (req: AdminRequest, res) => res.json({ user: req.admin }));

  app.get(
    '/admin/integrations',
    requireAdmin,
    (_req, res) => {
      res.json({
        offerProvider: deps.offerProvider.info,
        email: { configured: deps.notifier.configured, detail: deps.notifier.detail },
        whatsapp: deps.whatsappNumber
          ? { configured: true, mode: 'click_to_chat', detail: `Chat-Link auf ${deps.whatsappNumber}. Automatisierte Nachrichten erfordern die WhatsApp Business Platform (nicht eingerichtet).` }
          : { configured: false, mode: 'none', detail: 'WHATSAPP_NUMBER nicht gesetzt.' },
        assistant: { configured: deps.assistant.configured, detail: deps.assistant.detail },
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
      let draft;
      try {
        draft = await deps.assistant.draftEmail(r);
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
