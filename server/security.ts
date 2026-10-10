// Administrator-Authentifizierung (serverseitig) und Missbrauchsschutz.
//
// Prototyp: ein Inhaber-Konto, dessen Passwort-Hash per Umgebungsvariable gesetzt wird.
// Produktiv: Firebase Authentication (oder Identity Platform) mit Rollen; siehe docs/PLATTFORM.md.
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

export interface AdminUser {
  role: 'eigentuemer';
  email: string;
  name: string;
}

/** Erzeugt einen Hash im Format scrypt$<salt>$<hash> für ADMIN_PASSWORD_HASH. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// "__session" ist der einzige Cookie-Name, den Firebase Hosting (eigene Domain) an den Server weiterreicht
export const SESSION_COOKIE = '__session';

interface Session {
  user: AdminUser;
  expiresAt: number;
}

export class SessionManager {
  private sessions = new Map<string, Session>();
  constructor(private readonly ttlMs = 8 * 60 * 60 * 1000, private readonly now: () => number = Date.now) {}

  create(user: AdminUser): string {
    const token = randomBytes(32).toString('base64url');
    this.sessions.set(this.key(token), { user, expiresAt: this.now() + this.ttlMs });
    return token;
  }

  get(token: string | undefined): AdminUser | undefined {
    if (!token) return undefined;
    const key = this.key(token);
    const s = this.sessions.get(key);
    if (!s) return undefined;
    if (s.expiresAt < this.now()) {
      this.sessions.delete(key);
      return undefined;
    }
    return s.user;
  }

  destroy(token: string | undefined) {
    if (token) this.sessions.delete(this.key(token));
  }

  // Tokens nur gehasht im Speicher halten
  private key(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

/** Einfache Sliding-Window-Begrenzung im Speicher (pro Server-Instanz). */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(private readonly limit: number, private readonly windowMs: number, private readonly now: () => number = Date.now) {}

  allow(key: string): boolean {
    const t = this.now();
    const recent = (this.hits.get(key) ?? []).filter((x) => x > t - this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(t);
    this.hits.set(key, recent);
    if (this.hits.size > 10_000) this.prune(t);
    return true;
  }

  private prune(t: number) {
    for (const [k, v] of this.hits) if (!v.some((x) => x > t - this.windowMs)) this.hits.delete(k);
  }
}

export function rateLimit(limiter: RateLimiter, name: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (limiter.allow(`${name}:${req.ip}`)) return next();
    res.status(429).json({ error: 'Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut.' });
  };
}

/** Schutz gegen Cross-Site-Requests auf schreibende Endpunkte: nur gleiche Herkunft erlaubt. */
export function sameOriginOnly(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  const origin = req.headers.origin;
  if (origin) {
    const host = req.headers.host;
    try {
      if (new URL(origin).host !== host) {
        res.status(403).json({ error: 'Anfrage von fremder Herkunft abgelehnt.' });
        return;
      }
    } catch {
      res.status(403).json({ error: 'Ungültige Herkunft.' });
      return;
    }
  }
  next();
}
