#!/usr/bin/env bash
# Richtet Zusatzfunktionen für den laufenden Daryos-Dienst auf Cloud Run ein – in der Google Cloud Shell:
#   bash scripts/cloudrun-config.sh
# Menü: 1) Zwei-Faktor-Anmeldung  2) Chat-Assistent (Gemini)  3) E-Mail (SMTP)  4) Status anzeigen
# Geheimnisse landen im Secret Manager, nie im Code oder im Chat.
set -uo pipefail

PROJECT="${PROJECT:-daryos-cd99a}"
REGION="${REGION:-europe-west3}"
SERVICE="${SERVICE:-daryos}"

cd "$(dirname "$0")/.." || exit 1
gcloud config set project "$PROJECT" --quiet >/dev/null 2>&1
PN="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
SA="${PN}-compute@developer.gserviceaccount.com"
[ -d node_modules ] || npm install --no-audit --no-fund >/dev/null 2>&1
TSX=./node_modules/.bin/tsx

ok()   { echo -e "  \033[32m✔\033[0m $*"; }
warn() { echo -e "  \033[33m!\033[0m $*"; }
fail() { echo -e "  \033[31m✘ $*\033[0m"; }

# Secret anlegen/aktualisieren (Wert von stdin) und dem Dienst Lesezugriff geben
put_secret() {
  local name="$1"
  if ! gcloud secrets describe "$name" >/dev/null 2>&1; then
    gcloud secrets create "$name" --replication-policy=automatic --quiet >/dev/null || return 1
  fi
  gcloud secrets versions add "$name" --data-file=- >/dev/null || return 1
  gcloud secrets add-iam-policy-binding "$name" --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor --quiet >/dev/null
}

setup_2fa() {
  echo
  SECRET="$($TSX -e "import { generateTotpSecret } from './server/totp'; process.stdout.write(generateTotpSecret())")"
  echo "  1. Öffnen Sie auf dem Handy Google Authenticator oder Microsoft Authenticator."
  echo "  2. „+“ → „Einrichtungsschlüssel eingeben“ / „Schlüssel manuell eingeben“:"
  echo
  echo "       Kontoname:  Daryos Verwaltung"
  echo "       Schlüssel:  $(echo "$SECRET" | sed 's/.\{4\}/& /g')"
  echo "       Art:        zeitbasiert"
  echo
  read -r -p "  3. Geben Sie den 6-stelligen Code ein, den die App jetzt anzeigt: " CODE
  if ! $TSX -e "import { verifyTotp } from './server/totp'; process.exit(verifyTotp('$SECRET', '${CODE//[^0-9]/}') ? 0 : 1)"; then
    fail "Code stimmt nicht. Nichts wurde geändert – bitte erneut versuchen (Uhrzeit am Handy prüfen)."
    return
  fi
  printf '%s' "$SECRET" | put_secret admin-totp || { fail "Speichern fehlgeschlagen"; return; }
  gcloud run services update "$SERVICE" --region "$REGION" --update-secrets ADMIN_TOTP_SECRET=admin-totp:latest --quiet >/dev/null 2>&1 \
    && ok "Zwei-Faktor-Anmeldung aktiv. Ab jetzt: Passwort + Code aus der App." \
    || fail "Dienst-Aktualisierung fehlgeschlagen"
  echo "  Notfall (Handy verloren):  gcloud run services update $SERVICE --region $REGION --remove-secrets ADMIN_TOTP_SECRET"
  unset SECRET CODE
}

setup_gemini() {
  echo
  echo "  1. Öffnen Sie https://aistudio.google.com/apikey (mit demselben Google-Konto)."
  echo "  2. „API-Schlüssel erstellen“ → Projekt „$PROJECT“ wählen → Schlüssel kopieren."
  echo "  3. Hier einfügen (Rechtsklick → Einfügen). Der Schlüssel bleibt unsichtbar. Dann Enter."
  read -r -s -p "  Schlüssel: " KEY; echo
  KEY="$(echo -n "$KEY" | tr -d '[:space:]')"
  if [ -z "$KEY" ]; then
    fail "Nichts empfangen. In der Cloud Shell einfügen mit Strg+Umschalt+V oder Rechtsklick → Einfügen."
    return
  fi
  echo "  Empfangen: ${KEY:0:4}… (${#KEY} Zeichen)"
  if [[ ! "$KEY" =~ ^AIza[0-9A-Za-z_-]{30,}$ ]]; then
    fail "Das sieht nicht wie ein Gemini-Schlüssel aus (beginnt mit „AIza“). Nichts wurde geändert."
    return
  fi
  printf '%s' "$KEY" | put_secret gemini-key || { fail "Speichern fehlgeschlagen"; return; }
  unset KEY
  gcloud run services update "$SERVICE" --region "$REGION" --update-secrets GEMINI_API_KEY=gemini-key:latest --quiet 2>&1 | tail -3; [ "${PIPESTATUS[0]}" = 0 ] \
    && ok "Chat-Assistent aktiv. Test: Verwaltung → KI-Assistent → Testen." \
    || fail "Dienst-Aktualisierung fehlgeschlagen"
}

setup_smtp() {
  echo
  echo "  Empfehlung: Brevo (kostenlos bis 300 E-Mails/Tag, Server in der EU): https://www.brevo.com"
  echo "  Dort: Konto anlegen → Absender-Adresse bestätigen → „SMTP & API“ → SMTP-Schlüssel erzeugen."
  echo "  (Outlook.com/Hotmail erlauben den Versand aus Programmen meist nicht mehr.)"
  echo
  read -r -p "  SMTP-Server [smtp-relay.brevo.com]: " HOST; HOST="${HOST:-smtp-relay.brevo.com}"
  read -r -p "  Port [587]: " PORT; PORT="${PORT:-587}"
  read -r -p "  Benutzername (bei Brevo: Ihre Login-E-Mail bzw. angezeigter SMTP-Login): " USER
  read -r -s -p "  Passwort / SMTP-Schlüssel (unsichtbar): " PASS; echo
  read -r -p "  Absender, z. B. Daryos <info@ihre-domain.de>: " FROM
  read -r -p "  Ihre E-Mail für Benachrichtigungen: " NOTIFY
  if [ -z "$USER" ] || [ -z "$PASS" ] || [ -z "$FROM" ] || [[ ! "$NOTIFY" == *@* ]]; then
    fail "Angaben unvollständig. Nichts wurde geändert."
    return
  fi
  printf '%s' "$PASS" | put_secret smtp-pass || { fail "Speichern fehlgeschlagen"; return; }
  unset PASS
  gcloud run services update "$SERVICE" --region "$REGION" --quiet \
    --update-env-vars "^##^SMTP_HOST=$HOST##SMTP_PORT=$PORT##SMTP_USER=$USER##MAIL_FROM=$FROM##ADMIN_NOTIFY_EMAIL=$NOTIFY" \
    --update-secrets SMTP_PASS=smtp-pass:latest >/dev/null 2>&1 \
    && ok "E-Mail eingerichtet. Neue Anfragen melden sich ab jetzt an $NOTIFY." \
    || fail "Dienst-Aktualisierung fehlgeschlagen"
}

show_status() {
  echo
  local envs secrets
  envs="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(spec.template.spec.containers[0].env)' 2>/dev/null)"
  for k in STORAGE ADMIN_PASSWORD_HASH ADMIN_TOTP_SECRET GEMINI_API_KEY SMTP_HOST SMTP_PASS; do
    if [[ "$envs" == *"'$k'"* || "$envs" == *"$k"* ]]; then ok "$k gesetzt"; else warn "$k fehlt"; fi
  done
  echo "  Adresse: $(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
}

while true; do
  echo
  echo "  ── Daryos einrichten ─────────────────────────"
  echo "   1) Zwei-Faktor-Anmeldung"
  echo "   2) Chat-Assistent (Gemini)"
  echo "   3) E-Mail-Versand (SMTP)"
  echo "   4) Status anzeigen"
  echo "   0) Beenden"
  read -r -p "  Auswahl: " CHOICE
  case "$CHOICE" in
    1) setup_2fa ;;
    2) setup_gemini ;;
    3) setup_smtp ;;
    4) show_status ;;
    0|q|"") break ;;
    *) warn "Bitte 0–4 eingeben." ;;
  esac
done
