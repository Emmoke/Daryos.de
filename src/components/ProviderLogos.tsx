import React from 'react';

export interface ProviderBrand {
  id: string;
  name: string;
  domain: string;
  category: 'strom' | 'gas' | 'internet' | 'kfz';
}

// Auswahl von Anbietern, deren Tarife verglichen werden können.
// Bewusst als neutrale Namenskarten dargestellt: keine Markenlogos ohne Erlaubnis der Rechteinhaber
// und keine Andeutung einer Partnerschaft.
export const providerBrands: ProviderBrand[] = [
  { id: 'stadtwerke-leipzig', name: 'Stadtwerke Leipzig', domain: 'stadtwerke-leipzig.de', category: 'strom' },
  { id: 'vattenfall', name: 'Vattenfall', domain: 'vattenfall.de', category: 'strom' },
  { id: 'eon', name: 'E.ON', domain: 'eon.de', category: 'strom' },
  { id: 'yello', name: 'Yello', domain: 'yello.de', category: 'strom' },
  { id: 'enbw', name: 'EnBW', domain: 'enbw.com', category: 'strom' },
  { id: 'lichtblick', name: 'LichtBlick', domain: 'lichtblick.de', category: 'strom' },
  { id: 'eprimo', name: 'eprimo', domain: 'eprimo.de', category: 'gas' },
  { id: 'montana', name: 'MONTANA', domain: 'montana-energie.de', category: 'gas' },
  { id: 'maingau', name: 'MAINGAU Energie', domain: 'maingau-energie.de', category: 'gas' },
  { id: 'mainova', name: 'Mainova', domain: 'mainova.de', category: 'gas' },
  { id: 'telekom', name: 'Telekom', domain: 'telekom.de', category: 'internet' },
  { id: 'vodafone', name: 'Vodafone', domain: 'vodafone.de', category: 'internet' },
  { id: '1und1', name: '1&1', domain: '1und1.de', category: 'internet' },
  { id: 'o2', name: 'O₂', domain: 'o2online.de', category: 'internet' },
  { id: 'pyur', name: 'PŸUR', domain: 'pyur.com', category: 'internet' },
  { id: 'allianz', name: 'Allianz', domain: 'allianz.de', category: 'kfz' },
  { id: 'huk-coburg', name: 'HUK-COBURG', domain: 'huk.de', category: 'kfz' },
  { id: 'axa', name: 'AXA', domain: 'axa.de', category: 'kfz' },
  { id: 'devk', name: 'DEVK', domain: 'devk.de', category: 'kfz' },
  { id: 'vhv', name: 'VHV', domain: 'vhv.de', category: 'kfz' },
  { id: 'adac', name: 'ADAC', domain: 'adac.de', category: 'kfz' },
];

const CATEGORY_LABEL: Record<ProviderBrand['category'], string> = {
  strom: 'Strom',
  gas: 'Gas',
  internet: 'Internet',
  kfz: 'Kfz-Versicherung',
};

const CATEGORY_DOT: Record<ProviderBrand['category'], string> = {
  strom: 'bg-blue-400',
  gas: 'bg-orange-400',
  internet: 'bg-violet-400',
  kfz: 'bg-emerald-400',
};

const norm = (s: string) => s.toLowerCase().replace(/[\s.\-_&]/g, '');

export function findBrand(id: string): ProviderBrand | undefined {
  const n = norm(id);
  if (!n) return undefined;
  return providerBrands.find((b) => norm(b.id) === n || norm(b.name) === n) ?? providerBrands.find((b) => n.includes(norm(b.id)) || norm(b.id).includes(n));
}

interface ProviderLogoProps {
  id: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'transparent';
  /** Veraltet, wird ignoriert (früher: Markenlogo aus dem Web laden) */
  preferWebImage?: boolean;
  showText?: boolean;
}

/** Neutrale Namensmarke eines Anbieters in einheitlicher Gestaltung. */
export const ProviderLogo: React.FC<ProviderLogoProps> = ({ id, className = '', size = 'md', variant = 'dark' }) => {
  const brand = findBrand(id);
  const name = brand?.name ?? id;
  const text = { sm: 'text-[11px] px-2 py-0.5', md: 'text-xs px-2.5 py-1', lg: 'text-sm px-3 py-1.5' }[size];
  const tone = variant === 'light' ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-white/[0.06] text-slate-100 border-white/10';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-semibold tracking-tight whitespace-nowrap ${tone} ${text} ${className}`} title={name}>
      {brand && <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[brand.category]}`} aria-hidden />}
      {name}
    </span>
  );
};

interface PartnerLogosBannerProps {
  onSelectCategory?: (category: ProviderBrand['category']) => void;
}

export const PartnerLogosBanner: React.FC<PartnerLogosBannerProps> = ({ onSelectCategory }) => {
  const [filter, setFilter] = React.useState<'alle' | ProviderBrand['category']>('alle');
  const filtered = filter === 'alle' ? providerBrands : providerBrands.filter((b) => b.category === filter);
  const marquee = [...providerBrands, ...providerBrands];

  return (
    <section className="relative py-16 bg-[#05060a] overflow-hidden" aria-labelledby="anbieter-titel">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" aria-hidden />

      {/* Endlos-Laufleiste mit Anbieternamen */}
      <div className="relative mb-12 [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]" aria-hidden>
        <div className="flex w-max gap-10 animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused]">
          {marquee.map((b, i) => (
            <span key={`${b.id}-${i}`} className="text-lg sm:text-xl font-bold tracking-tight text-slate-500/80 whitespace-nowrap">
              {b.name}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Anbieterauswahl</p>
            <h2 id="anbieter-titel" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Anbieter, deren Tarife wir unter anderem vergleichen
            </h2>
            <p className="text-sm text-slate-400">
              Auszug. Welche Tarife für Sie verfügbar sind, hängt von Ihrer Adresse und Ihrem Bedarf ab. Für Verbraucher ist die Beratung kostenlos.
            </p>
          </div>

          <div role="tablist" aria-label="Nach Bereich filtern" className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 text-xs backdrop-blur">
            {(['alle', 'strom', 'gas', 'internet', 'kfz'] as const).map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={filter === cat}
                onClick={() => {
                  setFilter(cat);
                  if (onSelectCategory && cat !== 'alle') onSelectCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${filter === cat ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}
              >
                {cat === 'alle' ? 'Alle' : CATEGORY_LABEL[cat]}
              </button>
            ))}
          </div>
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((b) => (
            <li
              key={b.id}
              className="group relative flex min-h-[96px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
            >
              <span className="text-base font-bold tracking-tight text-white leading-tight">{b.name}</span>
              <span className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[b.category]}`} aria-hidden />
                {CATEGORY_LABEL[b.category]}
                <span className="ml-auto font-mono text-[10px] text-slate-500 truncate">{b.domain}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="text-[11px] text-slate-500">
          Genannte Marken und Unternehmensnamen gehören den jeweiligen Inhabern. Ihre Nennung bedeutet keine Partnerschaft, Empfehlung oder Zertifizierung
          durch diese Unternehmen.
        </p>
      </div>
    </section>
  );
};
