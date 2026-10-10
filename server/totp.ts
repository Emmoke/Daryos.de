// Zwei-Faktor-Anmeldung mit zeitbasierten Einmalcodes (TOTP, RFC 6238) – kompatibel mit
// Google Authenticator, Microsoft Authenticator, 1Password u. a.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error('Ungültiges Base32-Zeichen');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function totpCode(secret: string, timeMs: number, stepSeconds = 30, digits = 6): string {
  const counter = Math.floor(timeMs / 1000 / stepSeconds);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', base32Decode(secret)).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits;
  return bin.toString().padStart(digits, '0');
}

/** Prüft einen Code mit ±1 Zeitfenster Toleranz (Uhrabweichung). */
export function verifyTotp(secret: string, code: string, timeMs = Date.now()): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  for (const drift of [-1, 0, 1]) {
    const expected = Buffer.from(totpCode(secret, timeMs + drift * 30_000));
    if (timingSafeEqual(expected, Buffer.from(code))) return true;
  }
  return false;
}

export function otpauthUrl(secret: string, account: string, issuer = 'Daryos Verwaltung'): string {
  return `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
