'use client'

export default function NoteCard({ subject, subjectColor, title, description, date, onOpen, onDelete }) {
  const subjectColors = {
    biology: 'bg-emerald-50 text-emerald-600',
    physics: 'bg-blue-50 text-blue-600',
    chemistry: 'bg-amber-50 text-amber-600',
    math: 'bg-purple-50 text-purple-600',
    history: 'bg-orange-50 text-orange-600',
  }

  const colorClass = subjectColors[subjectColor?.toLowerCase()] || subjectColors.biology

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <span className={`${colorClass} px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider`}>
          {subject}
        </span>
        <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
          >
            <iconify-icon icon="solar:trash-bin-minimalistic-linear" width="16" height="16"></iconify-icon>
          </button>
        </div>
      </div>
      <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
        {title}
      </h3>
      <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
        {description || "No description available."}
      </p>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
        <span className="text-[10px] text-slate-400 uppercase font-medium">
          {new Date(date).toLocaleDateString()}
        </span>
        <button
          onClick={onOpen}
          className="text-xs font-semibold flex items-center gap-1 text-slate-900 hover:text-indigo-600 transition-colors"
        >
          Open Note
          <iconify-icon icon="solar:arrow-right-linear" width="14" height="14"></iconify-icon>
        </button>
      </div>
    </div>
  )
}
