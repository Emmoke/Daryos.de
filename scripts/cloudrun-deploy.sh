#!/usr/bin/env bash
# Veröffentlicht Daryos auf Google Cloud Run – in der Google Cloud Shell ausführen:
#   bash scripts/cloudrun-deploy.sh
# Erledigt: Dienste einschalten, Firestore-Datenbank anlegen (falls nötig), Admin-Passwort prüfen bzw. neu erzeugen,
# Rechte setzen, veröffentlichen, Adresse anzeigen – und bei Fehlern das Server-Protokoll ausgeben.
set -uo pipefail

PROJECT="${PROJECT:-daryos-cd99a}"
REGION="${REGION:-europe-west3}"
SERVICE="${SERVICE:-daryos}"
ADMIN_EMAIL="${ADMIN_EMAIL:-Emmoke@outlook.de}"
SECRET="admin-password-hash"

ok()   { echo -e "  \033[32m✔\033[0m $*"; }
info() { echo -e "\n\033[1m$*\033[0m"; }
fail() { echo -e "  \033[31m✘ $*\033[0m"; exit 1; }

cd "$(dirname "$0")/.." || exit 1
gcloud config set project "$PROJECT" --quiet >/dev/null 2>&1 || fail "Projekt $PROJECT nicht gefunden"

info "1/6 Google-Dienste einschalten …"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  firestore.googleapis.com secretmanager.googleapis.com storage.googleapis.com --quiet || fail "Dienste konnten nicht eingeschaltet werden (Abrechnung aktiv?)"
ok "Dienste aktiv"

info "2/6 Firestore-Datenbank prüfen …"
if gcloud firestore databases describe --database='(default)' >/dev/null 2>&1; then
  ok "Datenbank vorhanden"
else
  gcloud firestore databases create --location="$REGION" --type=firestore-native --quiet || fail "Datenbank konnte nicht angelegt werden"
  ok "Datenbank in $REGION angelegt"
fi

info "3/6 Admin-Passwort prüfen …"
[ -d node_modules ] || npm install --no-audit --no-fund >/dev/null 2>&1
NEED_NEW=0
if ! gcloud secrets describe "$SECRET" >/dev/null 2>&1; then
  gcloud secrets create "$SECRET" --replication-policy=automatic --quiet >/dev/null || fail "Secret konnte nicht angelegt werden"
  NEED_NEW=1
elif ! gcloud secrets versions access latest --secret="$SECRET" 2>/dev/null | ./node_modules/.bin/tsx scripts/check-admin-hash.ts 2>/dev/null; then
  NEED_NEW=1
fi
if [ "${NEUES_PASSWORT:-0}" = "1" ]; then NEED_NEW=1; fi
if [ "$NEED_NEW" = "1" ]; then
  PW="$(openssl rand -base64 15 | tr -d '/+=' | cut -c1-16)"
  ./node_modules/.bin/tsx scripts/hash-password.ts "$PW" | tr -d '\n' | gcloud secrets versions add "$SECRET" --data-file=- >/dev/null || fail "Passwort konnte nicht gespeichert werden"
  NEWEST="$(gcloud secrets versions list "$SECRET" --filter='state=ENABLED' --sort-by='~createTime' --format='value(name.basename())' | head -1)"
  for V in $(gcloud secrets versions list "$SECRET" --filter='state=ENABLED' --format='value(name.basename())'); do
    [ "$V" != "$NEWEST" ] && gcloud secrets versions disable "$V" --secret="$SECRET" --quiet >/dev/null
  done
  echo
  echo "  ╔════════════════════════════════════════════════════╗"
  echo "  ║  IHR NEUES ADMIN-PASSWORT:  $PW       ║"
  echo "  ║  Jetzt notieren! Es wird nicht noch einmal gezeigt. ║"
  echo "  ╚════════════════════════════════════════════════════╝"
  echo
  unset PW
else
  ok "Gültiges Passwort hinterlegt"
fi

info "4/6 Rechte für den Server setzen …"
PN="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
SA="${PN}-compute@developer.gserviceaccount.com"
gcloud secrets add-iam-policy-binding "$SECRET" --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor --quiet >/dev/null || fail "Secret-Recht fehlgeschlagen"
# Privater Speicher für Kundenunterlagen (kein öffentlicher Zugriff, nur der Server)
BUCKET="${PROJECT}-uploads"
if ! gcloud storage buckets describe "gs://$BUCKET" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://$BUCKET" --location="$REGION" --uniform-bucket-level-access --public-access-prevention --quiet >/dev/null || fail "Dateispeicher konnte nicht angelegt werden"
fi
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member="serviceAccount:$SA" --role=roles/storage.objectAdmin --quiet >/dev/null || fail "Dateispeicher-Recht fehlgeschlagen"
# Schlüssel zum Verschlüsseln der Zugangsdaten, die in der Verwaltung eingetragen werden (einmalig, zufällig)
if ! gcloud secrets describe config-key >/dev/null 2>&1; then
  openssl rand -base64 48 | tr -d '\n' | gcloud secrets create config-key --replication-policy=automatic --data-file=- --quiet >/dev/null || fail "Verschlüsselungsschlüssel konnte nicht angelegt werden"
fi
gcloud secrets add-iam-policy-binding config-key --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor --quiet >/dev/null || fail "Secret-Recht fehlgeschlagen"
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$SA" --role=roles/datastore.user --condition=None --quiet >/dev/null || fail "Datenbank-Recht fehlgeschlagen"
ok "Rechte gesetzt"

# Verweise auf Secrets entfernen, die es nicht (mehr) gibt – sonst schlägt jede Veröffentlichung fehl
STALE=""
for ref in $(gcloud run services describe "$SERVICE" --region "$REGION" --format=json 2>/dev/null | node -e '
  let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{for(const e of JSON.parse(d).spec.template.spec.containers[0].env||[]){const k=e.valueFrom&&e.valueFrom.secretKeyRef;if(k)console.log(e.name+"="+k.name)}}catch{}})'); do
  if ! gcloud secrets describe "${ref#*=}" >/dev/null 2>&1; then STALE="${STALE:+$STALE,}${ref%%=*}"; fi
done
if [ -n "$STALE" ]; then
  echo "  Entferne Verweise auf fehlende Secrets: $STALE"
  gcloud run services update "$SERVICE" --region "$REGION" --remove-secrets "$STALE" --quiet >/dev/null 2>&1 || true
fi

info "5/6 Veröffentlichen (3–6 Minuten) …"
if gcloud run deploy "$SERVICE" --source . --region "$REGION" --max-instances 1 --allow-unauthenticated --quiet \
    --update-env-vars "STORAGE=firestore,FIREBASE_PROJECT_ID=$PROJECT,ADMIN_EMAIL=$ADMIN_EMAIL,TRUST_PROXY=true,STORAGE_BUCKET=$BUCKET" \
    --update-secrets "ADMIN_PASSWORD_HASH=$SECRET:latest,CONFIG_ENCRYPTION_KEY=config-key:latest"; then
  URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
  CUR="$(gcloud run services describe "$SERVICE" --region "$REGION" --format=json | grep -A1 '"APP_URL"' | grep -o 'https://[^"]*' | head -1)"
  # Eine eigene Domain (z. B. https://daryos.de) nicht überschreiben
  if [ -z "$CUR" ] || [[ "$CUR" == *".run.app" ]]; then
    gcloud run services update "$SERVICE" --region "$REGION" --update-env-vars "APP_URL=$URL" --quiet >/dev/null 2>&1
  fi
  info "6/6 Fertig!"
  echo "  Webseite:    $URL"
  echo "  Verwaltung:  $URL/verwaltung/"
else
  info "6/6 Veröffentlichen fehlgeschlagen – letzte Meldungen des Servers:"
  gcloud logging read "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE\"" \
    --freshness=30m --limit=25 --format='value(textPayload)' 2>/dev/null | grep -v '^$' | tail -25
  echo
  echo "  Bitte diese Ausgabe (ohne Passwort) an Claude schicken."
  exit 1
fi
