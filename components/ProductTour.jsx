'use client'

// First-run walkthrough: spotlights each part of the app and explains it in one
// line, so nobody has to discover Live Teach or the roadmap by accident.
//
// Shown once per USER (persisted server-side via /onboarding/tour-complete), so
// it doesn't replay on a second device, and a migrated V1 student sees it after
// finishing the new onboarding.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const STEPS = [
  {
    target: null, // opening card, centred
    title: 'Welcome to StudyMaster',
    body: "Let me show you around — 30 seconds, then you're on your way.",
  },
  {
    target: '[data-tour="dashboard"]',
    title: 'Dashboard',
    body: 'Your progress at a glance: study time, streaks, and how ready you are for each exam.',
  },
  {
    target: '[data-tour="notes"]',
    title: 'Notes & Live Teach',
    body: 'Ask for any topic and StudyMaster writes the note — then reads it aloud and teaches it live, highlighting each line as it speaks. Hold the mic to interrupt and ask anything.',
  },
  {
    target: '[data-tour="pastquestions"]',
    title: 'Past Questions',
    body: 'Over 23,000 real WAEC and JAMB questions. Search a topic like "number bases" and practise just that.',
  },
  {
    target: '[data-tour="exam"]',
    title: 'Exam Mode',
    body: 'Full timed mock exams, marked instantly — including theory answers, marked by AI.',
  },
  {
    target: '[data-tour="roadmap"]',
    title: 'Your Roadmap',
    body: 'The plan built from your goal. Work through it step by step and watch your readiness climb.',
  },
  {
    target: '[data-tour="coach"]',
    title: 'Coach',
    body: 'Stuck on something? Snap a photo of the question or just ask — your coach explains it properly.',
  },
  {
    target: '[data-tour="community"]',
    title: 'Community',
    body: 'Study alongside other students preparing for the same exams.',
  },
]

const PAD = 8

export default function ProductTour() {
  const [active, setActive] = useState(false)
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const [mounted, setMounted] = useState(false)
  const checked = useRef(false)

  useEffect(() => setMounted(true), [])

  // Decide whether this student still needs the tour.
  useEffect(() => {
    if (checked.current || typeof window === 'undefined') return
    checked.current = true
    const token = localStorage.getItem('token')
    if (!token) return
    let user = null
    try { user = JSON.parse(localStorage.getItem('user') || 'null') } catch (e) { return }
    // Only after they actually have a V2 profile — never during migration.
    if (!user?.onboardingCompleted || user?.onboarding?.version !== 'v2') return
    if (localStorage.getItem('sm_tour_done') === '1') return

    fetch(`${API_URL}/onboarding/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && res.data && !res.data.hasCompletedTour) {
          setTimeout(() => setActive(true), 900) // let the page settle first
        } else {
          localStorage.setItem('sm_tour_done', '1')
        }
      })
      .catch(() => {})
  }, [])

  const step = STEPS[i]

  // Track the highlighted element, following scroll/resize.
  useLayoutEffect(() => {
    if (!active || !step?.target) { setRect(null); return }
    const measure = () => {
      const el = document.querySelector(step.target)
      if (!el) { setRect(null); return }
      const r = el.getBoundingClientRect()
      setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 })
    }
    measure()
    const el = document.querySelector(step.target)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    const t = setInterval(measure, 400) // sidebar can collapse/expand
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      clearInterval(t)
    }
  }, [active, i, step])

  const finish = useCallback(() => {
    setActive(false)
    localStorage.setItem('sm_tour_done', '1')
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`${API_URL}/onboarding/tour-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }, [])

  const next = useCallback(() => {
    setI((p) => (p + 1 < STEPS.length ? p + 1 : (finish(), p)))
  }, [finish])
  const back = useCallback(() => setI((p) => Math.max(0, p - 1)), [])

  useEffect(() => {
    if (!active) return
    const onKey = (e) => {
      if (e.key === 'Escape') finish()
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, next, back, finish])

  if (!mounted || !active) return null

  // Tooltip sits beside the spotlight, or centred for the intro step.
  const tip = { width: 340 }
  let tipStyle
  if (rect) {
    const left = Math.min(rect.left + rect.width + 16, window.innerWidth - tip.width - 16)
    const top = Math.max(16, Math.min(rect.top, window.innerHeight - 240))
    tipStyle = { left, top }
  } else {
    tipStyle = { left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }
  }

  const isLast = i === STEPS.length - 1

  return createPortal(
    <div className="fixed inset-0 z-[120]">
      {/* dim everything, punch a hole around the target */}
      {rect ? (
        <motion.div
          initial={false}
          animate={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          className="absolute rounded-xl ring-2 ring-blue-400"
          style={{ boxShadow: '0 0 0 9999px rgba(15,23,42,0.72)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/72" />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="absolute bg-white rounded-2xl shadow-2xl p-5"
          style={{ ...tipStyle, width: tip.width }}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              {i === 0 && <Sparkles className="w-4 h-4 text-blue-600" />}
              <h3 className="font-bold text-gray-900">{step.title}</h3>
            </div>
            <button onClick={finish} className="text-gray-300 hover:text-gray-600 shrink-0" aria-label="Skip tour">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-4">{step.body}</p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, n) => (
                <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-5 bg-blue-600' : 'w-1.5 bg-gray-200'}`} />
              ))}
            </div>
            <div className="flex items-center gap-1">
              {i > 0 && (
                <button onClick={back} className="p-2 text-gray-400 hover:text-gray-700" aria-label="Back">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={next}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                {isLast ? 'Start studying' : 'Next'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {i === 0 && (
            <button onClick={finish} className="mt-3 text-xs text-gray-400 hover:text-gray-600">
              Skip the tour
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  )
}
