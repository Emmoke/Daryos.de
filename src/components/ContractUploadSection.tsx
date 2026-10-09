import React, { useRef, useState } from 'react';
import { FileCheck, MessageSquare, Shield, UploadCloud } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface ContractUploadSectionProps {
  currentLang: Language;
}

export const ContractUploadSection: React.FC<ContractUploadSectionProps> = ({ currentLang }) => {
  const t = translations[currentLang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openWhatsApp = () => {
    const message = 'Hallo Daryos, ich möchte meine Strom- oder Gasabrechnung persönlich prüfen lassen. Wie kann ich Ihnen das Dokument sicher zukommen lassen?';
    return `https://wa.me/4917643416174?text=${encodeURIComponent(message)}`;
  };

  return (
    <section id="audit" className="py-20 bg-slate-950 border-t border-slate-900 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
            <FileCheck className="w-3.5 h-3.5 text-orange-400" />
            <span>Persönlicher Rechnungs-Check</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.audit.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Fragen Sie eine persönliche Prüfung Ihrer Strom- oder Gasabrechnung an. Wir besprechen mit Ihnen passende Angebote unserer Vertragspartner. Eine Ersparnis oder ein bestimmter Abschlag kann nicht garantiert werden.
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
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Keine automatische Übertragung oder Analyse</span>
                </div>
              </div>
              <p className="max-w-xl mx-auto mt-4 text-xs text-slate-400">
                Die ausgewählte Datei bleibt auf diesem Gerät. Diese Website lädt sie nicht hoch und analysiert sie nicht.
                Wenn Sie WhatsApp öffnen, müssen Sie die Datei dort selbst anhängen und die Nachricht selbst absenden.
              </p>
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

              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Die Datei wurde nicht übertragen. Sie können über WhatsApp Kontakt aufnehmen und sie dort bei Bedarf selbst anhängen.
                </p>
                <a
                  href={openWhatsApp()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp öffnen und Prüfung anfragen</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
