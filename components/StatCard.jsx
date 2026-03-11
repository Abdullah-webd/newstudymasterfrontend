import Link from 'next/link'

export default function StatCard({ icon, value, label, badge, badgeColor = 'green', href }) {
  const badgeColors = {
    green: 'text-green-600 bg-green-50',
    default: 'text-gray-600 bg-gray-50'
  }

  const CardContent = (
    <div className="bg-white border border-[#EAEAEA] rounded-xl p-4 shadow-sm flex flex-col justify-between h-32 hover:border-[#D4D4D4] transition-colors cursor-pointer w-full h-full">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] flex items-center justify-center">
          <iconify-icon icon={icon} width="16" className="text-[#171717]" />
        </div>
        {badge && (
          <span className={`text-xs ${badgeColors[badgeColor]} px-1.5 py-0.5 rounded flex items-center gap-0.5`}>
            <iconify-icon icon="solar:arrow-up-linear" width="10" />
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl tracking-tight font-medium text-[#171717]">{value}</p>
        <p className="text-xs text-[#666666] mt-0.5">{label}</p>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block w-full h-full">
        {CardContent}
      </Link>
    )
  }

  return CardContent
}
