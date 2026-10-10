import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

/** Das Daryos-Pfeilzeichen allein, z. B. für Chat-Symbol oder App-Icon. */
export function DaryosMark({ size = 24, color = '#f97316', strokeWidth = 7, className = '' }: { size?: number; color?: string; strokeWidth?: number; className?: string }) {
  return (
    <svg width={size} height={(size * 80) / 96} viewBox="0 0 96 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M 12 20 C 22 46 38 52 56 48 L 52 26 L 88 49 L 53 72 L 56 56 C 36 58 22 48 12 20 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  // Sizing variants
  const sizeConfig = {
    sm: {
      arrowWidth: 32,
      arrowHeight: 28,
      textSize: 'text-2xl',
      subSize: 'text-[9px]',
      gap: 'gap-2',
    },
    md: {
      arrowWidth: 42,
      arrowHeight: 36,
      textSize: 'text-3xl sm:text-4xl',
      subSize: 'text-[10px] sm:text-[11px]',
      gap: 'gap-2.5',
    },
    lg: {
      arrowWidth: 54,
      arrowHeight: 46,
      textSize: 'text-4xl sm:text-5xl',
      subSize: 'text-xs sm:text-sm',
      gap: 'gap-3',
    },
  }[size];

  return (
    <div className={`flex items-center ${sizeConfig.gap} select-none ${className}`}>
      {/* Exact curved hollow orange arrow matching image.png */}
      <svg
        width={sizeConfig.arrowWidth}
        height={sizeConfig.arrowHeight}
        viewBox="0 0 96 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <path
          d="M 12 20 C 22 46 38 52 56 48 L 52 26 L 88 49 L 53 72 L 56 56 C 36 58 22 48 12 20 Z"
          stroke="#f97316"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Brand Name & Subtitle lockup */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-baseline">
          <span
            className={`${sizeConfig.textSize} font-bold text-[#2563eb] tracking-tight font-logo`}
            style={{
              fontStyle: 'italic',
              textShadow: '0 0 20px rgba(37, 99, 235, 0.25)',
            }}
          >
            Daryos
          </span>
          <span className="text-[#2563eb] text-xs sm:text-sm ml-0.5 font-sans font-bold -translate-y-2">
            ®
          </span>
        </div>

        {showSubtitle && (
          <span
            className={`${sizeConfig.subSize} text-[#a5b4fc]/90 font-medium tracking-tight mt-1 whitespace-nowrap`}
          >
            Strom · Gas · Internet
          </span>
        )}
      </div>
    </div>
  );
};
