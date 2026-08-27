import React from 'react';

export function StatusBadge({ status, size = 'sm' }) {
  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';

  const statusStyles = {
    // Employment Statuses
    'Active': 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium',
    'Inactive': 'bg-slate-100 text-slate-600 border border-slate-200 font-medium',
    'On Leave': 'bg-amber-50 text-amber-700 border border-amber-200 font-medium',
    'Suspended': 'bg-rose-50 text-rose-700 border border-rose-200 font-medium',
    'Resigned': 'bg-slate-100 text-slate-500 border border-slate-200',
    'Terminated': 'bg-red-50 text-red-700 border border-red-200 font-medium',
    'End of Contract': 'bg-purple-50 text-purple-700 border border-purple-200',

    // Project / Site Statuses
    'Completed': 'bg-blue-50 text-blue-700 border border-blue-200 font-medium',
    'Planned': 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium',

    // Payroll Statuses
    'Draft': 'bg-slate-100 text-slate-700 border border-slate-200',
    'For Review': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Approved': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Paid': 'bg-brand-50 text-brand-700 border border-brand-200 font-semibold',

    // Document & Compliance Statuses
    'Valid': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Expiring Soon': 'bg-amber-50 text-amber-700 border border-amber-300 font-semibold animate-pulse',
    'Expired': 'bg-red-100 text-red-800 border border-red-300 font-bold',
    'Missing': 'bg-rose-50 text-rose-600 border border-rose-200',

    // Attendance
    'Present': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Late': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Absent': 'bg-rose-50 text-rose-700 border border-rose-200',
    'Half Day': 'bg-blue-50 text-blue-700 border border-blue-200',
  };

  const style = statusStyles[status] || 'bg-slate-100 text-slate-700 border border-slate-200';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses} ${style} select-none`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' || status === 'Valid' || status === 'Approved' ? 'bg-emerald-500' : status === 'Expiring Soon' || status === 'On Leave' || status === 'For Review' ? 'bg-amber-500' : status === 'Expired' || status === 'Terminated' || status === 'Suspended' ? 'bg-red-500' : 'bg-slate-400'}`} />
      {status}
    </span>
  );
}

export function CategoryBadge({ text, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80 ${className}`}>
      {text}
    </span>
  );
}
