import { ServiceDetail, FaqItem } from '../types';

export const servicesData: ServiceDetail[] = [
  {
    id: 'strom',
    title: 'Stromvertrag',
    tagline: 'Günstiger Öko- oder Normalstrom mit verlässlicher Preisgarantie.',
    badge: '⚡ Strom',
    image: '/src/assets/images/strom_energy_clean_1791468917569.jpg',
    description:
      'Steigende Stromkosten belasten private Haushalte und Gewerbetreibende in Leipzig spürbar. Wir durchforsten über 800 geprüfte Stromtarife – inklusive Ökostrom-Optionen, Neukunden-Boni und Festpreisverträgen bis zu 24 Monate. Wir schützen Sie vor unerwarteten Preiserhöhungen Ihres Grundversorgers.',
    savingsHint: 'Passende Partnerangebote individuell prüfen lassen',
    bulletPoints: [
      'Preis- und Vertragsbedingungen individuell vergleichen',
      'Ökostrom aus zertifizierter Wasserkraft oder Solar',
      'Keine Vorkasse oder dubiose Tarifmodelle',
      'Fristgerechte Kündigung beim Altversorger',
      'Unterbrechungsfreie gesetzliche Versorgungssicherheit',
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
    tagline: 'Wärme zu fairen Preisen – Heizkosten effektiv dämpfen.',
    badge: '🔥 Gas',
    image: '/src/assets/images/gas_heating_warm_1791468927843.jpg',
    description:
      'Die Heizperiode bringt oft böse Überraschungen bei der Jahresabrechnung. Wir vergleichen transparente Erdgas- und Biogastarife mit planbaren Festpreisen. Durch einen Wechsel sichern Sie sich günstige Arbeitspreise je Kilowattstunde und sparen hunderte Euro bei Gasthermen und Zentralheizungen.',
    savingsHint: 'Passende Partnerangebote individuell prüfen lassen',
    bulletPoints: [
      'Arbeitspreise und Vertragslaufzeit gemeinsam prüfen',
      'Biogas-Beimischung für umweltbewusste Haushalte',
      'Vermeidung teurer Grundversorgungstarife',
      'Transparente monatliche Abschläge ohne Nachzahlungsfalle',
      'Unterstützung beim Wechsel nach vorheriger Abstimmung',
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
    tagline: 'Highspeed Glasfaser, DSL & Kabel ohne versteckte Router-Kosten.',
    badge: '🌐 Internet & Festnetz',
    image: '/src/assets/images/fiber_internet_speed_1791468940279.jpg',
    description:
      'Zu langsames WLAN oder überteuerte Altverträge? Wir prüfen die maximale Bandbreite an Ihrer Leipziger Adresse – egal ob Glasfaser (FTTH), Highspeed-Kabel (bis 1.000 Mbit/s) oder stabiles VDSL. Mit attraktiven Wechselboni, Cashback und kostenloser Rufnummernmitnahme sparen Sie bares Geld.',
    savingsHint: 'Verfügbarkeit und Konditionen individuell prüfen lassen',
    bulletPoints: [
      'Verfügbarkeitsprüfung für Glasfaser, Kabel und VDSL',
      'Maximale Download- & Upload-Geschwindigkeit zum Bestpreis',
      'Garantierte Rufnummernmitnahme vom Altanbieter',
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
    tagline: 'Umfassender KFZ-Schutz: Haftpflicht, Teil- & Vollkasko optimiert.',
    badge: '🚗 Autoversicherung',
    image: '/src/assets/images/car_insurance_mobility_1791468952430.jpg',
    description:
      'KFZ-Tarife ändern sich jährlich massiv. Wir überprüfen Ihre Schadensfreiheitsklasse (SF-Klasse), Fahrleistung, Fahrerkreis und Deckungsumfang. Egal ob Neuwagen, Gebrauchter oder Elektrofahrzeug: Wir finden Policen mit bestem Schutz gegen Wildschäden, Marderbiss, grobe Fahrlässigkeit und Rabattschutz.',
    savingsHint: 'Versicherungsangebote und Vermittlerrolle individuell prüfen',
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
