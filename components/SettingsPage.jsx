'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { buildWhatsAppRenewalLink, getSubscriptionExpiryDate, isSubscriptionExpired } from '@/lib/subscriptionGuard'

export default function SettingsPage() {
    const { user, logout, changePassword, refreshUser } = useAuth()
    const subscriptionExpired = isSubscriptionExpired(user)
    const expiresOn = getSubscriptionExpiryDate(user)
    const whatsappNumber = process.env.NEXT_PUBLIC_RENEWAL_WHATSAPP_NUMBER || ''
    const renewalLink = useMemo(() => {
        const userId = user?.userId || user?.email || user?.username || 'unknown user'
        return buildWhatsAppRenewalLink(
            whatsappNumber,
            `Hello admin, my StudyMaster subscription is expired. I want to renew. User ID: ${userId}`
        )
    }, [user, whatsappNumber])

    // Change Password State
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
    const [pwLoading, setPwLoading] = useState(false)
    const [pwMsg, setPwMsg] = useState(null) // { type: 'success'|'error', text: string }

    // Copy state
    const [copied, setCopied] = useState(false)
    const [refreshLoading, setRefreshLoading] = useState(false)
    const [refreshMsg, setRefreshMsg] = useState(null)

    const handleCopyUserId = () => {
        if (!user?.userId) return
        navigator.clipboard.writeText(user.userId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        setPwMsg(null)

        if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
            setPwMsg({ type: 'error', text: 'Please fill in all fields.' })
            return
        }
        if (pwForm.newPw.length < 6) {
            setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' })
            return
        }
        if (pwForm.newPw !== pwForm.confirm) {
            setPwMsg({ type: 'error', text: 'New passwords do not match.' })
            return
        }

        setPwLoading(true)
        const result = await changePassword(pwForm.current, pwForm.newPw)
        setPwLoading(false)

        if (result.success) {
            setPwMsg({ type: 'success', text: result.message })
            setPwForm({ current: '', newPw: '', confirm: '' })
        } else {
            setPwMsg({ type: 'error', text: result.message })
        }
    }

    const handleRefreshStatus = async () => {
        setRefreshMsg(null)
        setRefreshLoading(true)
        const result = await refreshUser()
        setRefreshLoading(false)
        setRefreshMsg({
            type: result.success ? 'success' : 'error',
            text: result.message
        })
    }

    const subscriptionLabel = (plan) => {
        const map = {
            'free': 'Free',
            '1-day-free-trial': 'Free Trial',
            'basic': 'Basic',
            'pro': 'Pro',
            'premium': 'Premium',
        }
        return map[plan] || (plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Free')
    }

    return (
        <div className="max-w-2xl mx-auto w-full py-4 space-y-6">

            {/* Page header */}
            <div>
                <h1 className="text-xl font-semibold text-[#171717]">Settings</h1>
                <p className="text-sm text-[#888] mt-0.5">Manage your account preferences</p>
            </div>

            {subscriptionExpired && (
                <section className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-2">
                        <iconify-icon icon="solar:danger-triangle-linear" width="18" className="text-red-600 mt-0.5" />
                        <div>
                            <h2 className="text-sm font-semibold text-red-700">Subscription Expired</h2>
                            <p className="text-sm text-red-700/90">
                                Your subscription has expired. To renew, chat with admin on WhatsApp and send your User ID.
                            </p>
                            {expiresOn && (
                                <p className="text-xs text-red-700/80 mt-1">
                                    Expired on {expiresOn.toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href={renewalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-3 py-2 text-sm font-medium text-white hover:bg-[#000]"
                        >
                            <iconify-icon icon="logos:whatsapp-icon" width="16" />
                            Chat on WhatsApp
                        </a>
                        {!!whatsappNumber && (
                            <span className="text-xs text-red-700/80">Admin WhatsApp: {whatsappNumber}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleRefreshStatus}
                            disabled={refreshLoading}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {refreshLoading ? 'Refreshing...' : 'Refresh Account Status'}
                        </button>
                        {refreshMsg && (
                            <span className={`text-xs ${refreshMsg.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                                {refreshMsg.text}
                            </span>
                        )}
                    </div>
                </section>
            )}

            {/* ── Account Info ── */}
            <section className="bg-white border border-[#EAEAEA] rounded-xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-[#171717] uppercase tracking-wider">Account Info</h2>

                {/* User ID */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#F9F9F9] border border-[#EAEAEA]">
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs text-[#888] mb-0.5">User ID</span>
                        <span className="text-sm font-mono font-medium text-[#171717] truncate">{user?.userId || '—'}</span>
                    </div>
                    <button
                        onClick={handleCopyUserId}
                        title="Copy User ID"
                        className="ml-3 shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-[#EAEAEA] bg-white text-[#444] hover:bg-[#F5F5F5] transition-colors"
                    >
                        {copied ? (
                            <>
                                <iconify-icon icon="solar:check-circle-linear" width="14" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <iconify-icon icon="solar:copy-linear" width="14" />
                                Copy
                            </>
                        )}
                    </button>
                </div>

                {/* Username */}
                <InfoRow label="Username" value={user?.username} icon="solar:user-circle-linear" />

                {/* Email */}
                <InfoRow label="Email address" value={user?.email} icon="solar:letter-linear" />

                {/* Subscription */}
                <div className="flex items-center gap-3 p-3 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center shrink-0">
                        <iconify-icon icon="solar:crown-linear" width="16" className="text-[#666]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#888]">Subscription Plan</p>
                        <p className="text-sm font-medium text-[#171717]">{subscriptionLabel(user?.subscription?.plan)}</p>
                    </div>
                    {user?.subscription?.expirationDate && (
                        <span className="text-xs text-[#888] shrink-0">
                            Expires {new Date(user.subscription.expirationDate).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </section>

            {/* ── Change Password ── */}
            <section className="bg-white border border-[#EAEAEA] rounded-xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-[#171717] uppercase tracking-wider">Change Password</h2>

                {user?.googleId && !user?.password ? (
                    <p className="text-sm text-[#888] bg-[#F9F9F9] rounded-lg p-4 border border-[#EAEAEA]">
                        <iconify-icon icon="solar:info-circle-linear" width="16" className="inline mr-1.5" />
                        Password change is not available for Google sign-in accounts.
                    </p>
                ) : (
                    <form onSubmit={handleChangePassword} className="space-y-3">
                        <PasswordField
                            label="Current Password"
                            value={pwForm.current}
                            onChange={v => setPwForm(f => ({ ...f, current: v }))}
                            autoComplete="current-password"
                        />
                        <PasswordField
                            label="New Password"
                            value={pwForm.newPw}
                            onChange={v => setPwForm(f => ({ ...f, newPw: v }))}
                            autoComplete="new-password"
                        />
                        <PasswordField
                            label="Confirm New Password"
                            value={pwForm.confirm}
                            onChange={v => setPwForm(f => ({ ...f, confirm: v }))}
                            autoComplete="new-password"
                        />

                        {pwMsg && (
                            <div className={`flex items-start gap-2 text-sm p-3 rounded-lg ${pwMsg.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-600 border border-red-200'
                                }`}>
                                <iconify-icon
                                    icon={pwMsg.type === 'success' ? 'solar:check-circle-linear' : 'solar:danger-circle-linear'}
                                    width="16"
                                    className="shrink-0 mt-0.5"
                                />
                                {pwMsg.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={pwLoading}
                            className="w-full mt-1 py-2.5 rounded-lg bg-[#171717] text-white text-sm font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {pwLoading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Updating…
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>
                )}
            </section>

            {/* ── Danger Zone ── */}
            <section className="bg-white border border-red-100 rounded-xl p-6 space-y-3">
                <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wider">Account Actions</h2>
                <p className="text-sm text-[#888]">You will be signed out of all devices.</p>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                >
                    <iconify-icon icon="solar:logout-2-linear" width="16" />
                    Log Out
                </button>
            </section>

        </div>
    )
}

// ── Helper sub-components ──────────────────────────────────────────

function InfoRow({ label, value, icon }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center shrink-0">
                <iconify-icon icon={icon} width="16" className="text-[#666]" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-[#888]">{label}</p>
                <p className="text-sm font-medium text-[#171717] truncate">{value || '—'}</p>
            </div>
        </div>
    )
}

function PasswordField({ label, value, onChange, autoComplete }) {
    const [show, setShow] = useState(false)
    return (
        <div>
            <label className="block text-xs text-[#888] mb-1">{label}</label>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    autoComplete={autoComplete}
                    required
                    className="w-full px-3 py-2.5 pr-10 text-sm border border-[#EAEAEA] rounded-lg bg-[#F9F9F9] text-[#171717] placeholder:text-[#BBB] focus:outline-none focus:ring-2 focus:ring-[#171717]/10 focus:border-[#171717] transition-colors"
                    placeholder="••••••••"
                />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#444] transition-colors"
                >
                    <iconify-icon icon={show ? 'solar:eye-closed-linear' : 'solar:eye-linear'} width="16" />
                </button>
            </div>
        </div>
    )
}
