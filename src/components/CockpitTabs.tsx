import React, { useState } from 'react';
import {
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Plus,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Download,
  Trash2,
  Calendar,
  User,
  Zap,
  Flame,
  Wifi,
  Car,
  CheckCircle,
  Sparkles,
  ExternalLink,
  Phone,
  FileCheck,
  CreditCard,
  Building
} from 'lucide-react';
import {
  CustomerMessage,
  OptimizationProject,
  CustomerOffer,
  Invoice,
  ServiceType
} from '../types';

/* =========================================================================
   1. TAB: KUNDEN-MELDUNGEN (Anfragen, Zähler-Uploads, Rückrufbitten)
   ========================================================================= */

interface CustomerMessagesTabProps {
  messages: CustomerMessage[];
  onUpdateStatus: (id: string, status: 'neu' | 'in_bearbeitung' | 'erledigt') => void;
  onDeleteMessage: (id: string) => void;
  onCreateOfferForCustomer?: (msg: CustomerMessage) => void;
}

export const CustomerMessagesTab: React.FC<CustomerMessagesTabProps> = ({
  messages,
  onUpdateStatus,
  onDeleteMessage,
  onCreateOfferForCustomer
}) => {
  const [filterStatus, setFilterStatus] = useState<'alle' | 'neu' | 'in_bearbeitung' | 'erledigt'>('alle');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = messages.filter((m) => {
    const matchesStatus = filterStatus === 'alle' || m.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      m.customerName.toLowerCase().includes(q) ||
      m.title.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q) ||
      m.customerEmail.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const newCount = messages.filter((m) => m.status === 'neu').length;

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span>Kunden-Meldungen & Service-Eingang</span>
            </h4>
            {newCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                {newCount} neu
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Zähler-Uploads, Rückrufbitten und Tarifanfragen von Leipziger Bürgern und Gewerbekunden.
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Meldung oder Name suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-48 sm:w-60"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {(['alle', 'neu', 'in_bearbeitung', 'erledigt'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'alle' ? 'Alle' : st === 'neu' ? 'Neu' : st === 'in_bearbeitung' ? 'In Bearbeitung' : 'Erledigt'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs space-y-1">
            <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">Keine Kunden-Meldungen gefunden</p>
            <p>Aktuell liegen in dieser Kategorie keine offenen Anfragen vor.</p>
          </div>
        ) : (
          filtered.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 bg-white rounded-xl border transition-all shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                msg.status === 'neu'
                  ? 'border-blue-300 bg-blue-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">{msg.customerName}</span>
                  
                  {/* Service Badge */}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                    {msg.service === 'strom' && <Zap className="w-3 h-3 text-amber-500" />}
                    {msg.service === 'gas' && <Flame className="w-3 h-3 text-orange-500" />}
                    {msg.service === 'internet' && <Wifi className="w-3 h-3 text-blue-500" />}
                    {msg.service === 'kfz' && <Car className="w-3 h-3 text-emerald-500" />}
                    <span className="uppercase">{msg.service}</span>
                  </span>

                  {/* Priority */}
                  {msg.priority === 'dringend' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      <span>Dringend</span>
                    </span>
                  )}

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      msg.status === 'neu'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : msg.status === 'in_bearbeitung'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {msg.status === 'neu' ? 'Neu eingegangen' : msg.status === 'in_bearbeitung' ? 'In Bearbeitung' : 'Erledigt'}
                  </span>

                  <span className="text-[10px] text-slate-400 font-mono ml-auto">
                    {msg.date} · {msg.time}
                  </span>
                </div>

                <h5 className="text-xs font-bold text-slate-800">{msg.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {msg.message}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="font-mono text-slate-700">{msg.customerPhone}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-700">{msg.customerEmail}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row md:flex-col items-center md:items-end gap-1.5 self-stretch md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                {msg.status !== 'erledigt' ? (
                  <>
                    <button
                      onClick={() => onUpdateStatus(msg.id, 'in_bearbeitung')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer w-full text-center"
                    >
                      In Bearbeitung
                    </button>
                    <button
                      onClick={() => onUpdateStatus(msg.id, 'erledigt')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer w-full text-center shadow-xs"
                    >
                      Als erledigt markieren
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onUpdateStatus(msg.id, 'neu')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer w-full text-center"
                  >
                    Wieder öffnen
                  </button>
                )}

                <button
                  onClick={() => onDeleteMessage(msg.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Meldung löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};


/* =========================================================================
   2. TAB: PROJEKTE & WECHSELAUFTRÄGE (Optimierungsprozesse)
   ========================================================================= */

interface ProjectsTabProps {
  projects: OptimizationProject[];
  onUpdateStage: (id: string, stage: OptimizationProject['stage']) => void;
  onOpenInvoiceCreator?: (customerName: string, service: ServiceType) => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  projects,
  onUpdateStage,
  onOpenInvoiceCreator
}) => {
  const [statusFilter, setStatusFilter] = useState<'alle' | 'in_bearbeitung' | 'erfolgreich'>('alle');

  const filtered = projects.filter((p) => {
    if (statusFilter === 'alle') return true;
    return p.status === statusFilter;
  });

  const stageOrder: OptimizationProject['stage'][] = ['1_check', '2_vergleich', '3_angebot', '4_auftrag', '5_aktiv'];

  const stageLabels = {
    '1_check': '1. Check',
    '2_vergleich': '2. Vergleich',
    '3_angebot': '3. Angebot',
    '4_auftrag': '4. Auftrag',
    '5_aktiv': '5. Aktiv',
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Kunden-Projekte & Wechselmanagement</span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Verfolgen Sie jeden Optimierungsprozess schrittweise von der Rechnungsprüfung bis zum aktiven Zähler.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setStatusFilter('alle')}
            className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
              statusFilter === 'alle' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Alle Projekte ({projects.length})
          </button>
          <button
            onClick={() => setStatusFilter('in_bearbeitung')}
            className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
              statusFilter === 'in_bearbeitung' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laufend ({projects.filter((p) => p.status === 'in_bearbeitung').length})
          </button>
          <button
            onClick={() => setStatusFilter('erfolgreich')}
            className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
              statusFilter === 'erfolgreich' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Erfolgreich ({projects.filter((p) => p.status === 'erfolgreich').length})
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((proj) => {
          const currentStageIndex = stageOrder.indexOf(proj.stage);

          return (
            <div
              key={proj.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5 hover:border-slate-300 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{proj.customerName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                      {proj.projectNumber}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{proj.title}</p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold font-mono text-emerald-600 block">
                    +{proj.annualSavingsTarget} €
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Sparziel / Jahr</span>
                </div>
              </div>

              {/* Progress Stepper Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>Aktuelle Phase:</span>
                  <span className="text-blue-600 font-extrabold">{proj.stageLabel}</span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {stageOrder.map((stg, sIdx) => {
                    const isDone = sIdx < currentStageIndex;
                    const isCurrent = sIdx === currentStageIndex;

                    return (
                      <div
                        key={stg}
                        onClick={() => onUpdateStage(proj.id, stg)}
                        className={`h-2 rounded-full cursor-pointer transition-all ${
                          isDone
                            ? 'bg-emerald-500'
                            : isCurrent
                            ? 'bg-blue-600 ring-2 ring-blue-300'
                            : 'bg-slate-200 hover:bg-slate-300'
                        }`}
                        title={`Klick um auf ${stageLabels[stg]} zu setzen`}
                      />
                    );
                  })}
                </div>

                <div className="flex justify-between text-[9px] text-slate-400 font-medium pt-0.5">
                  <span>1. Check</span>
                  <span>2. Vergleich</span>
                  <span>3. Angebot</span>
                  <span>4. Auftrag</span>
                  <span>5. Aktiv</span>
                </div>
              </div>

              {/* Provider route & Action */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500">{proj.currentProvider}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-bold text-slate-900">{proj.targetProvider}</span>
                </div>

                <span className="text-[10px] text-slate-500 font-medium">
                  Frist: <strong>{proj.deadlineDate}</strong>
                </span>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[10px] text-slate-400">
                  Status: <strong>{proj.lastAction}</strong>
                </span>

                <div className="flex items-center gap-1.5">
                  {currentStageIndex < stageOrder.length - 1 && (
                    <button
                      onClick={() => onUpdateStage(proj.id, stageOrder[currentStageIndex + 1])}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      Nächste Phase &rarr;
                    </button>
                  )}

                  {onOpenInvoiceCreator && proj.stage === '5_aktiv' && (
                    <button
                      onClick={() => onOpenInvoiceCreator(proj.customerName, proj.service)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Rechnung abrechnen</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


/* =========================================================================
   3. TAB: ANGEBOTE & VERGLEICHE
   ========================================================================= */

interface OffersTabProps {
  offers: CustomerOffer[];
  onUpdateStatus: (id: string, status: CustomerOffer['status']) => void;
  onSendOfferWhatsApp: (offer: CustomerOffer) => void;
  onSendOfferEmail: (offer: CustomerOffer) => void;
  onOpenInvoiceCreator?: (customerName: string, service: ServiceType) => void;
}

export const OffersTab: React.FC<OffersTabProps> = ({
  offers,
  onUpdateStatus,
  onSendOfferWhatsApp,
  onSendOfferEmail,
  onOpenInvoiceCreator
}) => {
  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Kalkulierte Angebote & Tarifvergleiche</span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Geprüfte Tarifangebote für Leipziger Strom-, Gas- und Telekommunikationskunden.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-medium block">Gesamte Ersparnis aller Angebote:</span>
          <span className="text-base font-extrabold font-mono text-emerald-600">
            {offers.reduce((sum, o) => sum + o.annualSavings, 0).toLocaleString('de-DE')} € / Jahr
          </span>
        </div>
      </div>

      {/* Grid of Offers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offers.map((off) => (
          <div
            key={off.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5 hover:border-slate-300 transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">{off.customerName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                    {off.offerNumber}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{off.customerEmail}</span>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  off.status === 'angenommen'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : off.status === 'versendet'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {off.status === 'angenommen'
                  ? 'Angenommen'
                  : off.status === 'versendet'
                  ? 'Versendet'
                  : 'Entwurf'}
              </span>
            </div>

            {/* Comparison Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Bisheriger Tarif:</span>
                <p className="font-bold text-slate-800">{off.currentProvider}</p>
                <p className="text-slate-500 text-[11px]">{off.currentTariff}</p>
                <p className="font-mono text-slate-700 font-bold pt-1">{off.currentMonthly.toFixed(2)} € / Monat</p>
              </div>

              <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-200/80 space-y-1">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Empfohlenes Angebot:</span>
                <p className="font-bold text-emerald-900">{off.recommendedProvider}</p>
                <p className="text-emerald-700 text-[11px]">{off.recommendedTariff}</p>
                <p className="font-mono text-emerald-900 font-bold pt-1">{off.recommendedMonthly.toFixed(2)} € / Monat</p>
              </div>
            </div>

            {/* Savings Banner */}
            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-800">Kalkulierte Ersparnis:</span>
              <span className="font-mono font-extrabold text-sm text-emerald-700">
                +{off.annualSavings.toFixed(0)} € / Jahr
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSendOfferWhatsApp(off)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => onSendOfferEmail(off)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" />
                  <span>E-Mail</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {off.status !== 'angenommen' ? (
                  <button
                    onClick={() => onUpdateStatus(off.id, 'angenommen')}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Als angenommen buchen
                  </button>
                ) : (
                  onOpenInvoiceCreator && (
                    <button
                      onClick={() => onOpenInvoiceCreator(off.customerName, off.service)}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      Rechnung erstellen
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


/* =========================================================================
   4. TAB: RECHNUNGS-ÜBERSICHT (Invoices List)
   ========================================================================= */

interface InvoicesTabProps {
  invoices: Invoice[];
  onOpenCreateNew: () => void;
  onUpdateStatus: (id: string, status: Invoice['status']) => void;
  onDeleteInvoice: (id: string) => void;
  onDownloadInvoicePDF: (inv: Invoice) => void;
}

export const InvoicesTab: React.FC<InvoicesTabProps> = ({
  invoices,
  onOpenCreateNew,
  onUpdateStatus,
  onDeleteInvoice,
  onDownloadInvoicePDF
}) => {
  const [statusFilter, setStatusFilter] = useState<'alle' | 'offen' | 'bezahlt'>('alle');

  const filtered = invoices.filter((i) => {
    if (statusFilter === 'alle') return true;
    return i.status === statusFilter;
  });

  const totalRevenue = invoices.reduce((sum, i) => sum + i.total, 0);
  const paidRevenue = invoices.filter((i) => i.status === 'bezahlt').reduce((sum, i) => sum + i.total, 0);
  const openRevenue = invoices.filter((i) => i.status === 'offen').reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">Gesamtumsatz</span>
          <span className="text-xl font-extrabold font-mono text-slate-900">
            {totalRevenue.toFixed(2)} €
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{invoices.length} Rechnungen erfasst</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">Bereits bezahlt</span>
          <span className="text-xl font-extrabold font-mono text-emerald-600">
            {paidRevenue.toFixed(2)} €
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Eingegangen</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">Offene Forderungen</span>
          <span className="text-xl font-extrabold font-mono text-amber-600">
            {openRevenue.toFixed(2)} €
          </span>
          <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">Ausstehend</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400">Aktion</span>
          <button
            onClick={onOpenCreateNew}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Neue Rechnung</span>
          </button>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="text-sm font-extrabold text-slate-900">
            Rechnungsarchiv & Zahlungsstatus
          </h4>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {(['alle', 'offen', 'bezahlt'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                  statusFilter === st ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'alle' ? 'Alle' : st === 'offen' ? 'Offen' : 'Bezahlt'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Rechnungs-Nr.</th>
                <th className="py-3 px-4">Kunde / Empfänger</th>
                <th className="py-3 px-4">Datum</th>
                <th className="py-3 px-4">Fälligkeit</th>
                <th className="py-3 px-4 text-right">Netto</th>
                <th className="py-3 px-4 text-right">Brutto</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block">{inv.customerName}</span>
                    <span className="text-[11px] text-slate-400">{inv.customerCity}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{inv.invoiceDate}</td>
                  <td className="py-3 px-4 text-slate-600">{inv.dueDate}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">{inv.subtotal.toFixed(2)} €</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{inv.total.toFixed(2)} €</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        inv.status === 'bezahlt'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : inv.status === 'offen'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {inv.status === 'bezahlt' ? 'Bezahlt' : inv.status === 'offen' ? 'Offen' : 'Überfällig'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onDownloadInvoicePDF(inv)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="PDF herunterladen"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {inv.status !== 'bezahlt' ? (
                        <button
                          onClick={() => onUpdateStatus(inv.id, 'bezahlt')}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-bold border border-emerald-200 cursor-pointer"
                        >
                          Bezahlt
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateStatus(inv.id, 'offen')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[11px] font-medium cursor-pointer"
                        >
                          Offen
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteInvoice(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Rechnung löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
