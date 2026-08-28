import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pageSize, count, onChange }) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-surface-100 text-sm">
      <span className="text-surface-500">
        {count === 0 ? 'Aucun résultat' : `${((page - 1) * pageSize) + 1}–${Math.min(page * pageSize, count)} sur ${count}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-surface-200 text-surface-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-50"
          aria-label="Page précédente"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {page > 2 && (
          <>
            <button onClick={() => onChange(1)} className="px-2.5 py-1.5 rounded-lg text-surface-600 hover:bg-surface-50">1</button>
            {page > 3 && <span className="px-1 text-surface-400">…</span>}
          </>
        )}
        {page > 1 && (
          <button onClick={() => onChange(page - 1)} className="px-2.5 py-1.5 rounded-lg text-surface-600 hover:bg-surface-50">{page - 1}</button>
        )}
        <span className="px-2.5 py-1.5 rounded-lg bg-primary-500 text-white font-semibold">{page}</span>
        {page < totalPages && (
          <button onClick={() => onChange(page + 1)} className="px-2.5 py-1.5 rounded-lg text-surface-600 hover:bg-surface-50">{page + 1}</button>
        )}
        {page < totalPages - 1 && (
          <>
            {page < totalPages - 2 && <span className="px-1 text-surface-400">…</span>}
            <button onClick={() => onChange(totalPages)} className="px-2.5 py-1.5 rounded-lg text-surface-600 hover:bg-surface-50">{totalPages}</button>
          </>
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-surface-200 text-surface-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-50"
          aria-label="Page suivante"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
