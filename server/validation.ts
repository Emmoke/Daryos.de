// Serverseitige Eingabevalidierung. Liefert entweder bereinigte Daten oder Feldfehler.
import type { ComparisonInput, EnergyType } from '../shared/platform';

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

export interface ContactInput {
  offerId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  preferredChannel: 'email' | 'telefon' | 'whatsapp';
  consentPrivacy: true;
  consentWhatsapp: boolean;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function optionalString(v: unknown, max: number): string | undefined | null {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v !== 'string') return null;
  const s = v.trim().replace(/[\u0000-\u001f\u007f]/g, '');
  if (s.length > max) return null;
  return s || undefined;
}

function optionalNumber(v: unknown): number | undefined | null {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function isValidIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

export function validateComparisonInput(body: unknown, now = new Date()): ValidationResult<ComparisonInput> {
  const errors: Record<string, string> = {};
  if (!isObject(body)) return { ok: false, errors: { _: 'Ungültige Anfrage.' } };

  const energyType = body.energyType;
  if (energyType !== 'gas' && energyType !== 'strom') errors.energyType = 'Bitte Gas oder Strom wählen.';

  const postalCode = typeof body.postalCode === 'string' ? body.postalCode.trim() : '';
  if (!/^\d{5}$/.test(postalCode)) errors.postalCode = 'Bitte eine gültige fünfstellige Postleitzahl eingeben.';

  const city = optionalString(body.city, 80);
  if (city === null) errors.city = 'Ort ist zu lang oder ungültig.';

  const consumption = optionalNumber(body.annualConsumptionKwh);
  const maxKwh = energyType === 'strom' ? 100_000 : 200_000;
  if (consumption === undefined || consumption === null) {
    errors.annualConsumptionKwh = 'Bitte den Jahresverbrauch in kWh angeben oder schätzen lassen.';
  } else if (consumption < 100 || consumption > maxKwh) {
    errors.annualConsumptionKwh = `Der Jahresverbrauch muss zwischen 100 und ${maxKwh.toLocaleString('de-DE')} kWh liegen.`;
  }

  const householdSize = optionalNumber(body.householdSize);
  if (householdSize === null || (householdSize !== undefined && (!Number.isInteger(householdSize) || householdSize < 1 || householdSize > 12))) {
    errors.householdSize = 'Haushaltsgröße muss zwischen 1 und 12 Personen liegen.';
  }

  const currentProvider = optionalString(body.currentProvider, 100);
  if (currentProvider === null) errors.currentProvider = 'Anbietername ist zu lang.';
  const currentTariff = optionalString(body.currentTariff, 100);
  if (currentTariff === null) errors.currentTariff = 'Tarifname ist zu lang.';

  const currentAnnualCostEur = optionalNumber(body.currentAnnualCostEur);
  if (currentAnnualCostEur === null || (currentAnnualCostEur !== undefined && (currentAnnualCostEur < 0 || currentAnnualCostEur > 50_000))) {
    errors.currentAnnualCostEur = 'Aktuelle Jahreskosten müssen zwischen 0 und 50.000 € liegen.';
  }

  const desiredStartDate = optionalString(body.desiredStartDate, 10);
  if (desiredStartDate === null || (desiredStartDate !== undefined && !isValidIsoDate(desiredStartDate))) {
    errors.desiredStartDate = 'Bitte ein gültiges Datum wählen.';
  } else if (desiredStartDate) {
    const today = now.toISOString().slice(0, 10);
    const max = new Date(now.getTime() + 366 * 86_400_000).toISOString().slice(0, 10);
    if (desiredStartDate < today) errors.desiredStartDate = 'Der Lieferbeginn darf nicht in der Vergangenheit liegen.';
    else if (desiredStartDate > max) errors.desiredStartDate = 'Der Lieferbeginn darf höchstens 12 Monate in der Zukunft liegen.';
  }

  const maxContractMonths = optionalNumber(body.maxContractMonths);
  if (maxContractMonths === null || (maxContractMonths !== undefined && ![1, 12, 24].includes(maxContractMonths))) {
    errors.maxContractMonths = 'Erlaubte Laufzeiten: 1, 12 oder 24 Monate.';
  }
  const minPriceGuaranteeMonths = optionalNumber(body.minPriceGuaranteeMonths);
  if (minPriceGuaranteeMonths === null || (minPriceGuaranteeMonths !== undefined && (minPriceGuaranteeMonths < 0 || minPriceGuaranteeMonths > 36))) {
    errors.minPriceGuaranteeMonths = 'Preisgarantie muss zwischen 0 und 36 Monaten liegen.';
  }

  if (body.ecoOnly !== undefined && typeof body.ecoOnly !== 'boolean') errors.ecoOnly = 'Ungültiger Wert.';

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      energyType: energyType as EnergyType,
      postalCode,
      city: city ?? undefined,
      annualConsumptionKwh: Math.round(consumption as number),
      householdSize: householdSize ?? undefined,
      currentProvider: currentProvider ?? undefined,
      currentTariff: currentTariff ?? undefined,
      currentAnnualCostEur: currentAnnualCostEur ?? undefined,
      desiredStartDate: desiredStartDate ?? undefined,
      maxContractMonths: maxContractMonths ?? undefined,
      minPriceGuaranteeMonths: minPriceGuaranteeMonths ?? undefined,
      ecoOnly: body.ecoOnly === true ? true : undefined,
    },
  };
}

export function validateContactInput(body: unknown): ValidationResult<ContactInput> {
  const errors: Record<string, string> = {};
  if (!isObject(body)) return { ok: false, errors: { _: 'Ungültige Anfrage.' } };

  const offerId = typeof body.offerId === 'string' && /^[\w.-]{1,80}$/.test(body.offerId) ? body.offerId : '';
  if (!offerId) errors.offerId = 'Bitte ein Angebot auswählen.';

  const name = optionalString(body.name, 100);
  if (!name || name.length < 2) errors.name = 'Bitte Ihren Namen angeben.';

  const email = optionalString(body.email, 200);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Bitte eine gültige E-Mail-Adresse angeben.';

  const phone = optionalString(body.phone, 30);
  if (phone === null || (phone !== undefined && !/^\+?[\d\s()/-]{6,30}$/.test(phone))) errors.phone = 'Bitte eine gültige Telefonnummer angeben.';

  const message = optionalString(body.message, 2000);
  if (message === null) errors.message = 'Die Nachricht darf höchstens 2.000 Zeichen lang sein.';

  const channel = body.preferredChannel ?? 'email';
  if (channel !== 'email' && channel !== 'telefon' && channel !== 'whatsapp') errors.preferredChannel = 'Ungültiger Kontaktweg.';
  if ((channel === 'telefon' || channel === 'whatsapp') && !phone) errors.phone = 'Für Rückruf oder WhatsApp wird eine Telefonnummer benötigt.';
  if (channel === 'whatsapp' && body.consentWhatsapp !== true) errors.consentWhatsapp = 'Für Kontakt per WhatsApp ist Ihre Einwilligung erforderlich.';

  if (body.consentPrivacy !== true) errors.consentPrivacy = 'Bitte stimmen Sie der Verarbeitung gemäß Datenschutzerklärung zu.';

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      offerId,
      name: name as string,
      email: (email as string).toLowerCase(),
      phone: phone ?? undefined,
      message: message ?? undefined,
      preferredChannel: channel as ContactInput['preferredChannel'],
      consentPrivacy: true,
      consentWhatsapp: body.consentWhatsapp === true,
    },
  };
}

/** Typische Verbrauchsschätzung, klar als Schätzung gekennzeichnet (Richtwerte, keine Abrechnungsgrundlage). */
export function estimateConsumption(energyType: EnergyType, householdSize: number, livingSpaceSqm?: number): number {
  if (energyType === 'strom') {
    const table = [0, 1500, 2500, 3500, 4250, 5000];
    return table[Math.min(Math.max(householdSize, 1), 5)] + Math.max(0, householdSize - 5) * 750;
  }
  // Gas: Heizung + Warmwasser, grob 140 kWh/m² bzw. 35 m² pro Person als Ersatzwert
  const area = livingSpaceSqm && livingSpaceSqm > 0 ? livingSpaceSqm : Math.max(householdSize, 1) * 35;
  return Math.round((area * 140) / 100) * 100;
}
