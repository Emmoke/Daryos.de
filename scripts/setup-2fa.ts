// Erzeugt einen Schlüssel für die Zwei-Faktor-Anmeldung:  npm run admin:2fa
import { generateTotpSecret, otpauthUrl } from '../server/totp';

const secret = generateTotpSecret();
console.log(`
1. In der Authenticator-App (Google/Microsoft Authenticator, 1Password …) „Konto hinzufügen“ → „Schlüssel manuell eingeben“:
   Konto:     Daryos Verwaltung
   Schlüssel: ${secret.match(/.{1,4}/g)!.join(' ')}
   (zeitbasiert, 6 Stellen)

   Oder diesen Link in einen QR-Code-Generator Ihres Vertrauens einfügen:
   ${otpauthUrl(secret, process.env.ADMIN_EMAIL || 'admin')}

2. Auf dem Server als Secret hinterlegen:
   ADMIN_TOTP_SECRET=${secret}

Den Schlüssel geheim halten – wer ihn kennt, kann Codes erzeugen.
`);
