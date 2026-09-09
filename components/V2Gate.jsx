'use client'

// Hard migration gate for V1 users.
//
// The V1 screens are gone, so a returning student CANNOT be allowed to browse
// the app on a V1 profile — there is no roadmap, no readiness, no subjects for
// the new UI to render. This blocks the app and sends them into the new
// onboarding. Deliberately NOT dismissible: no "maybe later", no snooze.
//
// Their existing work is untouched — notes, chats and activity are keyed by
// user id and have nothing to do with onboarding.

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Map, Radio, Gauge } from 'lucide-react'

const EXEMPT = ['/onboarding', '/auth', '/admin', '/landing']

export default function V2Gate() {
  const router = useRouter()
  const pathname = usePathname()
  const [needed, setNeeded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (EXEMPT.some((p) => pathname?.startsWith(p))) { setNeeded(false); return }
    let user = null
    try { user = JSON.parse(localStorage.getItem('user') || 'null') } catch (e) { user = null }
    if (!user) return
    // A student who finished V1 but has no V2 profile yet.
    const mustMigrate = user.onboardingCompleted && user.onboarding?.version !== 'v2'
    setNeeded(!!mustMigrate)
  }, [pathname])

  if (!needed) return null

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl"
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-5">
          <Sparkles className="w-7 h-7 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">StudyMaster just got a lot smarter</h2>
        <p className="text-gray-600 mb-6">
          We rebuilt StudyMaster around your goal, not just your subjects. To continue,
          please set up your new profile — it takes about two minutes.
        </p>

        <div className="space-y-3 mb-7">
          {[
            [Map, 'A roadmap built for the course you want to study'],
            [Radio, 'A live AI teacher that reads your notes aloud with you'],
            [Gauge, 'A readiness score that tells you how prepared you really are'],
          ].map(([Icon, text]) => (
            <div key={text} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm text-gray-700 pt-1.5">{text}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mb-5">
          Everything you've already created — your notes, chats and study history — stays exactly where it is.
        </p>

        <button
          onClick={() => router.push('/onboarding')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
        >
          Set up my new profile <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  )
}
