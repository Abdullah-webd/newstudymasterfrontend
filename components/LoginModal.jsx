'use client'

import { useEffect, useId, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function LoginModal({ open, onClose, redirectTo }) {
  const { login, googleLogin } = useAuth()
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const buttonId = useId()

  useEffect(() => {
    if (!open) return

    setError('')
    setGoogleReady(false)
    setEmail('')
    setPassword('')

    /* global google */
    if (typeof window !== 'undefined' && window.google) {
      setGoogleReady(true)
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        callback: async (response) => {
          setLoading(true)
          const result = await googleLogin(response.credential, { redirectTo })
          setLoading(false)
          if (!result.success) {
            setError(result.message)
            return
          }
          onClose()
        },
      })

      const target = document.getElementById(buttonId)
      if (target) {
        target.innerHTML = ''
        window.google.accounts.id.renderButton(target, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          shape: 'pill',
        })
      }
    }
  }, [open, buttonId, googleLogin, onClose, redirectTo])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(email, password)
    setLoading(false)

    if (result.success) {
      onClose()
      return
    }

    if (result.needsVerification) {
      router.push(`/auth/verify-otp?email=${encodeURIComponent(result.email)}`)
      onClose()
      return
    }

    setError(result.message || 'Login failed.')
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
          aria-label="Close login modal"
        >
          <iconify-icon icon="solar:close-circle-linear" width="24"></iconify-icon>
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-500 to-teal-500 rounded-2xl mb-3 shadow-lg shadow-blue-500/20">
            <iconify-icon icon="solar:lock-password-bold-duotone" className="text-2xl text-white"></iconify-icon>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Log in to continue</h2>
          <p className="text-sm text-slate-500 mt-1">Sign in with email or Google to continue.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-xs py-2.5 px-3 rounded-xl flex items-center gap-2 mb-4">
            <iconify-icon icon="solar:danger-triangle-linear"></iconify-icon>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <iconify-icon icon="solar:letter-linear"></iconify-icon>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <iconify-icon icon="solar:lock-keyhole-linear"></iconify-icon>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? <iconify-icon icon="line-md:loading-twotone-loop"></iconify-icon> : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-100"></span>
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-white px-4 text-slate-400 font-medium">Or continue with</span>
          </div>
        </div>

        <div id={buttonId} className="w-full"></div>

        {!googleReady && (
          <p className="text-xs text-slate-400 mt-3 text-center">Google login is loading...</p>
        )}

        {loading && (
          <div className="mt-4 flex items-center justify-center text-slate-500 text-sm">
            <iconify-icon icon="line-md:loading-twotone-loop"></iconify-icon>
          </div>
        )}
      </div>
    </div>
  )
}
