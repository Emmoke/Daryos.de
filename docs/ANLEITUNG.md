# Daryos – Anleitung für den Betrieb

Webseite: https://daryos-6l7hprrx7a-ey.a.run.app · Verwaltung: …/verwaltung/
(Später unter der eigenen Domain, siehe unten.)

## 1. So arbeitet die Automatisierung

| Schritt | Wer | Was passiert |
|---|---|---|
| 1 | Kunde | Vergleicht auf der Webseite (PLZ, Verbrauch) und sieht Ihre gepflegten Tarife |
| 2 | automatisch | Eingaben werden geprüft, Anfrage-ID `DY-…` vergeben, Anfrage in Firestore gespeichert |
| 3 | Kunde | Wählt ein Angebot, sendet eine unverbindliche Anfrage (mit Datenschutz-Einwilligung) |
| 4 | automatisch | KI/Regeln erstellen Zusammenfassung, fehlende Angaben und Warnhinweise → Status „Wartet auf Prüfung“ |
| 5 | automatisch | E-Mail an Sie (nur Anfrage-ID + Link, keine Kundendaten) |
| 6 | **Sie** | Anfrage in der Verwaltung prüfen |
| 7 | automatisch | „Entwurf erstellen“: Preise/Bedingungen aus dem Tarif, Text von der KI – Zahlen werden gegengeprüft |
| 8 | **Sie** | Text kontrollieren, anpassen, „Geprüft – an Kunden senden“ (DEMO-Angebote sind gesperrt) |
| 9 | **Sie** | Nach Zusage: freigeben → Antrag im Anbieter-/Maklerportal → „Beim Anbieter eingereicht“ |
| 10 | **Sie** | Mit Bestätigungsnummer des Anbieters: „Anbieter hat bestätigt“ → abgeschlossen |

Parallel: Chat-Assistent auf der Webseite und WhatsApp-Bot beantworten allgemeine Fragen aus Leistungen, FAQ
und Ihrem eigenen Wissen (Verwaltung → KI-Assistent). Grundregel: **Die KI bereitet vor – verbindliche Schritte
passieren nur durch Sie.**

## 1a. Die „vier Säulen“ (wie im AI-Studio-/Firebase-Tutorial) – so sind sie bei Daryos umgesetzt

| Säule | Im Video | Bei Daryos |
|---|---|---|
| Anmeldung | Firebase Authentication | **Verwaltung:** Passwort + Zwei-Faktor. **Kunden:** „Mein Konto“ mit Anmeldelink per E-Mail (kein Passwort nötig) |
| Datenbank | Firestore | Firestore (Frankfurt), Zugriff **nur über den Server** – Browser haben keinen Direktzugriff |
| Dateispeicher | Firebase Storage | Privater Cloud-Storage-Bucket `daryos-cd99a-uploads` (Frankfurt), Kunden laden Unterlagen hoch, nur Verwaltung + Kunde selbst sehen sie |
| Sicherheitsregeln | Firestore/Storage Rules | Firestore-Regeln sperren alles für Browser; Bucket ohne öffentlichen Zugriff; Dateityp-Prüfung am Inhalt; Rate-Limits |
| Admin-Dashboard | einfache Benutzerliste | Verwaltung mit Anfragen, Tarifen, KI-Assistent, WhatsApp, Buchhaltung, Verbindungen |
| Umgebungsvariablen | Hostinger-Panel | **Verwaltung → Einstellungen → Verbindungen** (verschlüsselt) bzw. Secret Manager |
| Hosting + Domain | Hostinger | Google Cloud Run (Frankfurt) + Firebase Hosting für daryos.de (siehe Abschnitt 5) |
| Automatische Updates | GitHub → Hostinger | GitHub → Cloud Run (siehe Abschnitt 4a) |

**Mein Konto (Kunden):** Webseite → „Mein Konto“ → E-Mail der Anfrage eingeben → Link in der E-Mail anklicken (15 Min. gültig) →
Anfragen, gesendete Angebote und Unterlagen-Upload (PDF/JPG/PNG bis 8 MB). Funktioniert, sobald E-Mail eingerichtet ist.

## 1b. Ihr Assistent in der Verwaltung

Knopf **„Assistent“** unten rechts (öffnet sich bei Dringendem automatisch):
- **Lagebild** beim Öffnen: neue Anfragen und Unterlagen seit dem letzten Besuch, wartende Prüfungen (über 24 h = dringend),
  Nachfassen (Angebot > 3 Tage ohne Zusage), eingereicht > 7 Tage ohne Bestätigung, WhatsApp, ablaufende Tarife,
  überfällige Rechnungen, fehlende Verbindungen. Funktioniert auch ohne KI.
- **Chat** (mit Gemini): „Was zuerst?“, „Plan für diese Woche“, „Schreibe eine Nachfass-E-Mail“, „Was kann ich automatisieren?“.
- Datenschutz: An die KI gehen nur Anfrage-ID, Status, Sparte, PLZ-Bereich, Verbrauch und fehlende Angaben – keine Namen,
  E-Mail-Adressen oder Telefonnummern. Der Assistent kann nichts senden, freigeben oder ändern.

## 2. Tagesablauf (ca. 10 Minuten)

1. **Übersicht** → „Zu erledigen“.
2. **Anfragen** → „Wartet auf Prüfung“ → Angebot wählen → Entwurf erstellen → prüfen → senden.
3. **WhatsApp** → Gespräche mit „Antwort nötig“.
4. **Tarife** → abgelaufene (rot) aktualisieren.
5. **KI-Assistent → Auswertung** einmal pro Woche: häufige Fragen unter „Wissen“ ergänzen.

## 3. Beispiele

**Tarif eintragen** (Tarife → Neuer Tarif): Strom · Stadtwerke Muster · „Strom Fix 12“ · 27,9 ct/kWh · 11,00 €/Monat ·
Garantie 12 · Laufzeit 12 · Kündigung 4 · PLZ „04“ · gültig bis Monatsende · Quelle „Maklerpool XY, Abruf 10.10.2026“.
Sobald ein aktiver Tarif existiert, sind die DEMO-Daten auf der Webseite abgeschaltet.

**KI-Assistent anpassen** (KI-Assistent): *Anweisungen* = Ton/Länge („höchstens 4 Sätze“), *Wissen* = Fragen &
Antworten („Samstags geöffnet?“ – „Nach Vereinbarung.“), *Werkzeuge* = was angeboten werden darf (Vergleich, Termin,
WhatsApp, Status), *Testen* = Probefrage. Die festen Regeln (keine erfundenen Preise, keine Vertragszusagen) gelten immer.

**Rechnung** (Buchhaltung → Rechnungen): erst Firmendaten in Einstellungen ausfüllen, dann „Neue Rechnung“ →
PDF → bei Zahlungseingang „Bezahlt“ (bucht automatisch die Einnahme).

## 4. Einrichtung in der Google Cloud Shell

Am einfachsten direkt in der Verwaltung: **Einstellungen → Verbindungen** (Gemini, E-Mail, WhatsApp) und
**Einstellungen → Sicherheit** (Zwei-Faktor). Alternativ in der Cloud Shell:
```
cd ~/Daryos.de && git pull && bash scripts/cloudrun-config.sh
```

Neue Version veröffentlichen (Einstellungen bleiben erhalten):
```
cd ~/Daryos.de && git checkout main && git pull && bash scripts/cloudrun-deploy.sh
```

## 4a. Automatische Updates aus GitHub (einmal einrichten)

1. https://console.cloud.google.com/run?project=daryos-cd99a → Dienst **daryos** öffnen.
2. Oben **„Kontinuierliche Bereitstellung einrichten“** (bzw. „Mit Repository verbinden“).
3. Anbieter **GitHub** → mit GitHub anmelden → Repository **Emmoke/Daryos.de** wählen.
4. Branch: `^main$` · Build-Typ: **Dockerfile** (Pfad `/Dockerfile`) → Speichern.

Ab dann: Jede Übernahme (Merge) in `main` wird automatisch in 3–6 Minuten live. Einstellungen, Secrets und
Verbindungen bleiben erhalten. Den Fortschritt sehen Sie unter Cloud Build → Verlauf.
Wichtig: Darum nur geprüfte Änderungen in `main` übernehmen.

## 5. Eigene Domain daryos.de

Cloud Run in Frankfurt unterstützt eigene Domains nicht direkt; der Weg führt über **Firebase Hosting**
(kostenlos, SSL inklusive, leitet alles an den Dienst `daryos` weiter – `firebase.json` liegt bereit):

1. Cloud Shell: `cd ~/Daryos.de && npx firebase-tools login --no-localhost` (Link öffnen, Code einfügen)
2. `npx firebase-tools deploy --only hosting --project daryos-cd99a`
3. https://console.firebase.google.com → Projekt → Hosting → „Benutzerdefinierte Domain hinzufügen“ → `daryos.de`
   (und `www.daryos.de`) → die angezeigten DNS-Einträge (TXT/A) beim Domain-Anbieter eintragen.
4. Nach der Bestätigung (Minuten bis 24 h) läuft alles unter https://daryos.de, die Verwaltung unter https://daryos.de/verwaltung/.
5. Danach `APP_URL` umstellen: `gcloud run services update daryos --region europe-west3 --update-env-vars APP_URL=https://daryos.de`

Voraussetzung: Die Domain `daryos.de` gehört Ihnen bzw. Sie haben Zugang zu ihren DNS-Einstellungen.

## 6. Grenzen (ehrlich)

- Echte Tarife erscheinen nur, wenn Sie sie im Tarifkatalog pflegen oder eine Anbieter-/Maklerpool-API angebunden wird.
- Anträge beim Anbieter stellen Sie selbst im jeweiligen Portal; ein automatischer Vertragsabschluss ist bewusst nicht vorgesehen.
- Rechtstexte (Impressum, Datenschutz inkl. Chat-Speicherung, Gemini, WhatsApp, Brevo) vor dem Start prüfen lassen.
