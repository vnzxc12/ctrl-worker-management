import React from 'react';

export default function Logo({ variant = 'full', size = 'default', className = '', light = false }) {
  // Size presets
  const sizes = {
    sm: { badge: 'w-7 h-7', text: 'text-xs', mark: 'text-[9px]' },
    default: { badge: 'w-9 h-9', text: 'text-sm', mark: 'text-[11px]' },
    lg: { badge: 'w-12 h-12', text: 'text-base', mark: 'text-sm' },
    xl: { badge: 'w-16 h-16', text: 'text-xl', mark: 'text-base' },
  };

  const currentSize = sizes[size] || sizes.default;

  const BadgeIcon = (
    <div className={`relative flex items-center justify-center bg-gradient-to-br from-[#E63917] to-[#C92A0E] text-white font-extrabold rounded-lg shadow-sm flex-shrink-0 ${currentSize.badge} ${className}`}>
      {/* Stylized 'C' Emblem */}
      <svg viewBox="0 0 100 100" className="w-[72%] h-[72%] fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M 50 12 C 29.01 12 12 29.01 12 50 C 12 70.99 29.01 88 50 88 C 67.5 88 82.2 76.1 86.4 60 L 71.2 56.5 C 68.2 66.8 59.8 74 50 74 C 36.75 74 26 63.25 26 50 C 26 36.75 36.75 26 50 26 C 59.8 26 68.2 33.2 71.2 43.5 L 86.4 40 C 82.2 23.9 67.5 12 50 12 Z" />
        <circle cx="50" cy="50" r="14" className="fill-[#E63917]" />
        <path d="M 45 42 L 58 50 L 45 58 Z" fill="white" />
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return BadgeIcon;
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {BadgeIcon}
      <div className="flex flex-col leading-[1.05] tracking-tight">
        <div className={`font-black tracking-wider uppercase ${light ? 'text-white' : 'text-[#E63917]'} ${currentSize.text} font-display`}>
          CTRL
        </div>
        <div className={`font-bold tracking-tight uppercase ${light ? 'text-slate-200' : 'text-[#E63917]'} ${currentSize.mark} font-display`}>
          CONSTRUCTION
        </div>
        <div className={`font-extrabold tracking-widest uppercase ${light ? 'text-slate-300' : 'text-[#E63917]'} text-[8px] opacity-95 font-display`}>
          CORP.
        </div>
      </div>
    </div>
  );
}
