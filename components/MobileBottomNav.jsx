'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { isSubscriptionExpired } from '@/lib/subscriptionGuard'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const subscriptionExpired = isSubscriptionExpired(user)

  const navItems = [
    { icon: 'solar:widget-linear', label: 'Dash', href: '/' },
    { icon: 'solar:magic-stick-linear', label: 'Study', href: '/notes' },
    { icon: 'solar:notebook-linear', label: 'My Notes', href: '/notes?view=library' },
    { icon: 'solar:book-bookmark-linear', label: 'Past Q.', href: '/pastquestions' },
    { icon: 'solar:pen-new-square-linear', label: 'Exam', href: '/exam' },
    { icon: 'solar:calendar-linear', label: 'Time', href: '/timetable' },
    { icon: 'solar:user-speak-rounded-linear', label: 'Coach', href: '/coach' },
    { icon: 'solar:users-group-two-rounded-linear', label: 'Comm.', href: '/community' },
    { icon: 'solar:settings-linear', label: 'Settings', href: '/settings' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-[#EAEAEA] z-50 px-2 pb-safe pt-2 overflow-x-auto">
      <div className="flex items-center justify-between min-w-max px-2 gap-6 pb-2">
        {navItems.map((item, index) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const isSettings = item.href.startsWith('/settings')
          const isDisabled = subscriptionExpired && !isSettings
          return (
            <Link
              key={index}
              href={isDisabled ? '#' : item.href}
              onClick={(event) => {
                if (isDisabled) event.preventDefault()
              }}
              aria-disabled={isDisabled}
              className={`flex flex-col items-center gap-1 min-w-[48px] ${isActive
                ? 'text-[#171717]'
                : isDisabled
                  ? 'text-[#D0D0D0]'
                  : 'text-[#A3A3A3] hover:text-[#171717]'
                }`}
            >
              <iconify-icon icon={item.icon} width="20" strokeWidth="1.5" />
              <span className={`text-[10px] ${isActive ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
