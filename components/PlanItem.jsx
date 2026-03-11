'use client'

export default function PlanItem({ time, subject, description, active = false }) {
  return (
    <div className="relative pl-5">
      <div
        className={`absolute -left-1.5 top-1.5 w-3 h-3 bg-white border-2 rounded-full ${
          active ? 'border-[#171717]' : 'border-[#D4D4D4]'
        }`}
      ></div>
      <p className="text-xs text-[#A3A3A3] mb-0.5">{time}</p>
      <p className="text-sm text-[#171717] font-medium">{subject}</p>
      <p className="text-xs text-[#666666] mt-1">{description}</p>
    </div>
  )
}
