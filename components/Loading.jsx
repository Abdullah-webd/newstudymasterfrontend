'use client'

// Shared loading state: shown while a page/section is fetching, so users never
// see a flash of "No X found" before the data has actually arrived.
export default function Loading({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
      </div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
    </div>
  )
}
