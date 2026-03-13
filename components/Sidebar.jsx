'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { isSubscriptionExpired } from '@/lib/subscriptionGuard'

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const subscriptionExpired = isSubscriptionExpired(user)

  const navItems = [
    { icon: 'solar:widget-linear', label: 'Dashboard', href: '/dashboard' },
    { icon: 'solar:document-text-linear', label: 'Note Generation', href: '/notes' },
    { icon: 'solar:book-bookmark-linear', label: 'Past Questions', href: '/pastquestions' },
    { icon: 'solar:pen-new-square-linear', label: 'Exam', href: '/exam' },
    { icon: 'solar:calendar-linear', label: 'Time Table', href: '/timetable' },
    { icon: 'solar:user-speak-rounded-linear', label: 'Coach', href: '/coach' },
    { icon: 'solar:users-group-two-rounded-linear', label: 'Community', href: '/community' },
  ]

  const settingsItem = { icon: 'solar:settings-linear', label: 'Settings', href: '/settings' }

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-[#EAEAEA] bg-white h-screen sticky top-0 py-6 px-4 shrink-0 z-10">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 mb-8 px-2 cursor-pointer">
        <img
          src="/logo.png"
          alt="StudyMaster"
          className="w-7 h-7 rounded-md object-contain"
        />
        <span className="text-sm font-medium tracking-tight">StudyMaster</span>
      </Link>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item, index) => {
          const isActive = pathname.startsWith(item.href)
          const isDisabled = subscriptionExpired
          return (
            <Link
              key={index}
              href={isDisabled ? '#' : item.href}
              onClick={(event) => {
                if (isDisabled) event.preventDefault()
              }}
              aria-disabled={isDisabled}
              className={`flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors ${isActive
                ? 'bg-[#F5F5F5] text-[#171717]'
                : isDisabled
                  ? 'text-[#B8B8B8] cursor-not-allowed'
                  : 'text-[#666666] hover:text-[#171717] hover:bg-[#FAFAFA]'
                }`}
            >
              <iconify-icon icon={item.icon} width="18" height="18" strokeWidth="1.5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="mt-auto">
        <Link
          href={settingsItem.href}
          className={`flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors ${pathname.startsWith('/settings')
            ? 'bg-[#F5F5F5] text-[#171717]'
            : 'text-[#666666] hover:text-[#171717] hover:bg-[#FAFAFA]'
            }`}
        >
          <iconify-icon icon={settingsItem.icon} width="18" height="18" strokeWidth="1.5" />
          <span className="text-sm">{settingsItem.label}</span>
        </Link>
      </div>
    </aside>
  )
}
