import React from 'react';
import { ArrowDown, Bot, CheckCircle2, Hand } from 'lucide-react';
import { Badge, Card, PageHeader } from '../ui';

const FLOW: { who: 'auto' | 'du' | 'kunde'; title: string; text: string }[] = [
  { who: 'kunde', title: 'Kunde vergleicht', text: 'Auf der Webseite gibt der Kunde PLZ und Verbrauch ein und sieht Ihre gepflegten Tarife (Seite „Tarife“).' },
  { who: 'auto', title: 'Prüfung & Speicherung', text: 'Eingaben werden geprüft, die Anfrage bekommt eine ID (DY-…) und wird in der Datenbank gespeichert.' },
  { who: 'kunde', title: 'Unverbindliche Anfrage', text: 'Der Kunde wählt ein Angebot und sendet Name/E-Mail – mit Datenschutz-Einwilligung.' },
  { who: 'auto', title: 'Vorbereitung durch die KI', text: 'Zusammenfassung, fehlende Angaben (z. B. Zählernummer) und Warnhinweise werden erstellt. Status: „Wartet auf Prüfung“.' },
  { who: 'auto', title: 'Benachrichtigung', text: 'Sie erhalten eine E-Mail mit der Anfrage-ID (sobald E-Mail eingerichtet ist).' },
  { who: 'du', title: 'Prüfen', text: 'Unter „Anfragen“ Kundendaten, Tarif und Hinweise kontrollieren.' },
  { who: 'auto', title: 'Angebots-E-Mail entwerfen', text: '„Entwurf erstellen“: Preise und Bedingungen werden aus dem Tarif übernommen, die KI formuliert den Text (Zahlen werden automatisch gegengeprüft).' },
  { who: 'du', title: 'Kontrollieren & senden', text: 'Text anpassen, speichern, „Geprüft – an Kunden senden“. Ohne Ihren Klick wird nichts versendet. DEMO-Angebote sind gesperrt.' },
  { who: 'du', title: 'Antrag beim Anbieter', text: 'Nach Zusage des Kunden: „Prüfen und freigeben“ → Antrag im Anbieter-/Maklerportal stellen → „Beim Anbieter eingereicht“.' },
  { who: 'du', title: 'Abschluss', text: 'Erst mit Bestätigungsnummer des Anbieters: „Anbieter hat bestätigt“. Der Kunde sieht jeden Schritt auf der Status-Seite.' },
];

const WHO = {
  auto: { label: 'automatisch', tone: 'blue' as const, icon: Bot },
  du: { label: 'Sie', tone: 'amber' as const, icon: Hand },
  kunde: { label: 'Kunde', tone: 'gray' as const, icon: CheckCircle2 },
};

export function GuidePage() {
  return (
    <>
      <PageHeader title="Anleitung" description="So arbeitet die Automatisierung – und so nutzen Sie die Verwaltung im Alltag." />
      <div className="grid xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6 items-start">
        <Card title="Ablauf einer Kundenanfrage">
          <ol className="space-y-1">
            {FLOW.map((s, i) => {
              const W = WHO[s.who];
              return (
                <li key={s.title}>
                  <div className="flex gap-3 rounded-lg p-2">
                    <span className="grid place-items-center w-8 h-8 shrink-0 rounded-full bg-slate-100 text-xs font-semibold">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium flex flex-wrap items-center gap-2">{s.title} <Badge tone={W.tone}>{W.label}</Badge></p>
                      <p className="text-sm text-slate-600">{s.text}</p>
                    </div>
                  </div>
                  {i < FLOW.length - 1 && <ArrowDown className="w-3.5 h-3.5 text-slate-300 ml-4" aria-hidden />}
                </li>
              );
            })}
          </ol>
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">Grundregel: Die KI sucht, vergleicht, fasst zusammen und entwirft. <strong>Verbindliche Schritte</strong> (E-Mail-Versand, Antrag, Abschluss) passieren <strong>nur durch Sie</strong>.</p>
        </Card>

        <div className="space-y-6">
          <Card title="Ihr Tagesablauf (Beispiel, 10 Minuten)">
            <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-700">
              <li><strong>Übersicht</strong> öffnen – „Zu erledigen“ zeigt offene Prüfungen, WhatsApp und überfällige Rechnungen.</li>
              <li><strong>Anfragen</strong> → Filter „Wartet auf Prüfung“ → Anfrage öffnen.</li>
              <li>Vorbereitung lesen, Angebot wählen, <strong>Entwurf erstellen</strong>, prüfen, <strong>senden</strong>.</li>
              <li><strong>WhatsApp</strong> → Gespräche mit „Antwort nötig“ übernehmen.</li>
              <li><strong>Tarife</strong> → abgelaufene Tarife aktualisieren (rot markiert).</li>
            </ol>
          </Card>

          <Card title="Beispiel: Tarif eintragen">
            <div className="text-sm text-slate-700 space-y-1">
              <p><strong>Tarife → Neuer Tarif</strong></p>
              <p className="text-xs text-slate-600">Sparte: Strom · Anbieter: Stadtwerke Muster · Tarif: Strom Fix 12 · Arbeitspreis: 27,9 · Grundpreis: 11,00 · Preisgarantie: 12 · Laufzeit: 12 · Kündigung: 4 · PLZ: 04 · Gültig bis: Monatsende · Quelle: „Maklerpool XY, Abruf 10.10.2026“ · Link: offizielle Tarifseite</p>
              <p className="text-xs text-slate-500">Ab sofort sehen Kunden mit PLZ 04… diesen Tarif im Vergleich. Nach „Gültig bis“ verschwindet er automatisch.</p>
            </div>
          </Card>

          <Card title="Beispiel: KI-Assistent verbessern">
            <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-700">
              <li><strong>KI-Assistent → Auswertung</strong>: häufigste Fragen ansehen.</li>
              <li>Schwach beantwortete Frage unter <strong>Wissen</strong> ergänzen, z. B. „Haben Sie samstags geöffnet?“ – „Termine am Samstag nach Vereinbarung.“</li>
              <li>Unter <strong>Anweisungen</strong> den Ton festlegen, z. B. „Antworte in höchstens 4 Sätzen.“</li>
              <li>Unter <strong>Testen</strong> prüfen, ob die Antwort passt.</li>
            </ol>
          </Card>

          <Card title="Ihr Assistent (unten rechts)">
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700">
              <li>Begrüßt Sie beim Öffnen mit dem <strong>Lagebild</strong>: Neues seit dem letzten Besuch, Dringendes, Erinnerungen (Nachfassen, ablaufende Tarife, überfällige Rechnungen).</li>
              <li>Im Chat: Beratung, Tages-/Wochenplan, Textentwürfe für Kunden, Ideen zur Automatisierung. Anfrage-IDs in Antworten sind anklickbar.</li>
              <li>Er führt selbst nichts aus und sieht keine Kundennamen oder Kontaktdaten – er sagt Ihnen, wo Sie es erledigen.</li>
            </ul>
          </Card>

          <Card title="Kundenkonto & Unterlagen">
            <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-700">
              <li>Kunde öffnet auf der Webseite <strong>„Mein Konto“</strong> und gibt die E-Mail seiner Anfrage ein.</li>
              <li>Er bekommt einen Anmeldelink (15 Minuten gültig, kein Passwort).</li>
              <li>Er sieht Status, Ihre gesendeten Angebote und lädt z. B. die Jahresabrechnung hoch.</li>
              <li>Sie finden die Datei unter <strong>Anfragen → Unterlagen des Kunden</strong>.</li>
            </ol>
            <p className="mt-2 text-xs text-slate-500">Voraussetzung: E-Mail ist unter Einstellungen → Verbindungen eingerichtet.</p>
          </Card>

          <Card title="Wo finde ich was?">
            <ul className="text-sm text-slate-700 space-y-1">
              <li><strong>Neue Anfragen & Status:</strong> Übersicht, Anfragen</li>
              <li><strong>Was Kunden im Vergleich sehen:</strong> Tarife (Hinweis oben: Katalog oder DEMO)</li>
              <li><strong>Terminanfragen bestätigen, eigene Termine:</strong> Termine (oder bei der Anfrage „Termin vereinbaren“)</li>
              <li><strong>Vertragspartner & Portal-Links:</strong> Partner</li>
              <li><strong>Antrag ausfüllen (selbst, Kunde, KI aus Rechnung):</strong> Anfragen → Antrag vorbereiten</li>
              <li><strong>Was Besucher suchen, wo Tarife fehlen:</strong> Auswertung</li>
              <li><strong>Einnahmen, Rechnungen, Steuerberater-Export:</strong> Buchhaltung</li>
              <li><strong>Schlüssel für Chat, E-Mail, WhatsApp:</strong> Einstellungen → Verbindungen</li>
              <li><strong>Zwei-Faktor:</strong> Einstellungen → Sicherheit</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
