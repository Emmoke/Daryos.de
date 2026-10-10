// Prüft einen gespeicherten Passwort-Hash (von stdin). Exit 0 = gültig, 2 = ungültig oder bekannter Platzhalter.
import { verifyPassword } from '../server/security';

const PLACEHOLDERS = ['DEIN-PASSWORT', 'HIER-DEIN-EIGENES-PASSWORT', 'dein-langes-passwort', 'lokales-testpasswort'];
let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  const hash = input.trim();
  if (!/^scrypt\$[0-9a-f]+\$[0-9a-f]+$/.test(hash)) {
    console.error('ungültig');
    process.exit(2);
  }
  if (PLACEHOLDERS.some((p) => verifyPassword(p, hash))) {
    console.error('platzhalter');
    process.exit(2);
  }
  process.exit(0);
});
