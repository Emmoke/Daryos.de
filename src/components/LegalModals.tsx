import React from 'react';
import { X, Shield, FileText } from 'lucide-react';
import { Language } from '../types';

interface LegalModalsProps {
  activeModal: 'impressum' | 'datenschutz' | null;
  onClose: () => void;
  currentLang: Language;
}

export const LegalModals: React.FC<LegalModalsProps> = ({ activeModal, onClose }) => {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 relative text-slate-300 text-xs sm:text-sm leading-relaxed">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 cursor-pointer"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>

        {activeModal === 'impressum' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white text-xl font-bold border-b border-slate-800 pb-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <span>Impressum</span>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">Angaben gemäß § 5 TMG:</h4>
              <p>
                <strong>Daryos® Tarifoptimierung & Wechselservice</strong><br />
                Inhaber: Daryos Kreis<br />
                Rotfuchsstraße 1<br />
                04329 Leipzig<br />
                Deutschland
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">Kontakt:</h4>
              <p>
                Telefon / WhatsApp: +49 176 43416174<br />
                E-Mail: daryos.kreis@gmail.com
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">Tätigkeitsbereich:</h4>
              <p>
                Vermittlung und unabhängige Beratung von Tarifen für Strom-, Gas-, Telekommunikationsverträge sowie KFZ-Versicherungen gemäß den geltenden deutschen Gewerbebestimmungen.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">Haftung für Inhalte und Links:</h4>
              <p className="text-slate-400 text-xs">
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir prüfen externe Links sorgfältig, übernehmen jedoch keine Haftung für fremde Inhalte.
              </p>
            </div>
          </div>
        )}

        {activeModal === 'datenschutz' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white text-xl font-bold border-b border-slate-800 pb-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>Datenschutzerklärung (DSGVO)</span>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">1. Datenschutz auf einen Blick</h4>
              <p>
                Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Personenbezogene Daten (z. B. Name, Telefonnummer, Zählernummern oder Vertragsrechnungen), die Sie uns im Rahmen einer Terminanfrage, eines Rechner-Checks oder per WhatsApp übermitteln, werden vertraulich und ausschließlich zur Bearbeitung Ihres Beratungsanliegens verarbeitet.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">2. Verantwortliche Stelle</h4>
              <p>
                Daryos Kreis, Rotfuchsstraße 1, 04329 Leipzig<br />
                Telefon: +49 176 43416174 | E-Mail: daryos.kreis@gmail.com
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">3. Datenerfassung auf dieser Website</h4>
              <p>
                • <strong>Online-Kundenbewertungen:</strong> Wenn Sie eine Bewertung auf unserer Webseite verfassen, geschieht dies auf Grundlage Ihrer freiwilligen Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Es werden ausschließlich die von Ihnen eingegebenen Angaben (z. B. Name/Pseudonym, Wohnort/Stadtteil, Bewertungstext, Sterne) verarbeitet und öffentlich angezeigt. Sie können Ihre Bewertung und Einwilligung jederzeit formlos per E-Mail an daryos.kreis@gmail.com mit Wirkung für die Zukunft löschen lassen.<br />
                • <strong>Online-Terminanfrage & Rechner:</strong> Die von Ihnen eingegebenen Daten dienen der Vorbereitung und Durchführung Ihres individuellen Tarifangebots.<br />
                • <strong>Dokumenten-Audit:</strong> Dokumente werden nur mit Ihrer ausdrücklichen Einwilligung zur Prüfung von Kündigungsfristen und Sparpotenzialen herangezogen.<br />
                • <strong>Keine Weitergabe an Dritte:</strong> Eine Weitergabe an Versorger oder Versicherer erfolgt erst nach Ihrer gesonderten Vollmacht im Wechselauftrag.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">4. Online-Plattform: Vergleich, Kundenkonto, Chat, Statistik</h4>
              <p>
                • <strong>Tarifvergleich und Anfrage:</strong> Ihre Angaben (Sparte, PLZ, Verbrauch, bei einer Anfrage Name und Kontaktdaten) verarbeiten wir zur Erstellung und Bearbeitung Ihres Angebots (Art. 6 Abs. 1 lit. b DSGVO). Vergleiche ohne Anfrage löschen wir nach 30 Tagen, Anfragen nach 180 Tagen, soweit keine gesetzlichen Aufbewahrungspflichten bestehen.<br />
                • <strong>Mein Konto und Unterlagen:</strong> Die Anmeldung erfolgt per Link an Ihre E-Mail-Adresse; dafür setzen wir einen technisch notwendigen Anmelde-Cookie („__session“, 2 Stunden). Hochgeladene Unterlagen und Antragsdaten werden auf Servern von Google Cloud in Frankfurt gespeichert und mit der Anfrage gelöscht. Bankdaten erfragen wir nicht.<br />
                • <strong>KI-Unterstützung:</strong> Der Chat-Assistent und das Auslesen von Unterlagen (nur durch Daryos auf Ihre Anfrage hin) nutzen Google Gemini als Auftragsverarbeiter. Chatverläufe speichern wir zur Verbesserung des Service 30 Tage ohne IP-Adresse.<br />
                • <strong>E-Mail und WhatsApp:</strong> Für den E-Mail-Versand nutzen wir einen E-Mail-Dienstleister (Auftragsverarbeiter, EU), für WhatsApp die WhatsApp Business Platform von Meta.<br />
                • <strong>Statistik:</strong> Nur wenn Sie im Banner „Statistik erlauben“ wählen, zählen wir Seitenaufrufe anonym als Tageswerte (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG) – ohne Cookies, ohne IP-Adresse, ohne Profil. Unabhängig davon zählen wir Tarifvergleiche ohne Personenbezug (Sparte, zweistelliger PLZ-Bereich, Verbrauchsklasse), um unser Tarifangebot zu verbessern (Art. 6 Abs. 1 lit. f DSGVO). Ihre Auswahl können Sie jederzeit über „Cookie-Einstellungen“ im Seitenfuß ändern.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">5. Ihre Rechte</h4>
              <p className="text-slate-400 text-xs">
                Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten sowie ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten.
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
