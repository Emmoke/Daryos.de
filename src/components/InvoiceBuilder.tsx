import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Printer,
  CheckCircle2,
  Building,
  User,
  Calendar,
  CreditCard,
  Eye,
  Edit3,
  FileCheck,
  Sparkles
} from 'lucide-react';
import { CustomerContact, Invoice, InvoiceItem } from '../types';

interface InvoiceBuilderProps {
  crmContacts: CustomerContact[];
  onSaveInvoice: (invoice: Invoice) => void;
  onCancel?: () => void;
  initialInvoice?: Invoice | null;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({
  crmContacts,
  onSaveInvoice,
  onCancel,
  initialInvoice
}) => {
  // Generate random invoice number if not provided
  const generateNewInvNumber = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `RE-2026-${randomNum}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const dueDefault = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState(initialInvoice?.invoiceNumber || generateNewInvNumber());
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState(initialInvoice?.customerName || '');
  const [customerAddress, setCustomerAddress] = useState(initialInvoice?.customerAddress || '');
  const [customerCity, setCustomerCity] = useState(initialInvoice?.customerCity || 'Leipzig');
  const [customerPostalCode, setCustomerPostalCode] = useState(initialInvoice?.customerPostalCode || '04329');
  const [customerEmail, setCustomerEmail] = useState(initialInvoice?.customerEmail || '');
  const [customerPhone, setCustomerPhone] = useState(initialInvoice?.customerPhone || '');

  const [invoiceDate, setInvoiceDate] = useState(initialInvoice?.invoiceDate || todayStr);
  const [dueDate, setDueDate] = useState(initialInvoice?.dueDate || dueDefault);
  const [servicePeriod, setServicePeriod] = useState(initialInvoice?.servicePeriod || 'Oktober 2026');

  const [taxType, setTaxType] = useState<'standard_19' | 'kleinunternehmer_0' | 'provision_0'>(
    initialInvoice?.taxType || 'standard_19'
  );

  const [items, setItems] = useState<InvoiceItem[]>(
    initialInvoice?.items || [
      {
        id: '1',
        description: 'Erfolgsabhängige Provision für Tarifoptimierung & Wechselservice Strom',
        quantity: 1,
        unitPrice: 65.0,
        total: 65.0,
      },
    ]
  );

  const [notes, setNotes] = useState(
    initialInvoice?.notes ||
      'Zahlbar innerhalb von 14 Tagen nach Rechnungserhalt ohne Abzug auf unten stehendes Bankkonto. Vielen Dank für Ihr Vertrauen in Daryos®!'
  );

  const [iban, setIban] = useState(initialInvoice?.iban || 'DE89 8605 5592 1102 3344 55');
  const [bic, setBic] = useState(initialInvoice?.bic || 'LEIPDEDDXXX');
  const [bankName, setBankName] = useState(initialInvoice?.bankName || 'Sparkasse Leipzig');

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Quick preset templates
  const presets = [
    { title: 'Provision Strom', price: 65.0, desc: 'Vermittlungsprovision Tarifwechsel Strom 2026/27' },
    { title: 'Provision Gas', price: 80.0, desc: 'Vermittlungsprovision Erdgastarif 2026/27' },
    { title: 'Gewerbe-Analyse', price: 149.0, desc: 'Gewerbliche Energiekosten- & Lastgang-Analyse' },
    { title: 'Zählerprüfung', price: 45.0, desc: 'Zählerstandsüberprüfung & Nachzahlungs-Schutzgutachten' },
  ];

  // Select customer from CRM
  const handleSelectCustomer = (contactId: string) => {
    setSelectedCustomerId(contactId);
    const found = crmContacts.find((c) => c.id === contactId);
    if (found) {
      setCustomerName(found.fullName);
      setCustomerEmail(found.email);
      setCustomerPhone(found.phone);
      if (found.address) setCustomerAddress(found.address);
      if (found.city) setCustomerCity(found.city);
      if (found.postalCode) setCustomerPostalCode(found.postalCode);
    }
  };

  // Item modifications
  const handleItemChange = (id: string, field: 'description' | 'quantity' | 'unitPrice', val: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === 'quantity' || field === 'unitPrice') {
          const q = field === 'quantity' ? Number(val) || 0 : item.quantity;
          const p = field === 'unitPrice' ? Number(val) || 0 : item.unitPrice;
          updated.total = Math.round(q * p * 100) / 100;
        }
        return updated;
      })
    );
  };

  const handleAddItem = (preset?: { desc: string; price: number }) => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(),
      description: preset?.desc || 'Neue Service-Position',
      quantity: 1,
      unitPrice: preset?.price || 50.0,
      total: preset?.price || 50.0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculations
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
  const taxRate = taxType === 'standard_19' ? 19 : 0;
  const taxAmount = taxRate > 0 ? Math.round((subtotal * 0.19) * 100) / 100 : 0;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  // Build Invoice Object
  const buildCurrentInvoice = (status: 'offen' | 'bezahlt' = 'offen'): Invoice => {
    return {
      id: initialInvoice?.id || `inv-${Date.now()}`,
      invoiceNumber,
      customerName: customerName || 'Privatkunde',
      customerAddress: customerAddress || 'Musterstraße 1',
      customerCity: customerCity || 'Leipzig',
      customerPostalCode: customerPostalCode || '04329',
      customerEmail: customerEmail || 'kunde@example.de',
      customerPhone,
      invoiceDate,
      dueDate,
      servicePeriod,
      taxRate,
      taxType,
      items,
      subtotal,
      taxAmount,
      total,
      status,
      notes,
      iban,
      bic,
      bankName,
    };
  };

  // Save invoice
  const handleSave = (status: 'offen' | 'bezahlt' = 'offen') => {
    const inv = buildCurrentInvoice(status);
    onSaveInvoice(inv);
    setSavedNotice(`Rechnung ${inv.invoiceNumber} erfolgreich gespeichert!`);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  // Generate and Download PDF using jsPDF
  const handleDownloadPDF = () => {
    const inv = buildCurrentInvoice();
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Header: Company Letterhead
    doc.setFillColor(37, 99, 235); // Royal Blue
    doc.rect(margin, 16, 8, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('D', margin + 2.7, 21.5);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.text('Daryos', margin + 12, 22.5);
    doc.setFontSize(8);
    doc.setTextColor(37, 99, 235);
    doc.text('(R)', margin + 30, 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Tarifoptimierung & Wechselservice Leipzig', margin + 12, 27);

    // Right header company data
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Daryos Kreis', pageWidth - margin, 18, { align: 'right' });
    doc.text('Rotfuchsstraße 1, 04329 Leipzig', pageWidth - margin, 22, { align: 'right' });
    doc.text('Tel: +49 174 8088880', pageWidth - margin, 26, { align: 'right' });
    doc.text('E-Mail: daryos.kreis@gmail.com', pageWidth - margin, 30, { align: 'right' });
    doc.text('USt-IdNr.: DE 345 889 102', pageWidth - margin, 34, { align: 'right' });

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 38, pageWidth - margin, 38);

    // Recipient block
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Daryos Tarifoptimierung · Rotfuchsstraße 1 · 04329 Leipzig', margin, 46);

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(inv.customerName, margin, 53);
    doc.setFont('helvetica', 'normal');
    doc.text(inv.customerAddress, margin, 58);
    doc.text(`${inv.customerPostalCode} ${inv.customerCity}`, margin, 63);

    // Invoice Meta Block (Right aligned)
    const metaX = pageWidth - margin - 45;
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Rechnungs-Nr.:', metaX, 53);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(inv.invoiceNumber, pageWidth - margin, 53, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Rechnungsdatum:', metaX, 58);
    doc.setTextColor(15, 23, 42);
    doc.text(inv.invoiceDate, pageWidth - margin, 58, { align: 'right' });

    doc.setTextColor(100, 116, 139);
    doc.text('Fälligkeitsdatum:', metaX, 63);
    doc.setTextColor(15, 23, 42);
    doc.text(inv.dueDate, pageWidth - margin, 63, { align: 'right' });

    doc.setTextColor(100, 116, 139);
    doc.text('Leistungszeitraum:', metaX, 68);
    doc.setTextColor(15, 23, 42);
    doc.text(inv.servicePeriod, pageWidth - margin, 68, { align: 'right' });

    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`RECHNUNG`, margin, 82);

    // Table Header
    let y = 90;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Pos.', margin + 2, y + 4.8);
    doc.text('Bezeichnung der Leistung', margin + 14, y + 4.8);
    doc.text('Menge', margin + 105, y + 4.8);
    doc.text('Einzelpreis', margin + 125, y + 4.8);
    doc.text('Gesamtbetrag', pageWidth - margin - 2, y + 4.8, { align: 'right' });

    y += 7;

    // Table Items
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    inv.items.forEach((item, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
      }
      doc.text(`${idx + 1}`, margin + 2, y + 5.2);
      doc.text(item.description, margin + 14, y + 5.2, { maxWidth: 88 });
      doc.text(`${item.quantity}`, margin + 107, y + 5.2);
      doc.text(`${item.unitPrice.toFixed(2)} EUR`, margin + 125, y + 5.2);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.total.toFixed(2)} EUR`, pageWidth - margin - 2, y + 5.2, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 8;
    });

    // Subtotal and Total Section
    y += 4;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin + 90, y, pageWidth - margin, y);
    y += 5;

    doc.setFontSize(8.5);
    doc.text('Nettobetrag:', margin + 95, y);
    doc.text(`${inv.subtotal.toFixed(2)} EUR`, pageWidth - margin - 2, y, { align: 'right' });

    y += 5;
    if (inv.taxRate > 0) {
      doc.text(`USt. (${inv.taxRate}%):`, margin + 95, y);
      doc.text(`${inv.taxAmount.toFixed(2)} EUR`, pageWidth - margin - 2, y, { align: 'right' });
    } else {
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        inv.taxType === 'kleinunternehmer_0'
          ? 'USt. gem. § 19 UStG entfällt:'
          : 'Steuerfreie Vermittlungsprovision:',
        margin + 95,
        y
      );
      doc.text('0.00 EUR', pageWidth - margin - 2, y, { align: 'right' });
    }

    y += 6;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin + 90, y - 4, pageWidth - margin - 90, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Gesamtbetrag:', margin + 95, y + 1.5);
    doc.setTextColor(37, 99, 235);
    doc.text(`${inv.total.toFixed(2)} EUR`, pageWidth - margin - 2, y + 1.5, { align: 'right' });

    // Payment terms & bank info box
    y += 18;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Zahlungsinformationen & Bankverbindung:', margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Empfänger: Daryos Kreis · Bank: ${inv.bankName}`, margin + 4, y + 11);
    doc.text(`IBAN: ${inv.iban} · BIC: ${inv.bic}`, margin + 4, y + 15);
    doc.text(`Verwendungszweck: ${inv.invoiceNumber} - ${inv.customerName}`, margin + 4, y + 19);

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Daryos® Tarifoptimierung & Wechselservice · Rotfuchsstraße 1, 04329 Leipzig · Inhaber: Daryos Kreis',
      margin,
      footerY + 1
    );
    doc.text('Seite 1 von 1', pageWidth - margin, footerY + 1, { align: 'right' });

    doc.save(`${inv.invoiceNumber}_Daryos_${inv.customerName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 text-slate-800 space-y-6">
      {/* Toast Notification */}
      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{savedNotice}</span>
          </span>
        </div>
      )}

      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Vollfunktions-Rechnungsgenerator</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              GoBD & DIN 5008
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Erstellen Sie rechtskonforme Rechnungen und Vermittlungsprovisionen mit Live-Kalkulation und Sofort-PDF-Export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isPreviewMode ? <Edit3 className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4 text-blue-600" />}
            <span>{isPreviewMode ? 'Editor bearbeiten' : 'Druck-Vorschau'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>PDF herunterladen</span>
          </button>
        </div>
      </div>

      {/* PREVIEW MODE */}
      {isPreviewMode ? (
        <div className="bg-slate-100/70 p-4 sm:p-8 rounded-xl border border-slate-200 flex justify-center">
          <div className="bg-white max-w-2xl w-full p-8 rounded-lg shadow-md border border-slate-200 space-y-6 text-slate-900 font-sans text-xs">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <span className="text-xl font-black text-blue-600 tracking-tight">Daryos®</span>
                <p className="text-[10px] text-slate-500">Tarifoptimierung & Wechselservice Leipzig</p>
              </div>
              <div className="text-right text-[10px] text-slate-500 leading-tight">
                <p className="font-bold text-slate-700">Daryos Kreis</p>
                <p>Rotfuchsstraße 1, 04329 Leipzig</p>
                <p>E-Mail: daryos.kreis@gmail.com</p>
                <p>USt-IdNr.: DE 345 889 102</p>
              </div>
            </div>

            {/* Recipient & Meta */}
            <div className="flex justify-between items-start pt-2">
              <div>
                <span className="text-[9px] text-slate-400 block mb-1">Empfänger:</span>
                <p className="font-bold text-sm text-slate-900">{customerName || 'Privatkunde'}</p>
                <p className="text-slate-600">{customerAddress}</p>
                <p className="text-slate-600">{customerPostalCode} {customerCity}</p>
              </div>
              <div className="text-right text-xs space-y-1">
                <p><span className="text-slate-400">Rechnungs-Nr.:</span> <strong>{invoiceNumber}</strong></p>
                <p><span className="text-slate-400">Datum:</span> {invoiceDate}</p>
                <p><span className="text-slate-400">Fälligkeit:</span> {dueDate}</p>
                <p><span className="text-slate-400">Leistungsmonat:</span> {servicePeriod}</p>
              </div>
            </div>

            {/* Title */}
            <div className="pt-2">
              <h4 className="text-base font-extrabold text-slate-900">RECHNUNG</h4>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Pos.</th>
                    <th className="py-2 px-3">Leistungsbeschreibung</th>
                    <th className="py-2 px-3 text-center">Menge</th>
                    <th className="py-2 px-3 text-right">Einzelpreis</th>
                    <th className="py-2 px-3 text-right">Gesamt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {items.map((it, idx) => (
                    <tr key={it.id}>
                      <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{it.description}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{it.unitPrice.toFixed(2)} €</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{it.total.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-xs text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Nettobetrag:</span>
                  <span className="font-mono">{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>
                    {taxType === 'standard_19'
                      ? 'MwSt. 19%:'
                      : taxType === 'kleinunternehmer_0'
                      ? 'USt. (§ 19 UStG):'
                      : 'Vermittlungsprovision:'}
                  </span>
                  <span className="font-mono">{taxAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-blue-600 border-t border-slate-200 pt-1.5">
                  <span>Gesamtbetrag:</span>
                  <span className="font-mono">{total.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {/* Notes & Bank */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Zahlungshinweis:</p>
              <p>{notes}</p>
              <p className="font-mono text-[10px] text-slate-700 pt-1">
                IBAN: {iban} · BIC: {bic} · Bank: {bankName}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* EDITOR FORM */
        <div className="space-y-6">
          {/* Section 1: Customer & Invoice Master Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            {/* Customer Select */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kunde aus CRM auswählen</span>
                </label>
                {selectedCustomerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId('');
                      setCustomerName('');
                      setCustomerAddress('');
                      setCustomerEmail('');
                      setCustomerPhone('');
                    }}
                    className="text-[10px] text-slate-500 hover:text-rose-600 cursor-pointer"
                  >
                    Zurücksetzen
                  </button>
                )}
              </div>

              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Manueller Neukunde / Privatperson --</option>
                {crmContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.city || 'Leipzig'}) – {c.phone}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Name / Firma *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="z. B. Klaus Ebersbach"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Straße & Hausnr.</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Wurzner Str. 42"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">PLZ & Ort</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customerPostalCode}
                      onChange={(e) => setCustomerPostalCode(e.target.value)}
                      placeholder="04329"
                      className="w-20 px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      placeholder="Leipzig"
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">E-Mail für Rechnungsversand</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="klaus.ebersbach@web.de"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Meta Data */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Rechnungsdaten & Fristen</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Rechnungsnummer *</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 font-mono font-bold bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Leistungsmonat</label>
                  <input
                    type="text"
                    value={servicePeriod}
                    onChange={(e) => setServicePeriod(e.target.value)}
                    placeholder="Oktober 2026"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Rechnungsdatum</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Fälligkeitsdatum (Zahlungsziel)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Tax Type Radio */}
              <div className="pt-1">
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Steuerart / Umsatzsteuer</label>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTaxType('standard_19')}
                    className={`py-1.5 px-2 rounded-md font-medium border text-center transition-all cursor-pointer ${
                      taxType === 'standard_19'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    19% MwSt. (Regel)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxType('provision_0')}
                    className={`py-1.5 px-2 rounded-md font-medium border text-center transition-all cursor-pointer ${
                      taxType === 'provision_0'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    0% Provision (§4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxType('kleinunternehmer_0')}
                    className={`py-1.5 px-2 rounded-md font-medium border text-center transition-all cursor-pointer ${
                      taxType === 'kleinunternehmer_0'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    0% (§ 19 UStG)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Vorlagen hinzufügen:</span>
            </span>
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddItem(preset)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                + {preset.title} ({preset.price.toFixed(0)} €)
              </button>
            ))}
          </div>

          {/* Section 3: Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Rechnungspositionen ({items.length})</span>
              <button
                type="button"
                onClick={() => handleAddItem()}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Position hinzufügen</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {items.map((it, idx) => (
                <div key={it.id} className="p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 hover:bg-slate-50/50">
                  <span className="w-6 text-center text-xs font-bold text-slate-400 self-center hidden sm:block">
                    {idx + 1}.
                  </span>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => handleItemChange(it.id, 'description', e.target.value)}
                      placeholder="Positionsbeschreibung..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="w-16">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(it.id, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 text-center bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="w-24">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(it.id, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1.5 pr-5 text-right font-mono bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                        <span className="absolute right-1.5 top-2 text-[10px] text-slate-400">€</span>
                      </div>
                    </div>

                    <div className="w-24 text-right font-mono font-bold text-xs text-slate-900 pr-2">
                      {it.total.toFixed(2)} €
                    </div>

                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(it.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                      title="Position löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal & Total Row */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-xs text-slate-500">
                {items.length} Position(en) erfasst · Währung: Euro (EUR)
              </div>

              <div className="space-y-1 text-right text-xs w-full sm:w-auto">
                <div className="flex justify-between sm:justify-end gap-6 text-slate-600">
                  <span>Nettobetrag:</span>
                  <span className="font-mono font-bold text-slate-800">{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-6 text-slate-600">
                  <span>MwSt. ({taxRate}%):</span>
                  <span className="font-mono">{taxAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-6 text-sm font-extrabold text-blue-600 border-t border-slate-200 pt-1">
                  <span>Gesamtsumme Brutto:</span>
                  <span className="font-mono text-base">{total.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Notes & Banking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Rechnungshinweis & Zahlungsziel</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Bankverbindung (Daryos® Geschäftskonto)</span>
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="IBAN"
                  className="w-full px-2.5 py-1.5 font-mono bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={bic}
                    onChange={(e) => setBic(e.target.value)}
                    placeholder="BIC"
                    className="w-full px-2.5 py-1.5 font-mono bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Bankinstitut"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
            <div className="flex items-center gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Abbrechen
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSave('offen')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Rechnung als offen speichern</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave('bezahlt')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Als bezahlt einbuchen</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Druckfähige PDF erstellen & herunterladen</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
