import { ServiceDetail, ReviewItem, FaqItem } from '../types';

export const servicesData: ServiceDetail[] = [
  {
    id: 'strom',
    title: 'Stromvertrag',
    tagline: 'Tarife für Ihren Verbrauch vergleichen – mit Blick auf Preis, Laufzeit und Vertragsbedingungen.',
    badge: '⚡ Strom',
    image: '/src/assets/images/strom_energy_clean_1791468917569.jpg',
    description:
      'Wir vergleichen verfügbare Stromtarife anhand Ihrer Angaben. Dabei berücksichtigen wir unter anderem Arbeitspreis, Grundpreis, Laufzeit, Preisgarantie und mögliche Bonusbedingungen. Welche Optionen passen, hängt von Ihrem Verbrauch und Ihrer Wohnadresse ab.',
    savingsHint: 'Individuelles Sparpotenzial nach Tarifprüfung',
    bulletPoints: [
      'Preisgarantie und deren Umfang im Angebot prüfen',
      'Ökostrom aus zertifizierter Wasserkraft oder Solar',
      'Keine Vorkasse oder dubiose Tarifmodelle',
      'Fristgerechte Kündigung beim Altversorger',
      'Wechselablauf und Versorgungssicherheit verständlich erklärt',
    ],
    requiredDocs: [
      'Letzte Stromrechnung (oder Vorjahresverbrauch in kWh)',
      'Stromzählernummer (am Stromzähler ablesbar)',
      'Name des bisherigen Stromanbieters',
    ],
    providersExample: ['Vattenfall', 'E.ON', 'EnBW', 'Stadtwerke Leipzig', 'LichtBlick', 'Yello', 'Eprimo'],
  },
  {
    id: 'gas',
    title: 'Gasvertrag',
    tagline: 'Gasangebote nach Verbrauch und Vertragsbedingungen vergleichen.',
    badge: '🔥 Gas',
    image: '/src/assets/images/gas_heating_warm_1791468927843.jpg',
    description:
      'Wir vergleichen verfügbare Gasangebote und erläutern Arbeitspreis, Grundpreis, Laufzeit und Preisgarantie. Die tatsächlichen Kosten hängen vom Jahresverbrauch, der Adresse und den jeweiligen Vertragsbedingungen ab.',
    savingsHint: 'Individuelles Sparpotenzial nach Tarifprüfung',
    bulletPoints: [
      'Erhalt stabiler Arbeitspreise über den gesamten Winter',
      'Biogas-Beimischung für umweltbewusste Haushalte',
      'Vermeidung teurer Grundversorgungstarife',
      'Transparente monatliche Abschläge ohne Nachzahlungsfalle',
      'Unterstützung beim Wechsel nach Ihrer Zustimmung',
    ],
    requiredDocs: [
      'Letzte Gasabrechnung (Jahresverbrauch in kWh oder m³)',
      'Gaszählernummer',
      'Bisherige Kundennummer / Anbieter',
    ],
    providersExample: ['E.ON Gas', 'Vattenfall', 'Mainova', 'Goldgas', 'Stadtwerke Leipzig', 'Montana', 'Maingau'],
  },
  {
    id: 'internet',
    title: 'Internet & Festnetz',
    tagline: 'Internetoptionen transparent nach Preis, Geschwindigkeit und Laufzeit vergleichen.',
    badge: '🌐 Internet & Festnetz',
    image: '/src/assets/images/fiber_internet_speed_1791468940279.jpg',
    description:
      'Wir helfen beim Vergleich verfügbarer DSL-, Kabel- und Glasfaserangebote. Verfügbarkeit, tatsächliche Geschwindigkeit, Routerkosten, Bonusbedingungen und mögliche Kosten nach der Aktionsphase sollten vor Abschluss geprüft werden.',
    savingsHint: 'Verfügbarkeit und Gesamtkosten individuell prüfen',
    bulletPoints: [
      'Verfügbarkeitsprüfung für Glasfaser, Kabel und VDSL',
      'Maximale Download- & Upload-Geschwindigkeit zum Bestpreis',
      'Rufnummernmitnahme bei Bedarf mit dem Anbieter klären',
      'Inklusive Fritz!Box / WLAN-Hardware-Beratung',
      'Lückenloser Übergang am Schalttag',
    ],
    requiredDocs: [
      'Genaue Wohnadresse für Leitungsprüfung',
      'Bisherige Festnetznummer (falls Mitnahme erwünscht)',
      'Kündigungsfrist des laufenden Internetvertrags',
    ],
    providersExample: ['Telekom', 'Vodafone', '1&1', 'O2 Telefónica', 'PYUR (Tele Columbus)', 'easybell'],
  },
  {
    id: 'kfz',
    title: 'Autoversicherung',
    tagline: 'Autoversicherungen nach Beitrag, Deckung und individuellen Angaben vergleichen.',
    badge: '🚗 Autoversicherung',
    image: '/src/assets/images/car_insurance_mobility_1791468952430.jpg',
    description:
      'Wir unterstützen beim Vergleich von Haftpflicht, Teilkasko und Vollkasko. Entscheidend sind unter anderem Fahrleistung, Fahrerkreis, Schadenfreiheitsklasse, Selbstbeteiligung und die konkreten Versicherungsbedingungen.',
    savingsHint: 'Individuelle Prüfung von Beitrag und Deckung',
    bulletPoints: [
      'Optimierung von Haftpflicht, Teil- & Vollkasko',
      'Erhalt und Übertragung von SF-Rabatten',
      'Schutz bei grober Fahrlässigkeit & erweiterte Wildschadenklausel',
      'Sonderkündigungsrecht bei Beitragserhöhungen nutzen',
      'Stichtag 30. November sowie ganzjährige Wechselberatung',
    ],
    requiredDocs: [
      'Fahrzeugschein (Zulassungsbescheinigung Teil I)',
      'Aktuelle Beitragsrechnung der bisherigen KFZ-Versicherung',
      'Aktuelle SF-Klasse und Kilometerstand',
      'Führerscheindaten der eingetragenen Fahrer',
    ],
    providersExample: ['HUK-Coburg', 'Allianz', 'VHV Versicherungen', 'AXA', 'Ergo', 'DEVK', 'R+V', 'Generali'],
  },
];

export const reviewsData: ReviewItem[] = [];

export const faqData: FaqItem[] = [
  {
    id: 'f1',
    question: 'Kostet mich die Beratung oder der Wechsel etwas?',
    answer:
      'Nein, unsere Beratung und der gesamte Wechselservice sind für Sie als Endkunde zu 100% kostenlos. Wir finanzieren uns über reguläre Vermittlungsprovisionen der jeweiligen Versorger und Versicherer, bleiben dabei jedoch unabhängig und empfehlen stets den Tarif, der für Ihre Anforderungen am günstigsten ist.',
    category: 'allgemein',
  },
  {
    id: 'f2',
    question: 'Droht mir beim Strom- oder Gasanbieterwechsel ein Versorgungsausfall?',
    answer:
      'Nein, keinesfalls! In Deutschland ist die lückenlose Energieversorgung gesetzlich durch das Energiewirtschaftsgesetz (EnWG) garantiert. Es gibt zu keinem Zeitpunkt eine Strom- oder Gasunterbrechung. Sie merken vom Wechsel technisch überhaupt nichts – die Leitungen und Zähler bleiben exakt dieselben.',
    category: 'strom',
  },
  {
    id: 'f3',
    question: 'Was passiert mit meinem Altvertrag? Muss ich selbst kündigen?',
    answer:
      'In den allermeisten Fällen müssen Sie gar nichts kündigen. Der neue Versorger übernimmt die Kündigung bei Ihrem bisherigen Anbieter vollautomatisch im Zuge des Wechsels. Lediglich bei sehr kurzen Sonderkündigungsfristen (z.B. nach einer plötzlichen Preiserhöhung) empfehlen wir eine vorsorgliche Eigenkündigung, bei der wir Sie mit Musterschreiben unterstützen.',
    category: 'allgemein',
  },
  {
    id: 'f4',
    question: 'Welche Unterlagen muss ich zur Beratung mitbringen?',
    answer:
      'Für Strom und Gas: Die letzte Jahresabrechnung (darauf stehen Zählernummer und Jahresverbrauch). Für Internet: Die aktuelle Vertragsbezeichnung und Festnetznummer. Für KFZ: Den Fahrzeugschein und die letzte Beitragsrechnung mit Ihrer SF-Klasse.',
    category: 'allgemein',
  },
  {
    id: 'f5',
    question: 'Kann ich auch Termine außerhalb von Leipzig oder digital wahrnehmen?',
    answer:
      'Ja! Obwohl unser Büro in der Rotfuchsstraße 1 in 04329 Leipzig ansässig ist, beraten wir Kunden aus ganz Sachsen und bundesweit bequem per WhatsApp, Video-Call oder telefonischem Rückruf.',
    category: 'allgemein',
  },
  {
    id: 'f6',
    question: 'Beraten Sie auch Gewerbekunden und Unternehmen?',
    answer:
      'Ja. Für Gewerbebetriebe, Praxen, Büros und Gastronomie in Leipzig bieten wir spezialisierte Gewerbestrom-, Gewerbegas- und Flottentarife mit maßgeschneiderten Großkundenkonditionen an.',
    category: 'allgemein',
  },
];
