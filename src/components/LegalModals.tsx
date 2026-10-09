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
              <h4 className="font-bold text-white text-sm">Angaben gemäß § 5 DDG:</h4>
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
                Beratung und Vermittlung von Strom-, Gas-, Telekommunikations- und Kfz-Angeboten unserer Vertragspartner. Versicherungsvermittlung erfolgt nur, soweit die dafür erforderlichen gesetzlichen Voraussetzungen erfüllt sind.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">Haftung für Inhalte und Links:</h4>
              <p className="text-slate-400 text-xs">
                Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Für Inhalte externer Seiten sind deren Betreiber verantwortlich.
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
                Diese Website überträgt keine Dateien und wertet keine Rechnungen aus. Die Terminmaske erfasst keine Kontaktdaten und sendet keine Anfrage automatisch. Wenn Sie WhatsApp, Telefon oder E-Mail verwenden, verarbeiten wir die von Ihnen dort mitgeteilten Angaben zur Bearbeitung Ihres Anliegens.
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
                • <strong>Kontaktaufnahme:</strong> Wenn Sie uns über einen externen Kommunikationsdienst kontaktieren, werden die dort von Ihnen übermittelten Daten zur Bearbeitung Ihrer Anfrage verwendet. Der jeweilige Dienst verarbeitet Daten in eigener Verantwortung.<br />
                • <strong>Dateiauswahl:</strong> Eine auf dieser Seite ausgewählte Datei wird nicht an Daryos übertragen oder hier analysiert. Um sie zu teilen, müssen Sie sie selbst in einem Kommunikationsdienst anhängen.<br />
                • <strong>Beispielrechner:</strong> Die Berechnung verwendet im Programm hinterlegte Beispielwerte und übermittelt keine Eingaben an Daryos. Sie ist kein konkretes Tarifangebot.<br />
                • <strong>Externe Inhalte:</strong> Schriftarten werden lokal durch das System bereitgestellt. Eine Kartenansicht wird nicht eingebettet; der externe Kartendienst wird erst nach Auswahl des Links geöffnet. Anbieterlogos werden lokal dargestellt.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">4. Ihre Rechte</h4>
              <p className="text-slate-400 text-xs">
                Sie haben im Rahmen der gesetzlichen Voraussetzungen Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Außerdem können Sie sich bei einer Datenschutzaufsichtsbehörde beschweren.
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
