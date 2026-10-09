import { Language } from '../types';

export interface TranslationSchema {
  dir: 'ltr' | 'rtl';
  topbar: {
    address: string;
    phone: string;
    email: string;
    openNow: string;
    closedNow: string;
    opensAt: string;
  };
  nav: {
    services: string;
    calculator: string;
    process: string;
    audit: string;
    about: string;
    reviews: string;
    faq: string;
    contact: string;
    bookAppointment: string;
  };
  hero: {
    badge: string;
    titleStart: string;
    titleStrom: string;
    titleGas: string;
    titleInternet: string;
    titleKfz: string;
    titleEnd: string;
    subtitle: string;
    commissionDisclosure: string;
    btnCalc: string;
    btnBook: string;
    btnWhatsApp: string;
    stat1Number: string;
    stat1Label: string;
    stat2Number: string;
    stat2Label: string;
    stat3Number: string;
    stat3Label: string;
  };
  calculator: {
    title: string;
    subtitle: string;
    tabStrom: string;
    tabGas: string;
    tabInternet: string;
    tabKfz: string;
    stromPersons: string;
    stromOrKwh: string;
    currentMonthlyRate: string;
    gasArea: string;
    gasConsumption: string;
    internetSpeed: string;
    internetType: string;
    kfzClass: string;
    kfzCoverage: string;
    calcButton: string;
    resultTitle: string;
    liveCalculation: string;
    estimatedSavings: string;
    perYear: string;
    guaranteedQuality: string;
    previousAnnualCosts: string;
    optimizedAnnualCosts: string;
    potentialLabel: string;
    takeToBooking: string;
    shareWhatsAppBtn: string;
  };
  services: {
    sectionSub: string;
    sectionTitle: string;
    sectionDesc: string;
    detailsBtn: string;
    bookBtn: string;
    modalDocsTitle: string;
    modalProvidersTitle: string;
    closeBtn: string;
  };
  process: {
    sectionSub: string;
    sectionTitle: string;
    sectionDesc: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    step4Title: string;
    step4Desc: string;
  };
  audit: {
    title: string;
    subtitle: string;
    dragText: string;
    orClick: string;
    privacyNote: string;
    analyzingText: string;
    analysisSuccess: string;
    detectedProvider: string;
    detectedConsumption: string;
    potentialSaving: string;
    sendViaWhatsApp: string;
    sendViaEmail: string;
  };
  booking: {
    sectionSub: string;
    sectionTitle: string;
    sectionDesc: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    typeInPerson: string;
    typePhone: string;
    typeVideo: string;
    typeWhatsApp: string;
    selectService: string;
    allServices: string;
    dateLabel: string;
    timeLabel: string;
    nameLabel: string;
    phoneLabel: string;
    emailLabel: string;
    notesLabel: string;
    submitBtn: string;
    confirmationTitle: string;
    confirmationDesc: string;
    exportCalendar: string;
    openWhatsAppAction: string;
    newBooking: string;
  };
  reviews: {
    sectionSub: string;
    sectionTitle: string;
    filterAll: string;
    savedText: string;
    emptyMessage: string;
  };
  faq: {
    sectionSub: string;
    sectionTitle: string;
  };
  contact: {
    title: string;
    hoursTitle: string;
    directionsBtn: string;
    callNow: string;
    chatWhatsApp: string;
    sendEmail: string;
    addressLabel: string;
    weekdays: string;
    saturday: string;
    sunday: string;
    closed: string;
  };
  footer: {
    tagline: string;
    rights: string;
    privacy: string;
    impressum: string;
  };
}

export const translations: Record<Language, TranslationSchema> = {
  de: {
    dir: 'ltr',
    topbar: {
      address: 'Rotfuchsstraße 1, 04329 Leipzig',
      phone: '+49 176 43416174',
      email: 'daryos.kreis@gmail.com',
      openNow: 'Jetzt geöffnet',
      closedNow: 'Aktuell geschlossen',
      opensAt: 'Öffnet um 09:00 Uhr',
    },
    nav: {
      services: 'Leistungen',
      calculator: 'Spar-Rechner',
      process: 'Wechsel-Ablauf',
      audit: 'Rechnungs-Check',
      about: 'Über uns',
      reviews: 'Kundenstimmen',
      faq: 'FAQ',
      contact: 'Kontakt & Standort',
      bookAppointment: 'Termin anfragen',
    },
    hero: {
      badge: 'Persönliche Tarifberatung aus Leipzig – regional & bundesweit',
      titleStart: 'Weniger zahlen. Besser beraten.',
      titleStrom: 'Strom',
      titleGas: 'Gas',
      titleInternet: 'Internet',
      titleKfz: 'Autoversicherung',
      titleEnd: '',
      subtitle: 'Wir prüfen Ihre Angaben, vergleichen verfügbare Angebote unserer direkten Vertragspartner und unterstützen Sie persönlich beim Anbieterwechsel. Sie entscheiden selbst, ob Sie wechseln möchten.',
      commissionDisclosure: 'Die Erstberatung ist kostenlos. Bei erfolgreicher Vermittlung können wir eine Provision vom Anbieter erhalten. Wir vergleichen Angebote unserer Vertragspartner, nicht zwingend den gesamten Markt.',
      btnCalc: 'Orientierungswert berechnen',
      btnBook: 'Termin vereinbaren',
      btnWhatsApp: 'WhatsApp Beratung',
      stat1Number: '',
      stat1Label: '',
      stat2Number: '',
      stat2Label: '',
      stat3Number: '',
      stat3Label: '',
    },
    calculator: {
      title: 'Interaktiver Schnell-Sparrechner',
      subtitle: 'Ermitteln Sie in wenigen Sekunden Ihr persönliches Einsparpotenzial ohne lästige Dateneingabe.',
      tabStrom: '⚡ Strom',
      tabGas: '🔥 Gas',
      tabInternet: '🌐 Internet',
      tabKfz: '🚗 KFZ-Versicherung',
      stromPersons: 'Haushaltsgröße (Personen)',
      stromOrKwh: 'Geschätzter Jahresverbrauch (kWh)',
      currentMonthlyRate: 'Aktueller monatlicher Abschlag (€)',
      gasArea: 'Wohnfläche (ca. m²)',
      gasConsumption: 'Geschätzter Jahresverbrauch Gas (kWh)',
      internetSpeed: 'Aktuelle Geschwindigkeit (Mbit/s)',
      internetType: 'Gewünschte Technologie',
      kfzClass: 'Schadenfreiheitsklasse (SF)',
      kfzCoverage: 'Gewünschter Versicherungsschutz',
      calcButton: 'Ersparnis berechnen',
      resultTitle: 'Geschätztes Einsparpotenzial',
      liveCalculation: 'Live-Kalkulation',
      estimatedSavings: 'Mögliche Ersparnis:',
      perYear: 'pro Jahr',
      guaranteedQuality: 'Leistungen werden im Einzelfall verglichen; keine Garantie.',
      previousAnnualCosts: 'Bisherige Jahreskosten:',
      optimizedAnnualCosts: 'Optimierte Jahreskosten:',
      potentialLabel: 'Beispielrechnung mit hinterlegten Preisen – kein Live-Angebot. Tatsächliche Konditionen bitte beim Anbieter prüfen.',
      takeToBooking: 'Unverbindlich beraten lassen',
      shareWhatsAppBtn: 'Ergebnis per WhatsApp prüfen lassen',
    },
    services: {
      sectionSub: 'Transparente Optimierung',
      sectionTitle: 'Unsere Tarif- und Beratungsbereiche',
      sectionDesc: 'Wir vergleichen verfügbare Angebote unserer Vertragspartner, prüfen passende Konditionen und unterstützen Sie auf Wunsch beim Wechsel.',
      detailsBtn: 'Tarif-Details & Unterlagen',
      bookBtn: 'Beratung anfragen',
      modalDocsTitle: 'Was wir für die Prüfung benötigen:',
      modalProvidersTitle: 'Häufig geprüfte Anbieter & Tarife:',
      closeBtn: 'Schließen',
    },
    process: {
      sectionSub: 'Einfach & Sicher',
      sectionTitle: 'Der Daryos Wechselservice in 4 Schritten',
      sectionDesc: 'Sie entscheiden, ob Sie ein Angebot annehmen möchten. Der Wechsel erfolgt erst nach Ihrer Zustimmung und gemäß dem vereinbarten Ablauf.',
      step1Title: '01. Kontakt aufnehmen',
      step1Desc: 'Teilen Sie uns per WhatsApp oder Telefon mit, welchen Vertrag Sie prüfen lassen möchten.',
      step2Title: '02. Partnerangebote prüfen',
      step2Desc: 'Wir prüfen passende, verfügbare Angebote unserer Vertragspartner und erläutern die Konditionen.',
      step3Title: '03. Gemeinsam entscheiden',
      step3Desc: 'Sie vergleichen die besprochenen Bedingungen und entscheiden selbst, ob Sie einen Vertrag abschließen möchten.',
      step4Title: '04. Wechsel begleiten',
      step4Desc: 'Wenn Sie sich entscheiden, unterstützen wir Sie bei den vereinbarten Schritten des Anbieterwechsels.',
    },
    audit: {
      title: 'Persönliche Rechnungsprüfung anfragen',
      subtitle: 'Laden Sie Ihre letzte Rechnung hoch oder fotografieren Sie Ihren Zähler für eine unverbindliche Ersteinschätzung.',
      dragText: 'Rechnung zur späteren Prüfung auswählen (bleibt lokal)',
      orClick: 'oder Datei vom Gerät auswählen (PDF, JPG, PNG)',
      privacyNote: 'Ihre Dokumente werden vertraulich gemäß DSGVO nur zur individuellen Tarifberatung verarbeitet.',
      analyzingText: 'Dokument wird digital analysiert...',
      analysisSuccess: 'Dokument erfolgreich erfasst!',
      detectedProvider: 'Erkannter Vertrag / Sparpotenzial',
      detectedConsumption: 'Analysierter Verbrauch',
      potentialSaving: 'Geschätzte Ersparnis ca. 240 – 520 € / Jahr',
      sendViaWhatsApp: 'Direkt per WhatsApp zur Prüfung senden',
      sendViaEmail: 'Per E-Mail an Daryos senden',
    },
    booking: {
      sectionSub: 'Persönlich & Digital',
      sectionTitle: 'Beratungstermin anfragen',
      sectionDesc: 'Wählen Sie Ihren Wunschtermin. Ob vor Ort in Leipzig, telefonisch oder via WhatsApp – wir nehmen uns Zeit für Sie.',
      step1: '1. Beratungsart',
      step2: '2. Tarifbereich',
      step3: '3. Termin & Zeit',
      step4: '4. Ihre Kontaktdaten',
      typeInPerson: 'Vor Ort im Büro (Leipzig)',
      typePhone: 'Telefonischer Rückruf',
      typeVideo: 'Video-Beratung',
      typeWhatsApp: 'Beratung via WhatsApp',
      selectService: 'Gewünschter Bereich:',
      allServices: 'Komplett-Check (Strom, Gas, Internet & KFZ)',
      dateLabel: 'Wunschdatum:',
      timeLabel: 'Uhrzeit:',
      nameLabel: 'Ihr vollständiger Name:',
      phoneLabel: 'Telefon- / WhatsApp-Nummer:',
      emailLabel: 'E-Mail-Adresse:',
      notesLabel: 'Aktueller Anbieter oder Anmerkungen (optional):',
      submitBtn: 'Terminanfrage verbindlich absenden',
      confirmationTitle: 'Terminanfrage erfolgreich erhalten!',
      confirmationDesc: 'Wir haben Ihre Anfrage erfasst und melden uns kurzfristig zur Terminbestätigung.',
      exportCalendar: 'Termin im Kalender speichern (.ics)',
      openWhatsAppAction: 'Termin per WhatsApp bestätigen',
      newBooking: 'Weitere Anfrage stellen',
    },
    reviews: {
      sectionSub: 'Erfahrungsberichte',
      sectionTitle: 'Kundenstimmen',
      filterAll: 'Alle Bewertungen',
      savedText: 'Erzielte Ersparnis:',
      emptyMessage: 'Aktuell zeigen wir hier noch keine Kundenbewertungen an. Echte Kundenstimmen veröffentlichen wir nur mit Zustimmung der betreffenden Personen.',
    },
    faq: {
      sectionSub: 'Antworten auf Ihre Fragen',
      sectionTitle: 'Häufig gestellte Fragen (FAQ)',
    },
    contact: {
      title: 'Kontakt & Standort',
      hoursTitle: 'Öffnungs- & Beratungszeiten',
      directionsBtn: 'In Google Maps öffnen',
      callNow: 'Jetzt anrufen',
      chatWhatsApp: 'Per WhatsApp schreiben',
      sendEmail: 'E-Mail senden',
      addressLabel: 'Büroanschrift:',
      weekdays: 'Montag – Freitag: 09:00 – 18:00 Uhr',
      saturday: 'Samstag: 10:00 – 14:00 Uhr',
      sunday: 'Sonntag & Feiertage:',
      closed: 'Geschlossen',
    },
    footer: {
      tagline: 'Persönliche Beratung zu verfügbaren Angeboten unserer Vertragspartner für Energie, Internet und Kfz-Versicherung.',
      rights: 'Alle Rechte vorbehalten. Rotfuchsstraße 1, 04329 Leipzig.',
      privacy: 'Datenschutz',
      impressum: 'Impressum',
    },
  },

  en: {
    dir: 'ltr',
    topbar: {
      address: 'Rotfuchsstraße 1, 04329 Leipzig, Germany',
      phone: '+49 176 43416174',
      email: 'daryos.kreis@gmail.com',
      openNow: 'Open now',
      closedNow: 'Currently closed',
      opensAt: 'Opens at 09:00',
    },
    nav: {
      services: 'Services',
      calculator: 'Savings Calculator',
      process: 'How It Works',
      audit: 'Bill Audit',
      about: 'About Us',
      reviews: 'Testimonials',
      faq: 'FAQ',
      contact: 'Contact & Location',
      bookAppointment: 'Request Appointment',
    },
    hero: {
      badge: 'Personal tariff advice from Leipzig – regional & nationwide',
      titleStart: 'Pay less. Get better advice.',
      titleStrom: 'Electricity',
      titleGas: 'Gas',
      titleInternet: 'Internet',
      titleKfz: 'Car Insurance',
      titleEnd: '',
      subtitle: 'We review your details, compare available offers from our direct provider partners, and support you personally with switching. You decide whether to accept an offer.',
      commissionDisclosure: 'The initial consultation is free. We may receive a commission from a provider if a contract is arranged. We compare our partners’ offers, not necessarily the entire market.',
      btnCalc: 'Get an estimate',
      btnBook: 'Book Consultation',
      btnWhatsApp: 'WhatsApp Chat',
      stat1Number: '',
      stat1Label: '',
      stat2Number: '',
      stat2Label: '',
      stat3Number: '',
      stat3Label: '',
    },
    calculator: {
      title: 'Illustrative tariff estimate',
      subtitle: 'Find out your potential savings in seconds with zero complex data entry.',
      tabStrom: '⚡ Electricity',
      tabGas: '🔥 Gas',
      tabInternet: '🌐 Internet',
      tabKfz: '🚗 Car Insurance',
      stromPersons: 'Household Size (Persons)',
      stromOrKwh: 'Estimated Annual Consumption (kWh)',
      currentMonthlyRate: 'Current Monthly Payment (€)',
      gasArea: 'Living Space (approx. m²)',
      gasConsumption: 'Estimated Gas Usage (kWh)',
      internetSpeed: 'Current Bandwidth (Mbit/s)',
      internetType: 'Preferred Technology',
      kfzClass: 'No-Claims Class (SF)',
      kfzCoverage: 'Desired Coverage',
      calcButton: 'Calculate Savings',
      resultTitle: 'Estimated Savings Potential',
      liveCalculation: 'Live Calculation',
      estimatedSavings: 'Possible Savings:',
      perYear: 'per year',
      guaranteedQuality: 'Terms are compared individually; no guarantee.',
      previousAnnualCosts: 'Previous Annual Cost:',
      optimizedAnnualCosts: 'Optimized Annual Cost:',
      potentialLabel: 'Example based on stored prices, not a live quote. Verify actual terms with the provider.',
      takeToBooking: 'Request a consultation',
      shareWhatsAppBtn: 'Verify result via WhatsApp',
    },
    services: {
      sectionSub: 'Transparent Optimization',
      sectionTitle: 'Our Tariff & Advisory Sectors',
      sectionDesc: 'We compare available offers from our provider partners, review relevant terms, and can support you with switching.',
      detailsBtn: 'Tariff Details & Requirements',
      bookBtn: 'Request Advice',
      modalDocsTitle: 'What we need to review your contract:',
      modalProvidersTitle: 'Frequently compared providers & plans:',
      closeBtn: 'Close',
    },
    process: {
      sectionSub: 'Simple & Secure',
      sectionTitle: 'The Daryos Switching Process in 4 Steps',
      sectionDesc: 'You decide whether to accept an offer. Switching takes place only with your consent and as agreed.',
      step1Title: '01. Get in touch',
      step1Desc: 'Tell us by WhatsApp or phone which contract you would like us to review.',
      step2Title: '02. Review partner offers',
      step2Desc: 'We check suitable available offers from our provider partners and explain their terms.',
      step3Title: '03. Decide together',
      step3Desc: 'Review the terms and decide for yourself whether you want to enter into a contract.',
      step4Title: '04. Support with switching',
      step4Desc: 'If you choose an offer, we support you with the agreed steps of the provider switch.',
    },
    audit: {
      title: 'Request a personal bill review',
      subtitle: 'Upload your latest utility bill or snap a photo of your meter for a free preliminary evaluation.',
      dragText: 'Select a bill for a later review (stays on this device)',
      orClick: 'or choose file from device (PDF, JPG, PNG)',
      privacyNote: 'Your documents are processed strictly in accordance with GDPR solely for individual rate consultation.',
      analyzingText: 'Digitally analyzing document...',
      analysisSuccess: 'Document successfully registered!',
      detectedProvider: 'Detected Contract / Potential',
      detectedConsumption: 'Analyzed Consumption',
      potentialSaving: 'Estimated savings: approx. €240 – €520 / year',
      sendViaWhatsApp: 'Send directly via WhatsApp for review',
      sendViaEmail: 'Email to Daryos',
    },
    booking: {
      sectionSub: 'In-Person & Digital',
      sectionTitle: 'Request a Consultation',
      sectionDesc: 'Choose your desired date and format: at our office in Leipzig, over the phone, or via WhatsApp.',
      step1: '1. Format',
      step2: '2. Subject',
      step3: '3. Date & Time',
      step4: '4. Contact Details',
      typeInPerson: 'At Office (Leipzig)',
      typePhone: 'Phone Callback',
      typeVideo: 'Video Consultation',
      typeWhatsApp: 'Chat via WhatsApp',
      selectService: 'Desired Area:',
      allServices: 'Comprehensive Check (Electricity, Gas, Internet & Car)',
      dateLabel: 'Desired Date:',
      timeLabel: 'Time Slot:',
      nameLabel: 'Full Name:',
      phoneLabel: 'Phone / WhatsApp Number:',
      emailLabel: 'Email Address:',
      notesLabel: 'Current provider or notes (optional):',
      submitBtn: 'Submit Appointment Request',
      confirmationTitle: 'Appointment Request Received!',
      confirmationDesc: 'We have received your request and will contact you promptly to confirm.',
      exportCalendar: 'Save in Calendar (.ics)',
      openWhatsAppAction: 'Confirm via WhatsApp',
      newBooking: 'Submit another request',
    },
    reviews: {
      sectionSub: 'Customer Stories',
      sectionTitle: 'Customer feedback',
      filterAll: 'All Reviews',
      savedText: 'Savings achieved:',
      emptyMessage: 'We are not displaying customer reviews here at this time. We publish genuine feedback only with the individuals’ consent.',
    },
    faq: {
      sectionSub: 'Got Questions?',
      sectionTitle: 'Frequently Asked Questions (FAQ)',
    },
    contact: {
      title: 'Contact & Location',
      hoursTitle: 'Opening & Consultation Hours',
      directionsBtn: 'Open in Google Maps',
      callNow: 'Call Now',
      chatWhatsApp: 'Chat on WhatsApp',
      sendEmail: 'Send Email',
      addressLabel: 'Office Address:',
      weekdays: 'Monday – Friday: 09:00 – 18:00',
      saturday: 'Saturday: 10:00 – 14:00',
      sunday: 'Sunday & Holidays:',
      closed: 'Closed',
    },
    footer: {
      tagline: 'Your trusted partner for fair energy rates, highspeed internet, and top automotive insurance in Leipzig.',
      rights: 'All rights reserved. Rotfuchsstraße 1, 04329 Leipzig.',
      privacy: 'Privacy Policy',
      impressum: 'Legal Notice',
    },
  },

  tr: {
    dir: 'ltr',
    topbar: {
      address: 'Rotfuchsstraße 1, 04329 Leipzig, Almanya',
      phone: '+49 176 43416174',
      email: 'daryos.kreis@gmail.com',
      openNow: 'Şu an açık',
      closedNow: 'Şu an kapalı',
      opensAt: 'Pzt 09:00 açılıyor',
    },
    nav: {
      services: 'Hizmetler',
      calculator: 'Tasarruf Hesaplayıcı',
      process: 'Nasıl Çalışır?',
      audit: 'Fatura İnceleme',
      about: 'Hakkımızda',
      reviews: 'Müşteri Yorumları',
      faq: 'SSS',
      contact: 'İletişim & Konum',
      bookAppointment: 'Randevu Talebi',
    },
    hero: {
      badge: 'Leipzig’den kişisel tarife danışmanlığı',
      titleStart: 'Daha az ödeyin. Daha iyi danışmanlık alın.',
      titleStrom: 'Gaz',
      titleGas: ', İnternet',
      titleInternet: 've',
      titleKfz: 'Araç Sigortası',
      titleEnd: '',
      subtitle: 'Bilgilerinizi inceliyor, doğrudan çalıştığımız sağlayıcıların mevcut tekliflerini karşılaştırıyor ve geçiş sürecinde size kişisel destek sunuyoruz. Bir teklifi kabul edip etmemeye siz karar verirsiniz.',
      commissionDisclosure: 'İlk danışmanlık ücretsizdir. Sözleşme aracılığıyla sonuçlanırsa sağlayıcıdan komisyon alabiliriz. Tüm piyasayı değil, iş ortaklarımızın tekliflerini karşılaştırıyoruz.',
      btnCalc: 'Tahmini hesapla',
      btnBook: 'Randevu Al',
      btnWhatsApp: 'WhatsApp Danışmanlık',
      stat1Number: '',
      stat1Label: '',
      stat2Number: '',
      stat2Label: '',
      stat3Number: '',
      stat3Label: '',
    },
    calculator: {
      title: 'Örnek tarife hesaplaması',
      subtitle: 'Saniyeler içinde ne kadar tasarruf edebileceğinizi görün.',
      tabStrom: '⚡ Elektrik',
      tabGas: '🔥 Gaz',
      tabInternet: '🌐 İnternet',
      tabKfz: '🚗 Araç Sigortası',
      stromPersons: 'Hane Kişi Sayısı',
      stromOrKwh: 'Tahmini Yıllık Tüketim (kWh)',
      currentMonthlyRate: 'Şu Anki Aylık Tutar (€)',
      gasArea: 'Ev Büyüklüğü (m²)',
      gasConsumption: 'Tahmini Yıllık Gaz Tüketimi (kWh)',
      internetSpeed: 'Şu Anki Hız (Mbit/s)',
      internetType: 'İstenen Altyapı',
      kfzClass: 'Hasarsızlık Kademesi (SF)',
      kfzCoverage: 'Kasko / Sigorta Türü',
      calcButton: 'Tasarrufu Hesapla',
      resultTitle: 'Tahmini Tasarruf Potansiyeli',
      liveCalculation: 'Canlı Hesaplama',
      estimatedSavings: 'Tasarruf:',
      perYear: '/ yıl',
      guaranteedQuality: 'Koşullar ayrı ayrı karşılaştırılır; garanti verilmez.',
      previousAnnualCosts: 'Şu anki yıllık maliyet:',
      optimizedAnnualCosts: 'İyileştirilmiş yıllık maliyet:',
      potentialLabel: 'Kayıtlı örnek fiyatlara dayanır, canlı teklif değildir. Gerçek koşulları sağlayıcıdan doğrulayın.',
      takeToBooking: 'Danışmanlık talep et',
      shareWhatsAppBtn: 'Sonucu WhatsApp üzerinden incelet',
    },
    services: {
      sectionSub: 'Şeffaf İyileştirme',
      sectionTitle: 'Tarife ve Danışmanlık Alanlarımız',
      sectionDesc: 'İş ortaklarımızın mevcut tekliflerini karşılaştırır, ilgili koşulları inceler ve isterseniz geçiş sürecinde destek oluruz.',
      detailsBtn: 'Detaylar & Belgeler',
      bookBtn: 'Danışmanlık İste',
      modalDocsTitle: 'Kontrol için gereken belgeler:',
      modalProvidersTitle: 'Sıkça karşılaştırılan sağlayıcılar:',
      closeBtn: 'Kapat',
    },
    process: {
      sectionSub: 'Kolay & Güvenli',
      sectionTitle: 'Daryos İle 4 Adımda Kolay Geçiş',
      sectionDesc: 'Bir teklifi kabul edip etmemeye siz karar verirsiniz. Geçiş yalnızca onayınız ve kararlaştırılan süreç doğrultusunda yapılır.',
      step1Title: '01. İletişime geçin',
      step1Desc: 'İncelenmesini istediğiniz sözleşmeyi WhatsApp veya telefonla bize bildirin.',
      step2Title: '02. İş ortağı tekliflerini inceleyin',
      step2Desc: 'İş ortaklarımızın uygun ve mevcut tekliflerini kontrol eder, koşulları açıklarız.',
      step3Title: '03. Birlikte karar verin',
      step3Desc: 'Koşulları değerlendirin ve sözleşme yapıp yapmayacağınıza kendiniz karar verin.',
      step4Title: '04. Geçiş desteği',
      step4Desc: 'Teklifi seçerseniz sağlayıcı değişikliğinin kararlaştırılan adımlarında size destek oluruz.',
    },
    audit: {
      title: 'Kişisel fatura incelemesi talep edin',
      subtitle: 'Faturanızın fotoğrafını yükleyin veya sayacınızı çekin, ücretsiz ilk değerlendirmeyi yapalım.',
      dragText: 'Daha sonra incelenmek üzere fatura seçin (cihazınızda kalır)',
      orClick: 'veya cihazınızdan dosya seçin (PDF, JPG, PNG)',
      privacyNote: 'Belgeleriniz KVKK/DSGVO kapsamında gizli tutulur.',
      analyzingText: 'Belge taranıyor...',
      analysisSuccess: 'Belge başarıyla yüklendi!',
      detectedProvider: 'Tespit Edilen Tarife / Durum',
      detectedConsumption: 'Tahmini Tüketim',
      potentialSaving: 'Tahmini Tasarruf: Yaklaşık 240 – 520 € / yıl',
      sendViaWhatsApp: 'İnceleme İçin WhatsApp’a Gönder',
      sendViaEmail: 'E-posta İle Gönder',
    },
    booking: {
      sectionSub: 'Yüz Yüze & Dijital',
      sectionTitle: 'Danışmanlık Randevusu Talep Edin',
      sectionDesc: 'Leipzig ofisimizde yüz yüze, telefonla veya WhatsApp üzerinden görüşme saati seçin.',
      step1: '1. Görüşme Şekli',
      step2: '2. Konu',
      step3: '3. Tarih & Saat',
      step4: '4. İletişim Bilgileri',
      typeInPerson: 'Ofiste Yüz Yüze (Leipzig)',
      typePhone: 'Telefonla Arama',
      typeVideo: 'Görüntülü Görüşme',
      typeWhatsApp: 'WhatsApp Danışmanlık',
      selectService: 'Konu:',
      allServices: 'Tüm Konular (Elektrik, Gaz, İnternet, Araç)',
      dateLabel: 'İstenen Tarih:',
      timeLabel: 'Saat:',
      nameLabel: 'Adınız Soyadınız:',
      phoneLabel: 'Telefon / WhatsApp:',
      emailLabel: 'E-posta Adresi:',
      notesLabel: 'Şu anki sağlayıcı veya notunuz (opsiyonel):',
      submitBtn: 'Randevu Talebini Gönder',
      confirmationTitle: 'Randevu Talebiniz Alındı!',
      confirmationDesc: 'Talebiniz kaydedildi. Onaylamak için en kısa sürede sizinle iletişime geçeceğiz.',
      exportCalendar: 'Takvime Kaydet (.ics)',
      openWhatsAppAction: 'WhatsApp İle Onayla',
      newBooking: 'Yeni Randevu Talebi',
    },
    reviews: {
      sectionSub: 'Müşteri Memnuniyeti',
      sectionTitle: 'Müşteri yorumları',
      filterAll: 'Tüm Yorumlar',
      savedText: 'Elde Edilen Tasarruf:',
      emptyMessage: 'Şu anda burada müşteri yorumu göstermiyoruz. Gerçek müşteri görüşlerini yalnızca ilgili kişilerin izniyle yayımlıyoruz.',
    },
    faq: {
      sectionSub: 'Aklınıza Takılanlar',
      sectionTitle: 'Sıkça Sorulan Sorular',
    },
    contact: {
      title: 'İletişim & Adres',
      hoursTitle: 'Çalışma ve Danışma Saatleri',
      directionsBtn: 'Google Haritalar’da Aç',
      callNow: 'Hemen Ara',
      chatWhatsApp: 'WhatsApp’tan Yaz',
      sendEmail: 'E-posta Gönder',
      addressLabel: 'Ofis Adresi:',
      weekdays: 'Pazartesi – Cuma: 09:00 – 18:00',
      saturday: 'Cumartesi: 10:00 – 14:00',
      sunday: 'Pazar ve Tatil Günleri:',
      closed: 'Kapalı',
    },
    footer: {
      tagline: 'Leipzig’de adil enerji tarifeleri, hızlı internet ve karlı araç sigortası için güvenilir danışmanınız.',
      rights: 'Tüm hakları saklıdır. Rotfuchsstraße 1, 04329 Leipzig.',
      privacy: 'Gizlilik',
      impressum: 'Künye',
    },
  },

  ku: {
    dir: 'ltr',
    topbar: {
      address: 'Rotfuchsstraße 1, 04329 Leipzig, Almanya',
      phone: '+49 176 43416174',
      email: 'daryos.kreis@gmail.com',
      openNow: 'Niha vekirî ye',
      closedNow: 'Niha girtî ye',
      opensAt: 'Duşemê saet 09:00 vedibe',
    },
    nav: {
      services: 'Xizmetguzarî',
      calculator: 'Hesabkerê Mesrefan',
      process: 'Çawa Dixebite?',
      audit: 'Kontrola Fatureyê',
      about: 'Derbarê Me',
      reviews: 'Nêrînên Xerîdaran',
      faq: 'Pirsên Berbelav',
      contact: 'Têkilî & Cih',
      bookAppointment: 'Daxwaza Randevûyê',
    },
    hero: {
      badge: 'Şêwirmendiya kesane ya tarîfan ji Leipzigê',
      titleStart: 'Kêmtir bidin. Şêwirmendiya çêtir bistînin.',
      titleStrom: 'Elektrîk',
      titleGas: ', Gaz',
      titleInternet: ', Înternet',
      titleKfz: 'û Sîgortaya Erebeyê',
      titleEnd: '',
      subtitle: 'Em agahiyên we dinirxînin, pêşniyarên heyî yên hevkarên xwe yên rasterast berhev dikin û di pêvajoya guherînê de alîkariya we dikin. Hûn biryarê didin ka pêşniyarekê qebûl bikin an na.',
      commissionDisclosure: 'Şêwirmendiya destpêkê bêpere ye. Ger peymanek were kirin, dibe ku em ji dabînkerê komîsyon bistînin. Em pêşniyarên hevkarên xwe berhev dikin, ne hemû bazarê.',
      btnCalc: 'Nirxê texmînkirî hesab bike',
      btnBook: 'Randevû Bistîne',
      btnWhatsApp: 'Şêwirmendiya WhatsAppê',
      stat1Number: '',
      stat1Label: '',
      stat2Number: '',
      stat2Label: '',
      stat3Number: '',
      stat3Label: '',
    },
    calculator: {
      title: 'Hesabkerê Lezgîn ê Mesrefan',
      subtitle: 'Di çend saniyan de hûn dikarin bibînin ka çiqas dikarin pere xilas bikin.',
      tabStrom: '⚡ Elektrîk',
      tabGas: '🔥 Gaz',
      tabInternet: '🌐 Înternet',
      tabKfz: '🚗 Sîgortaya Erebeyê',
      stromPersons: 'Hejmara Kesan di Malê de',
      stromOrKwh: 'Bikaranîna Salane (kWh)',
      currentMonthlyRate: 'Mehane ya niha (€)',
      gasArea: 'Mezinahiya Xaniyê (m²)',
      gasConsumption: 'Bikaranîna Gazê ya Salane (kWh)',
      internetSpeed: 'Leza Niha (Mbit/s)',
      internetType: 'Teknolojiya Xwestî',
      kfzClass: 'Dereceya Bêzererî (SF)',
      kfzCoverage: 'Cureya Sîgorteyê',
      calcButton: 'Hesab Bike',
      resultTitle: 'Tasarrufa Gengaz',
      liveCalculation: 'Hesabkirina Zindî',
      estimatedSavings: 'Tasarruf:',
      perYear: '/ sal',
      guaranteedQuality: 'Merc bi awayekî kesane tên berhevkirin; garantî tune.',
      previousAnnualCosts: 'Mesrefa salane ya niha:',
      optimizedAnnualCosts: 'Mesrefa salane ya çêtirkirî:',
      potentialLabel: 'Li ser bingeha bihayên nimûneyî yên tomarkirî ye, ne pêşniyara zindî. Mercên rastîn ji dabînker bipirsin.',
      takeToBooking: 'Şêwirmendiyê bixwazin',
      shareWhatsAppBtn: 'Encamê bi rêya WhatsAppê kontrol bike',
    },
    services: {
      sectionSub: 'Optimîzasyona Zelal',
      sectionTitle: 'Qadên Xizmet û Şêwirmendiyê',
      sectionDesc: 'Em pêşniyarên heyî yên hevkarên xwe berhev dikin û, heke hûn bixwazin, di guherînê de alîkariya we dikin.',
      detailsBtn: 'Agahiyên Zêdetir',
      bookBtn: 'Şêwirmendiyê Bixwaze',
      modalDocsTitle: 'Tiştên ji bo kontrolê hewce ne:',
      modalProvidersTitle: 'Şîrketên gelemperî:',
      closeBtn: 'Bigire',
    },
    process: {
      sectionSub: 'Hêsan & Pêbawer',
      sectionTitle: 'Derbasbûna bi 4 Gavan li gel Daryos',
      sectionDesc: 'Hûn biryarê didin ka pêşniyarekê qebûl bikin an na. Guherîn tenê bi razîbûna we û li gorî pêvajoya lihevkirî tê kirin.',
      step1Title: '01. Têkilî daynin',
      step1Desc: 'Bi WhatsApp an telefonê bibêjin ka hûn dixwazin kîjan peyman were kontrolkirin.',
      step2Title: '02. Pêşniyarên hevkaran binirxînin',
      step2Desc: 'Em pêşniyarên guncaw û heyî yên hevkarên xwe kontrol dikin û mercan rave dikin.',
      step3Title: '03. Biryarê bi hev re bidin',
      step3Desc: 'Mercan binirxînin û biryar bidin ka hûn dixwazin peymanekê çêkin an na.',
      step4Title: '04. Alîkariya guherînê',
      step4Desc: 'Heke hûn pêşniyarekê hilbijêrin, em di gavên lihevkirî yên guherîna dabînkerê de alîkariya we dikin.',
    },
    audit: {
      title: 'Daxwaza kontrolkirina kesane ya fatureyê',
      subtitle: 'Wêneya fatureya xwe an saeta xwe bar bikin, em binirxînin.',
      dragText: 'Ji bo kontrolkirina paşê fatûreyê hilbijêrin (li ser amûra we dimîne)',
      orClick: 'an ji telefon/kompîturê hilbijêrin (PDF, JPG, PNG)',
      privacyNote: 'Belgeyên we li gorî qanûna parastina daneyan nehênî dimînin.',
      analyzingText: 'Belge tê kontrolkirin...',
      analysisSuccess: 'Belge bi serkeftî hat wergirtin!',
      detectedProvider: 'Peymana Tesbîtkirî',
      detectedConsumption: 'Mesrefa texmînî',
      potentialSaving: 'Tasarrufa texmînî: nêzîkî 240 – 520 € / sal',
      sendViaWhatsApp: 'Bi WhatsAppê bişîne',
      sendViaEmail: 'Bi E-Mailê bişîne',
    },
    booking: {
      sectionSub: 'Rû bi Rû & Dijîtal',
      sectionTitle: 'Daxwaza Randevûya Şêwirmendiyê',
      sectionDesc: 'Li Leipzig di buroya me de, bi telefonê an WhatsAppê demeke guncaw hilbijêrin.',
      step1: '1. Awayê Hevdîtinê',
      step2: '2. Mijar',
      step3: '3. Dîrok & Saet',
      step4: '4. Agahiyên Têkiliyê',
      typeInPerson: 'Li Buroyê (Leipzig)',
      typePhone: 'Bi Telefonê',
      typeVideo: 'Vîdyo-Hevdîtin',
      typeWhatsApp: 'Bi rêya WhatsAppê',
      selectService: 'Mijar:',
      allServices: 'Hemû Mijar (Elektrîk, Gaz, Înternet, Erebe)',
      dateLabel: 'Dîroka Xwestî:',
      timeLabel: 'Saet:',
      nameLabel: 'Nav û Paşnav:',
      phoneLabel: 'Telefon / WhatsApp:',
      emailLabel: 'E-Mail:',
      notesLabel: 'Şîrketa niha an têbînî (vebijarkî):',
      submitBtn: 'Daxwaza Randevûyê Bişîne',
      confirmationTitle: 'Daxwaza Randevûyê Hat Qebûlkirin!',
      confirmationDesc: 'Daxwaza we hat tomarkirin. Em ê di demek kurt de bersiv bidin.',
      exportCalendar: 'Li Salnameyê Tomar Bike (.ics)',
      openWhatsAppAction: 'Bi WhatsAppê Piştrast Bike',
      newBooking: 'Daxwazeke Nû Bike',
    },
    reviews: {
      sectionSub: 'Nêrînên Xerîdaran',
      sectionTitle: 'Nêrînên xerîdaran',
      filterAll: 'Hemû Nêrîn',
      savedText: 'Tasarrufa bidestxistî:',
      emptyMessage: 'Niha em li vir şîroveyên xerîdaran nîşan nadin. Em nêrînên rastîn tenê bi destûra kesên têkildar diweşînin.',
    },
    faq: {
      sectionSub: 'Pirs û Bersiv',
      sectionTitle: 'Pirsên Herî Zêde Tên Pirsîn',
    },
    contact: {
      title: 'Têkilî & Cih',
      hoursTitle: 'Demên Kar û Şêwirmendiyê',
      directionsBtn: 'Di Google Maps de Veke',
      callNow: 'Niha Telefon Bike',
      chatWhatsApp: 'Bi WhatsAppê Binivîse',
      sendEmail: 'E-Mail Bişîne',
      addressLabel: 'Navnîşana Buroyê:',
      weekdays: 'Duşem – În: 09:00 – 18:00',
      saturday: 'Şemî: 10:00 – 14:00',
      sunday: 'Yekşem & Betlaneyên Fermî:',
      closed: 'Girtî ye',
    },
    footer: {
      tagline: 'Hevkarê we yê pêbawer ji bo tarîfên elektrîk, gaz, înternet û sîgortayê li Leipzig.',
      rights: 'Hemû maf parastî ne. Rotfuchsstraße 1, 04329 Leipzig.',
      privacy: 'Parastina Daneyan',
      impressum: 'Agahiyên Yasayî',
    },
  },

  ar: {
    dir: 'rtl',
    topbar: {
      address: 'Rotfuchsstraße 1, 04329 Leipzig, ألمانيا',
      phone: '+49 176 43416174',
      email: 'daryos.kreis@gmail.com',
      openNow: 'مفتوح الآن',
      closedNow: 'مغلق حالياً',
      opensAt: 'يفتح الاثنين 09:00',
    },
    nav: {
      services: 'الخدمات',
      calculator: 'حاسبة التوفير',
      process: 'كيف نعمل؟',
      audit: 'فحص الفاتورة',
      about: 'من نحن',
      reviews: 'آراء العملاء',
      faq: 'الأسئلة الشائعة',
      contact: 'الاتصال والموقع',
      bookAppointment: 'طلب موعد',
    },
    hero: {
      badge: 'استشارات شخصية للتعرفة من لايبزيغ',
      titleStart: 'ادفع أقل. واحصل على استشارة أفضل.',
      titleStrom: 'الكهرباء',
      titleGas: '، الغاز',
      titleInternet: '، الإنترنت',
      titleKfz: 'وتأمين السيارات',
      titleEnd: '',
      subtitle: 'نراجع بياناتك ونقارن العروض المتاحة من شركائنا المباشرين من مزودي الخدمة، ونقدم لك دعماً شخصياً عند التبديل. القرار لك في قبول أي عرض.',
      commissionDisclosure: 'الاستشارة الأولية مجانية. قد نتلقى عمولة من المزود عند إبرام عقد عن طريقنا. نقارن عروض شركائنا، وليس بالضرورة جميع عروض السوق.',
      btnCalc: 'احصل على تقدير',
      btnBook: 'احجز موعداً',
      btnWhatsApp: 'استشارة عبر واتساب',
      stat1Number: '',
      stat1Label: '',
      stat2Number: '',
      stat2Label: '',
      stat3Number: '',
      stat3Label: '',
    },
    calculator: {
      title: 'حساب توضيحي للتعرفة',
      subtitle: 'اكتشف في ثوانٍ كم يمكنك توفيره من تكاليفك السنوية.',
      tabStrom: '⚡ الكهرباء',
      tabGas: '🔥 الغاز',
      tabInternet: '🌐 الإنترنت',
      tabKfz: '🚗 تأمين السيارات',
      stromPersons: 'عدد أفراد المنزل',
      stromOrKwh: 'الاستهلاك السنوي التقريبي (kWh)',
      currentMonthlyRate: 'القسط الشهري الحالي (€)',
      gasArea: 'مساحة المنزل (تقريباً م²)',
      gasConsumption: 'استهلاك الغاز السنوي (kWh)',
      internetSpeed: 'السرعة الحالية (Mbit/s)',
      internetType: 'التقنية المطلوبة (ألياف / دي اس ال)',
      kfzClass: 'فئة خلو الحوادث (SF)',
      kfzCoverage: 'نوع التأمين (شامل / جزئي / إلزامي)',
      calcButton: 'احسب التوفير الآن',
      resultTitle: 'التوفير التقديري المتوقع',
      liveCalculation: 'حساب فوري مباشر',
      estimatedSavings: 'التوفير الممكن:',
      perYear: '/ سنوياً',
      guaranteedQuality: 'تتم مقارنة الشروط بشكل فردي؛ لا يوجد ضمان.',
      previousAnnualCosts: 'التكلفة السنوية السابقة:',
      optimizedAnnualCosts: 'التكلفة السنوية بعد التحسين:',
      potentialLabel: 'حساب توضيحي بالأسعار المخزنة وليس عرضاً مباشراً. تحقق من الشروط الفعلية لدى المزود.',
      takeToBooking: 'اطلب استشارة',
      shareWhatsAppBtn: 'فحص النتيجة عبر واتساب',
    },
    services: {
      sectionSub: 'تحسين شفاف وموثوق',
      sectionTitle: 'مجالات الاستشارة ومقارنة العقود',
      sectionDesc: 'نقارن العروض المتاحة من شركائنا من مزودي الخدمة ونراجع الشروط ذات الصلة، ويمكننا دعمك في التبديل.',
      detailsBtn: 'تفاصيل التعرفة والأوراق المطلوبة',
      bookBtn: 'طلب استشارة',
      modalDocsTitle: 'المستندات المطلوبة للفحص:',
      modalProvidersTitle: 'أبرز الشركات التي نقارن بينها:',
      closeBtn: 'إغلاق',
    },
    process: {
      sectionSub: 'بسيط وآمن 100%',
      sectionTitle: 'خطوات الانتقال مع داريوس في 4 خطوات',
      sectionDesc: 'أنت تقرر قبول العرض من عدمه. لا يتم التبديل إلا بموافقتك ووفقاً للإجراءات المتفق عليها.',
      step1Title: '01. تواصل معنا',
      step1Desc: 'أخبرنا عبر واتساب أو الهاتف بالعقد الذي ترغب في مراجعته.',
      step2Title: '02. مراجعة عروض الشركاء',
      step2Desc: 'نتحقق من العروض المناسبة والمتاحة لدى شركائنا ونوضح شروطها.',
      step3Title: '03. القرار لك',
      step3Desc: 'راجع الشروط وقرر بنفسك ما إذا كنت ترغب في إبرام عقد.',
      step4Title: '04. دعم التبديل',
      step4Desc: 'إذا اخترت عرضاً، ندعمك في الخطوات المتفق عليها لتبديل المزود.',
    },
    audit: {
      title: 'طلب مراجعة شخصية للفاتورة',
      subtitle: 'ارفع صورة فاتورتك أو عداد الكهرباء للحصول على تقييم مجاني فوري.',
      dragText: 'اختر فاتورة للمراجعة لاحقاً (تبقى على جهازك)',
      orClick: 'أو اختر ملفاً من جهازك (PDF, JPG, PNG)',
      privacyNote: 'مستنداتك محمية تماماً وفق معايير الخصوصية الأوروبية وتستخدم فقط لغرض الاستشارة.',
      analyzingText: 'جاري فحص المستند رقمياً...',
      analysisSuccess: 'تم فحص المستند بنجاح!',
      detectedProvider: 'العقد المكتشف / إمكانية التوفير',
      detectedConsumption: 'الاستهلاك المقدر',
      potentialSaving: 'التوفير المقدر: حوالي 240 – 520 € / سنوياً',
      sendViaWhatsApp: 'إرسال مباشر عبر واتساب للتدقيق',
      sendViaEmail: 'إرسال عبر البريد الإلكتروني',
    },
    booking: {
      sectionSub: 'حضورياً أو عن بُعد',
      sectionTitle: 'طلب موعد استشارة',
      sectionDesc: 'اختر الموعد المناسب لك: في مكتبنا في لايبزيغ، أو عبر الهاتف، أو محادثة واتساب.',
      step1: '1. نوع الاستشارة',
      step2: '2. الخدمة المطلوبة',
      step3: '3. التاريخ والوقت',
      step4: '4. معلومات الاتصال',
      typeInPerson: 'في المكتب (لايبزيغ)',
      typePhone: 'مكالمة هاتفية',
      typeVideo: 'مكالمة فيديو',
      typeWhatsApp: 'استشارة عبر واتساب',
      selectService: 'المجال المطلوب:',
      allServices: 'فحص شامل (كهرباء، غاز، إنترنت، سيارات)',
      dateLabel: 'التاريخ المطلوب:',
      timeLabel: 'الوقت:',
      nameLabel: 'الاسم الكامل:',
      phoneLabel: 'رقم الهاتف / واتساب:',
      emailLabel: 'البريد الإلكتروني:',
      notesLabel: 'الشركة الحالية أو أي ملاحظات (اختياري):',
      submitBtn: 'إرسال طلب الموعد',
      confirmationTitle: 'تم استلام طلب الموعد بنجاح!',
      confirmationDesc: 'لقد سجلنا طلبك وسنتواصل معك قريباً لتأكيد الموعد.',
      exportCalendar: 'حفظ الموعد في التقويم (.ics)',
      openWhatsAppAction: 'تأكيد الموعد عبر واتساب',
      newBooking: 'تقديم طلب آخر',
    },
    reviews: {
      sectionSub: 'تجارب عملائنا',
      sectionTitle: 'آراء العملاء',
      filterAll: 'جميع التقييمات',
      savedText: 'المبلغ الموفر:',
      emptyMessage: 'لا نعرض حالياً تقييمات للعملاء هنا. لا ننشر آراء العملاء الحقيقية إلا بموافقة أصحابها.',
    },
    faq: {
      sectionSub: 'إجابات على استفساراتك',
      sectionTitle: 'الأسئلة الشائعة (FAQ)',
    },
    contact: {
      title: 'الاتصال والموقع',
      hoursTitle: 'أوقات العمل والاستشارة',
      directionsBtn: 'فتح في خرائط جوجل',
      callNow: 'اتصل الآن',
      chatWhatsApp: 'تواصل عبر واتساب',
      sendEmail: 'إرسال بريد إلكتروني',
      addressLabel: 'عنوان المكتب:',
      weekdays: 'الاثنين – الجمعة: 09:00 – 18:00',
      saturday: 'السبت: 10:00 – 14:00',
      sunday: 'الأحد والعطلات الرسمية:',
      closed: 'مغلق',
    },
    footer: {
      tagline: 'شريكك الموثوق لأسعار الطاقة العادلة والإنترنت فائق السرعة وتأمين السيارات الأفضل في لايبزيغ.',
      rights: 'جميع الحقوق محفوظة. Rotfuchsstraße 1, 04329 Leipzig.',
      privacy: 'سياسة الخصوصية',
      impressum: 'بيانات النشر القانونية',
    },
  },
};
