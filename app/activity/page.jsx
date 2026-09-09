'use client'

import { useState, useEffect, useCallback } from 'react'
import MainLayout from '@/components/MainLayout'
import Loading from '@/components/Loading'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const TYPE_META = {
  note_creation: { icon: 'solar:document-add-linear', label: 'Created a note', color: 'bg-blue-50 text-blue-600' },
  note_study: { icon: 'solar:book-open-linear', label: 'Studied a note', color: 'bg-indigo-50 text-indigo-600' },
  quiz_study: { icon: 'solar:checklist-minimalistic-linear', label: 'Took a quiz', color: 'bg-emerald-50 text-emerald-600' },
  past_question_study: { icon: 'solar:book-bookmark-linear', label: 'Practised past questions', color: 'bg-amber-50 text-amber-600' },
  ai_chat: { icon: 'solar:user-speak-rounded-linear', label: 'Talked to the Coach', color: 'bg-purple-50 text-purple-600' },
  app_session: { icon: 'solar:monitor-linear', label: 'Study session', color: 'bg-gray-50 text-gray-500' },
  diagnostic: { icon: 'solar:target-linear', label: 'Baseline test', color: 'bg-rose-50 text-rose-600' },
  exam: { icon: 'solar:pen-new-square-linear', label: 'Took an exam', color: 'bg-cyan-50 text-cyan-600' },
  roadmap_task: { icon: 'solar:map-arrow-square-linear', label: 'Roadmap task', color: 'bg-teal-50 text-teal-600' },
}

function timeAgo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) + ' · ' +
    d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(secs) {
  if (!secs) return null
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.round(secs / 60)} min`
  return `${(secs / 3600).toFixed(1)} hr`
}

function detail(a) {
  const m = a.metadata || {}
  if (m.title) return m.title
  if (m.score !== undefined && m.total !== undefined) return `Scored ${m.score}/${m.total}`
  if (m.subject) return String(m.subject).replace(/-/g, ' ')
  if (m.noteTitle) return m.noteTitle
  return null
}

export default function ActivityPage() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (p) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/activity?page=${p}&limit=30`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      const data = await res.json()
      if (data.success) {
        setItems((prev) => (p === 1 ? data.data : [...prev, ...data.data]))
        setPages(data.pagination.pages)
        setTotal(data.pagination.total)
        setPage(p)
      }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(1) }, [load])

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your activity</h1>
          <p className="text-sm text-gray-500 mt-1">Everything you've done on StudyMaster — {total} activities and counting. It all feeds your readiness.</p>
        </div>

        {loading && items.length === 0 && <Loading label="Loading your activity…" />}

        <div className="space-y-3">
          {items.map((a) => {
            const meta = TYPE_META[a.type] || TYPE_META.app_session
            const d = detail(a)
            const dur = fmtDuration(a.duration)
            return (
              <div key={a._id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                  <iconify-icon icon={meta.icon} width="20" height="20" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{meta.label}</div>
                  {d && <div className="text-xs text-gray-500 truncate">{d}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-400">{timeAgo(a.createdAt)}</div>
                  {dur && <div className="text-[11px] font-semibold text-indigo-500 mt-0.5">{dur}</div>}
                </div>
              </div>
            )
          })}
          {!loading && items.length === 0 && (
            <div className="text-center text-gray-400 py-16">No activity yet — start studying and it'll show up here.</div>
          )}
        </div>

        {page < pages && (
          <button onClick={() => load(page + 1)} disabled={loading}
            className="mt-6 w-full py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            {loading ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </MainLayout>
  )
}
