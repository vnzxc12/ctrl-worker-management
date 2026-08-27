import React from 'react';
import { Search, FolderOpen, UserX, AlertCircle } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'Try adjusting your search criteria or clearing active filters.',
  icon: Icon = Search,
  actionText,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-slate-200 my-4">
      <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4 ring-8 ring-slate-50/50">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-bold text-slate-800 font-display mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-5">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
