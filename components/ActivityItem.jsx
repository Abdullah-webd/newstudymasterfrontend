'use client'

export default function ActivityItem({ icon, title, subtitle, time }) {
  return (
    <div className="p-4 flex items-start gap-4 hover:bg-[#FAFAFA] transition-colors cursor-default">
      <div className="w-8 h-8 rounded-full bg-[#F5F5F5] border border-[#EAEAEA] flex items-center justify-center shrink-0 mt-0.5">
        <iconify-icon icon={icon} width="16" className="text-[#171717]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#171717] truncate">{title}</p>
        <p className="text-xs text-[#A3A3A3] mt-0.5">{subtitle}</p>
      </div>
      <span className="text-xs text-[#A3A3A3] whitespace-nowrap">{time}</span>
    </div>
  )
}
