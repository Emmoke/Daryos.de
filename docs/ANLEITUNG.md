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

```
cd ~/Daryos.de && git pull && bash scripts/cloudrun-config.sh
```
Menü: 1) Zwei-Faktor-Anmeldung · 2) Chat-Assistent (Gemini-Schlüssel) · 3) E-Mail (SMTP, z. B. Brevo) · 4) Status.

Neue Version veröffentlichen (Einstellungen bleiben erhalten):
```
cd ~/Daryos.de && git checkout main && git pull && bash scripts/cloudrun-deploy.sh
```

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
