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
      badge: 'Unabhängige Beratung & Wechselservice in Leipzig & bundesweit',
      titleStart: 'Tarife für',
      titleStrom: 'Strom',
      titleGas: 'Gas',
      titleInternet: 'Internet',
      titleKfz: 'Autoversicherung',
      titleEnd: 'im optimalen Vergleich.',
      subtitle: 'Wir prüfen Ihre Angaben und vergleichen passende Optionen für Strom, Gas, Internet und Autoversicherung. Sie erhalten eine verständliche Einordnung der Kosten und Vertragsbedingungen. Die Beratung ist für Privatkunden kostenlos; eine bestimmte Ersparnis können wir nicht versprechen.',
      btnCalc: 'Ersparnis berechnen',
      btnBook: 'Termin vereinbaren',
      btnWhatsApp: 'WhatsApp Beratung',
      stat1Number: 'Individuell',
      stat1Label: 'Ersparnis wird anhand Ihrer Daten geprüft',
      stat2Number: '100%',
      stat2Label: 'Kostenlose Beratung für Verbraucher',
      stat3Number: 'Mehrere',
      stat3Label: 'Anbieter und Vertragsoptionen',
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
      guaranteedQuality: 'Gleichwertige oder bessere Leistungen garantiert',
      previousAnnualCosts: 'Bisherige Jahreskosten:',
      optimizedAnnualCosts: 'Optimierte Jahreskosten:',
      potentialLabel: 'Basiert auf marktüblichen Besttarifen mit Preisgarantie und Neukundenvorteilen.',
      takeToBooking: 'Dieses Sparpotenzial jetzt sichern',
      shareWhatsAppBtn: 'Ergebnis per WhatsApp prüfen lassen',
    },
    services: {
      sectionSub: 'Transparente Optimierung',
      sectionTitle: 'Unsere Tarif- und Beratungsbereiche',
      sectionDesc: 'Wir vergleichen unabhängig regionale und überregionale Anbieter, prüfen Kündigungsfristen und verhandeln Konditionen für Sie.',
      detailsBtn: 'Tarif-Details & Unterlagen',
      bookBtn: 'Beratung anfragen',
      modalDocsTitle: 'Was wir für die Prüfung benötigen:',
      modalProvidersTitle: 'Häufig geprüfte Anbieter & Tarife:',
      closeBtn: 'Schließen',
    },
    process: {
      sectionSub: 'Einfach & Sicher',
      sectionTitle: 'Der Daryos Wechselservice in 4 Schritten',
      sectionDesc: 'Kein Papierkram, kein Risiko: Wir übernehmen alle administrativen Schritte für Sie.',
      step1Title: '01. Kostenlose Analyse',
      step1Desc: 'Sie nennen uns die wichtigsten Vertragsdaten im Gespräch. Bitte senden Sie sensible Unterlagen erst nach Abstimmung über einen geeigneten Übermittlungsweg.',
      step2Title: '02. Unabhängiger Tarifvergleich',
      step2Desc: 'Wir vergleichen verfügbare Angebote und erläutern Preis, Laufzeit, Bonusbedingungen und wichtige Einschränkungen.',
      step3Title: '03. Lückenloser Wechsel',
      step3Desc: 'Wenn Sie sich für einen Wechsel entscheiden, unterstützen wir Sie bei den nächsten Schritten. Kündigung und Anmeldung erfolgen nach Prüfung der Fristen und mit Ihrer Zustimmung.',
      step4Title: '04. Fristen- & Tarifwächter',
      step4Desc: 'Auf Wunsch besprechen wir rechtzeitig vor Vertragsende, ob ein erneuter Vergleich sinnvoll ist.',
    },
    audit: {
      title: 'Digitaler Rechnungs- & Vertrags-Check',
      subtitle: 'Wählen Sie eine Datei nur aus, wenn Sie sie anschließend selbst über WhatsApp oder E-Mail teilen möchten. Die Website analysiert die Datei nicht automatisch.',
      dragText: 'Rechnung oder Vertrag hier ablegen',
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
      submitBtn: 'Anfrage vorbereiten',
      confirmationTitle: 'Anfrage vorbereitet – noch nicht gesendet',
      confirmationDesc: 'Ihre Angaben wurden nur für diese Ansicht zusammengestellt. Bitte wählen Sie anschließend WhatsApp und senden Sie die Nachricht selbst, damit wir Ihre Anfrage erhalten.',
      exportCalendar: 'Termin im Kalender speichern (.ics)',
      openWhatsAppAction: 'Termin per WhatsApp bestätigen',
      newBooking: 'Weitere Anfrage stellen',
    },
    reviews: {
      sectionSub: 'Erfahrungsberichte',
      sectionTitle: 'Was unsere Kunden in Leipzig und Umgebung sagen',
      filterAll: 'Alle Bewertungen',
      savedText: 'Erzielte Ersparnis:',
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
      tagline: 'Ihr vertrauensvoller Partner für faire Energietarife, Highspeed-Internet und optimale Autoversicherungen in Leipzig.',
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
      badge: 'Independent Consulting & Switching Service in Leipzig & Nationwide',
      titleStart: 'Optimal comparison for',
      titleStrom: 'Electricity',
      titleGas: 'Gas',
      titleInternet: 'Internet',
      titleKfz: 'Car Insurance',
      titleEnd: 'tariffs.',
      subtitle: 'We review your details and compare suitable options for electricity, gas, internet and car insurance. You receive a clear explanation of costs and contract terms. Advice is free for private customers; specific savings cannot be promised.',
      btnCalc: 'Calculate Savings',
      btnBook: 'Book Consultation',
      btnWhatsApp: 'WhatsApp Chat',
      stat1Number: 'Personalized',
      stat1Label: 'Savings assessed from your details',
      stat2Number: '100%',
      stat2Label: 'Free consultation for consumers',
      stat3Number: 'Multiple',
      stat3Label: 'Providers and contract options',
    },
    calculator: {
      title: 'Interactive Quick Savings Calculator',
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
      guaranteedQuality: 'Equivalent or superior service guaranteed',
      previousAnnualCosts: 'Previous Annual Cost:',
      optimizedAnnualCosts: 'Optimized Annual Cost:',
      potentialLabel: 'Based on prevailing top market rates with price guarantees and bonuses.',
      takeToBooking: 'Lock in this saving now',
      shareWhatsAppBtn: 'Verify result via WhatsApp',
    },
    services: {
      sectionSub: 'Transparent Optimization',
      sectionTitle: 'Our Tariff & Advisory Sectors',
      sectionDesc: 'We independently compare regional and national providers, verify cancellation deadlines, and negotiate rates on your behalf.',
      detailsBtn: 'Tariff Details & Requirements',
      bookBtn: 'Request Advice',
      modalDocsTitle: 'What we need to review your contract:',
      modalProvidersTitle: 'Frequently compared providers & plans:',
      closeBtn: 'Close',
    },
    process: {
      sectionSub: 'Simple & Secure',
      sectionTitle: 'The Daryos Switching Process in 4 Steps',
      sectionDesc: 'Zero paperwork, zero risk: We handle all administrative procedures for you.',
      step1Title: '01. Free Analysis',
      step1Desc: 'Submit your recent statement or contract details via photo, upload, or in person.',
      step2Title: '02. Independent Comparison',
      step2Desc: 'We filter through over 1,000 verified offers to pick the best terms and price guarantee.',
      step3Title: '03. Seamless Transition',
      step3Desc: 'We cancel your old contract on time and register you with the new provider without interruption.',
      step4Title: '04. Deadline Guardian',
      step4Desc: 'Before your contract term expires, we automatically re-evaluate so you always stay on top rates.',
    },
    audit: {
      title: 'Digital Bill & Contract Audit',
      subtitle: 'Select a file only if you want to share it yourself via WhatsApp or email afterward. This website does not analyse files automatically.',
      dragText: 'Drop your bill or contract here',
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
      submitBtn: 'Prepare appointment request',
      confirmationTitle: 'Request prepared – not yet sent',
      confirmationDesc: 'Your details have only been assembled on this page. Continue to WhatsApp and send the message yourself so we receive your request.',
      exportCalendar: 'Save in Calendar (.ics)',
      openWhatsAppAction: 'Confirm via WhatsApp',
      newBooking: 'Submit another request',
    },
    reviews: {
      sectionSub: 'Customer Stories',
      sectionTitle: 'What our clients in Leipzig and Germany say',
      filterAll: 'All Reviews',
      savedText: 'Savings achieved:',
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
      badge: 'Leipzig ve Tüm Almanya İçin Bağımsız Tarife Danışmanlığı',
      titleStart: 'Elektrik,',
      titleStrom: 'Gaz',
      titleGas: ', İnternet',
      titleInternet: 've',
      titleKfz: 'Araç Sigortası',
      titleEnd: 'fiyatlarında en iyi karşılaştırma.',
      subtitle: 'Bilgilerinizi değerlendirip elektrik, gaz, internet ve araç sigortası için uygun seçenekleri karşılaştırıyoruz. Fiyatı ve sözleşme koşullarını açıklarız. Bireysel müşteriler için danışmanlık ücretsizdir; belirli bir tasarruf garanti edilemez.',
      btnCalc: 'Tasarrufumu Hesapla',
      btnBook: 'Randevu Al',
      btnWhatsApp: 'WhatsApp Danışmanlık',
      stat1Number: 'Kişiye özel',
      stat1Label: 'Tasarruf, bilgileriniz incelendikten sonra değerlendirilir',
      stat2Number: '%100',
      stat2Label: 'Tüketicilere ücretsiz danışmanlık',
      stat3Number: 'Mehrere',
      stat3Label: 'İncelenen tarife ve sağlayıcı',
    },
    calculator: {
      title: 'Hızlı Tasarruf Hesaplama Aracı',
      subtitle: 'Girdiğiniz bilgilere göre olası maliyet farkını yaklaşık olarak hesaplayın.',
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
      guaranteedQuality: 'Aynı veya daha iyi hizmet garantisi',
      previousAnnualCosts: 'Şu anki yıllık maliyet:',
      optimizedAnnualCosts: 'İyileştirilmiş yıllık maliyet:',
      potentialLabel: 'Fiyat garantili ve hoş geldin bonuslu en iyi tarifeler baz alınmıştır.',
      takeToBooking: 'Bu tasarruf için randevu talep et',
      shareWhatsAppBtn: 'Sonucu WhatsApp üzerinden incelet',
    },
    services: {
      sectionSub: 'Şeffaf İyileştirme',
      sectionTitle: 'Tarife ve Danışmanlık Alanlarımız',
      sectionDesc: 'Bölgesel ve ulusal sağlayıcıları tarafsızca karşılaştırır, fesih sürelerini kontrol eder ve sizin adınıza en iyi şartları sağlarız.',
      detailsBtn: 'Detaylar & Belgeler',
      bookBtn: 'Danışmanlık İste',
      modalDocsTitle: 'Kontrol için gereken belgeler:',
      modalProvidersTitle: 'Sıkça karşılaştırılan sağlayıcılar:',
      closeBtn: 'Kapat',
    },
    process: {
      sectionSub: 'Kolay & Güvenli',
      sectionTitle: 'Daryos İle 4 Adımda Kolay Geçiş',
      sectionDesc: 'Evrak işi yok, kesinti riski yok: Tüm işlemleri sizin adınıza biz yürütüyoruz.',
      step1Title: '01. Ücretsiz Analiz',
      step1Desc: 'Son faturanızı veya sözleşme bilgilerinizi bize WhatsApp veya yükleme yoluyla iletin.',
      step2Title: '02. Bağımsız Karşılaştırma',
      step2Desc: '1.000’den fazla teklif arasından fiyat garantili en uygun olanları seçiyoruz.',
      step3Title: '03. Kesintisiz Geçiş',
      step3Desc: 'Eski sözleşmenizi iptal edip yenisine kaydınızı yapıyoruz. Elektrik veya gazınız asla kesilmez!',
      step4Title: '04. Sürekli Tarife Takibi',
      step4Desc: 'Sözleşme süreniz dolmadan önce tekrar kontrol ederek her zaman en ucuz fiyatta kalmanızı sağlıyoruz.',
    },
    audit: {
      title: 'Dijital Fatura ve Sözleşme Kontrolü',
      subtitle: 'Dosyayı yalnızca daha sonra WhatsApp veya e-posta üzerinden kendiniz paylaşmak istiyorsanız seçin. Bu web sitesi dosyayı otomatik olarak analiz etmez.',
      dragText: 'Faturanızı buraya sürükleyin',
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
      submitBtn: 'Randevu talebini hazırla',
      confirmationTitle: 'Talep hazırlandı – henüz gönderilmedi',
      confirmationDesc: "Bilgileriniz yalnızca bu sayfada hazırlandı. Talebinizin bize ulaşması için WhatsApp’ı açıp mesajı kendiniz göndermeniz gerekir.",
      exportCalendar: 'Takvime Kaydet (.ics)',
      openWhatsAppAction: 'WhatsApp İle Onayla',
      newBooking: 'Yeni Randevu Talebi',
    },
    reviews: {
      sectionSub: 'Müşteri Memnuniyeti',
      sectionTitle: 'Leipzig ve Çevresindeki Müşterilerimizin Yorumları',
      filterAll: 'Tüm Yorumlar',
      savedText: 'Elde Edilen Tasarruf:',
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
      badge: 'Şêwirmendiya Serbixwe li Leipzig û seranserê Almanyayê',
      titleStart: 'Buhayên',
      titleStrom: 'Elektrîk',
      titleGas: ', Gaz',
      titleInternet: ', Înternet',
      titleKfz: 'û Sîgortaya Erebeyê',
      titleEnd: 'bi berhevokeke çêtirîn.',
      subtitle: 'Em agahiyên we dinirxînin û vebijêrkên guncaw ji bo elektrîkê, gazê, înternetê û sîgorteya erebeyê berawird dikin. Ji bo xerîdarên kesane şêwirmendî belaş e; teserûfa taybet nayê garantîkirin.',
      btnCalc: 'Tasarrufê Hesab Bike',
      btnBook: 'Randevû Bistîne',
      btnWhatsApp: 'Şêwirmendiya WhatsAppê',
      stat1Number: 'Kesane',
      stat1Label: 'Teserûf piştî nirxandina agahiyan tê texmînkirin',
      stat2Number: '100%',
      stat2Label: 'Şêwirmendiya bêpere ji bo kesan',
      stat3Number: 'Mehrere',
      stat3Label: 'Tarîfên kontrolkirî',
    },
    calculator: {
      title: 'Hesabkerê Lezgîn ê Mesrefan',
      subtitle: 'Li gorî agahiyên we, em dikarin cûdahiya lêçûnê bi awayekî texmînî hesab bikin.',
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
      guaranteedQuality: 'Xizmeta wekhev an çêtir garantîkirî ye',
      previousAnnualCosts: 'Mesrefa salane ya niha:',
      optimizedAnnualCosts: 'Mesrefa salane ya çêtirkirî:',
      potentialLabel: 'Li ser bingeha tarîfên herî baş ên bi garantiya bihayê hatiye hesabkirin.',
      takeToBooking: 'Ji bo vê tasarrufê randevûyê daxwaz bike',
      shareWhatsAppBtn: 'Encamê bi rêya WhatsAppê kontrol bike',
    },
    services: {
      sectionSub: 'Optimîzasyona Zelal',
      sectionTitle: 'Qadên Xizmet û Şêwirmendiyê',
      sectionDesc: 'Em şîrketên herêmî û giştî yên Almanyayê berhev dikin û mafên we diparêzin.',
      detailsBtn: 'Agahiyên Zêdetir',
      bookBtn: 'Şêwirmendiyê Bixwaze',
      modalDocsTitle: 'Tiştên ji bo kontrolê hewce ne:',
      modalProvidersTitle: 'Şîrketên gelemperî:',
      closeBtn: 'Bigire',
    },
    process: {
      sectionSub: 'Hêsan & Pêbawer',
      sectionTitle: 'Derbasbûna bi 4 Gavan li gel Daryos',
      sectionDesc: 'Bê stres û bê navber: Em hemû karên fermî ji bo we pêk tînin.',
      step1Title: '01. Analîza Bêpere',
      step1Desc: 'Fatureya xwe ya herî dawî bi rêya WhatsApp an uploadê ji me re bişînin.',
      step2Title: '02. Berhevdana Serbixwe',
      step2Desc: 'Em ji nav zêdetirî 1.000 teklîfan ya herî kêmbuha û garantîkirî hildibijêrin.',
      step3Title: '03. Derbasbûna Bê Navber',
      step3Desc: 'Em peymana berê betal dikin û we qeydî ya nû dikin. Elektrîk an gaza we qet nayê birîn.',
      step4Title: '04. Çavdêriya Deman',
      step4Desc: 'Beriya ku peymana we biqede em dîsa kontrol dikin da ku hûn tim erzan bimînin.',
    },
    audit: {
      title: 'Kontrola Dijîtal a Fatureyê',
      subtitle: 'Tenê dema ku dixwazin pelê paşê bi WhatsApp an e-nameyê bi xwe bişînin, hilbijêrin. Ev malper pelan bixweber analîz nake.',
      dragText: 'Fatureya xwe li vir deynin',
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
      submitBtn: 'Daxwaza randevûyê amade bike',
      confirmationTitle: 'Daxwaz amade ye – hîn nehat şandin',
      confirmationDesc: 'Agahiyên we tenê li ser vê rûpelê hatin amadekirin. Ji bo ku daxwaza we bigihîje me, WhatsApp vekin û peyamê bi xwe bişînin.',
      exportCalendar: 'Li Salnameyê Tomar Bike (.ics)',
      openWhatsAppAction: 'Bi WhatsAppê Piştrast Bike',
      newBooking: 'Daxwazeke Nû Bike',
    },
    reviews: {
      sectionSub: 'Nêrînên Xerîdaran',
      sectionTitle: 'Xerîdarên me li Leipzig çi dibêjin?',
      filterAll: 'Hemû Nêrîn',
      savedText: 'Tasarrufa bidestxistî:',
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
      badge: 'استشارات مستقلة وخدمة تغيير العقود في لايبزيغ وعموم ألمانيا',
      titleStart: 'مقارنة مثالية لأسعار',
      titleStrom: 'الكهرباء',
      titleGas: '، الغاز',
      titleInternet: '، الإنترنت',
      titleKfz: 'وتأمين السيارات',
      titleEnd: '.',
      subtitle: 'نراجع معلوماتك ونقارن الخيارات المناسبة للكهرباء والغاز والإنترنت وتأمين السيارات. نوضح الأسعار وشروط العقد. الاستشارة مجانية للعملاء الأفراد، ولا يمكن ضمان مبلغ محدد من التوفير.',
      btnCalc: 'احسب التوفير',
      btnBook: 'احجز موعداً',
      btnWhatsApp: 'استشارة عبر واتساب',
      stat1Number: 'حسب الحالة',
      stat1Label: 'يُقدّر التوفير بعد مراجعة بياناتك',
      stat2Number: '100%',
      stat2Label: 'استشارة مجانية للمستهلكين',
      stat3Number: 'Multiple',
      stat3Label: 'تعرفة ومزود خدمة تم فحصهم',
    },
    calculator: {
      title: 'حاسبة التوفير السريع التفاعلية',
      subtitle: 'احصل على تقدير أولي لفروق التكلفة المحتملة بناءً على المعلومات التي تدخلها.',
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
      guaranteedQuality: 'خدمات متطابقة أو أفضل مضمونة بالكامل',
      previousAnnualCosts: 'التكلفة السنوية السابقة:',
      optimizedAnnualCosts: 'التكلفة السنوية بعد التحسين:',
      potentialLabel: 'بناءً على أفضل العروض المتاحة مع ضمان استقرار الأسعار ومكافآت الترحيب.',
      takeToBooking: 'احجز هذا التوفير الآن',
      shareWhatsAppBtn: 'فحص النتيجة عبر واتساب',
    },
    services: {
      sectionSub: 'تحسين شفاف وموثوق',
      sectionTitle: 'مجالات الاستشارة ومقارنة العقود',
      sectionDesc: 'نقارن بحيادية بين الشركات الإقليمية والمحلية في ألمانيا، ونتحقق من مواعيد الإلغاء، ونضمن لك أفضل الشروط.',
      detailsBtn: 'تفاصيل التعرفة والأوراق المطلوبة',
      bookBtn: 'طلب استشارة',
      modalDocsTitle: 'المستندات المطلوبة للفحص:',
      modalProvidersTitle: 'أبرز الشركات التي نقارن بينها:',
      closeBtn: 'إغلاق',
    },
    process: {
      sectionSub: 'بسيط وآمن 100%',
      sectionTitle: 'خطوات الانتقال مع داريوس في 4 خطوات',
      sectionDesc: 'بدون أوراق وبدون أي انقطاع: نتولى جميع الإجراءات الإدارية نيابة عنك.',
      step1Title: '01. فحص مجاني',
      step1Desc: 'أرسل لنا آخر فاتورة أو بيانات العقد عبر واتساب أو الرفع أو بالمقابلة الشخصية.',
      step2Title: '02. مقارنة مستقلة',
      step2Desc: 'نختار لك من بين أكثر من 1,000 عرض أفضل سعر مع ضمان ثبات التعرفة.',
      step3Title: '03. نقل سلس وبلا انقطاع',
      step3Desc: 'نقوم بفسخ العقد القديم وتسجيلك لدى الشركة الجديدة دون أي انقطاع في الكهرباء أو الغاز.',
      step4Title: '04. حراسة العقود والمواعيد',
      step4Desc: 'قبل انتهاء مدة عقدك نراجع الأسعار تلقائياً لنضمن بقاءك دائماً على أفضل سعر.',
    },
    audit: {
      title: 'الفحص الرقمي للفواتير والعقود',
      subtitle: 'اختر الملف فقط إذا كنت تريد مشاركته بنفسك لاحقًا عبر واتساب أو البريد الإلكتروني. لا يحلل هذا الموقع الملفات تلقائيًا.',
      dragText: 'اسحب الفاتورة أو العقد إلى هنا',
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
      submitBtn: 'تجهيز طلب الموعد',
      confirmationTitle: 'تم تجهيز الطلب — لم يُرسل بعد',
      confirmationDesc: 'تم تجهيز بياناتك على هذه الصفحة فقط. افتح واتساب وأرسل الرسالة بنفسك حتى يصلنا طلبك.',
      exportCalendar: 'حفظ الموعد في التقويم (.ics)',
      openWhatsAppAction: 'تأكيد الموعد عبر واتساب',
      newBooking: 'تقديم طلب آخر',
    },
    reviews: {
      sectionSub: 'تجارب عملائنا',
      sectionTitle: 'ماذا يقول عملاؤنا في لايبزيغ وحولها؟',
      filterAll: 'جميع التقييمات',
      savedText: 'المبلغ الموفر:',
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
