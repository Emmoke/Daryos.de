import React, { useState, useRef } from 'react';
import { UploadCloud, FileCheck, CheckCircle2, MessageSquare, Mail, RefreshCw, AlertCircle, Shield, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface ContractUploadSectionProps {
  currentLang: Language;
  onOpenBooking: () => void;
}

export const ContractUploadSection: React.FC<ContractUploadSectionProps> = ({ currentLang, onOpenBooking }) => {
  const t = translations[currentLang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    tariffType: string;
    consumption: string;
    potential: string;
    safeInstallment: string;
    nachzahlungProtection: string;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [clientPhone, setClientPhone] = useState('');

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setIsAnalyzing(false);
    // Do not pretend to perform OCR or calculate savings locally.
    // No file content or customer details are stored or sent by this page.
    setAnalysisResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendFileToWhatsApp = () => {
    const fileName = selectedFile ? selectedFile.name : 'Rechnung';
    const message = `Hallo Daryos, ich habe meine Rechnung (${fileName}) hochgeladen. Bitte prüfen Sie mein Einsparpotenzial und berechnen Sie den optimalen monatlichen Abschlag für mich (Nachzahlungs-Schutz).`;
    window.open(`https://wa.me/4917643416174?text=${encodeURIComponent(message)}`, '_blank');
  };

  const sendFileToEmail = () => {
    const subject = encodeURIComponent('Anfrage: Kostenloser Rechnungs-Check & Nachzahlungs-Schutz bei Daryos');
    const body = encodeURIComponent(
      `Hallo Herr Daryos,\n\nanbei sende ich Ihnen meine aktuelle Abrechnung für einen unverbindlichen Tarifvergleich und Abschlags-Check.\n\nMeine Telefonnummer: ${clientPhone || '+49 ...'}\n\nBitte prüfen Sie, wie viel ich sparen kann und wie mein monatlicher Abschlag optimal eingestellt wird, damit ich keine Nachzahlung bekomme.\n\nMit freundlichen Grüßen`
    );
    window.location.href = `mailto:daryos.kreis@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <section id="audit" className="py-20 bg-slate-950 border-t border-slate-900 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Persönliche Prüfung nach Kontaktaufnahme</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.audit.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Wählen Sie eine Datei nur aus, wenn Sie sie anschließend selbst über WhatsApp oder E-Mail teilen möchten. Auf dieser Website findet keine automatische Dokumentenanalyse statt. Einsparungen oder Abschläge können erst nach Prüfung der tatsächlichen Unterlagen eingeschätzt werden.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-10 shadow-2xl space-y-6">
          {!selectedFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-950/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 text-blue-400">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div className="text-base font-bold text-white mb-1">
                {t.audit.dragText}
              </div>

              <div className="text-xs text-slate-400 mb-4">
                {t.audit.orClick}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Datei bleibt zunächst auf Ihrem Gerät</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] text-blue-300 bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-500/30 font-semibold">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>Keine automatische Analyse</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Info Box */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3 truncate">
                  <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-bold text-white truncate">
                      {selectedFile.name}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 cursor-pointer"
                >
                  Andere Datei
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <p className="text-sm text-slate-300">
                  Die Datei wird auf dieser Seite <strong>nicht automatisch ausgewertet oder übertragen</strong>.
                  Für eine Prüfung öffnen Sie WhatsApp oder E-Mail und hängen Sie die Datei dort selbst an.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={sendFileToWhatsApp}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                  >
                    WhatsApp öffnen – Datei selbst anhängen
                  </button>
                  <button
                    type="button"
                    onClick={sendFileToEmail}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs"
                  >
                    E-Mail öffnen – Datei selbst anhängen
                  </button>
                </div>
              </div>

              {/* Status and Extraction Preview */}
              {isAnalyzing && (
                <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800 text-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
                  <div className="text-sm font-semibold text-slate-200">
                    Die Datei wird nicht automatisch analysiert.
                  </div>
                </div>
              )}

              {analysisResult && (
                <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{t.audit.analysisSuccess}</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-blue-300 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                      KI-Score: 98%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">{t.audit.detectedProvider}</span>
                      <span className="font-semibold text-white">{analysisResult.tariffType}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">{t.audit.detectedConsumption}</span>
                      <span className="font-semibold text-blue-400">{analysisResult.consumption}</span>
                    </div>
                  </div>

                  {/* Savings & Safe Installment */}
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs font-semibold text-center space-y-1">
                    <div className="text-sm font-bold">{analysisResult.potential}</div>
                    <div className="text-[11px] text-slate-300">{analysisResult.safeInstallment}</div>
                  </div>

                  {/* Protection Banner */}
                  <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl flex items-center gap-2.5 text-xs text-blue-200">
                    <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                    <span>{analysisResult.nachzahlungProtection}</span>
                  </div>

                  {/* Dispatch actions */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={sendFileToWhatsApp}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp öffnen und Datei selbst anhängen</span>
                    </button>

                    <button
                      onClick={sendFileToEmail}
                      className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Mail className="w-4 h-4" />
                      <span>E-Mail öffnen und Datei selbst anhängen</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
