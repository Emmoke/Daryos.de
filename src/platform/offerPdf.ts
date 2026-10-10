// Druckfreundliche PDF-Angebotsübersicht (clientseitig mit jsPDF).
import { jsPDF } from 'jspdf';
import type { ComparisonInput, RankedOffer } from '../../shared/platform';
import { dateTime, eur } from './api';

export function downloadOfferPdf(ranked: RankedOffer, input: ComparisonInput, requestId: string) {
  const o = ranked.offer;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 20;
  const line = (text: string, size = 10, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    for (const l of doc.splitTextToSize(text, 170) as string[]) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(l, 20, y);
      y += size * 0.5;
    }
    y += 1.5;
  };

  line('Daryos – Angebotsübersicht', 16, true);
  line(`Anfrage-ID: ${requestId} · erstellt ${dateTime(new Date().toISOString())}`, 9);
  if (o.source.isDemo) {
    doc.setTextColor(200, 0, 0);
    line('DEMO-TESTANGEBOT – kein reales, buchbares Angebot.', 12, true);
    doc.setTextColor(0, 0, 0);
  }
  y += 3;
  line(`${o.providerName} – ${o.tariffName}`, 13, true);
  line(`Energieart: ${o.energyType === 'gas' ? 'Gas' : 'Strom'} · PLZ ${input.postalCode} · Verbrauch ${input.annualConsumptionKwh.toLocaleString('de-DE')} kWh/Jahr`);
  y += 2;
  line('Preise und Bedingungen', 11, true);
  line(`Arbeitspreis: ${o.workPriceCtPerKwh ?? '–'} ct/kWh (brutto)`);
  line(`Grundpreis: ${o.basePriceEurPerMonth !== null ? eur(o.basePriceEurPerMonth) : '–'} pro Monat (brutto)`);
  line(`Preisgarantie: ${o.priceGuaranteeMonths ? `${o.priceGuaranteeMonths} Monate${o.priceGuaranteeType ? ` (${o.priceGuaranteeType})` : ''}` : 'keine'}`);
  line(`Vertragslaufzeit: ${o.contractTermMonths ?? '–'} Monate · Kündigungsfrist: ${o.noticePeriodWeeks ?? '–'} Wochen`);
  if (o.earliestStartDate) line(`Möglicher Lieferbeginn: ${o.earliestStartDate}`);
  for (const b of o.bonuses) line(`Bonus: ${b.label} ${eur(b.amountEur)} – ${b.conditions}${b.oneTime ? ' (einmalig)' : ''}`);
  y += 2;
  if (ranked.cost) {
    line('Kostenschätzung', 11, true);
    line(`Grundpreis × 12 = ${eur(ranked.cost.baseCostEur)}`);
    line(`Arbeitspreis × Verbrauch = ${eur(ranked.cost.workCostEur)}`);
    line(`Geschätzte Jahreskosten ohne Bonus: ${eur(ranked.cost.annualCostWithoutBonusEur)}`, 10, true);
    if (ranked.cost.oneTimeBonusEur) line(`Im ersten Jahr bei Erfüllung der Bonusbedingungen: ${eur(ranked.cost.firstYearCostWithBonusEur)}`);
    line('Schätzung auf Basis Ihres angegebenen Verbrauchs. Abgerechnet wird der tatsächliche Verbrauch.', 8);
  }
  y += 4;
  line(`Quelle: ${o.source.name} · Stand: ${dateTime(o.source.fetchedAt)}`, 8);
  line('Diese Übersicht ist unverbindlich und kein Vertragsangebot. Ein Vertrag kommt erst nach Prüfung durch Daryos und Bestätigung durch den Anbieter zustande.', 8);
  doc.save(`Daryos-Angebot-${requestId}.pdf`);
}
