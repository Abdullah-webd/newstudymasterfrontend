'use client'

import PlanItem from './PlanItem'

export default function TodaysPlan() {
  const planItems = [
    {
      time: '4:00 PM - 5:30 PM',
      subject: 'Mathematics',
      description: 'Past questions practice',
      active: true
    },
    {
      time: '6:00 PM - 7:00 PM',
      subject: 'Biology',
      description: 'Review AI notes'
    },
    {
      time: '8:00 PM - 9:30 PM',
      subject: 'Physics',
      description: 'Mock exam section'
    }
  ]

  return (
    <section className="bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-medium text-[#171717]">Today's Plan</h2>
        <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#FAFAFA] border border-transparent hover:border-[#EAEAEA] transition-all">
          <iconify-icon icon="solar:add-square-linear" width="16" className="text-[#666666]" />
        </button>
      </div>

      <div className="relative border-l border-[#EAEAEA] ml-2.5 space-y-6 pb-2">
        {planItems.map((item, index) => (
          <PlanItem key={index} {...item} />
        ))}
      </div>
    </section>
  )
}
