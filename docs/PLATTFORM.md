# Daryos-Vergleichsplattform – Stand Testversion 0.1

## Starten

```bash
npm install
cp .env.example .env        # ADMIN_PASSWORD für lokal setzen
npm run dev                 # http://localhost:3000
npm test                    # 19 automatisierte Tests
npm run build && npm start  # Produktionsmodus (dist/ + API)
```

Öffentliche Seite: `/` (Startseite), `#/vergleich` (Tarifvergleich), `#/status/<ID>` (Anfragestatus).
**Verwaltung (eigene App): `/verwaltung/`** – Übersicht, Anfragen, WhatsApp, Buchhaltung, Einstellungen.
Die öffentliche Seite enthält keinen Verwaltungscode und keinen Link dorthin.

```bash
npm run build:all           # öffentliche Seite (dist/) + Verwaltung (dist-admin/)
npm run admin:hash -- "…"   # Passwort-Hash für ADMIN_PASSWORD_HASH
npm run admin:2fa           # Schlüssel für die Zwei-Faktor-Anmeldung (ADMIN_TOTP_SECRET)
```

## Verwaltung und Buchhaltung

- Anmeldung: Passwort (scrypt-Hash) + optional TOTP-Code aus einer Authenticator-App; Sitzung 8 h, HttpOnly-Cookie, 5 Versuche / 15 Min.
- Buchhaltung (`server/accounting.ts`): Firmendaten, Rechnungen mit lückenloser Nummer (RE-JJJJ-NNNN), PDF mit Pflichtangaben,
  Kleinunternehmerregelung § 19 UStG als Einstellung, „bezahlt“ erzeugt automatisch die Einnahme-Buchung,
  Korrekturen nur über Stornorechnung bzw. Gegenbuchung (nichts wird gelöscht), Auswertung je Monat/Kategorie, CSV-Export für den Steuerberater.
- Hinweis: Hilfe für die Einnahmen-Überschuss-Rechnung; ersetzt keine Steuerberatung und kein zertifiziertes Buchhaltungsprogramm.

## Architektur

```
Browser (React)            Server (Express, server.ts)
  #/vergleich  ──POST /api/compare──▶  Validierung → RequestStore (NEW→VALIDATING)
                                       → OfferProvider (Zeitlimit 10 s) → Ranking → OFFERS_FOUND | ERROR
  Kontakt      ──POST /api/requests/:id/contact──▶ Spam-/Doppelschutz → CUSTOMER_CONTACTED
                                       → Zusammenfassung (regelbasiert, optional Gemini) → WAITING_FOR_ADMIN
                                       → E-Mail an Admin (nur ID + Link, keine Kundendaten)
  #/status     ──GET /api/requests/:id──▶ öffentlicher Status (ohne Kontaktdaten, ohne interne Notizen)
  #/admin      ──/api/admin/*──▶ HttpOnly-Session → Freigeben / Ablehnen / Nachfrage / Eingereicht / Abgeschlossen
```

| Baustein | Datei | Austausch für Produktion |
|---|---|---|
| Angebotsquelle | `server/offers/` (`OfferProvider`) | echte API-Anbindung als neue Klasse |
| Datenhaltung | `server/store.ts` (`RequestStore`) | Firestore-Implementierung |
| Admin-Login | `server/security.ts` | Firebase Authentication / Identity Platform |
| E-Mail | `server/notifier.ts` (SMTP) | z. B. Google Workspace SMTP-Relay |
| KI | `server/assistant.ts` (Gemini, serverseitig) | Vertex AI / Agent Builder (Phase 2) |
| Statusmaschine | `server/workflow.ts` | – |

### Leitplanken (im Code erzwungen)
- Keine erfundenen Tarife: Ohne echte Quelle liefert der Server nur als **DEMO** markierte Testangebote (fiktive Namen „DEMO …“), jede Ansicht und das PDF zeigen das an. Eine nicht eingerichtete Quelle liefert „nicht eingerichtet“ statt Daten.
- Unvollständige Angebote werden angezeigt, aber nicht gerankt. „Günstigstes“ erscheint nur, wenn alle Angebote vollständig sind.
- Boni zählen nur zum ersten Jahr und werden getrennt ausgewiesen.
- `COMPLETED` ist nur aus `SUBMITTED` und nur mit Bestätigungsreferenz des Anbieters möglich. Jede Änderung wird mit Zeit und Akteur protokolliert.
- Die KI versendet nichts. Entwürfe müssen vom Administrator kopiert und selbst versendet werden.
- Ohne SMTP/WhatsApp/Gemini wird „nicht eingerichtet“ angezeigt und protokolliert, nie eine vorgetäuschte Nachricht.

### Sicherheit
- Die alte Browser-PIN-Anmeldung (fest eingebaute PINs `04329`/`1234`, leeres Passwort, „Schnell-Zugang“) wurde **entfernt**. Anmeldung nur noch serverseitig mit scrypt-Hash, HttpOnly/SameSite=Strict-Cookie (8 h), Login-Limit 5 Versuche / 15 Min.
- Rate-Limits für Vergleich, Kontakt, Status und KI. Honeypot-Feld, Herkunftsprüfung (CSRF), JSON-Limit 20 KB, Sicherheits-Header/CSP in Produktion.
- Nicht erratbare Anfrage-IDs (`DY-XXXX-XXXX-XXXX`, ca. 59 Bit).
- Löschfristen: Vergleiche ohne Kontakt nach 30 Tagen, mit Kontakt nach 180 Tagen (konfigurierbar), automatisches Löschen alle 6 h.

## Chat-Assistent und WhatsApp-Bot

**Webseiten-Chat** (Sprechblase unten rechts): beantwortet allgemeine Fragen ausschließlich aus der freigegebenen Wissensbasis
(`server/knowledge.ts` = Leistungen + FAQ der Webseite) über Gemini, serverseitig. Keine Tarife, keine Zusagen; Gespräche werden
nicht auf dem Server gespeichert. Ohne `GEMINI_API_KEY` bzw. ohne Server (GitHub Pages) zeigt er WhatsApp und Terminbuchung an.

**WhatsApp-Bot** (`server/whatsapp.ts`), offizielle WhatsApp Business Platform:
- Webhook `GET/POST /api/whatsapp/webhook`: Verifizierung per Verify-Token, jede Nachricht per HMAC-Signatur (`X-Hub-Signature-256`) geprüft, Doppelzustellungen ignoriert
- Automatische Antworten aus derselben Wissensbasis; bei „Mitarbeiter“, Beschwerden, Dateien oder ohne KI → Übergabe an einen Menschen, der Bot schweigt
- Opt-out mit „STOP“, wieder an mit „START“
- Anfrage-ID (`DY-…`) in der Nachricht verknüpft das Gespräch mit dem Vorgang
- Admin-Dashboard → Tab „WhatsApp-Postfach“: Gespräche lesen, übernehmen, antworten (nur im 24-Stunden-Fenster; außerhalb nur freigegebene Vorlagen)

Einrichtung: Meta-Business-Konto → Meta-App mit Produkt „WhatsApp“ → Telefonnummer verifizieren → System-User-Token erzeugen →
Werte in `.env` bzw. Secrets eintragen → in Meta die Webhook-URL `https://IHRE-DOMAIN/api/whatsapp/webhook` und das Verify-Token eintragen und das Feld `messages` abonnieren.
Der Webhook braucht eine öffentlich erreichbare HTTPS-Adresse (Cloud Run / AI-Studio-Deployment), GitHub Pages reicht nicht.

## Dauerhafte Datenbank (Cloud Firestore)

`server/persistence.ts`: Alle Daten (Anfragen, WhatsApp, Buchhaltung) werden bei jeder Änderung sofort einzeln gespeichert –
lokal als JSON-Dateien in `data/`, im Betrieb mit `STORAGE=firestore` in Cloud Firestore (ein Dokument je Datensatz,
Sammlungen `daryos_requests`, `daryos_whatsapp_conversations`, `daryos_accounting_invoices`, `daryos_accounting_bookings`,
`daryos_accounting_meta`). Schlägt das Speichern fehl, wird nichts Ungespeichertes angezeigt; Rechnungsnummern bleiben lückenlos.

Einrichtung:
1. https://console.firebase.google.com → Projekt anlegen (oder das Google-Cloud-Projekt wählen, in dem Cloud Run läuft).
2. Firestore Database → Datenbank erstellen → Standort `europe-west3` (Frankfurt) → Produktionsmodus.
3. Regeln aus `firestore.rules` übernehmen (sperrt jeden Browser-Zugriff; nur der Server greift zu).
4. Auf Cloud Run hat das Dienstkonto im selben Projekt in der Regel Zugriff (sonst Rolle „Cloud Datastore User“ vergeben).
5. Variablen: `STORAGE=firestore`, `FIREBASE_PROJECT_ID=<projekt-id>`.

Lokal gegen Firestore testen: `GOOGLE_APPLICATION_CREDENTIALS` auf eine Dienstkonto-JSON setzen oder den Firestore-Emulator nutzen
(`FIRESTORE_EMULATOR_HOST=127.0.0.1:8085`).

## Veröffentlichen auf Cloud Run (Beispiel)

```bash
gcloud run deploy daryos --source . --region europe-west3 --max-instances 1 --allow-unauthenticated \
  --set-env-vars STORAGE=firestore,FIREBASE_PROJECT_ID=<projekt-id>,ADMIN_EMAIL=<mail>,APP_URL=https://<adresse> \
  --set-secrets ADMIN_PASSWORD_HASH=admin-password-hash:latest,ADMIN_TOTP_SECRET=admin-totp:latest,GEMINI_API_KEY=gemini-key:latest
```
Secrets vorher im Secret Manager anlegen. Danach: `https://<adresse>/` (Webseite) und `https://<adresse>/verwaltung/` (Verwaltung).

## Testergebnisse
`npm test`: 38/38 bestanden (inkl. Neustart-/Firestore-/Rollback-Tests; zusätzlich manuell gegen den offiziellen Firestore-Emulator geprüft) (inkl. WhatsApp: Signatur, Verifizierung, Duplikate, Opt-out, Übergabe, 24-h-Fenster, Chat-Validierung), unter anderem für Erfolgsfall, ungültige Eingaben, fehlende Einwilligung, Honeypot, fremdes Angebot,
Doppelanfragen (gleiche Anfrage und anfrageübergreifend innerhalb von 30 Min.), API-Ausfall, Zeitüberschreitung, leeres Ergebnis,
nicht eingerichtete Quelle, nicht autorisierte Admin-Zugriffe, alte Standard-PINs, Abmeldung, CSRF, Rate-Limits und Statusübergänge.
Zusätzlich wurde der gesamte Ablauf im Browser durchgeklickt (Desktop 1280/1440 px und Mobil 390 px, ohne horizontales Scrollen).

## Noch benötigt (von Daryos)
1. **Zentrale Angebotsquelle**: Name der Plattform, API-Dokumentation, Vertrag bzw. schriftliche Erlaubnis zum automatisierten Abruf, Test-Zugang.
   Ohne API keine automatische Übernahme (kein Auslesen einer Login-Webseite).
2. **Google-Cloud-Projekt** mit Abrechnung (Cloud Run, Firestore, Secret Manager, Firebase Auth).
3. **SMTP-Zugang** für Admin-Benachrichtigungen (z. B. Google Workspace).
4. **Gemini-API-Schlüssel** (AI Studio Secrets oder Secret Manager).
5. **WhatsApp**: für automatisierte Nachrichten ein Meta-Business-Konto und die WhatsApp Business Platform (Cloud API) mit freigegebenen Vorlagen. Bis dahin nur Chat-Link.
6. Bestätigte Geschäftsdaten für Impressum/Datenschutz und die Vermittlerangaben.

## Geschätzte laufende Kosten (Richtwerte, Prototyp mit wenig Verkehr)
- Cloud Run: bei geringer Last meist im kostenlosen Kontingent, sonst wenige €/Monat
- Firestore: bei einigen tausend Anfragen im Monat meist im kostenlosen Kontingent
- Gemini Flash: Cent-Beträge pro hundert Anfragen
- WhatsApp Business Platform: Gebühr pro Unterhaltung bzw. Vorlagennachricht laut aktueller Meta-Preisliste
- Kosten der Angebots-API: hängen vom Vertrag mit dem Anbieter ab (oft der größte Posten)
Aktuelle Preise vor dem Start in den Google- und Meta-Preisrechnern prüfen.

## Offene Sicherheits- und Rechtsfragen
- **Datenspeicherung**: erledigt – mit `STORAGE=firestore` liegen alle Daten in Cloud Firestore (siehe unten). Der Server lädt beim Start alles in den Speicher, deshalb genau eine Instanz betreiben (`--max-instances=1`).
- Sitzungen und Rate-Limits liegen im Speicher (pro Instanz) → für mehrere Instanzen Firestore/Redis bzw. Firebase Auth.
- Das frühere Browser-Cockpit (CRM/Rechnungen im `localStorage`, Beispieldaten) wurde entfernt und durch die Verwaltungs-App mit Serverdaten ersetzt.
- Der alte **Schnell-Rechner** auf der Startseite nutzt hinterlegte Richtwerte mit echten Anbieternamen. Der Hinweis „reale Anbieterdaten“ wurde in „Richtwerte“ geändert. Prüfen, ob die Werte belegt sind, sonst ersetzen oder entfernen.
- Rechtlich prüfen lassen: Vermittlerstatus und Informationspflichten (u. a. EnWG, Preisangaben, Fernabsatz/Widerruf), DSGVO (Verzeichnis, AV-Verträge mit Google/Meta/SMTP, Einwilligungstexte), Provisionsoffenlegung, Inhalte von Impressum und Datenschutzerklärung.
- Backups und Wiederherstellungstests (Firestore-Export) einrichten.

## Nächste Schritte bis zur Veröffentlichung
1. Angebotsquelle klären → `OfferProvider` für die echte API implementieren und testen (Phase 3/4).
2. Firestore-`RequestStore` und Firebase Authentication (Phase 2 abschließen).
3. SMTP und Gemini-Schlüssel hinterlegen (Phase 5).
4. Cockpit-Daten in die Datenbank verlagern, Dokumentenentwürfe aus offiziellen Anbieterdaten (Phase 6).
5. WhatsApp Business Platform und Kalender (Phase 7).
6. Rechtsprüfung, Sicherheitstest, Lasttest, Deployment auf Cloud Run mit `TRUST_PROXY=true` (Phase 8).
