'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Lock, BookOpen, PenLine, Target, RefreshCw, Trophy, Flag,
  X, Loader2, Sparkles, CalendarDays, ChevronRight,
} from 'lucide-react'
import ReadinessCard from '@/components/readiness/ReadinessCard'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const pretty = (slug) =>
  (slug || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

// Build the detailed prompt the notes assistant receives when a student clicks
// "Study with AI" on a roadmap task — so they never have to type it themselves.
const buildStudyPrompt = (t) => {
  const topic = t.topic || t.title
  const subject = t.subject ? ` in ${pretty(t.subject)}` : ''
  const extra = t.description ? ` Focus on: ${t.description}` : ''
  return (
    `Create a detailed but easy-to-understand study note on "${topic}"${subject}.` +
    `${extra} Make sure it covers all the key ideas an exam student needs, explains ` +
    `every hard word simply, includes worked examples, and ends with a quiz so I can test myself.`
  )
}

const TASK_ICON = {
  study: BookOpen,
  practice: PenLine,
  exam: Flag,
  review: RefreshCw,
  milestone: Trophy,
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.max(0, Math.ceil(diff / 86400000))
}

export default function RoadmapContent() {
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState('')
  const [activeLevel, setActiveLevel] = useState(null)
  const [busyTask, setBusyTask] = useState(null)

  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` })

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await fetch(`${API_URL}/roadmap`, { headers: headers() })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not load your roadmap')
      setRoadmap(data.data)
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const regenerate = async () => {
    setRegenerating(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/roadmap/generate`, { method: 'POST', headers: headers() })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not rebuild')
      setRoadmap(data.data)
      setActiveLevel(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setRegenerating(false)
    }
  }

  const completeTask = async (taskId) => {
    setBusyTask(taskId)
    try {
      const res = await fetch(`${API_URL}/roadmap/task/${taskId}/complete`, {
        method: 'POST', headers: headers(),
      })
      if (res.ok) {
        await load()
        // keep the drawer showing the refreshed level
        setActiveLevel((prev) => prev)
      }
    } finally {
      setBusyTask(null)
    }
  }

  if (loading) return <RoadmapLoading />

  if (error && !roadmap) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={load} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium">
          Try again
        </button>
      </div>
    )
  }

  if (!roadmap) return null

  const levels = roadmap.levels || []
  const total = levels.reduce((n, l) => n + (l.tasks?.length || 0), 0)
  const done = levels.reduce((n, l) => n + (l.tasks || []).filter((t) => t.status === 'done').length, 0)
  const pct = total ? Math.round((done / total) * 100) : 0
  const dLeft = daysUntil(roadmap.examDate)
  const currentLevel = levels.find((l) => l.status !== 'done') || levels[levels.length - 1]

  // live version of the open level (so it reflects task completion)
  const openLevel = activeLevel != null ? levels.find((l) => l.order === activeLevel) : null

  return (
    <div className="w-full">
      {/* Readiness */}
      <div className="mb-8">
        <ReadinessCard />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Your Roadmap</h1>
            <p className="text-gray-500 mt-1 max-w-2xl">{roadmap.summary}</p>
          </div>
          <button
            onClick={regenerate}
            disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Rebuild
          </button>
        </div>

        {/* stat row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <Stat label="Progress" value={`${pct}%`} sub={`${done}/${total} tasks`} icon={Target} />
          <Stat label="Weeks" value={levels.length} sub="on your path" icon={CalendarDays} />
          <Stat label="Exam in" value={dLeft != null ? `${dLeft}d` : '—'} sub={roadmap.exams?.join(' · ')} icon={Flag} />
          <Stat label="Target" value={Object.values(roadmap.targetScores || {})[0] ?? '—'} sub={Object.keys(roadmap.targetScores || {})[0] || 'goal'} icon={Trophy} />
        </div>

        {/* progress bar */}
        <div className="h-2 w-full bg-gray-100 rounded-full mt-5 overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
        </div>
      </div>

      {/* The path */}
      <div className="relative max-w-3xl mx-auto pb-16">
        <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-100 via-gray-100 to-gray-100 -z-0" />
        <div className="space-y-6 relative z-10">
          {levels.map((lvl, i) => (
            <LevelNode
              key={lvl.order}
              level={lvl}
              side={i % 2 === 0 ? 'left' : 'right'}
              isCurrent={currentLevel && lvl.order === currentLevel.order}
              onClick={() => lvl.status !== 'locked' && setActiveLevel(lvl.order)}
            />
          ))}
        </div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {openLevel && (
          <LevelDrawer
            level={openLevel}
            onClose={() => setActiveLevel(null)}
            onComplete={completeTask}
            busyTask={busyTask}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function Stat({ label, value, sub, icon: Icon }) {
  return (
    <div className="p-4 rounded-2xl border border-gray-100 bg-white">
      <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-xl font-bold text-gray-900 mt-1">{value}</div>
      <div className="text-xs text-gray-400 truncate">{sub}</div>
    </div>
  )
}

function LevelNode({ level, side, isCurrent, onClick }) {
  const status = level.status
  const doneTasks = (level.tasks || []).filter((t) => t.status === 'done').length
  const totalTasks = level.tasks?.length || 0

  const styles = {
    done: 'bg-gradient-to-tr from-blue-500 to-indigo-500 text-white border-transparent',
    in_progress: 'bg-white text-blue-600 border-blue-400',
    available: 'bg-white text-blue-600 border-blue-300',
    locked: 'bg-gray-50 text-gray-300 border-gray-200',
  }[status]

  return (
    <div className={`flex items-center gap-4 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
      {/* node circle */}
      <motion.button
        whileHover={status !== 'locked' ? { scale: 1.06 } : {}}
        whileTap={status !== 'locked' ? { scale: 0.96 } : {}}
        onClick={onClick}
        disabled={status === 'locked'}
        className={`relative w-16 h-16 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-sm ${styles} ${status === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {status === 'done' ? <Check className="w-7 h-7" />
          : status === 'locked' ? <Lock className="w-5 h-5" />
          : <span className="text-lg font-bold">{level.weekNumber}</span>}
        {isCurrent && status !== 'done' && (
          <motion.span
            className="absolute -inset-1 rounded-2xl border-2 border-blue-400"
            animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 1.8, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* card */}
      <button
        onClick={onClick}
        disabled={status === 'locked'}
        className={`flex-1 text-left p-4 rounded-2xl border transition-all ${status === 'locked' ? 'border-gray-100 bg-gray-50/50 opacity-70 cursor-not-allowed' : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm'} ${side === 'right' ? 'text-right' : ''}`}
      >
        <div className={`flex items-center gap-2 ${side === 'right' ? 'justify-end' : ''}`}>
          <span className="text-[11px] uppercase tracking-wide font-semibold text-blue-500">
            {isCurrent ? 'This week' : `Week ${level.weekNumber}`}
          </span>
        </div>
        <div className="font-semibold text-gray-900 mt-0.5">{level.title}</div>
        {level.goal && <div className="text-sm text-gray-500 mt-0.5 line-clamp-2">{level.goal}</div>}
        <div className={`flex items-center gap-2 mt-2 ${side === 'right' ? 'justify-end' : ''}`}>
          {(level.subjectsFocus || []).slice(0, 3).map((s) => (
            <span key={s} className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{pretty(s)}</span>
          ))}
          {status !== 'locked' && (
            <span className="text-[11px] text-gray-400">{doneTasks}/{totalTasks}</span>
          )}
        </div>
      </button>
    </div>
  )
}

function LevelDrawer({ level, onClose, onComplete, busyTask }) {
  const router = useRouter()
  // Hand the task to the notes assistant: jump to /notes and auto-send the prompt.
  const studyWithAI = (t) => {
    router.push(`/notes?autoprompt=${encodeURIComponent(buildStudyPrompt(t))}`)
  }
  // Hand a practice task to Past Questions: auto-filters the topic and drops the
  // student straight into the questions.
  const practiceTask = (t) => {
    const params = new URLSearchParams({
      subject: t.subject || '',
      topic: t.topic || t.title || '',
      count: String(t.targetCount || 20),
    })
    router.push(`/pastquestions?${params.toString()}`)
  }
  return (
    <>
      <motion.div className="fixed inset-0 bg-black/30 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        className="fixed z-50 bg-white shadow-2xl overflow-y-auto
          inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh]
          md:inset-y-0 md:right-0 md:left-auto md:w-[440px] md:max-h-none md:rounded-none"
        initial={{ y: '100%', opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.6 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-gray-100 p-5 flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase font-semibold text-blue-500">Week {level.weekNumber}</div>
            <h2 className="text-lg font-bold text-gray-900">{level.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-5">
          {level.goal && (
            <div className="mb-5 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-sm text-gray-700 flex gap-2">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />{level.goal}
            </div>
          )}

          <div className="space-y-3">
            {(level.tasks || []).map((t) => {
              const Icon = TASK_ICON[t.type] || BookOpen
              const isDone = t.status === 'done'
              return (
                <div key={t.id} className={`p-4 rounded-2xl border ${isDone ? 'border-green-100 bg-green-50/40' : 'border-gray-100 bg-white'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDone ? 'bg-green-500 text-white' : 'bg-blue-50 text-blue-600'}`}>
                      {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{t.title}</div>
                      {t.subject && <div className="text-[11px] text-gray-400 capitalize">{pretty(t.subject)}{t.topic ? ` · ${t.topic}` : ''}</div>}
                      {t.description && <div className="text-sm text-gray-500 mt-1">{t.description}</div>}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                        <span className="capitalize">{t.type}</span>
                        {t.targetCount > 0 && <span>{t.targetCount} questions</span>}
                        {t.estMinutes > 0 && <span>~{t.estMinutes} min</span>}
                      </div>
                    </div>
                  </div>
                  {!isDone && (
                    <div className="mt-3 flex gap-2">
                      {(t.type === 'study' || t.type === 'review') && (
                        <button
                          onClick={() => studyWithAI(t)}
                          className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                          <Sparkles className="w-4 h-4" /> Study with AI
                        </button>
                      )}
                      {(t.type === 'practice' || t.type === 'exam') && t.subject && (
                        <button
                          onClick={() => practiceTask(t)}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                          <PenLine className="w-4 h-4" /> Practice
                        </button>
                      )}
                      <button
                        onClick={() => onComplete(t.id)}
                        disabled={busyTask === t.id}
                        className={`${((t.type === 'study' || t.type === 'review') || ((t.type === 'practice' || t.type === 'exam') && t.subject)) ? 'flex-1' : 'w-full'} py-2 rounded-xl bg-gray-900 text-white text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50`}
                      >
                        {busyTask === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Mark done <Check className="w-4 h-4" /></>}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </motion.aside>
    </>
  )
}

function RoadmapLoading() {
  const steps = [
    'Checking your exam dates…',
    'Sequencing your subjects & topics…',
    'Balancing time toward your target…',
    'Laying out your weekly path…',
  ]
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % steps.length), 2200)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-xl mb-6">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Sparkles className="w-7 h-7 text-white" />
        </motion.div>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Building your roadmap</h2>
      <AnimatePresence mode="wait">
        <motion.p key={i} className="text-gray-500"
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
          {steps[i]}
        </motion.p>
      </AnimatePresence>
      <p className="text-xs text-gray-400 mt-6">This takes a moment the first time — we only build it once.</p>
    </div>
  )
}
