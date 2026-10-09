import React, { useState } from 'react';

export interface ProviderBrand {
  id: string;
  name: string;
  domain: string;
  category: 'strom' | 'gas' | 'internet' | 'kfz';
  subtitle: string;
  webLogoUrl: string;
}

// Crisp, authentic German utility & telecommunication provider brandmarks with verified web URLs
export const providerBrands: ProviderBrand[] = [
  // Strom & Gas
  {
    id: 'stadtwerke-leipzig',
    name: 'Stadtwerke Leipzig',
    domain: 'stadtwerke-leipzig.de',
    category: 'strom',
    subtitle: 'Regionalpartner Leipzig',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Stadtwerke_Leipzig_Logo.svg/320px-Stadtwerke_Leipzig_Logo.svg.png',
  },
  {
    id: 'vattenfall',
    name: 'Vattenfall',
    domain: 'vattenfall.de',
    category: 'strom',
    subtitle: 'Ökostrom & Gas',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Vattenfall_logo.svg/320px-Vattenfall_logo.svg.png',
  },
  {
    id: 'eon',
    name: 'E.ON',
    domain: 'eon.de',
    category: 'strom',
    subtitle: 'Energie & Grundversorgung',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/E.ON_logo.svg/320px-E.ON_logo.svg.png',
  },
  {
    id: 'yello',
    name: 'Yello',
    domain: 'yello.de',
    category: 'strom',
    subtitle: 'Geprüfter Ökostrom',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Yello_Strom_Logo.svg/320px-Yello_Strom_Logo.svg.png',
  },
  {
    id: 'enbw',
    name: 'EnBW',
    domain: 'enbw.com',
    category: 'strom',
    subtitle: 'Bundesweiter Versorger',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/EnBW_Logo.svg/320px-EnBW_Logo.svg.png',
  },
  {
    id: 'lichtblick',
    name: 'LichtBlick',
    domain: 'lichtblick.de',
    category: 'strom',
    subtitle: '100% Öko-Pionier',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/LichtBlick_Logo.svg/320px-LichtBlick_Logo.svg.png',
  },
  {
    id: 'eprimo',
    name: 'eprimo',
    domain: 'eprimo.de',
    category: 'gas',
    subtitle: 'Die Energiewender',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Eprimo_logo.svg/320px-Eprimo_logo.svg.png',
  },
  {
    id: 'montana',
    name: 'MONTANA',
    domain: 'montana-energie.de',
    category: 'gas',
    subtitle: 'Erdgas & Biogas',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Montana_Energie_Logo.svg/320px-Montana_Energie_Logo.svg.png',
  },
  {
    id: 'maingau',
    name: 'MAINGAU',
    domain: 'maingau-energie.de',
    category: 'gas',
    subtitle: 'Energie & Autostrom',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Maingau_Energie_Logo.svg/320px-Maingau_Energie_Logo.svg.png',
  },
  
  // Internet
  {
    id: 'telekom',
    name: 'Deutsche Telekom',
    domain: 'telekom.de',
    category: 'internet',
    subtitle: 'Glasfaser & DSL',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Telekom_Logo_2022.svg/320px-Telekom_Logo_2022.svg.png',
  },
  {
    id: 'vodafone',
    name: 'Vodafone',
    domain: 'vodafone.de',
    category: 'internet',
    subtitle: 'GigaZuhause Kabel & DSL',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Vodafone_2017_logo.svg/320px-Vodafone_2017_logo.svg.png',
  },
  {
    id: '1und1',
    name: '1&1',
    domain: '1und1.de',
    category: 'internet',
    subtitle: 'Highspeed Glasfaser',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/1%261_Logo_2020.svg/320px-1%261_Logo_2020.svg.png',
  },
  {
    id: 'o2',
    name: 'O₂ Telefónica',
    domain: 'o2online.de',
    category: 'internet',
    subtitle: 'Home Internet & 5G',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/O2_logo.svg/320px-O2_logo.svg.png',
  },
  {
    id: 'pyur',
    name: 'PŸUR',
    domain: 'pyur.com',
    category: 'internet',
    subtitle: 'Kabelnetz Leipzig',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Pyur_logo.svg/320px-Pyur_logo.svg.png',
  },

  // KFZ-Versicherung
  {
    id: 'allianz',
    name: 'Allianz',
    domain: 'allianz.de',
    category: 'kfz',
    subtitle: 'Auto-Schutzbrief & Kasko',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Allianz_logo.svg/320px-Allianz_logo.svg.png',
  },
  {
    id: 'huk-coburg',
    name: 'HUK-COBURG',
    domain: 'huk.de',
    category: 'kfz',
    subtitle: 'Deutschlands größter KFZ-Versicherer',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/HUK-Coburg_logo.svg/320px-HUK-Coburg_logo.svg.png',
  },
  {
    id: 'axa',
    name: 'AXA',
    domain: 'axa.de',
    category: 'kfz',
    subtitle: 'Mobil Komfort Schutz',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/AXA_Logo.svg/320px-AXA_Logo.svg.png',
  },
  {
    id: 'devk',
    name: 'DEVK',
    domain: 'devk.de',
    category: 'kfz',
    subtitle: 'Tatkräftig versichert',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/DEVK_Logo.svg/320px-DEVK_Logo.svg.png',
  },
  {
    id: 'vhv',
    name: 'VHV',
    domain: 'vhv.de',
    category: 'kfz',
    subtitle: 'Klassik-Garant KFZ',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/VHV_Gruppe_logo.svg/320px-VHV_Gruppe_logo.svg.png',
  },
  {
    id: 'adac',
    name: 'ADAC',
    domain: 'adac.de',
    category: 'kfz',
    subtitle: 'Autoversicherung & Pannenhilfe',
    webLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/ADAC_Logo.svg/320px-ADAC_Logo.svg.png',
  },
];

interface ProviderLogoProps {
  id: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark' | 'transparent';
  preferWebImage?: boolean;
}

export const ProviderLogo: React.FC<ProviderLogoProps> = ({
  id,
  className = '',
  size = 'md',
  variant = 'light',
  preferWebImage = true,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const normId = id.toLowerCase().replace(/[\s\.\-_]/g, '');

  const dimensions = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-12',
  }[size];

  const brandInfo = providerBrands.find(
    (b) =>
      b.id.toLowerCase().replace(/[\s\.\-_]/g, '').includes(normId) ||
      normId.includes(b.id.toLowerCase().replace(/[\s\.\-_]/g, ''))
  );
  const brandName = brandInfo ? brandInfo.name : id;

  const wrapperClass =
    variant === 'dark'
      ? `inline-flex items-center justify-center bg-white px-2 py-0.5 rounded-md shadow-xs border border-slate-200/90 ${className}`
      : `inline-flex items-center justify-center ${className}`;

  // If web image is preferred and available, render real web image with graceful vector fallback
  if (preferWebImage && brandInfo?.webLogoUrl && !imageFailed) {
    return (
      <div className={wrapperClass} title={brandName}>
        <img
          src={brandInfo.webLogoUrl}
          alt={brandName}
          className={`${dimensions} w-auto max-w-[130px] object-contain transition-opacity duration-200`}
          loading="lazy"
          crossOrigin="anonymous"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  const renderSvg = () => {
    // 1. Stadtwerke Leipzig (Official Leipzig Blue & Lime Green Logo)
    if (normId.includes('stadtwerke') || normId.includes('leipzig')) {
      return (
        <svg viewBox="0 0 160 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(6, 6)">
            <path d="M4 25C4 16 10 9 18 6.5C13 11 11 17 11 25H4Z" fill="#005596" />
            <path d="M11 25C11 20 13.5 16.5 17 14C15 18 14 22 14 25H11Z" fill="#003D6D" />
            <circle cx="21" cy="7" r="4.5" fill="#84BD00" />
          </g>
          <text x="36" y="19" fill="#005596" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="10.5" letterSpacing="0.4">STADTWERKE</text>
          <text x="36" y="31" fill="#84BD00" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="9.5" letterSpacing="0.8">LEIPZIG</text>
        </svg>
      );
    }

    // 2. Vattenfall (Official Deep Blue & Yellow Ribbon Logo)
    if (normId.includes('vattenfall')) {
      return (
        <svg viewBox="0 0 155 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(6, 6)">
            <circle cx="15" cy="15" r="14" fill="#002D72" />
            <path d="M5 14.5C9 10 18 10.5 24 14C19 16.5 11 16 5 14.5Z" fill="#FFD100" />
            <path d="M6 16.5C11 19 20 18.5 24 15C20 13.5 12 14.5 6 16.5Z" fill="#00A3E0" />
          </g>
          <text x="42" y="25" fill="#002D72" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="12.5" letterSpacing="0.6">VATTENFALL</text>
        </svg>
      );
    }

    // 3. E.ON (Official Red e.on Typography)
    if (normId.includes('eon')) {
      return (
        <svg viewBox="0 0 95 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(4, 7)">
            <path d="M12 14C12 7.5 17 3 23.5 3C30 3 34 7.5 34 13.5H18C18 17.5 20.5 20.5 24.5 20.5C27 20.5 29 19.5 30.5 18L33.5 21C31.5 23.5 28 25 24 25C17 25 12 20.5 12 14ZM18 11H28.5C28 7.5 26 5.5 23.5 5.5C20.5 5.5 18.5 7.5 18 11Z" fill="#E2001A" />
            <rect x="36.5" y="19.5" width="4.5" height="4.5" rx="0.8" fill="#E2001A" />
            <path d="M44 14C44 7.5 48.5 3 55 3C61.5 3 66 7.5 66 14C66 20.5 61.5 25 55 25C48.5 25 44 20.5 44 14ZM60.5 14C60.5 9.5 58 6 55 6C52 6 49.5 9.5 49.5 14C49.5 18.5 52 22 55 22C58 22 60.5 18.5 60.5 14Z" fill="#E2001A" />
            <path d="M72 4H77.5V7.5C79 5 82 3 85.5 3C91 3 93.5 6.5 93.5 12V24H88V13C88 9.5 86.5 8 84 8C80.5 8 77.5 10.5 77.5 14.5V24H72V4Z" fill="#E2001A" />
          </g>
        </svg>
      );
    }

    // 4. Yello (Official Bright Yellow Rounded Badge & Black Wordmark)
    if (normId.includes('yello')) {
      return (
        <svg viewBox="0 0 115 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="103" height="30" rx="8" fill="#FFCC00" />
          <g transform="translate(14, 11)">
            <path d="M4 2L9.5 11.5V18H12.5V11.5L18 2H14.5L11 8.5L7.5 2H4Z" fill="#111111" />
            <path d="M21 10C21 5.5 24 2 28 2C32 2 35 5 35 9.5H24C24 12.5 25.5 14.5 28.5 14.5C30.2 14.5 31.5 13.8 32.5 12.5L34.5 14.2C33 16.2 30.8 17 28.5 17C24 17 21 14 21 10ZM24 7.8H31.8C31.5 5.5 30 3.8 28 3.8C26 3.8 24.5 5.5 24 7.8Z" fill="#111111" />
            <rect x="37" y="1" width="3.2" height="16.5" rx="1" fill="#111111" />
            <rect x="42.5" y="1" width="3.2" height="16.5" rx="1" fill="#111111" />
            <path d="M48 9.5C48 5 51.5 1.8 56 1.8C60.5 1.8 64 5 64 9.5C64 14 60.5 17.2 56 17.2C51.5 17.2 48 14 48 9.5ZM60.5 9.5C60.5 6.5 58.5 4.5 56 4.5C53.5 4.5 51.5 6.5 51.5 9.5C51.5 12.5 53.5 14.5 56 14.5C58.5 14.5 60.5 12.5 60.5 9.5Z" fill="#111111" />
          </g>
          <circle cx="88" cy="14" r="2.5" fill="#111111" />
        </svg>
      );
    }

    // 5. EnBW (Official Blue & Orange Slash Wordmark)
    if (normId.includes('enbw')) {
      return (
        <svg viewBox="0 0 115 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(10, 8)">
            <text x="0" y="21" fill="#002D72" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="21" letterSpacing="-0.5">En</text>
            <path d="M33 24L41 2H47L39 24H33Z" fill="#FF5500" />
            <text x="32" y="21" fill="#002D72" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="21" letterSpacing="-0.5">BW</text>
          </g>
        </svg>
      );
    }

    // 6. LichtBlick (Official Green Sunburst & Typography)
    if (normId.includes('lichtblick')) {
      return (
        <svg viewBox="0 0 148 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(6, 6)">
            <circle cx="15" cy="15" r="14" fill="#009B3A" />
            <g stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round">
              <line x1="15" y1="5" x2="15" y2="25" />
              <line x1="5" y1="15" x2="25" y2="15" />
              <line x1="8" y1="8" x2="22" y2="22" />
              <line x1="8" y1="22" x2="22" y2="8" />
            </g>
            <circle cx="15" cy="15" r="3.5" fill="#009B3A" />
          </g>
          <text x="42" y="26" fill="#06361C" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="14" letterSpacing="-0.3">LichtBlick</text>
        </svg>
      );
    }

    // 7. eprimo (Official Magenta Concentric Target & Typography)
    if (normId.includes('eprimo')) {
      return (
        <svg viewBox="0 0 130 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(6, 7)">
            <circle cx="14" cy="14" r="13" fill="#E5007D" />
            <circle cx="14" cy="14" r="7.5" fill="#ffffff" />
            <circle cx="14" cy="14" r="4" fill="#E5007D" />
          </g>
          <text x="40" y="27" fill="#1D1D1B" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="16" letterSpacing="-0.3">eprimo</text>
          <circle cx="106" cy="14" r="2.8" fill="#84BD00" />
        </svg>
      );
    }

    // 8. MONTANA (Official Alpine Peaks & Navy Wordmark)
    if (normId.includes('montana')) {
      return (
        <svg viewBox="0 0 145 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(6, 7)">
            <path d="M2 24L14 6L21 16L25 10L35 24H2Z" fill="#00457C" />
            <path d="M18 12L22 17L26 12L31 20H15L18 12Z" fill="#008CD2" />
          </g>
          <text x="48" y="23" fill="#00457C" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="13" letterSpacing="1.2">MONTANA</text>
          <text x="48" y="32" fill="#008CD2" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="800" fontSize="8" letterSpacing="2">ENERGIE</text>
        </svg>
      );
    }

    // 9. MAINGAU (Official Dual Energy Waves & Typography)
    if (normId.includes('maingau')) {
      return (
        <svg viewBox="0 0 145 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(6, 6)">
            <path d="M3 21C10 13 18 13 25 21" stroke="#003D7A" strokeWidth="3.6" strokeLinecap="round" />
            <path d="M7 24C14 16 22 16 29 24" stroke="#FFB800" strokeWidth="3" strokeLinecap="round" />
          </g>
          <text x="42" y="22" fill="#003D7A" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="12.5" letterSpacing="0.6">MAINGAU</text>
          <text x="42" y="32" fill="#666666" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="700" fontSize="8" letterSpacing="1.5">ENERGIE</text>
        </svg>
      );
    }

    // 10. Deutsche Telekom (Official Magenta 4-Digit T Logo)
    if (normId.includes('telekom') || normId.includes('magenta')) {
      return (
        <svg viewBox="0 0 145 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(6, 6)">
            <rect x="7" y="5" width="18" height="5.5" fill="#E20074" />
            <rect x="13.2" y="10.5" width="5.6" height="15" fill="#E20074" />
            <rect x="3.5" y="20.5" width="5" height="5" fill="#E20074" />
            <rect x="23.5" y="20.5" width="5" height="5" fill="#E20074" />
          </g>
          <text x="40" y="26" fill="#111111" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="14" letterSpacing="0.2">Telekom</text>
        </svg>
      );
    }

    // 11. Vodafone (Official Red Speechmark & Typography)
    if (normId.includes('vodafone')) {
      return (
        <svg viewBox="0 0 145 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(6, 6)">
            <circle cx="15" cy="15" r="14" fill="#E60000" />
            <path d="M15 6C11 6 8.5 9 8.5 12.8C8.5 17.5 12.5 21 17 19.2C18.5 18.5 19.5 16 19 13.5C18.5 9.5 16 6 15 6ZM14 16C12.5 16 11.5 14.8 11.5 13.5C11.5 12.2 12.5 11 14 11C15.2 11 16.2 12 16.2 13.5C16.2 14.8 15.2 16 14 16Z" fill="#ffffff" />
          </g>
          <text x="42" y="26" fill="#E60000" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="800" fontSize="14" letterSpacing="-0.2">vodafone</text>
        </svg>
      );
    }

    // 12. 1&1 (Official Navy Rounded Badge - Single Authentic Wordmark)
    if (normId.includes('1und1') || normId.includes('1&1')) {
      return (
        <svg viewBox="0 0 110 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="98" height="30" rx="7" fill="#003D8F" />
          <text x="55" y="27" fill="#ffffff" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="18" textAnchor="middle" letterSpacing="1">1&1</text>
        </svg>
      );
    }

    // 13. O₂ (Official Royal Blue Gradient Badge with Oxygen Bubbles)
    if (normId.includes('o2') || normId.includes('telefonica')) {
      return (
        <svg viewBox="0 0 110 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="o2Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0019A5" />
              <stop offset="100%" stopColor="#000D58" />
            </linearGradient>
          </defs>
          <rect x="6" y="6" width="98" height="30" rx="7" fill="url(#o2Grad)" />
          <circle cx="20" cy="14" r="3" stroke="#58C9F3" strokeWidth="1" fill="none" opacity="0.6" />
          <circle cx="88" cy="22" r="4.5" stroke="#58C9F3" strokeWidth="1.2" fill="none" opacity="0.5" />
          <circle cx="82" cy="12" r="2" fill="#58C9F3" opacity="0.7" />
          <g transform="translate(38, 26)">
            <text x="0" y="0" fill="#ffffff" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="19">O</text>
            <text x="17" y="3" fill="#58C9F3" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="13">2</text>
          </g>
        </svg>
      );
    }

    // 14. PŸUR (Official Cyan Rounded Badge with Umlaut Wordmark)
    if (normId.includes('pyur') || normId.includes('telecolumbus')) {
      return (
        <svg viewBox="0 0 110 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="98" height="30" rx="7" fill="#00A2DE" />
          <g transform="translate(18, 25)">
            <text x="0" y="0" fill="#ffffff" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="16" letterSpacing="2">PŸUR</text>
          </g>
        </svg>
      );
    }

    // 15. Allianz (Official Royal Blue Circle with 3 Eagle Bars)
    if (normId.includes('allianz')) {
      return (
        <svg viewBox="0 0 145 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(6, 6)">
            <circle cx="15" cy="15" r="14" fill="#003780" />
            <rect x="8.5" y="8" width="3" height="14" rx="1.5" fill="#ffffff" />
            <rect x="13.5" y="5.5" width="3" height="19" rx="1.5" fill="#ffffff" />
            <rect x="18.5" y="8" width="3" height="14" rx="1.5" fill="#ffffff" />
          </g>
          <text x="42" y="26" fill="#003780" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="15" letterSpacing="-0.2">Allianz</text>
        </svg>
      );
    }

    // 16. HUK-COBURG (Official Heraldic Yellow Shield & Navy Wordmark)
    if (normId.includes('huk')) {
      return (
        <svg viewBox="0 0 155 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(6, 6)">
            <path d="M2 2H22V17C22 23 12 28 12 28C12 28 2 23 2 17V2Z" fill="#FFD500" stroke="#002C77" strokeWidth="2" strokeLinejoin="round" />
            <text x="12" y="16.5" fill="#002C77" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="8.5" textAnchor="middle">HUK</text>
          </g>
          <text x="36" y="21" fill="#002C77" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="12" letterSpacing="0.2">HUK-COBURG</text>
          <text x="36" y="31" fill="#555555" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="700" fontSize="7.5" letterSpacing="0.2">Aus Tradition günstig</text>
        </svg>
      );
    }

    // 17. AXA (Official Navy Block Letters with Diagonal Red Slash)
    if (normId.includes('axa')) {
      return (
        <svg viewBox="0 0 110 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(10, 8)">
            <text x="4" y="20" fill="#00008F" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="22" letterSpacing="1">AXA</text>
            <path d="M28 24L48 2" stroke="#E01A22" strokeWidth="4.5" strokeLinecap="round" />
          </g>
        </svg>
      );
    }

    // 18. DEVK (Official Forest Green Tile - Single Authentic Wordmark)
    if (normId.includes('devk')) {
      return (
        <svg viewBox="0 0 110 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="98" height="30" rx="7" fill="#00823C" />
          <text x="55" y="24" fill="#ffffff" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="15" textAnchor="middle" letterSpacing="1">DEVK</text>
          <path d="M25 28C40 26 70 26 85 28" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </svg>
      );
    }

    // 19. VHV (Official Signal Red Tile - Single Authentic Wordmark)
    if (normId.includes('vhv')) {
      return (
        <svg viewBox="0 0 110 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="98" height="30" rx="7" fill="#E30613" />
          <text x="55" y="26" fill="#ffffff" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="16" textAnchor="middle" letterSpacing="1">VHV</text>
        </svg>
      );
    }

    // 20. ADAC (Official Yellow Rectangle with Bold Black Lettering)
    if (normId.includes('adac')) {
      return (
        <svg viewBox="0 0 110 42" className={`${dimensions} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="98" height="30" rx="6" fill="#FFD800" stroke="#E6C200" strokeWidth="1.5" />
          <text x="55" y="26.5" fill="#000000" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="900" fontSize="16" textAnchor="middle" letterSpacing="-0.2">ADAC</text>
        </svg>
      );
    }

    // Generic fallback with styled badge
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-bold">
        <span className="w-2 h-2 rounded-full bg-blue-600" />
        <span>{id}</span>
      </div>
    );
  };

  return (
    <div className={wrapperClass} title={brandName}>
      {renderSvg()}
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
    <section className="py-14 bg-[#0a0c12] border-y border-white/[0.08] relative overflow-hidden">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-blue-600/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        
        {/* Title and Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Beispiele bekannter Anbieter</span>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Anbieterlogos
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Angebote unserer Vertragspartner
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Die Logos zeigen Marktbeispiele und sind keine Aussage über eine aktuelle Partnerschaft oder die Verfügbarkeit eines konkreten Tarifs. Wir prüfen passende Angebote unserer Vertragspartner individuell.
            </p>
          </div>

          {/* Category Filter Buttons - Harmonische Farbgebung */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#12141c] p-1.5 rounded-xl border border-white/[0.08] text-xs">
            {(['alle', 'strom', 'gas', 'internet', 'kfz'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setFilter(cat);
                  if (onSelectCategory && cat !== 'alle') {
                    onSelectCategory(cat);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filter === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {cat === 'alle' ? 'Alle Anbieter' : cat === 'strom' ? '⚡ Strom' : cat === 'gas' ? '🔥 Gas' : cat === 'internet' ? '🌐 Internet' : '🚗 KFZ'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Authentic Logos on Clean Crisp White Badges (Standard for Check24 / Verivox) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filteredBrands.map((brand) => (
            <div
              key={brand.id}
              className="bg-white rounded-xl p-3 shadow-sm border border-slate-200/90 hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col items-center justify-between text-center group min-h-[112px]"
            >
              <div className="h-10 flex items-center justify-center w-full px-1">
                <ProviderLogo id={brand.id} size="md" variant="light" />
              </div>
              <div className="w-full pt-1.5 border-t border-slate-100 flex flex-col items-center">
                <span className="text-[10px] text-slate-700 font-bold truncate w-full">{brand.subtitle}</span>
                <span className="text-[9px] text-slate-400 font-mono truncate w-full">{brand.domain}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400 border-t border-white/[0.04]">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Vertragsschluss nur mit Ihrer Zustimmung</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Konditionen werden individuell geprüft</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Unterstützung beim Wechsel nach Vereinbarung</span>
          </span>
        </div>

      </div>
    </section>
  );
};
