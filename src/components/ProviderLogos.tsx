import React from 'react';

export interface ProviderBrand {
  id: string;
  name: string;
  category: 'strom' | 'gas' | 'internet' | 'kfz';
  subtitle: string;
}

// Crisp, high-fidelity SVG logos for all major German providers
export const providerBrands: ProviderBrand[] = [
  // Strom & Gas
  { id: 'stadtwerke-leipzig', name: 'Stadtwerke Leipzig', category: 'strom', subtitle: 'Regionalpartner Leipzig' },
  { id: 'vattenfall', name: 'Vattenfall', category: 'strom', subtitle: 'Ökostrom & Gas' },
  { id: 'eon', name: 'E.ON', category: 'strom', subtitle: 'Energie & Grundversorgung' },
  { id: 'yello', name: 'Yello Strom', category: 'strom', subtitle: 'Geprüfter Ökostrom' },
  { id: 'enbw', name: 'EnBW', category: 'strom', subtitle: 'Bundesweiter Versorger' },
  { id: 'lichtblick', name: 'LichtBlick', category: 'strom', subtitle: '100% Öko-Pionier' },
  { id: 'eprimo', name: 'eprimo', category: 'gas', subtitle: 'Die Energiewender' },
  { id: 'montana', name: 'MONTANA', category: 'gas', subtitle: 'Erdgas & Biogas' },
  { id: 'maingau', name: 'MAINGAU', category: 'gas', subtitle: 'Energie & Autostrom' },
  
  // Internet
  { id: 'telekom', name: 'Deutsche Telekom', category: 'internet', subtitle: 'Glasfaser & DSL' },
  { id: 'vodafone', name: 'Vodafone', category: 'internet', subtitle: 'GigaZuhause Kabel & DSL' },
  { id: '1und1', name: '1&1', category: 'internet', subtitle: 'Highspeed Glasfaser' },
  { id: 'o2', name: 'O2 Telefónica', category: 'internet', subtitle: 'Home Internet & 5G' },
  { id: 'pyur', name: 'PŸUR', category: 'internet', subtitle: 'Kabelnetz Leipzig' },

  // KFZ-Versicherung
  { id: 'allianz', name: 'Allianz', category: 'kfz', subtitle: 'Auto-Schutzbrief & Kasko' },
  { id: 'huk-coburg', name: 'HUK-COBURG', category: 'kfz', subtitle: 'Deutschlands größter KFZ-Versicherer' },
  { id: 'axa', name: 'AXA', category: 'kfz', subtitle: 'Mobil Komfort Schutz' },
  { id: 'devk', name: 'DEVK', category: 'kfz', subtitle: 'Tatkräftig versichert' },
  { id: 'vhv', name: 'VHV', category: 'kfz', subtitle: 'Klassik-Garant KFZ' },
  { id: 'adac', name: 'ADAC', category: 'kfz', subtitle: 'Autoversicherung & Pannenhilfe' },
];

interface ProviderLogoProps {
  id: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const ProviderLogo: React.FC<ProviderLogoProps> = ({
  id,
  className = '',
  size = 'md',
  showText = false,
}) => {
  const normId = id.toLowerCase().replace(/[\s\.\-_]/g, '');

  const dimensions = {
    sm: 'h-6',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-12',
  }[size];

  // 1. Stadtwerke Leipzig (Leipzig local provider)
  if (normId.includes('stadtwerke') || normId.includes('leipzig')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 160 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="40" rx="6" fill="#0c182c" />
          {/* Leipzig Blue & Green Logo Mark */}
          <path d="M12 10H19V24H28V30H12V10Z" fill="#005596" />
          <circle cx="28" cy="14" r="4.5" fill="#84bd00" />
          <path d="M16 14H24V18H16V14Z" fill="#00a3e0" opacity="0.8" />
          <text x="36" y="19" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="11" letterSpacing="0.2">STADTWERKE</text>
          <text x="36" y="30" fill="#84bd00" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="10" letterSpacing="0.4">LEIPZIG</text>
        </svg>
      </div>
    );
  }

  // 2. Vattenfall
  if (normId.includes('vattenfall')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 150 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="150" height="40" rx="6" fill="#0f192b" />
          {/* Vattenfall Yellow / Blue Ribbon Emblem */}
          <circle cx="22" cy="20" r="12" fill="#ffd100" />
          <path d="M15 15C19 12 25 15 28 20C24 23 18 20 15 15Z" fill="#002d72" />
          <path d="M16 25C20 28 26 25 29 20C25 17 19 20 16 25Z" fill="#00a3e0" />
          <text x="40" y="24" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="12" letterSpacing="0.5">VATTENFALL</text>
        </svg>
      </div>
    );
  }

  // 3. E.ON
  if (normId.includes('eon')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 120 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="40" rx="6" fill="#1b080b" />
          {/* E.ON Red Signature Logo */}
          <path d="M14 8H38V14H22V17H34V22H22V26H38V32H14V8Z" fill="#e2001a" />
          <circle cx="44" cy="29" r="3" fill="#e2001a" />
          <path d="M50 14C58 14 64 20 64 28C64 36 58 42 50 42C42 42 36 36 36 28C36 20 42 14 50 14Z" fill="#e2001a" />
          <text x="20" y="27" fill="#e2001a" fontFamily="system-ui, sans-serif" fontWeight="900" fontStyle="italic" fontSize="22" letterSpacing="-0.5">e.on</text>
        </svg>
      </div>
    );
  }

  // 4. Yello
  if (normId.includes('yello')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 120 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="40" rx="6" fill="#1e1b07" />
          <rect x="12" y="8" width="24" height="24" rx="4" fill="#ffcc00" />
          <path d="M19 14L24 22V28H26V22L31 14H28L25 19L22 14H19Z" fill="#000000" />
          <text x="44" y="25" fill="#ffcc00" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" letterSpacing="-0.5">yello</text>
        </svg>
      </div>
    );
  }

  // 5. EnBW
  if (normId.includes('enbw')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 120 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="40" rx="6" fill="#0d1424" />
          {/* EnBW Orange energy slash */}
          <path d="M14 26L22 12H27L19 26H14Z" fill="#ff5500" />
          <text x="32" y="26" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="16" letterSpacing="0.5">EnBW</text>
        </svg>
      </div>
    );
  }

  // 6. LichtBlick
  if (normId.includes('lichtblick')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 140 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="140" height="40" rx="6" fill="#071b12" />
          {/* Green Sun/Nature Ray */}
          <circle cx="22" cy="20" r="10" fill="#109e4b" />
          <path d="M22 13V27M15 20H29" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <text x="38" y="24" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="12">LichtBlick</text>
        </svg>
      </div>
    );
  }

  // 7. eprimo
  if (normId.includes('eprimo')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 120 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="40" rx="6" fill="#1c0f1a" />
          <circle cx="20" cy="20" r="9" fill="#e5007d" />
          <circle cx="20" cy="20" r="5" fill="#ffffff" />
          <text x="34" y="25" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="14">eprimo</text>
        </svg>
      </div>
    );
  }

  // 8. MONTANA / MAINGAU
  if (normId.includes('montana') || normId.includes('maingau')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 130 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="130" height="40" rx="6" fill="#0e1726" />
          <path d="M14 26L22 12L27 20L31 14L37 26H14Z" fill="#0083ca" />
          <text x="44" y="25" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="12" letterSpacing="0.8">
            {normId.includes('montana') ? 'MONTANA' : 'MAINGAU'}
          </text>
        </svg>
      </div>
    );
  }

  // 9. Deutsche Telekom (Magenta T)
  if (normId.includes('telekom') || normId.includes('magenta')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 150 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="150" height="40" rx="6" fill="#200a16" />
          {/* Iconic Magenta T with square dots */}
          <rect x="12" y="10" width="16" height="4.5" fill="#e20074" />
          <rect x="17.75" y="14.5" width="4.5" height="15.5" fill="#e20074" />
          <rect x="12" y="25.5" width="4" height="4.5" fill="#e20074" />
          <rect x="24" y="25.5" width="4" height="4.5" fill="#e20074" />
          <text x="36" y="24" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="12" letterSpacing="0.3">Telekom</text>
        </svg>
      </div>
    );
  }

  // 10. Vodafone (Red circle speech mark)
  if (normId.includes('vodafone')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 140 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="140" height="40" rx="6" fill="#200a0b" />
          {/* Iconic Vodafone Red Speech Mark */}
          <circle cx="22" cy="20" r="11" fill="#e60000" />
          <path d="M22 14C19 14 17 16 17 19C17 22 20 24 23 23C24 23 25 21 25 19C25 16 23 14 22 14ZM21 21C20.5 21 20 20.5 20 20C20 19.5 20.5 19 21 19C21.5 19 22 19.5 22 20C22 20.5 21.5 21 21 21Z" fill="#ffffff" />
          <text x="40" y="24" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="12" letterSpacing="0.2">vodafone</text>
        </svg>
      </div>
    );
  }

  // 11. 1&1
  if (normId.includes('1und1') || normId.includes('1&1')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 110 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="110" height="40" rx="6" fill="#081427" />
          <rect x="12" y="8" width="24" height="24" rx="5" fill="#003d8f" />
          <text x="24" y="25" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="13" textAnchor="middle">1&1</text>
          <text x="44" y="25" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="14">1&1</text>
        </svg>
      </div>
    );
  }

  // 12. O2 Telefónica
  if (normId.includes('o2') || normId.includes('telefonica')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 110 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="110" height="40" rx="6" fill="#061226" />
          <circle cx="22" cy="20" r="10" stroke="#0019a5" strokeWidth="2.5" fill="#002d72" />
          <text x="18" y="24" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="12">O</text>
          <text x="26" y="26" fill="#00a3e0" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="8">2</text>
          <text x="40" y="24" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="13">O₂</text>
        </svg>
      </div>
    );
  }

  // 13. PŸUR
  if (normId.includes('pyur') || normId.includes('telecolumbus')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 120 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="40" rx="6" fill="#071b26" />
          <rect x="12" y="10" width="20" height="20" rx="4" fill="#00a2de" />
          <text x="22" y="25" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="12" textAnchor="middle">P</text>
          <text x="38" y="25" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="14" letterSpacing="0.5">PŸUR</text>
        </svg>
      </div>
    );
  }

  // 14. Allianz (Blue Shield / 3 bars)
  if (normId.includes('allianz')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 135 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="135" height="40" rx="6" fill="#07172f" />
          {/* Allianz 3 vertical bars inside circle */}
          <circle cx="22" cy="20" r="11" fill="#003780" />
          <rect x="16.5" y="14" width="2.5" height="12" rx="1.25" fill="#ffffff" />
          <rect x="20.75" y="12" width="2.5" height="16" rx="1.25" fill="#ffffff" />
          <rect x="25" y="14" width="2.5" height="12" rx="1.25" fill="#ffffff" />
          <text x="39" y="24" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="13" letterSpacing="0.2">Allianz</text>
        </svg>
      </div>
    );
  }

  // 15. HUK-COBURG
  if (normId.includes('huk')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 150 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="150" height="40" rx="6" fill="#1e1806" />
          {/* HUK Shield yellow & blue */}
          <path d="M12 10H30V22C30 27 21 31 21 31C21 31 12 27 12 22V10Z" fill="#ffd500" />
          <text x="21" y="22" fill="#002c77" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="8" textAnchor="middle">HUK</text>
          <text x="36" y="21" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="10">HUK-COBURG</text>
          <text x="36" y="29" fill="#ffd500" fontFamily="system-ui, sans-serif" fontWeight="600" fontSize="7.5">Aus Tradition günstig</text>
        </svg>
      </div>
    );
  }

  // 16. AXA
  if (normId.includes('axa')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 110 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="110" height="40" rx="6" fill="#08142c" />
          <rect x="12" y="8" width="24" height="24" rx="4" fill="#00008f" />
          <path d="M22 28L34 10" stroke="#e01a22" strokeWidth="3" strokeLinecap="round" />
          <text x="42" y="25" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="14" letterSpacing="0.5">AXA</text>
        </svg>
      </div>
    );
  }

  // 17. DEVK
  if (normId.includes('devk')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 115 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="115" height="40" rx="6" fill="#061c10" />
          <rect x="12" y="9" width="24" height="22" rx="4" fill="#00823c" />
          <text x="24" y="24" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="8" textAnchor="middle">DEVK</text>
          <text x="42" y="25" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="13">DEVK</text>
        </svg>
      </div>
    );
  }

  // 18. VHV
  if (normId.includes('vhv')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 115 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="115" height="40" rx="6" fill="#220709" />
          <rect x="12" y="9" width="24" height="22" rx="4" fill="#e30613" />
          <text x="24" y="24" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="8" textAnchor="middle">VHV</text>
          <text x="42" y="25" fill="#ffffff" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="13">VHV</text>
        </svg>
      </div>
    );
  }

  // 19. ADAC
  if (normId.includes('adac')) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 120 40" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="40" rx="6" fill="#1e1a06" />
          <rect x="12" y="9" width="28" height="22" rx="3" fill="#ffd800" />
          <text x="26" y="24" fill="#000000" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="8.5" textAnchor="middle">ADAC</text>
          <text x="46" y="25" fill="#ffd800" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="13">ADAC</text>
        </svg>
      </div>
    );
  }

  // Generic fallback with styled badge
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141620] border border-white/[0.08] text-xs font-bold text-slate-200 ${className}`}>
      <span className="w-2 h-2 rounded-full bg-blue-500" />
      <span>{id}</span>
    </div>
  );
};

// Full interactive Partner & Provider Logos Strip
interface PartnerLogosBannerProps {
  onSelectCategory?: (category: 'strom' | 'gas' | 'internet' | 'kfz') => void;
}

export const PartnerLogosBanner: React.FC<PartnerLogosBannerProps> = ({ onSelectCategory }) => {
  const [filter, setFilter] = React.useState<'alle' | 'strom' | 'gas' | 'internet' | 'kfz'>('alle');

  const filteredBrands = filter === 'alle'
    ? providerBrands
    : providerBrands.filter((b) => b.category === filter);

  return (
    <section className="py-14 bg-[#07080c] border-y border-white/[0.08] relative overflow-hidden">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-blue-600/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        
        {/* Title and Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Geprüftes Partner- & Versorgernetzwerk</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Unabhängiger Vergleich aus über 100+ zertifizierten Anbietern
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Wir vergleichen die Tarife aller großen Versorger in Leipzig und bundesweit – garantiert neutral und für Sie zu 100% kostenlos.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#10121a] p-1.5 rounded-xl border border-white/[0.08] text-xs">
            {(['alle', 'strom', 'gas', 'internet', 'kfz'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filter === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {cat === 'alle' ? 'Alle Partner' : cat === 'strom' ? '⚡ Strom' : cat === 'gas' ? '🔥 Gas' : cat === 'internet' ? '🌐 Internet' : '🚗 KFZ'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Authentic Logos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {filteredBrands.map((brand) => (
            <div
              key={brand.id}
              className="bg-[#0e1017] hover:bg-[#131622] p-3 rounded-xl border border-white/[0.06] hover:border-white/[0.16] transition-all flex flex-col items-center justify-center text-center group shadow-sm"
            >
              <div className="py-2 flex items-center justify-center">
                <ProviderLogo id={brand.id} size="md" />
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-300 font-medium truncate w-full mt-1">
                {brand.subtitle}
              </span>
            </div>
          ))}
        </div>

        {/* Trust Badges Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400 border-t border-white/[0.04]">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>100% Unterbrechungsfreie Versorgung garantiert</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Keine Vorkasse & faire Preisgarantien</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>Kostenloser Kündigungs- & Wechselservice</span>
          </span>
        </div>

      </div>
    </section>
  );
};
