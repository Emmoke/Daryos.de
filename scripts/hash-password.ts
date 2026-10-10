// Erzeugt einen Passwort-Hash für ADMIN_PASSWORD_HASH:  npm run admin:hash -- "mein sicheres Passwort"
import { hashPassword } from '../server/security';

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Bitte ein Passwort mit mindestens 12 Zeichen angeben: npm run admin:hash -- "…"');
  process.exit(1);
}
console.log(hashPassword(password));
