'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts'
import { TrendingUp, Info, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL
const EXAM_COLORS = { JAMB: '#2563eb', WAEC: '#7c3aed' }

const pretty = (s) => (s || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

function Ring({ exam, prob, target, confidence }) {
  const pct = Math.round((prob || 0) * 100)
  const color = EXAM_COLORS[exam] || '#2563eb'
  const R = 46
  const C = 2 * Math.PI * R
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r={R} fill="none" stroke="#EEF2F7" strokeWidth="9" />
          <motion.circle
            cx="55" cy="55" r={R} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C - (C * pct) / 100 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{pct}%</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>{exam}</span>
        </div>
      </div>
      <div className="text-[11px] text-gray-400 mt-1">
        target {typeof target === 'number' ? `${Math.round(target * 100)}%` : target}
      </div>
    </div>
  )
}

export default function ReadinessCard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) { setLoading(false); return }
    fetch(`${API_URL}/readiness`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => { if (res.success) setData(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-6 flex items-center justify-center h-44">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }
  if (!data || !data.exams) return null

  const exams = Object.entries(data.exams)
  const history = (data.history || []).map((h) => ({ ...h }))
  const factors = data.confidenceFactors || {}

  return (
    <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-blue-50/30 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-blue-500" />
        <h3 className="font-bold text-gray-900">Your readiness</h3>
        <span className="text-xs text-gray-400">chance of hitting your target</span>
      </div>

      <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center">
        {/* rings */}
        <div className="flex gap-5 justify-center">
          {exams.map(([exam, e]) => (
            <Ring key={exam} exam={exam} prob={e.probability} target={e.target} confidence={e.confidence} />
          ))}
        </div>

        {/* trend + explanation */}
        <div>
          {history.length > 1 ? (
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
                  <YAxis hide domain={[0, 1]} />
                  <Tooltip
                    formatter={(v, name) => [`${Math.round(v * 100)}%`, name]}
                    labelFormatter={(l) => l}
                    contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 12 }}
                  />
                  {exams.map(([exam]) => (
                    <Line key={exam} type="monotone" dataKey={exam} stroke={EXAM_COLORS[exam] || '#2563eb'}
                      strokeWidth={2.5} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-24 flex items-center text-sm text-gray-400">
              Your trend line will grow here as you study each day.
            </div>
          )}

          {data.explanation && (
            <div className="mt-2 flex items-start gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>{data.explanation}</span>
            </div>
          )}

          {/* confidence factors */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[['volume', 'Practice'], ['coverage', 'Roadmap'], ['consistency', 'Streak'], ['breadth', 'Spread']].map(([k, label]) => (
              <div key={k}>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.round((factors[k] || 0) * 100)}%` }} />
                </div>
                <div className="text-[10px] text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
