'use client';

export default function ExamHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div className="text-xl font-semibold tracking-tighter">SM</div>
        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-slate-900 transition-colors">
            <iconify-icon icon="solar:bell-linear" width="24" height="24"></iconify-icon>
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-medium">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}
