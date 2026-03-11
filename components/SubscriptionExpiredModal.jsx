'use client'

import { useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { buildWhatsAppRenewalLink, getSubscriptionExpiryDate, isSubscriptionExpired } from '@/lib/subscriptionGuard'

export default function SubscriptionExpiredModal() {
  const { user } = useAuth()
  const expired = isSubscriptionExpired(user)

  const whatsappNumber = process.env.NEXT_PUBLIC_RENEWAL_WHATSAPP_NUMBER || ''
  const whatsappLink = useMemo(() => {
    const userLabel = user?.userId || user?.email || user?.username || 'a user'
    return buildWhatsAppRenewalLink(
      whatsappNumber,
      `Hello, my StudyMaster subscription has expired. I want to renew. User: ${userLabel}`
    )
  }, [whatsappNumber, user])

  const expiresOn = getSubscriptionExpiryDate(user)

  if (!expired) return null

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <iconify-icon icon="solar:danger-triangle-bold" width="20" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[#171717]">Subscription Expired</h2>
              <p className="mt-1 text-sm text-[#666666]">
                Your free trial or paid subscription has ended. Only the Settings tab is available until renewal.
              </p>
              {expiresOn && (
                <p className="mt-2 text-xs text-[#8a8a8a]">
                  Expired on {expiresOn.toLocaleDateString()}
                </p>
              )}
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-sm font-medium text-white hover:bg-[#000]"
              >
                <iconify-icon icon="logos:whatsapp-icon" width="16" />
                Chat on WhatsApp
              </a>
              {!!whatsappNumber && (
                <p className="mt-2 text-xs text-[#666666]">
                  Contact: {whatsappNumber}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
