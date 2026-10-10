// Freigegebene Wissensbasis für Chat-Assistent und WhatsApp-Bot.
// Enthält nur Inhalte, die auch auf der Webseite stehen – keine Tarife oder Preise.
import { faqData, servicesData } from '../src/data/servicesData';

export const CONTACT = {
  name: 'Daryos® – Tarifoptimierung & Wechselservice',
  address: 'Rotfuchsstraße 1, 04329 Leipzig',
  phone: '+49 176 43416174',
  email: 'daryos.kreis@gmail.com',
  languages: 'Deutsch, Türkisch, Kurdisch, Arabisch',
};

export function buildKnowledgeBase(): string {
  const services = servicesData
    .map((s) => `### ${s.title}\n${s.description}\nLeistungen: ${s.bulletPoints.join('; ')}\nBenötigte Unterlagen: ${s.requiredDocs.join('; ')}`)
    .join('\n\n');
  const faq = faqData.map((f) => `F: ${f.question}\nA: ${f.answer}`).join('\n\n');
  return `## Kontakt
${CONTACT.name}, ${CONTACT.address}. Telefon/WhatsApp ${CONTACT.phone}, E-Mail ${CONTACT.email}. Beratung auf ${CONTACT.languages}.
Online: Tarifvergleich unter #/vergleich, Anfragestatus unter #/status, Terminbuchung auf der Startseite.

## Leistungen
${services}

## Häufige Fragen
${faq}`;
}

/** Wörter, bei denen sofort an einen Menschen übergeben wird. */
export const HANDOVER_PATTERN = /\b(mensch|mitarbeiter|berater|beraterin|persönlich|beschwerde|anwalt|kündigung widerrufen|widerruf|rückruf)\b/i;
export const OPT_OUT_PATTERN = /^\s*(stop|stopp|abmelden|unsubscribe)\s*$/i;
