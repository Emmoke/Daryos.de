// Realistische Daten für Postleitzahlen, Grundversorger & Top-Tarifanbieter in Deutschland
// Spezieller Fokus auf Leipzig (04xxx) sowie bundesweite Vergleichsdaten

export interface PlzRegionInfo {
  plzPrefix: string;
  cityName: string;
  region: string;
  grundversorgerStrom: {
    name: string;
    arbeitspreis: number; // ct/kWh
    grundpreis: number; // €/Monat
  };
  grundversorgerGas: {
    name: string;
    arbeitspreis: number; // ct/kWh
    grundpreis: number; // €/Monat
  };
}

export interface ProviderTariffDetail {
  id: string; // matches ProviderLogo id
  providerName: string;
  tariffName: string;
  service: 'strom' | 'gas' | 'internet' | 'kfz';
  arbeitspreis: number; // ct/kWh für Energie oder monatl. Ø-Preis für Internet
  grundpreis: number; // €/Monat für Energie
  laufzeitMonate: number;
  preisgarantieMonate: number;
  kuendigungsfristWochen: number;
  eco: boolean; // 100% Ökostrom / Biogas
  regionalLeipzig: boolean;
  bonusEuro?: number;
  description: string;
  ratingScore: number;
}

// Erkennung von PLZ und zugehörigen regionalen Grundversorger-Konditionen
export const PLZ_REGIONS: Record<string, PlzRegionInfo> = {
  '04': {
    plzPrefix: '04',
    cityName: 'Leipzig & Umland',
    region: 'Sachsen / Mitteldeutschland',
    grundversorgerStrom: {
      name: 'Stadtwerke Leipzig GmbH (L-Strom)',
      arbeitspreis: 38.6,
      grundpreis: 12.8,
    },
    grundversorgerGas: {
      name: 'Stadtwerke Leipzig GmbH (L-Gas)',
      arbeitspreis: 13.8,
      grundpreis: 14.5,
    },
  },
  '01': {
    plzPrefix: '01',
    cityName: 'Dresden & Umland',
    region: 'Sachsen',
    grundversorgerStrom: {
      name: 'SachsenEnergie AG (DREWAG)',
      arbeitspreis: 37.9,
      grundpreis: 12.4,
    },
    grundversorgerGas: {
      name: 'SachsenEnergie AG',
      arbeitspreis: 13.4,
      grundpreis: 14.2,
    },
  },
  '09': {
    plzPrefix: '09',
    cityName: 'Chemnitz & Erzgebirge',
    region: 'Sachsen',
    grundversorgerStrom: {
      name: 'eins energie in sachsen',
      arbeitspreis: 38.2,
      grundpreis: 12.5,
    },
    grundversorgerGas: {
      name: 'eins energie in sachsen',
      arbeitspreis: 13.5,
      grundpreis: 14.0,
    },
  },
  '06': {
    plzPrefix: '06',
    cityName: 'Halle (Saale) & Merseburg',
    region: 'Sachsen-Anhalt',
    grundversorgerStrom: {
      name: 'EVH GmbH (Stadtwerke Halle)',
      arbeitspreis: 38.1,
      grundpreis: 12.6,
    },
    grundversorgerGas: {
      name: 'EVH GmbH',
      arbeitspreis: 13.6,
      grundpreis: 14.1,
    },
  },
  '10': {
    plzPrefix: '10',
    cityName: 'Berlin Zentrum',
    region: 'Berlin',
    grundversorgerStrom: {
      name: 'Vattenfall Europe Berlin',
      arbeitspreis: 37.4,
      grundpreis: 11.9,
    },
    grundversorgerGas: {
      name: 'GASAG AG',
      arbeitspreis: 13.2,
      grundpreis: 13.9,
    },
  },
  '20': {
    plzPrefix: '20',
    cityName: 'Hamburg',
    region: 'Hamburg',
    grundversorgerStrom: {
      name: 'Vattenfall Hamburg',
      arbeitspreis: 36.8,
      grundpreis: 11.5,
    },
    grundversorgerGas: {
      name: 'Hamburger Energiewerke',
      arbeitspreis: 12.9,
      grundpreis: 13.8,
    },
  },
  '80': {
    plzPrefix: '80',
    cityName: 'München',
    region: 'Bayern',
    grundversorgerStrom: {
      name: 'SWM Stadtwerke München',
      arbeitspreis: 36.5,
      grundpreis: 11.2,
    },
    grundversorgerGas: {
      name: 'SWM Stadtwerke München',
      arbeitspreis: 12.7,
      grundpreis: 13.5,
    },
  },
  '50': {
    plzPrefix: '50',
    cityName: 'Köln',
    region: 'Nordrhein-Westfalen',
    grundversorgerStrom: {
      name: 'RheinEnergie AG',
      arbeitspreis: 37.2,
      grundpreis: 12.1,
    },
    grundversorgerGas: {
      name: 'RheinEnergie AG',
      arbeitspreis: 13.1,
      grundpreis: 13.9,
    },
  },
  '60': {
    plzPrefix: '60',
    cityName: 'Frankfurt am Main',
    region: 'Hessen',
    grundversorgerStrom: {
      name: 'Mainova AG',
      arbeitspreis: 37.0,
      grundpreis: 11.8,
    },
    grundversorgerGas: {
      name: 'Mainova AG',
      arbeitspreis: 13.0,
      grundpreis: 13.7,
    },
  },
};

// Bundesweiter Standard, falls PLZ nicht in Spezifiktabelle
export const DEFAULT_PLZ_REGION: PlzRegionInfo = {
  plzPrefix: '00',
  cityName: 'Bundesweites Netz',
  region: 'Deutschland',
  grundversorgerStrom: {
    name: 'Lokaler Grundversorger',
    arbeitspreis: 37.8,
    grundpreis: 12.2,
  },
  grundversorgerGas: {
    name: 'Lokaler Grundversorger',
    arbeitspreis: 13.5,
    grundpreis: 14.0,
  },
};

export function getRegionInfoForPlz(plz: string): PlzRegionInfo {
  const cleanPlz = plz.trim().replace(/\D/g, '');
  if (!cleanPlz || cleanPlz.length < 2) {
    return PLZ_REGIONS['04']; // Leipzig als Heimatstandort von Daryos
  }
  const prefix2 = cleanPlz.slice(0, 2);
  if (PLZ_REGIONS[prefix2]) {
    return PLZ_REGIONS[prefix2];
  }
  // Check Leipzig Stadtteile (04103, 04109, 04329 etc.)
  if (cleanPlz.startsWith('04')) {
    return PLZ_REGIONS['04'];
  }
  return {
    ...DEFAULT_PLZ_REGION,
    cityName: `PLZ ${cleanPlz}`,
  };
}

// Echte Anbieter-Tarife mit genauen Spezifikationen (Stand 2025/2026)
export const STROM_PROVIDER_TARIFFS: ProviderTariffDetail[] = [
  {
    id: 'vattenfall',
    providerName: 'Vattenfall',
    tariffName: 'NaturStrom Easy 12M',
    service: 'strom',
    arbeitspreis: 26.4,
    grundpreis: 10.8,
    laufzeitMonate: 12,
    preisgarantieMonate: 12,
    kuendigungsfristWochen: 4,
    eco: true,
    regionalLeipzig: false,
    bonusEuro: 120,
    description: '100% zertifizierter Ökostrom aus skandinavischer Wasserkraft mit 12 Monaten voller Preisgarantie.',
    ratingScore: 4.8,
  },
  {
    id: 'stadtwerke-leipzig',
    providerName: 'Stadtwerke Leipzig',
    tariffName: 'L-Strom pur (Regional)',
    service: 'strom',
    arbeitspreis: 28.2,
    grundpreis: 11.5,
    laufzeitMonate: 12,
    preisgarantieMonate: 12,
    kuendigungsfristWochen: 4,
    eco: true,
    regionalLeipzig: true,
    bonusEuro: 80,
    description: 'Regionalstrom direkt aus und für Leipzig. Sichere Energieversorgung mit regionaler Wertschöpfung.',
    ratingScore: 4.7,
  },
  {
    id: 'eon',
    providerName: 'E.ON',
    tariffName: 'ÖkoStrom Leipzig Garant',
    service: 'strom',
    arbeitspreis: 27.0,
    grundpreis: 10.9,
    laufzeitMonate: 12,
    preisgarantieMonate: 12,
    kuendigungsfristWochen: 4,
    eco: true,
    regionalLeipzig: false,
    bonusEuro: 105,
    description: 'TÜV-geprüfter Ökostrom von Deutschlands größtem Netzbetreiber mit verlässlichem Service.',
    ratingScore: 4.6,
  },
  {
    id: 'yello',
    providerName: 'Yello',
    tariffName: 'Strom Klima Care',
    service: 'strom',
    arbeitspreis: 26.8,
    grundpreis: 11.2,
    laufzeitMonate: 12,
    preisgarantieMonate: 12,
    kuendigungsfristWochen: 4,
    eco: true,
    regionalLeipzig: false,
    bonusEuro: 90,
    description: 'Klimaneutraler Ökostrom mit digitaler App-Steuerung und transparenter Monatsübersicht.',
    ratingScore: 4.7,
  },
  {
    id: 'lichtblick',
    providerName: 'LichtBlick',
    tariffName: 'ÖkoStrom 100% Zukunft',
    service: 'strom',
    arbeitspreis: 27.6,
    grundpreis: 11.4,
    laufzeitMonate: 12,
    preisgarantieMonate: 12,
    kuendigungsfristWochen: 4,
    eco: true,
    regionalLeipzig: false,
    bonusEuro: 75,
    description: 'Deutschlands Ökostrom-Pionier mit Auszeichnung für echten Zusatznutzen beim Ausbau erneuerbarer Energien.',
    ratingScore: 4.9,
  },
];

export const GAS_PROVIDER_TARIFFS: ProviderTariffDetail[] = [
  {
    id: 'montana',
    providerName: 'MONTANA',
    tariffName: 'Erdgas Garant 12',
    service: 'gas',
    arbeitspreis: 8.4,
    grundpreis: 11.9,
    laufzeitMonate: 12,
    preisgarantieMonate: 12,
    kuendigungsfristWochen: 4,
    eco: false,
    regionalLeipzig: false,
    bonusEuro: 150,
    description: 'Hocheffizientes Erdgas mit 12 Monaten fester Preisgarantie gegen winterliche Preissprünge.',
    ratingScore: 4.8,
  },
  {
    id: 'maingau',
    providerName: 'MAINGAU Energie',
    tariffName: 'Gas Clever Fix',
    service: 'gas',
    arbeitspreis: 8.5,
    grundpreis: 11.5,
    laufzeitMonate: 12,
    preisgarantieMonate: 12,
    kuendigungsfristWochen: 4,
    eco: false,
    regionalLeipzig: false,
    bonusEuro: 130,
    description: 'Besonders günstiger Grundversorgungs-Wechsler mit Top-Konditionen für Haushalte und Mehrfamilienhäuser.',
    ratingScore: 4.7,
  },
  {
    id: 'stadtwerke-leipzig',
    providerName: 'Stadtwerke Leipzig',
    tariffName: 'L-Gas regio',
    service: 'gas',
    arbeitspreis: 9.1,
    grundpreis: 12.8,
    laufzeitMonate: 12,
    preisgarantieMonate: 12,
    kuendigungsfristWochen: 4,
    eco: true,
    regionalLeipzig: true,
    bonusEuro: 90,
    description: 'Regionaler Gaspartner Leipzig mit Biogas-Anteil und persönlicher Betreuung vor Ort.',
    ratingScore: 4.6,
  },
  {
    id: 'eon',
    providerName: 'E.ON',
    tariffName: 'Erdgas Öko 12',
    service: 'gas',
    arbeitspreis: 8.7,
    grundpreis: 12.2,
    laufzeitMonate: 12,
    preisgarantieMonate: 12,
    kuendigungsfristWochen: 4,
    eco: true,
    regionalLeipzig: false,
    bonusEuro: 110,
    description: 'Kompensiertes Ökogas mit stabiler Versorgung und Ausfallgarantie.',
    ratingScore: 4.6,
  },
  {
    id: 'vattenfall',
    providerName: 'Vattenfall',
    tariffName: 'Easy Erdgas 12M',
    service: 'gas',
    arbeitspreis: 8.6,
    grundpreis: 11.9,
    laufzeitMonate: 12,
    preisgarantieMonate: 12,
    kuendigungsfristWochen: 4,
    eco: false,
    regionalLeipzig: false,
    bonusEuro: 125,
    description: 'Verlässliche Heizwärme mit fairem monatlichen Abschlag.',
    ratingScore: 4.7,
  },
];

export const INTERNET_PROVIDER_TARIFFS: ProviderTariffDetail[] = [
  {
    id: 'pyur',
    providerName: 'PŸUR',
    tariffName: 'Speed 250 (Leipzig Kabelnetz)',
    service: 'internet',
    arbeitspreis: 24.99, // Monatsdurchschnitt
    grundpreis: 0,
    laufzeitMonate: 24,
    preisgarantieMonate: 24,
    kuendigungsfristWochen: 4,
    eco: false,
    regionalLeipzig: true,
    bonusEuro: 100,
    description: 'Leipzigs führendes Kabelglasfasernetz. Bis zu 250 Mbit/s dauerhaft zum fairen Festpreis.',
    ratingScore: 4.6,
  },
  {
    id: 'telekom',
    providerName: 'Deutsche Telekom',
    tariffName: 'MagentaZuhause Glasfaser / DSL',
    service: 'internet',
    arbeitspreis: 29.95, // Monatsdurchschnitt (19,95 € M 1-6, danach 44,95 €)
    grundpreis: 0,
    laufzeitMonate: 24,
    preisgarantieMonate: 24,
    kuendigungsfristWochen: 4,
    eco: false,
    regionalLeipzig: false,
    bonusEuro: 170,
    description: 'Beste Netzabdeckung Deutschlands mit ultraschnellem Glasfaser-Ping und Premium-Router-Support.',
    ratingScore: 4.9,
  },
  {
    id: 'vodafone',
    providerName: 'Vodafone',
    tariffName: 'GigaZuhause Kabel 250',
    service: 'internet',
    arbeitspreis: 28.5,
    grundpreis: 0,
    laufzeitMonate: 24,
    preisgarantieMonate: 24,
    kuendigungsfristWochen: 4,
    eco: false,
    regionalLeipzig: false,
    bonusEuro: 120,
    description: 'Gigabit-Power über das moderne Koaxial-Glasfasernetz inklusive Telefonie-Flatrate.',
    ratingScore: 4.5,
  },
  {
    id: '1und1',
    providerName: '1&1',
    tariffName: 'DSL & Glasfaser 100/250',
    service: 'internet',
    arbeitspreis: 26.9,
    grundpreis: 0,
    laufzeitMonate: 24,
    preisgarantieMonate: 24,
    kuendigungsfristWochen: 4,
    eco: false,
    regionalLeipzig: false,
    bonusEuro: 140,
    description: 'Flexible Bandbreiten mit 1&1 Prinzip: Schneller Vor-Ort-Service und Fritz!Box Hardware.',
    ratingScore: 4.7,
  },
  {
    id: 'o2',
    providerName: 'O₂',
    tariffName: 'Home M (Kabel / VDSL / 5G)',
    service: 'internet',
    arbeitspreis: 29.99,
    grundpreis: 0,
    laufzeitMonate: 24,
    preisgarantieMonate: 24,
    kuendigungsfristWochen: 4,
    eco: false,
    regionalLeipzig: false,
    bonusEuro: 90,
    description: 'Dauerhaft günstiger Tarif ohne Preissprung ab dem 13. Monat, kombinierbar mit O₂ Mobilfunk.',
    ratingScore: 4.6,
  },
];

export const KFZ_PROVIDER_TARIFFS: ProviderTariffDetail[] = [
  {
    id: 'huk-coburg',
    providerName: 'HUK-COBURG',
    tariffName: 'Klassik-Garant mit Kasko PLUS',
    service: 'kfz',
    arbeitspreis: 480, // Jahresbeitrag Beispiel SF10 Vollkasko
    grundpreis: 0,
    laufzeitMonate: 12,
    preisgarantieMonate: 12,
    kuendigungsfristWochen: 4,
    eco: false,
    regionalLeipzig: false,
    bonusEuro: 60,
    description: 'Deutschlands größter KFZ-Versicherer mit Top-Schadensregulierung und Werkstatt-Service.',
    ratingScore: 4.9,
  },
  {
    id: 'allianz',
    providerName: 'Allianz',
    tariffName: 'Mobil Komfort mit Schutzbrief',
    service: 'kfz',
    arbeitspreis: 530,
    grundpreis: 0,
    laufzeitMonate: 12,
    preisgarantieMonate: 12,
    kuendigungsfristWochen: 4,
    eco: false,
    regionalLeipzig: false,
    bonusEuro: 50,
    description: 'Premium-Schutz mit freier Werkstattwahl, Rabattschutz und 24/7 Notfallservice.',
    ratingScore: 4.8,
  },
  {
    id: 'axa',
    providerName: 'AXA',
    tariffName: 'Mobil Online Schutz',
    service: 'kfz',
    arbeitspreis: 495,
    grundpreis: 0,
    laufzeitMonate: 12,
    preisgarantieMonate: 12,
    kuendigungsfristWochen: 4,
    eco: false,
    regionalLeipzig: false,
    bonusEuro: 55,
    description: 'Gutes Preis-Leistungs-Verhältnis mit schneller digitaler Schadenabwicklung.',
    ratingScore: 4.6,
  },
  {
    id: 'devk',
    providerName: 'DEVK',
    tariffName: 'Aktiv Kasko Komfort',
    service: 'kfz',
    arbeitspreis: 510,
    grundpreis: 0,
    laufzeitMonate: 12,
    preisgarantieMonate: 12,
    kuendigungsfristWochen: 4,
    eco: false,
    regionalLeipzig: false,
    bonusEuro: 45,
    description: 'Traditionell günstiger Versicherungsschutz mit persönlichem Beraterservice.',
    ratingScore: 4.7,
  },
  {
    id: 'adac',
    providerName: 'ADAC',
    tariffName: 'Autoversicherung mit Mitgliederrabatt',
    service: 'kfz',
    arbeitspreis: 520,
    grundpreis: 0,
    laufzeitMonate: 12,
    preisgarantieMonate: 12,
    kuendigungsfristWochen: 4,
    eco: false,
    regionalLeipzig: false,
    bonusEuro: 50,
    description: 'Inklusive ADAC Mobilitäts-Garantie und Schutz im europäischen Ausland.',
    ratingScore: 4.8,
  },
];
