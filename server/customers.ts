// Kundenkonto ohne Passwort: Anmeldung per Link an die E-Mail-Adresse, mit der die Anfrage gestellt wurde.
// Der Link gilt 15 Minuten und nur einmal; gespeichert wird nur ein Hash des Codes.
import { createHash, randomBytes } from 'node:crypto';

const hash = (t: string) => createHash('sha256').update(t).digest('hex');

export const normalizeEmail = (e: string) => e.trim().toLowerCase();

export class CustomerAuth {
  private links = new Map<string, { email: string; expiresAt: number }>();
  private sessions = new Map<string, { email: string; expiresAt: number }>();
  constructor(
    private readonly now: () => number = Date.now,
    private readonly linkTtlMs = 15 * 60_000,
    private readonly sessionTtlMs = 2 * 60 * 60_000,
  ) {}

  createLink(email: string) {
    this.cleanup();
    const token = randomBytes(32).toString('base64url');
    this.links.set(hash(token), { email: normalizeEmail(email), expiresAt: this.now() + this.linkTtlMs });
    return token;
  }

  /** Löst einen Anmeldelink ein (nur einmal gültig) und gibt einen Sitzungs-Token zurück */
  redeem(token: string): { session: string; email: string } | undefined {
    if (typeof token !== 'string' || token.length < 20 || token.length > 100) return undefined;
    const key = hash(token);
    const link = this.links.get(key);
    this.links.delete(key);
    if (!link || link.expiresAt < this.now()) return undefined;
    const session = randomBytes(32).toString('base64url');
    this.sessions.set(hash(session), { email: link.email, expiresAt: this.now() + this.sessionTtlMs });
    return { session, email: link.email };
  }

  get(session: string | undefined) {
    if (!session) return undefined;
    const s = this.sessions.get(hash(session));
    if (!s) return undefined;
    if (s.expiresAt < this.now()) {
      this.sessions.delete(hash(session));
      return undefined;
    }
    return s.email;
  }

  destroy(session: string | undefined) {
    if (session) this.sessions.delete(hash(session));
  }

  private cleanup() {
    const t = this.now();
    for (const [k, v] of this.links) if (v.expiresAt < t) this.links.delete(k);
    for (const [k, v] of this.sessions) if (v.expiresAt < t) this.sessions.delete(k);
  }
}
