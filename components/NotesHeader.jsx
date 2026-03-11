'use client'

export default function NotesHeader({ onSwitchView, currentView }) {
  return (
    <header className={`${currentView === 'study' ? 'hidden md:flex' : 'flex'} h-16 border-b border-slate-100 items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-50`}>
      <div className="flex items-center gap-8">
        <span className="text-xl font-semibold tracking-tighter uppercase md:hidden">SM</span>
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => onSwitchView('study')}
            className={`text-sm font-medium transition-colors ${currentView === 'study' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
          >
            Study Room
          </button>
          <button
            onClick={() => onSwitchView('library')}
            className={`text-sm font-medium transition-colors ${currentView === 'library' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
          >
            My Notes
          </button>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600">
          <iconify-icon icon="solar:crown-minimalistic-linear" width="16" height="16" style={{ strokeWidth: 1.5 }}></iconify-icon>
          Pro Plan
        </button>
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
          <iconify-icon icon="solar:user-linear" width="18" height="18"></iconify-icon>
        </div>
      </div>
    </header>
  )
}
