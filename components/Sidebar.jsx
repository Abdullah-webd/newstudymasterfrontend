'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { isSubscriptionExpired } from '@/lib/subscriptionGuard'

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const subscriptionExpired = isSubscriptionExpired(user)

  // Collapsible (desktop): remembered per browser.
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    try { setCollapsed(localStorage.getItem('sm_sidebar_collapsed') === '1') } catch (e) {}
    // Pages (e.g. Coach) can ask the sidebar to collapse/expand.
    const onSet = (e) => setCollapsed(!!e.detail)
    window.addEventListener('sm-sidebar-collapse', onSet)
    return () => window.removeEventListener('sm-sidebar-collapse', onSet)
  }, [])
  const toggle = () => {
    setCollapsed((v) => {
      try { localStorage.setItem('sm_sidebar_collapsed', v ? '0' : '1') } catch (e) {}
      return !v
    })
  }

  const navItems = [
    { icon: 'solar:widget-linear', label: 'Dashboard', href: '/dashboard' },
    { icon: 'solar:document-text-linear', label: 'Note Generation', href: '/notes' },
    { icon: 'solar:book-bookmark-linear', label: 'Past Questions', href: '/pastquestions' },
    { icon: 'solar:pen-new-square-linear', label: 'Exam', href: '/exam' },
    { icon: 'solar:map-arrow-square-linear', label: 'Roadmap', href: '/roadmap' },
    { icon: 'solar:user-speak-rounded-linear', label: 'Coach', href: '/coach' },
    { icon: 'solar:users-group-two-rounded-linear', label: 'Community', href: '/community' },
    { icon: 'solar:gamepad-linear', label: 'Gaming', href: '/gaming' },
  ]

  const settingsItem = { icon: 'solar:settings-linear', label: 'Settings', href: '/settings' }

  return (
    <aside className={`hidden md:flex flex-col border-r border-[#EAEAEA] bg-white h-screen sticky top-0 py-6 shrink-0 z-10 transition-all duration-300 ${collapsed ? 'w-16 px-2' : 'w-64 px-4'}`}>
      {/* Logo + collapse toggle */}
      <div className={`flex items-center mb-8 ${collapsed ? 'flex-col gap-3 px-0' : 'justify-between px-2'}`}>
        <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
          <img src="/logo.png" alt="StudyMaster" className="w-7 h-7 rounded-md object-contain" />
          {!collapsed && <span className="text-sm font-medium tracking-tight">StudyMaster</span>}
        </Link>
        <button
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-md text-[#999] hover:text-[#171717] hover:bg-[#F5F5F5] transition-colors"
        >
          <iconify-icon
            icon={collapsed ? 'solar:alt-arrow-right-linear' : 'solar:alt-arrow-left-linear'}
            width="16" height="16"
          />
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item, index) => {
          const isActive = pathname.startsWith(item.href)
          const isDisabled = subscriptionExpired && item.label !== 'Gaming'
          return (
            <Link
              key={index}
              href={isDisabled ? '#' : item.href}
              onClick={(event) => { if (isDisabled) event.preventDefault() }}
              aria-disabled={isDisabled}
              data-tour={item.href.slice(1)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 py-1.5 rounded-md transition-colors ${collapsed ? 'justify-center px-0' : 'px-2'} ${isActive
                ? 'bg-[#F5F5F5] text-[#171717]'
                : isDisabled
                  ? 'text-[#B8B8B8] cursor-not-allowed'
                  : 'text-[#666666] hover:text-[#171717] hover:bg-[#FAFAFA]'
                }`}
            >
              <iconify-icon icon={item.icon} width="18" height="18" strokeWidth="1.5" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="mt-auto">
        <Link
          href={settingsItem.href}
          title={collapsed ? settingsItem.label : undefined}
          className={`flex items-center gap-3 py-1.5 rounded-md transition-colors ${collapsed ? 'justify-center px-0' : 'px-2'} ${pathname.startsWith('/settings')
            ? 'bg-[#F5F5F5] text-[#171717]'
            : 'text-[#666666] hover:text-[#171717] hover:bg-[#FAFAFA]'
            }`}
        >
          <iconify-icon icon={settingsItem.icon} width="18" height="18" strokeWidth="1.5" />
          {!collapsed && <span className="text-sm">{settingsItem.label}</span>}
        </Link>
      </div>
    </aside>
  )
}
