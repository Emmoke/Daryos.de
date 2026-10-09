import React from 'react';
import { BadgeEuro, ClipboardCheck, MessagesSquare, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

interface TransparencySectionProps {
  currentLang: Language;
  onOpenBooking: () => void;
}

const copy: Record<Language, {
  eyebrow: string; title: string; intro: string;
  steps: { title: string; text: string }[];
  disclosureTitle: string; disclosure: string; cta: string;
}> = {
  de: {
    eyebrow: 'Klarheit statt Kleingedrucktes',
    title: 'Sie entscheiden. Wir erklären die Optionen.',
    intro: 'Ein Tarifwechsel soll verständlich sein. Wir besprechen Ihre Situation persönlich und zeigen, worauf Sie bei Preis, Laufzeit und Bedingungen achten sollten.',
    steps: [
      { title: '1. Bedarf verstehen', text: 'Wir klären, was Ihnen wichtig ist und welche Angaben für einen Vergleich benötigt werden.' },
      { title: '2. Angebote einordnen', text: 'Wir erläutern Preis, Vertragslaufzeit, Boni und relevante Einschränkungen – nicht nur den Einstiegspreis.' },
      { title: '3. In Ruhe entscheiden', text: 'Sie entscheiden, ob Sie wechseln möchten. Ohne Ihre Zustimmung wird kein Wechselauftrag ausgelöst.' },
    ],
    disclosureTitle: 'Wie finanziert sich die Beratung?',
    disclosure: 'Die Beratung ist für Privatkunden nach aktuellem Geschäftsmodell kostenlos. Bei erfolgreicher Vermittlung können wir vom jeweiligen Anbieter oder Versicherer eine Provision erhalten. Wir erläutern relevante Konditionen und prüfen Angebote passend zu Ihrem Bedarf; eine bestimmte Ersparnis können wir nicht garantieren.',
    cta: 'Persönliche Beratung anfragen',
  },
  en: {
    eyebrow: 'Clarity over fine print',
    title: 'You decide. We explain your options.',
    intro: 'Switching a tariff should be understandable. We discuss your needs and explain what to check in prices, contract terms and conditions.',
    steps: [
      { title: '1. Understand your needs', text: 'We clarify your priorities and which details are needed for a comparison.' },
      { title: '2. Explain the offers', text: 'We review price, contract length, bonuses and relevant limitations—not just the introductory price.' },
      { title: '3. Decide in your own time', text: 'You choose whether to switch. No switch order is triggered without your approval.' },
    ],
    disclosureTitle: 'How is the advice funded?',
    disclosure: 'Under our current business model, advice is free for private customers. If a contract is successfully arranged, we may receive a commission from the provider or insurer. We explain relevant terms and look for offers that fit your needs; specific savings cannot be guaranteed.',
    cta: 'Request a personal consultation',
  },
  tr: {
    eyebrow: 'Küçük yazılar yerine açıklık',
    title: 'Karar sizin. Seçenekleri biz açıklayalım.',
    intro: 'Tarife değişikliği anlaşılır olmalı. İhtiyaçlarınızı konuşur, fiyatı, sözleşme süresini ve koşulları birlikte değerlendiririz.',
    steps: [
      { title: '1. İhtiyacınızı anlayalım', text: 'Önceliklerinizi ve karşılaştırma için gereken bilgileri belirleriz.' },
      { title: '2. Teklifleri açıklayalım', text: 'Sadece başlangıç fiyatını değil; süreyi, bonusları ve önemli koşulları da açıklarız.' },
      { title: '3. Kararı siz verin', text: 'Değişiklik yapıp yapmamaya siz karar verirsiniz. Onayınız olmadan işlem başlatılmaz.' },
    ],
    disclosureTitle: 'Danışmanlık nasıl finanse edilir?',
    disclosure: 'Mevcut iş modelimize göre bireysel müşteriler için danışmanlık ücretsizdir. Sözleşme başarıyla aracılık edildiğinde sağlayıcıdan veya sigorta şirketinden komisyon alabiliriz. Belirli bir tasarruf garanti edilemez.',
    cta: 'Kişisel danışmanlık isteyin',
  },
  ku: {
    eyebrow: 'Ronahî li şûna nivîsa biçûk',
    title: 'Biryar ya te ye. Em vebijêrkên te rave dikin.',
    intro: 'Guhertina tarifê divê zelal be. Em hewcedariyên te dibihîzin û bihayê, demê peymanê û şertan rave dikin.',
    steps: [
      { title: '1. Hewcedariyê fam bikin', text: 'Em tiştên girîng ji bo te û agahiyên pêwîst ji bo berawirdkirinê diyar dikin.' },
      { title: '2. Pêşniyaran rave bikin', text: 'Em bihayê, demê peymanê, bonus û şertên girîng rave dikin.' },
      { title: '3. Bi aramî biryar bide', text: 'Tu biryar didî ka biguherî. Bê pejirandina te tu daxwaz nayê şandin.' },
    ],
    disclosureTitle: 'Şêwirmendî çawa tê fînansekirin?',
    disclosure: 'Li gorî modela niha, şêwirmendî ji bo xerîdarên kesane belaş e. Di navbeynkariya serkeftî ya peymanê de dibe ku em ji pêşkêşker an parastinê komîsyon bistînin. Teserûfa taybet nayê garantîkirin.',
    cta: 'Şêwirmendiya kesane bixwaze',
  },
  ar: {
    eyebrow: 'وضوح بدلًا من الشروط الصغيرة',
    title: 'القرار لك، ونحن نشرح الخيارات.',
    intro: 'يجب أن يكون تغيير التعرفة واضحًا. نناقش احتياجاتك ونشرح السعر ومدة العقد والشروط المهمة.',
    steps: [
      { title: '1. فهم احتياجاتك', text: 'نحدد أولوياتك والمعلومات اللازمة للمقارنة.' },
      { title: '2. شرح العروض', text: 'نوضح السعر ومدة العقد والمكافآت والقيود المهمة، وليس السعر التمهيدي فقط.' },
      { title: '3. القرار لك', text: 'أنت تقرر إن كنت تريد التغيير. لن نبدأ طلبًا دون موافقتك.' },
    ],
    disclosureTitle: 'كيف يتم تمويل الاستشارة؟',
    disclosure: 'وفق نموذج العمل الحالي، الاستشارة مجانية للعملاء الأفراد. عند إتمام الوساطة بنجاح، قد نتلقى عمولة من مزود الخدمة أو شركة التأمين. لا يمكن ضمان مبلغ محدد من التوفير.',
    cta: 'اطلب استشارة شخصية',
  },
};

export const TransparencySection: React.FC<TransparencySectionProps> = ({ currentLang, onOpenBooking }) => {
  const t = copy[currentLang] || copy.de;
  return (
    <section id="transparency" className="py-20 bg-[#08090d] border-t border-white/[0.08] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> {t.eyebrow}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">{t.title}</h2>
          <p className="text-sm sm:text-base leading-relaxed text-slate-400">{t.intro}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {t.steps.map((step, index) => {
            const Icon = [ClipboardCheck, MessagesSquare, ShieldCheck][index];
            return (
              <article key={step.title} className="rounded-2xl border border-white/[0.09] bg-[#101117] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest text-blue-300">0{index + 1}</span>
                  <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-2.5 text-blue-300"><Icon className="w-5 h-5" /></div>
                </div>
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{step.text}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-7 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-6 sm:p-8">
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white"><BadgeEuro className="w-5 h-5 text-emerald-300" />{t.disclosureTitle}</h3>
            <p className="text-sm leading-relaxed text-slate-300">{t.disclosure}</p>
          </div>
          <button onClick={onOpenBooking} className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition-colors">
            {t.cta}
          </button>
        </div>
      </div>
    </section>
  );
};
