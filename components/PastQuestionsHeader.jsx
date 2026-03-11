'use client';

export default function PastQuestionsHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="text-xl font-semibold tracking-tighter cursor-pointer">PQ.</div>
        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-gray-900 transition-colors">
            <iconify-icon icon="solar:user-circle-linear" className="text-xl"></iconify-icon>
          </button>
        </div>
      </div>
    </header>
  );
}
