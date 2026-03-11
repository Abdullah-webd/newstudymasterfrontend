'use client'

export default function MobileHeader() {
  return (
    <header className="md:hidden flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-[#171717] rounded flex items-center justify-center">
          <span className="text-white text-xs font-medium tracking-tighter leading-none">SM</span>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-[#EAEAEA] border border-[#D4D4D4] overflow-hidden flex items-center justify-center">
        <iconify-icon icon="solar:user-linear" width="16" className="text-[#666666]" />
      </div>
    </header>
  )
}
