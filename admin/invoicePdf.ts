// Rechnung als PDF (Pflichtangaben nach § 14 UStG bzw. Hinweis nach § 19 UStG).
import { jsPDF } from 'jspdf';
import { date, eur } from './api';

export function downloadInvoicePdf(inv: any) {
  const s = inv.seller;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const L = 20;
  const R = 190;
  doc.setFont('helvetica', 'normal');

  // Absenderzeile + Briefkopf
  doc.setFontSize(16).setFont('helvetica', 'bold').text(s.businessName, L, 22);
  doc.setFontSize(9).setFont('helvetica', 'normal');
  const head = [s.ownerName, s.street, `${s.postalCode} ${s.city}`, s.phone && `Tel. ${s.phone}`, s.email].filter(Boolean) as string[];
  head.forEach((t, i) => doc.text(t, R, 18 + i * 4.2, { align: 'right' }));

  doc.setFontSize(7).setTextColor(110).text(`${s.businessName} · ${s.street} · ${s.postalCode} ${s.city}`, L, 48);
  doc.setTextColor(0).setFontSize(10);
  [inv.customer.name, inv.customer.street, `${inv.customer.postalCode} ${inv.customer.city}`].forEach((t: string, i: number) => doc.text(t, L, 54 + i * 5));

  doc.setFontSize(9);
  const meta: [string, string][] = [
    ['Rechnungsnummer', inv.number],
    ['Rechnungsdatum', date(inv.issueDate)],
    ['Leistungsdatum', date(inv.serviceDate)],
  ];
  if (inv.kind === 'rechnung') meta.push(['Fällig bis', date(inv.dueDate)]);
  meta.forEach(([k, v], i) => {
    doc.text(k, 130, 54 + i * 5);
    doc.text(v, R, 54 + i * 5, { align: 'right' });
  });

  doc.setFontSize(14).setFont('helvetica', 'bold').text(inv.kind === 'storno' ? 'Stornorechnung' : 'Rechnung', L, 88);
  doc.setFont('helvetica', 'normal').setFontSize(9);

  // Positionen
  let y = 98;
  doc.setFillColor(243, 244, 246).rect(L, y - 5, R - L, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Pos.', L + 2, y);
  doc.text('Beschreibung', L + 14, y);
  doc.text('Menge', 125, y, { align: 'right' });
  doc.text('Einzelpreis', 152, y, { align: 'right' });
  if (!inv.smallBusiness) doc.text('USt', 166, y, { align: 'right' });
  doc.text('Betrag', R - 2, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 8;
  inv.items.forEach((it: any, i: number) => {
    const lines = doc.splitTextToSize(it.description, 90) as string[];
    doc.text(String(i + 1), L + 2, y);
    doc.text(lines, L + 14, y);
    doc.text(String(it.quantity).replace('.', ','), 125, y, { align: 'right' });
    doc.text(eur(it.unitPriceCents), 152, y, { align: 'right' });
    if (!inv.smallBusiness) doc.text(`${it.vatRate} %`, 166, y, { align: 'right' });
    doc.text(eur(Math.round(it.quantity * it.unitPriceCents)), R - 2, y, { align: 'right' });
    y += Math.max(1, lines.length) * 4.5 + 2;
  });

  y += 2;
  doc.line(120, y, R, y);
  y += 6;
  const row = (k: string, v: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(k, 120, y);
    doc.text(v, R - 2, y, { align: 'right' });
    y += 5.5;
  };
  if (inv.smallBusiness) {
    row('Gesamtbetrag', eur(inv.grossCents), true);
  } else {
    row('Nettobetrag', eur(inv.netCents));
    inv.vatBreakdown.filter((v: any) => v.rate > 0).forEach((v: any) => row(`Umsatzsteuer ${v.rate} %`, eur(v.vatCents)));
    row('Gesamtbetrag', eur(inv.grossCents), true);
  }

  y += 6;
  doc.setFont('helvetica', 'normal').setFontSize(9);
  const notes: string[] = [];
  if (inv.smallBusiness) notes.push('Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.');
  if (inv.kind === 'rechnung') notes.push(`Bitte überweisen Sie den Betrag bis zum ${date(inv.dueDate)} unter Angabe der Rechnungsnummer ${inv.number}.`);
  if (inv.notes) notes.push(inv.notes);
  for (const n of notes) {
    const lines = doc.splitTextToSize(n, R - L) as string[];
    doc.text(lines, L, y);
    y += lines.length * 4.5 + 1.5;
  }

  // Fußzeile mit Bank- und Steuerangaben
  doc.setFontSize(7.5).setTextColor(90);
  const foot = [
    [s.businessName, s.ownerName && `Inhaber: ${s.ownerName}`, `${s.street}, ${s.postalCode} ${s.city}`].filter(Boolean).join(' · '),
    [s.taxNumber && `Steuernummer: ${s.taxNumber}`, s.vatId && `USt-IdNr.: ${s.vatId}`].filter(Boolean).join(' · '),
    [s.bankName, s.iban && `IBAN: ${s.iban}`, s.bic && `BIC: ${s.bic}`].filter(Boolean).join(' · '),
  ].filter(Boolean);
  doc.line(L, 275, R, 275);
  foot.forEach((t, i) => doc.text(t, (L + R) / 2, 280 + i * 3.8, { align: 'center' }));

  doc.save(`${inv.number}.pdf`);
}
