import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'brand', trend, onClick }) {
  const colorMap = {
    brand: {
      bg: 'bg-brand-50 text-brand-600',
      border: 'border-brand-100 hover:border-brand-300',
      glow: 'group-hover:bg-brand-500/10'
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100 hover:border-emerald-300',
      glow: 'group-hover:bg-emerald-500/10'
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100 hover:border-amber-300',
      glow: 'group-hover:bg-amber-500/10'
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100 hover:border-blue-300',
      glow: 'group-hover:bg-blue-500/10'
    },
    slate: {
      bg: 'bg-slate-100 text-slate-700',
      border: 'border-slate-200 hover:border-slate-300',
      glow: 'group-hover:bg-slate-500/10'
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      border: 'border-rose-100 hover:border-rose-300',
      glow: 'group-hover:bg-rose-500/10'
    }
  };

  const scheme = colorMap[color] || colorMap.brand;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-white p-5 rounded-xl border ${scheme.border} shadow-sm transition-all duration-200 hover:shadow-card-hover ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="text-2xl font-bold text-slate-900 font-display tracking-tight">{value}</div>
        </div>
        <div className={`p-3 rounded-xl ${scheme.bg} transition-colors duration-200`}>
          {Icon && <Icon className="w-5 h-5 stroke-[2.2]" />}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span className={`font-semibold ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
