'use client'

import { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Loader2, Sparkles, Check, BookOpen, Pause, Square, Radio } from 'lucide-react'
import LiveTeach, { primeLiveAudio } from './LiveTeach'
import 'katex/dist/katex.min.css'
import katex from 'katex'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const SEG_SELECTOR = 'h1,h2,h3,p,li,figure'

// Recover LaTeX from control chars produced by old buggy JSON parsing
// (\frac -> formfeed+"rac", \times -> tab+"imes", etc.). Harmless on clean data.
function recoverLatex(s) {
  return (s == null ? '' : String(s))
    .replace(/\f/g, '\\f').replace(/\t/g, '\\t').replace(/\x0b/g, '\\v')
    .replace(/\x08/g, '\\b').replace(/\r/g, '\\r').replace(/\n(?=[A-Za-z])/g, '\\n')
}

// Deterministically pre-render $...$ / $$...$$ / \(..\) / \[..\] LaTeX into HTML
// using the KaTeX core (auto-render/renderMathInElement is unreliable here).
function katexHtml(tex, display) {
  try { return katex.renderToString(tex.trim(), { throwOnError: false, displayMode: display }) }
  catch (e) { return display ? `$$${tex}$$` : `$${tex}$` }
}
function renderMathInHtml(html) {
  if (!html) return ''
  let out = recoverLatex(html)
  out = out.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => katexHtml(tex, true))
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => katexHtml(tex, true))
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => katexHtml(tex, false))
  out = out.replace(/\$([^$\n]+?)\$/g, (_, tex) => katexHtml(tex, false))
  return out
}

// Inline math renderer for short strings (quiz question/options/explanations).
function MathInline({ children }) {
  const html = useMemo(() => renderMathInHtml(String(children ?? '')), [children])
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

// Wrap each visible word (outside maths/figures) in a span so read-along can
// highlight word-by-word. Runs once per note render.
function wrapWords(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT
      let p = node.parentElement
      while (p && p !== container) {
        const t = p.tagName
        if ((p.classList && p.classList.contains('katex')) || t === 'FIGURE' || t === 'SCRIPT' || t === 'STYLE')
          return NodeFilter.FILTER_REJECT
        p = p.parentElement
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  nodes.forEach((node) => {
    const frag = document.createDocumentFragment()
    node.nodeValue.split(/(\s+)/).forEach((tok) => {
      if (tok === '' || /^\s+$/.test(tok)) frag.appendChild(document.createTextNode(tok))
      else { const s = document.createElement('span'); s.className = 'ra-w'; s.textContent = tok; frag.appendChild(s) }
    })
    node.parentNode.replaceChild(frag, node)
  })
}

// Build the final display HTML: render maths, tag each block with data-seg (same
// order as the backend's segments), and wrap every word in a .ra-w span — all in
// a DETACHED element, so the spans are part of the HTML STRING that React itself
// renders. React re-rendering can no longer wipe them (that was the root cause:
// post-render DOM mutations were being reset by React within ~1s of playback).
function buildDisplayHtml(html) {
  const out = renderMathInHtml(html)
  if (typeof document === 'undefined') return out
  const tmp = document.createElement('div')
  tmp.innerHTML = out
  tmp.querySelectorAll(SEG_SELECTOR).forEach((b, i) => { b.dataset.seg = i })
  try { wrapWords(tmp) } catch (e) { /* optional */ }
  // Number each word unit within its block. The highlight is applied via a CSS
  // rule targeting [data-seg]/[data-w] — never by mutating elements — so even if
  // the DOM children are regenerated, the highlight re-applies instantly.
  tmp.querySelectorAll(SEG_SELECTOR).forEach((b) => {
    b.querySelectorAll('.ra-w, .katex').forEach((u, k) => u.setAttribute('data-w', k))
  })
  return tmp.innerHTML
}

// memo + stable dangerouslySetInnerHTML object: react-dom re-sets innerHTML on
// every re-render otherwise (confirmed via tracer), which wipes any runtime DOM
// state ~4x/sec during playback. With memo, the note DOM stays untouched.
const NoteBody = memo(function NoteBody({ html, bodyRef }) {
  const processed = useMemo(() => buildDisplayHtml(html), [html])
  const dsi = useMemo(() => ({ __html: processed }), [processed])
  return (
    <div
      ref={(el) => { if (bodyRef) bodyRef.current = el }}
      className="note-html"
      dangerouslySetInnerHTML={dsi}
    />
  )
})

function ProgressView({ steps }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg mb-6">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
      </div>
      <div className="space-y-2 w-full max-w-sm">
        <AnimatePresence initial={false}>
          {steps.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 text-sm ${i === steps.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {i === steps.length - 1
                ? <Loader2 className="w-4 h-4 animate-spin text-blue-500 shrink-0" />
                : <Check className="w-4 h-4 text-green-500 shrink-0" />}
              <span>{s}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Quiz({ quiz, noteId }) {
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => { setAnswers({}); setResult(null) }, [noteId])
  if (!quiz || !quiz.questions?.length) return null
  const quizId = quiz.id || quiz.quizId
  const submit = async () => {
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const ordered = quiz.questions.map((_, i) => answers[i] ?? '')
      const res = await fetch(`${API_URL}/notes/quiz/${quizId}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: ordered }),
      })
      const data = await res.json()
      if (data.success) setResult(data.data)
    } finally { setSubmitting(false) }
  }
  const attempts = Array.isArray(quiz.attempts) ? quiz.attempts : []
  const hasPrevious = quiz.status === 'completed' && !result

  return (
    <div className="mt-10 pt-8 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-5">
        <BookOpen className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-bold text-gray-900">Quick quiz</h3>
        <span className="text-sm text-gray-400">test what you just learned</span>
      </div>
      {hasPrevious && (
        <div className="mb-4 p-3 rounded-2xl bg-blue-50 border border-blue-100 text-sm text-blue-800 flex items-center justify-between gap-3">
          <span>
            Last time you scored <strong>{quiz.score}/{quiz.questions.length}</strong>
            {attempts.length > 1 && <> · {attempts.length} attempts</>}
            {' '}— have another go and beat it!
          </span>
        </div>
      )}
      <div className="space-y-5">
        {quiz.questions.map((q, qi) => {
          const r = result?.results?.[qi]
          return (
            <div key={qi} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
              <div className="font-medium text-gray-900 mb-3">{qi + 1}. <MathInline>{q.question}</MathInline></div>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const chosen = answers[qi] === opt
                  const isCorrect = result && opt === r?.correctAnswer
                  const isWrongChoice = result && chosen && !r?.isCorrect
                  return (
                    <button key={oi} disabled={!!result}
                      onClick={() => setAnswers((a) => ({ ...a, [qi]: opt }))}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all
                        ${isCorrect ? 'border-green-400 bg-green-50 text-green-800'
                          : isWrongChoice ? 'border-red-300 bg-red-50 text-red-700'
                          : chosen ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <MathInline>{opt}</MathInline>
                    </button>
                  )
                })}
              </div>
              {result && r?.explanation && <div className="mt-2 text-xs text-gray-500"><MathInline>{r.explanation}</MathInline></div>}
            </div>
          )
        })}
      </div>
      {!result ? (
        <button onClick={submit} disabled={submitting || Object.keys(answers).length === 0}
          className="mt-5 px-5 py-2.5 rounded-xl bg-gray-900 text-white font-medium disabled:opacity-50 flex items-center gap-2">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit answers'}
        </button>
      ) : (
        <div className="mt-5 p-4 rounded-2xl bg-blue-50 border border-blue-100 font-semibold text-blue-800">
          You scored {result.score}/{result.total} 🎉
        </div>
      )}
    </div>
  )
}

export default function NoteCanvas({ note, generating, steps, noteLoading }) {
  const bodyRef = useRef(null)
  const rootRef = useRef(null)
  const audioRef = useRef(null)
  const blockTimerRef = useRef(null)
  const wordTimerRef = useRef(null)
  const idxRef = useRef(-1)
  const lastWordRef = useRef(null)

  // Robustly locate the note DOM even if the ref hasn't attached yet.
  const getBody = useCallback(() => (
    bodyRef.current
    || rootRef.current?.querySelector('.note-html')
    || (typeof document !== 'undefined' ? document.querySelector('.note-html') : null)
  ), [])

  const [player, setPlayer] = useState('idle') // idle | preparing | playing | paused
  const [segments, setSegments] = useState([])
  const [voiceless, setVoiceless] = useState(false)
  // The reading cursor: {seg, w}. The highlight is a CSS rule generated from this
  // state (see the <style> tag in the render) targeting [data-seg]/[data-w] baked
  // into the HTML string — so nothing here mutates the DOM, and DOM regeneration
  // can never erase the highlight.
  const [cursor, setCursor] = useState(null)
  const [liveActive, setLiveActive] = useState(false)
  const noteId = note?.id || note?.noteId

  // Preloaded audio clips, keyed by segment index — upcoming clips are fetched
  // ahead of time so there is no dead air between segments.
  const audioCacheRef = useRef(new Map())
  const errStreakRef = useRef(0)

  const clearTimers = () => {
    if (blockTimerRef.current) { clearTimeout(blockTimerRef.current); blockTimerRef.current = null }
    if (wordTimerRef.current) { clearInterval(wordTimerRef.current); wordTimerRef.current = null }
  }

  // The ONE way an audio clip is retired. Guarantees no clip can keep playing in
  // the background (which caused overlapping voices).
  const killAudio = () => {
    const a = audioRef.current
    if (a) {
      a.ontimeupdate = null; a.onended = null; a.onerror = null
      try { a.pause() } catch (e) {}
      audioRef.current = null
    }
  }

  const getAudio = useCallback((idx, list) => {
    const seg = list[idx]
    if (!seg?.audioUrl) return null
    let a = audioCacheRef.current.get(idx)
    if (!a) {
      a = new Audio(seg.audioUrl)
      a.preload = 'auto'
      audioCacheRef.current.set(idx, a)
    }
    return a
  }, [])

  const prefetch = useCallback((i, list) => {
    for (let k = i + 1; k <= i + 2 && k < list.length; k++) getAudio(k, list)
  }, [getAudio])

  const clearAudioCache = () => {
    audioCacheRef.current.forEach((a) => { try { a.pause(); a.src = '' } catch (e) {} })
    audioCacheRef.current = new Map()
  }

  const stop = useCallback(() => {
    clearTimers()
    killAudio()
    clearAudioCache()
    idxRef.current = -1
    lastWordRef.current = null
    errStreakRef.current = 0
    setCursor(null)
    setPlayer('idle')
  }, [])

  useEffect(() => { stop(); setSegments([]); setVoiceless(false); setLiveActive(false) }, [noteId, stop])
  useEffect(() => () => stop(), [stop])

  // Live Teaching: the teacher's show_segment tool-calls drive the highlight.
  const onLiveSegment = useCallback((i) => {
    prepareBody()
    setCursor({ seg: i, w: -1 })
    const body = getBody()
    const block = body?.querySelector(`[data-seg="${i}"]`)
    block?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // primeLiveAudio() runs INSIDE the click gesture, so the browser's autoplay
  // policy unlocks the audio engine before the session even connects.
  const startLive = () => { primeLiveAudio(); stop(); setLiveActive(true) }
  const endLive = () => { setLiveActive(false); setCursor(null) }

  // Ensure blocks are tagged + words wrapped on the CURRENT visible DOM.
  const prepareBody = useCallback(() => {
    const el = getBody()
    if (!el) return 0
    const blocks = el.querySelectorAll(SEG_SELECTOR)
    blocks.forEach((b, i) => { b.dataset.seg = i })
    if (!el.querySelector('.ra-w')) {
      try { wrapWords(el) } catch (e) { /* optional */ }
    }
    return blocks.length
  }, [getBody])

  const playFrom = useCallback((i, segs) => {
    const list = segs || segments
    if (i >= list.length) { stop(); return }
    idxRef.current = i
    setPlayer('playing')
    clearTimers()
    prepareBody() // (re)tag on the current DOM every time, so targets always exist
    const body = getBody()
    let block = body?.querySelector(`[data-seg="${i}"]`)
    // fallback: if segment index exceeds block count, use the nth block directly
    if (!block && body) {
      const blocks = body.querySelectorAll(SEG_SELECTOR)
      block = blocks[Math.min(i, blocks.length - 1)] || null
    }
    lastWordRef.current = null
    // Segment cursor (block highlight via CSS state; w:-1 = no word underlined yet).
    setCursor({ seg: i, w: -1 })
    if (block) block.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const seg = list[i]
    const next = () => playFrom(i + 1, list)
    const est = Math.max(1600, ((seg.spoken || '').split(/\s+/).filter(Boolean).length) * 360)

    // Re-query the word spans from the LIVE DOM on every tick, so even if React
    // replaced nodes mid-playback we always target elements actually on screen.
    const liveUnits = () => {
      let b = block
      if (!b || !b.isConnected) {
        const bd = getBody()
        b = bd?.querySelector(`[data-seg="${i}"]`) || null
      }
      return b ? Array.from(b.querySelectorAll('.ra-w, .katex')) : []
    }
    const showWords = (frac) => {
      const u = liveUnits()
      if (!u.length) return
      const upto = Math.max(0, Math.min(u.length - 1, Math.floor(frac * u.length)))
      setCursor({ seg: i, w: upto })
      const el = u[upto]
      if (el && el !== lastWordRef.current) {
        lastWordRef.current = el
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        if (typeof window !== 'undefined') window.__raCursor = { seg: i, w: upto, word: el.textContent }
      }
    }

    killAudio() // retire any previous clip — only one voice, ever
    const audio = getAudio(i, list)
    prefetch(i, list) // warm the next clips so there's no dead air between lines

    if (audio) {
      audioRef.current = audio
      try { audio.currentTime = 0 } catch (e) {}
      // Highlighting is driven ONLY by the audio's real position: if the voice
      // pauses to buffer, the highlight waits with it — always in sync.
      audio.ontimeupdate = () => {
        const d = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
        if (d > 0) showWords(audio.currentTime / d)
      }
      audio.onended = () => { errStreakRef.current = 0; showWords(1); next() }
      audio.onerror = () => {
        errStreakRef.current += 1
        killAudio()
        if (errStreakRef.current >= 4) { stop(); return } // network is down — stop cleanly
        blockTimerRef.current = setTimeout(next, 600) // skip the bad clip, keep the voice
      }
      // Watchdog: if a clip makes no progress for ~8s, skip it (never highlight
      // silently while a voice is expected).
      let lastT = -1
      let stalled = 0
      wordTimerRef.current = setInterval(() => {
        if (audioRef.current !== audio) { clearInterval(wordTimerRef.current); return }
        if (!audio.paused && audio.currentTime === lastT) {
          stalled += 1
          if (stalled >= 4) {
            killAudio()
            clearTimers()
            next()
            return
          }
        } else { stalled = 0 }
        lastT = audio.currentTime
      }, 2000)
      audio.play().catch(() => { if (audioRef.current === audio) audio.onerror() })
    } else {
      // No audio for this segment (voiceless mode): timed sweep.
      runTimed(est, showWords, next)
    }
  }, [segments, stop, getBody, prepareBody, getAudio, prefetch])

  // Timed fallback (no/stalled audio): sweep the highlight across `est` ms.
  const runTimed = (est, showWords, next) => {
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now())
    wordTimerRef.current = setInterval(() => {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now())
      const frac = (now - t0) / est
      if (frac >= 1) { clearInterval(wordTimerRef.current); wordTimerRef.current = null; showWords(1); next(); return }
      showWords(frac)
    }, 120)
  }

  const start = useCallback(async () => {
    if (!noteId) return
    setPlayer('preparing')
    prepareBody()
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/notes/${noteId}/read-along`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!data.success || !data.data?.segments?.length) { setPlayer('idle'); return }
      const segs = data.data.segments
      setSegments(segs)
      setVoiceless(!segs.some((s) => s.audioUrl))
      prepareBody()
      playFrom(0, segs)
    } catch (e) { setPlayer('idle') }
  }, [noteId, playFrom, prepareBody])

  const pause = useCallback(() => {
    clearTimers()
    if (audioRef.current) audioRef.current.pause() // keeps position; timeupdate resumes on play
    setPlayer('paused')
  }, [])
  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused && !audioRef.current.ended) {
      setPlayer('playing')
      audioRef.current.play().catch(() => {})
    } else {
      playFrom(Math.max(0, idxRef.current), segments)
    }
  }, [playFrom, segments])

  const onButton = () => {
    if (player === 'idle') start()
    else if (player === 'playing') pause()
    else if (player === 'paused') resume()
  }

  if (generating && !note) return <div className="h-full bg-white"><ProgressView steps={steps} /></div>
  // A note is being fetched (library click / page refresh restore): show a
  // loader — never the previous note, never the "create a note" empty screen.
  if (noteLoading && !note) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
        </div>
        <p className="text-sm text-gray-400 font-medium">Opening your note…</p>
      </div>
    )
  }
  if (!note) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8 bg-white">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center mb-5">
          <Sparkles className="w-7 h-7 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Your note will appear here</h2>
        <p className="text-gray-500 max-w-sm">Ask the assistant on the left to create a note on any topic —
          it'll research it, add diagrams, and build a quiz.</p>
      </div>
    )
  }

  const quiz = note.quiz && note.quiz.questions
    ? note.quiz
    : (Array.isArray(note.quiz) ? { id: note.quizId, questions: note.quiz } : null)

  return (
    <div ref={rootRef} className="h-full overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6">
        <div className="flex items-center justify-between gap-3 mb-6 sticky top-0 bg-white/90 backdrop-blur py-2 z-10">
          <div className="min-w-0">
            {note.subject && <div className="text-xs font-semibold text-blue-500 uppercase">{(note.subject || '').replace(/-/g, ' ')}</div>}
            <h1 className="text-lg font-bold text-gray-900 truncate">{note.title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!liveActive && (
              <button onClick={startLive}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium shadow-lg shadow-emerald-500/20 active:scale-[0.98]">
                <Radio className="w-4 h-4" /> Live Teach
              </button>
            )}
            <button onClick={onButton} disabled={player === 'preparing' || liveActive}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-60">
              {player === 'preparing' ? <Loader2 className="w-4 h-4 animate-spin" />
                : player === 'playing' ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {player === 'preparing' ? 'Preparing…' : player === 'playing' ? 'Pause' : player === 'paused' ? 'Resume' : 'Read aloud'}
            </button>
            {(player === 'playing' || player === 'paused') && (
              <button onClick={stop} className="p-2 rounded-xl bg-gray-100 text-gray-600" title="Stop">
                <Square className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {voiceless && (player === 'playing' || player === 'paused') && (
          <div className="mb-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            Voice is unavailable right now (Spitch credits), so this is following along without sound.
          </div>
        )}

        {/* The read-along highlight: a CSS rule generated from React state.
            It targets data-seg/data-w baked into the HTML, so DOM regeneration
            can never erase it. */}
        {cursor && (
          <style>{`
            .note-html [data-seg="${cursor.seg}"] {
              background: rgba(59, 130, 246, 0.09);
              border-radius: 8px;
              box-shadow: inset 3px 0 0 #2563eb;
              padding-left: 10px;
              margin-left: -10px;
            }
            .note-html [data-seg="${cursor.seg}"] .ra-w[data-w="${cursor.w}"],
            .note-html [data-seg="${cursor.seg}"] .katex[data-w="${cursor.w}"] {
              text-decoration: underline 3px #2563eb;
              text-underline-offset: 4px;
              color: #1d4ed8;
              font-weight: 600;
            }
          `}</style>
        )}
        <NoteBody html={note.content} bodyRef={bodyRef} />
        <Quiz quiz={quiz} noteId={noteId} />

        {liveActive && (
          <LiveTeach noteId={noteId} onSegment={onLiveSegment} onEnd={endLive} />
        )}
      </div>
    </div>
  )
}
