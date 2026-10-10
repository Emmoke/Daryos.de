# Daryos-Vergleichsplattform – Stand Testversion 0.1

## Starten

```bash
npm install
cp .env.example .env        # ADMIN_PASSWORD für lokal setzen
npm run dev                 # http://localhost:3000
npm test                    # 19 automatisierte Tests
npm run build && npm start  # Produktionsmodus (dist/ + API)
```

Seiten: `#/vergleich` (Tarifvergleich), `#/status/<ID>` (Anfragestatus), `#/admin` (geschütztes Dashboard).
Die bisherige Startseite bleibt unter `/` unverändert erreichbar.

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

## Testergebnisse
`npm test`: 19/19 bestanden, unter anderem für Erfolgsfall, ungültige Eingaben, fehlende Einwilligung, Honeypot, fremdes Angebot,
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
- **Datenspeicherung**: `FileRequestStore` ist nur für einen einzelnen Server geeignet. Auf Cloud Run ist das Dateisystem flüchtig → vor dem Echtbetrieb auf Firestore umstellen.
- Sitzungen und Rate-Limits liegen im Speicher (pro Instanz) → für mehrere Instanzen Firestore/Redis bzw. Firebase Auth.
- Das bestehende **Berater-Cockpit** (CRM, Rechnungen) speichert seine Daten weiterhin nur im `localStorage` des Browsers und enthält Beispieldaten. Es ist jetzt hinter der Server-Anmeldung, die Daten sollten aber in die Datenbank umziehen.
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
