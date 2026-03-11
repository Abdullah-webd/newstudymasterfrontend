'use client'

export default function StudyActivityChart({ studyTrend }) {
  // Use real data or fall back to empty
  const rawDays = studyTrend && studyTrend.length > 0
    ? studyTrend
    : [
      { day: 'Mon', hours: 0 },
      { day: 'Tue', hours: 0 },
      { day: 'Wed', hours: 0 },
      { day: 'Thu', hours: 0 },
      { day: 'Fri', hours: 0 },
      { day: 'Sat', hours: 0 },
      { day: 'Sun', hours: 0 }
    ]

  // Get max hours for scaling the bar
  const maxHours = Math.max(...rawDays.map(d => d.hours), 0.1)

  // Today day name for highlighting
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'short' })

  const days = rawDays.map(d => ({
    day: d.day,
    hours: d.hours,
    height: Math.round((d.hours / maxHours) * 100),
    highlight: d.day === todayName
  }))

  return (
    <section className="bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-medium text-[#171717]">Study Activity</h2>
        <span className="text-xs text-[#666666]">Last 7 days</span>
      </div>

      <div className="flex items-end justify-between h-32 gap-1.5 md:gap-3">
        {days.map((item, index) => (
          <div key={index} className="w-full flex flex-col items-center gap-2 group cursor-pointer" title={`${item.hours} hrs`}>
            <div className="w-full bg-[#FAFAFA] border border-[#EAEAEA] rounded-t flex items-end h-24 overflow-hidden relative">
              <div
                className={`w-full transition-colors rounded-t ${item.highlight ? 'bg-[#171717]' : 'bg-[#D4D4D4] group-hover:bg-[#171717]'}`}
                style={{ height: `${Math.max(item.height, item.hours > 0 ? 4 : 0)}%` }}
              ></div>
            </div>
            <span
              className={`text-[10px] uppercase tracking-wider ${item.highlight ? 'text-[#171717] font-medium' : 'text-[#A3A3A3]'
                }`}
            >
              {item.day}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
