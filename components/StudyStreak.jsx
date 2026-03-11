'use client'

export default function StudyStreak() {
  return (
    <section className="bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
        <iconify-icon icon="solar:fire-linear" width="120" />
      </div>
      <div className="flex items-center gap-3 mb-3 relative z-10">
        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
          <iconify-icon icon="solar:fire-linear" width="18" className="text-orange-500" />
        </div>
        <h2 className="text-lg font-medium tracking-tight text-[#171717]">5 Day Streak</h2>
      </div>
      <p className="text-sm text-[#666666] relative z-10 leading-relaxed">
        "Consistency beats talent. Study a little every day and success will follow."
      </p>
    </section>
  )
}
