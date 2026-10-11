'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Check, ChevronRight, Clock3, Keyboard, Loader2, Mic, MicOff, Pause, PhoneOff, Play, Plus, RotateCcw, Send, Sparkles, Volume2, X, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import OwlTeacher from './OwlTeacher'
import TeachingBoard from './TeachingBoard'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const SUBJECTS = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature']
const DURATIONS = [15, 30, 45, 60]

function authHeaders(json = true) {
  const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` }
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

function waitForIce(pc) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => {
      if (pc.iceGatheringState === 'complete') { pc.removeEventListener('icegatheringstatechange', done); resolve() }
    }
    pc.addEventListener('icegatheringstatechange', done)
    setTimeout(resolve, 5000)
  })
}

function formatTime(seconds) {
  const mins = Math.max(0, Math.floor(seconds / 60)).toString().padStart(2, '0')
  const secs = Math.max(0, seconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

function Setup({ form, setForm, onStart, loading, error, lessons, onResume }) {
  // Every field matters: the whole lesson's notes are written from this form.
  const detailsOk = form.details.trim().length >= 10
  const valid = form.topic.trim().length >= 2 && form.subject && detailsOk && form.startingLevel && form.durationMinutes
  const resumable = lessons.filter((l) => l.resumable)
  const finished = lessons.filter((l) => !l.resumable && l.status === 'completed')
  return (
    <div className="live-setup-page">
      <div className="live-setup-orb live-orb-one" /><div className="live-setup-orb live-orb-two" />
      <div className="live-setup-shell">
        <section className="live-setup-copy">
          <div className="live-pill"><Sparkles size={16} /> StudyMaster Live Learning</div>
          <h1>A teacher who explains,<br /><span>listens and writes with you.</span></h1>
          <p>Choose what you want to understand. StudyMaster will begin at your level, teach on a live board and pause whenever you need to ask a question.</p>
          <div className="live-setup-benefits">
            {['Natural two-way voice', 'A board that develops as you learn', 'Questions matched to your progress'].map((item) => (
              <div key={item}><span><Check size={15} /></span>{item}</div>
            ))}
          </div>
          {(resumable.length > 0 || finished.length > 0) && (
            <div className="live-sessions">
              {resumable.length > 0 && (
                <>
                  <h3>Continue where you stopped</h3>
                  <ul>
                    {resumable.slice(0, 3).map((lesson) => (
                      <li key={lesson.id}>
                        <button type="button" onClick={() => onResume(lesson)}>
                          <span className="ls-dot" aria-hidden="true" />
                          <span className="ls-body">
                            <b>{lesson.topic}</b>
                            <small>{lesson.subject} · {formatTime(lesson.elapsedSeconds)} in · page {lesson.currentPage || 0} of {Math.max(0, (lesson.pageCount || 1) - 1)}</small>
                          </span>
                          <Play size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {finished.length > 0 && (
                <>
                  <h3>Past lessons</h3>
                  <ul>
                    {finished.slice(0, 3).map((lesson) => (
                      <li key={lesson.id}>
                        <button type="button" onClick={() => setForm((f) => ({ ...f, subject: lesson.subject, topic: lesson.topic }))}>
                          <span className="ls-dot ls-done" aria-hidden="true" />
                          <span className="ls-body">
                            <b>{lesson.topic}</b>
                            <small>{lesson.subject} · {formatTime(lesson.elapsedSeconds)} · completed</small>
                          </span>
                          <RotateCcw size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
          <div className="live-setup-owl"><OwlTeacher state="idle" /></div>
        </section>

        <form className="live-setup-card" onSubmit={(e) => { e.preventDefault(); valid && onStart() }}>
          <header><div><span>Set up your class</span><h2>What should we learn?</h2></div><BookOpen size={24} /></header>
          <label>Subject
            <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
              {SUBJECTS.map((subject) => <option key={subject}>{subject}</option>)}
            </select>
          </label>
          <label>Topic
            <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Logarithms in mathematics" autoFocus />
          </label>
          <label>What would you like StudyMaster to know? <small>(required)</small>
            <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="For example: I understand the basics, but calculations confuse me." rows={3} required minLength={10} />
            {form.details.trim().length > 0 && !detailsOk && <small className="live-field-hint">Tell us a little more (at least 10 characters) — your notes are written from this.</small>}
          </label>
          <fieldset><legend>Where should we begin?</legend>
            <div className="live-choice-grid">
              {[['new', "I'm completely new"], ['basics', 'I know the basics'], ['specific', 'A specific difficulty']].map(([value, label]) => (
                <button type="button" key={value} onClick={() => setForm({ ...form, startingLevel: value })} className={form.startingLevel === value ? 'selected' : ''}>{label}</button>
              ))}
            </div>
          </fieldset>
          <fieldset><legend>Lesson time</legend>
            <div className="live-duration-grid">
              {DURATIONS.map((duration) => <button type="button" key={duration} onClick={() => setForm({ ...form, durationMinutes: duration })} className={form.durationMinutes === duration ? 'selected' : ''}>{duration}<small>min</small></button>)}
            </div>
          </fieldset>
          {error && <div className="live-error">{error}</div>}
          <button className="live-start-button" disabled={!valid || loading}>
            {loading ? <><Loader2 className="animate-spin" size={19} /> Preparing your classroom…</> : <>{valid ? 'Start live class' : 'Fill in the form to start'} <ChevronRight size={19} /></>}
          </button>
          <p className="live-consent">Your microphone is used only while the lesson is active. Audio is not stored by StudyMaster.</p>
        </form>
      </div>
    </div>
  )
}

// ── How the live class works ───────────────────────────────────────────
// 1. The setup form (required) becomes a full NOTEBOOK on the backend:
//    objectives page, note pages, quiz page. The student watches a preparing
//    screen; no voice, no mic until it is ready.
// 2. The voice session (GPT-Live, WebRTC) starts with the whole notebook in
//    the teacher's instructions. She teaches it page by page in her own words.
// 3. THIS page keeps the board in step with her, with no model call in the
//    way: it turns pages when she or the student says "page 3" / "next page",
//    and highlights the paragraph whose words she is speaking.
// 4. Anything not in the notes (a side question needing maths, a picture) can
//    be handed to a small board assistant that writes on the current page.

let opSeq = 0
function makeOp(action, content, { id, emphasis = 'normal', stepIndex = 0, delay = 0 } = {}) {
  opSeq += 1
  return {
    id: id || `op_${Date.now().toString(36)}_${opSeq}`,
    revision: Date.now() * 100 + opSeq, action, content, emphasis, stepIndex, delay,
  }
}

const liveLog = (...args) => { try { console.info('[live]', ...args) } catch { /* noop */ } }

// ── Page commands, from the teacher's or the student's words ───────────
const NUMBER_WORDS = { zero: 0, one: 1, first: 1, two: 2, second: 2, three: 3, third: 3, four: 4, fourth: 4, five: 5, fifth: 5, six: 6, sixth: 6, seven: 7, seventh: 7 }
const toNumber = (w) => (/^\d+$/.test(w) ? Number(w) : NUMBER_WORDS[w])

/** "let's turn to page 2", "go to the third page", "next page", "go back",
 *  "let's do the quiz" -> the page index to show, or null. */
export function pageCommand(text, current, count, quizIndex) {
  const t = String(text || '').toLowerCase()
  let m = t.match(/\bpage\s+(\d+|zero|one|two|three|four|five|six|seven)\b/) || t.match(/\b(first|second|third|fourth|fifth|sixth|seventh)\s+page\b/)
  if (m) {
    const n = toNumber(m[1])
    // "page 2" must be a move ("turn to page 2", "go to page 2", "page 2 now"),
    // not a mention ("as we saw on page 2")
    const moving = /(turn|go|move|flip|head|back|over|onto|open|to)\s+(to\s+)?(the\s+)?(page|first|second|third|fourth|fifth|sixth|seventh)/.test(t) || /^\s*(page|the)\b/.test(t)
    if (Number.isFinite(n) && n >= 0 && n < count && moving && !/\b(saw|seen|earlier|said|wrote|was) (on|in)\b/.test(t)) return n
  }
  if (/\b(next page|turn (the )?page|move on to the next page|go on to the next page)\b/.test(t)) return Math.min(current + 1, count - 1)
  if (/\b(previous page|last page|go back( a page| one page)?|page before|back a page)\b/.test(t) && !/\bgo back to (the )?(question|example)/.test(t)) return Math.max(current - 1, 0)
  if (quizIndex !== null && (/\b(let'?s|let us)\s+(now\s+)?(do|take|start|begin|try)\s+(the|our|a)?\s*(quick\s+)?(final\s+)?quiz\b/.test(t)
    || /\btime (for|to do) (the|our)?\s*quiz\b/.test(t) || /\b(go to|open|turn to) the quiz\b/.test(t))) return quizIndex
  return null
}

// ── Which paragraph is she talking about? ───────────────────────────────
const STOP = new Set('that this with from have they them then than there their what when which will would about your into also just like some more most such only very each other these those because where while being been were does done make made take give gives given using used look see here back first second next turn page board'.split(' '))
// crude but consistent: release/releases/released -> releas, activity/activities -> activity
const stem = (w) => w.replace(/ies$/, 'y').replace(/(ing|ed|es|s)$/, '').replace(/e$/, '')
function wordList(text) {
  return String(text || '').toLowerCase().replace(/\$[^$]*\$/g, ' ').replace(/\\[a-z]+/g, ' ')
    .split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP.has(w)).map(stem)
}
function words(text) {
  const list = wordList(text)
  const set = new Set(list)
  // two-word phrases ("zero product", "worked example") pin a paragraph down
  // far better than single words that appear all over a maths page
  set.pairs = new Set(list.slice(1).map((w, i) => `${list[i]} ${w}`))
  return set
}
function opWords(op) {
  const c = op.content || {}
  return words([c.text, c.title, c.objective, c.label, c.explanation, c.problem, c.question, c.caption,
    ...(c.steps || []), ...(c.solution || []), ...(c.options || [])].filter(Boolean).join(' '))
}
/** Best-matching block for a spoken sentence: { id, score, shared } or null.
 *  Words are weighted by rarity on the page — "quadratic" appears in every
 *  paragraph and says nothing; "cancel" or "coefficient" pins one down. */
function bestBlock(sentence, ops, preferAfterId) {
  const said = words(sentence)
  if (said.size < 2) return null
  const sets = ops.map((op) => op._words || (op._words = opWords(op)))
  const df = new Map()
  sets.forEach((w) => w.forEach((x) => df.set(x, (df.get(x) || 0) + 1)))
  const afterIndex = preferAfterId ? ops.findIndex((o) => o.id === preferAfterId) + 1 : -1
  let best = null
  sets.forEach((w, i) => {
    if (!w.size) return
    let shared = 0, weight = 0
    said.forEach((x) => { if (w.has(x)) { shared += 1; weight += 1 / df.get(x) } })
    said.pairs.forEach((pair) => { if (w.pairs?.has(pair)) weight += 0.8 })
    // she teaches in order: the next block gets a nudge, and going BACK to an
    // earlier block needs much stronger evidence (it jumped back wrongly once)
    const back = afterIndex > 0 && i < afterIndex - 1
    const score = weight + (i === afterIndex ? 0.3 : 0) - (back ? 1.2 : 0)
    if (shared >= 2 && (!best || score > best.score)) best = { id: ops[i].id, score, shared }
  })
  return best && best.score >= 1 ? best : null
}

export default function LiveLearningPage() {
  const { user } = useAuth()
  const [screen, setScreen] = useState('setup')
  const [form, setForm] = useState({ subject: 'Mathematics', topic: '', details: '', goal: 'Understand the topic', startingLevel: 'new', durationMinutes: 30 })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [lessonId, setLessonId] = useState(null)
  const [prep, setPrep] = useState({ stage: 'Starting', done: 0, total: 1 })
  const [pages, setPages] = useState([])          // the notebook: [{title, ops}]
  const [page, setPage] = useState(0)
  const [focusId, setFocusId] = useState(null)
  const [extraOps, setExtraOps] = useState([])    // lines written live, beyond the notes
  const [transcript, setTranscript] = useState([])
  const [teacherCaption, setTeacherCaption] = useState('')
  const [captionsOn, setCaptionsOn] = useState(true)
  const [lessons, setLessons] = useState([])
  const [owlState, setOwlState] = useState('idle')
  const [volume, setVolume] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [targetMinutes, setTargetMinutes] = useState(30)
  const [muted, setMuted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [showType, setShowType] = useState(false)
  const [typed, setTyped] = useState('')
  const [showExtend, setShowExtend] = useState(false)
  const [summary, setSummary] = useState('')
  const [quizScore, setQuizScore] = useState(null)

  const pcRef = useRef(null), dcRef = useRef(null), streamRef = useRef(null), audioRef = useRef(null)
  const analyserRef = useRef(null), animationRef = useRef(null), lessonRef = useRef(null)
  const pagesRef = useRef([]), pageRef = useRef(0), focusRef = useRef(null), transcriptRef = useRef([])
  const inputBufferRef = useRef(''), outputBufferRef = useRef(''), outputTimerRef = useRef(null)
  const sentenceRef = useRef(''), studentCmdRef = useRef(false)
  const startedRef = useRef(false), resumingRef = useRef(false), spokeRef = useRef(false), greetTimerRef = useRef(null)
  const handoffRef = useRef(new Map()), pollRef = useRef(null)
  const expectReplyRef = useRef(0), lastHeardAtRef = useRef(0), lastSpokeAtRef = useRef(0)
  const quizRef = useRef({ answers: {}, timer: null, sent: false })

  useEffect(() => { transcriptRef.current = transcript }, [transcript])
  useEffect(() => {
    if (screen !== 'classroom' || paused || status !== 'teaching') return
    const id = setInterval(() => setElapsed((v) => v + 1), 1000)
    return () => clearInterval(id)
  }, [screen, paused, status])
  useEffect(() => {
    if (screen === 'classroom' && elapsed >= targetMinutes * 60 && !showExtend) setShowExtend(true)
  }, [elapsed, targetMinutes, screen, showExtend])

  const sendLive = useCallback((event) => {
    if (dcRef.current?.readyState === 'open') dcRef.current.send(JSON.stringify(event))
  }, [])
  // thinking = quiet facts she can use; instructions = act on this now
  const tellVoice = useCallback((content, kind = 'thinking') => {
    sendLive({ type: `session.${kind}.append`, event_id: `${kind}_${Date.now()}`, delegation_id: null, content: String(content).slice(0, 1800) })
  }, [sendLive])

  const loadLessons = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/live-learning/lessons`, { headers: authHeaders() })
      const data = await res.json()
      if (data?.success) setLessons(data.data || [])
    } catch { /* the list is a convenience; never block the page on it */ }
  }, [])
  useEffect(() => { if (screen === 'setup') loadLessons() }, [screen, loadLessons])

  const quizIndex = useCallback(() => {
    const i = pagesRef.current.findIndex((p) => p.title === 'Quiz')
    return i >= 0 ? i : null
  }, [])

  // ── Turning pages ────────────────────────────────────────────────────
  const goPage = useCallback((target, by = 'teacher') => {
    const count = pagesRef.current.length
    if (!count || target === null || target < 0 || target >= count || target === pageRef.current) return
    pageRef.current = target; setPage(target)
    const first = pagesRef.current[target].ops.find((op) => op.action !== 'set_focus')
    focusRef.current = first?.id || null; setFocusId(focusRef.current)
    liveLog(`board turned to page ${target} (${by})`)
    if (lessonRef.current) {
      fetch(`${API_URL}/live-learning/${lessonRef.current}/page`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ page: target }) }).catch(() => {})
    }
    if (by === 'student') {
      const title = pagesRef.current[target].title
      tellVoice(target === quizIndex()
        ? 'The student opened the quiz page. Ask them to tap their answers one by one.'
        : `The student moved the board to page ${target}: ${title}. Teach from the top of this page now.`, 'instructions')
      expectReplyRef.current = performance.now()
    }
  }, [quizIndex, tellVoice])

  // ── Highlighting the paragraph she is on ─────────────────────────────
  const followSpeech = useCallback((sentence) => {
    const current = pagesRef.current[pageRef.current]
    if (!current) return
    const here = bestBlock(sentence, current.ops, focusRef.current)
    if (here) {
      if (here.id !== focusRef.current) { focusRef.current = here.id; setFocusId(here.id) }
      return
    }
    // She clearly moved to another page's content without saying the page:
    // follow her there rather than leave the student on the wrong page.
    let elsewhere = null
    pagesRef.current.forEach((p, n) => {
      if (n === pageRef.current || p.title === 'Quiz') return
      const b = bestBlock(sentence, p.ops)
      if (b && b.shared >= 4 && b.score >= 4 && (!elsewhere || b.score > elsewhere.score)) elsewhere = { ...b, n }
    })
    if (elsewhere) { goPage(elsewhere.n, 'speech'); focusRef.current = elsewhere.id; setFocusId(elsewhere.id) }
  }, [goPage])

  // ── Tool calls from the board assistant (things NOT in the notes) ──────
  // Every call MUST be answered (function_call_output + response.create, with
  // NO delegation_id) or the delegated turn stays open and she goes silent.
  const replyTool = useCallback((callId, output) => {
    if (!callId) return
    sendLive({ type: 'response.item.create', event_id: `tool_out_${Date.now()}`, item: { type: 'function_call_output', call_id: callId, output: JSON.stringify(output) } })
    sendLive({ type: 'response.create', event_id: `tool_go_${Date.now()}` })
  }, [sendLive])

  const persistOps = useCallback((ops) => {
    if (!lessonRef.current || !ops.length) return
    const body = ops.map(({ id, action, content, emphasis, stepIndex: s }) => ({ id, action, content, emphasis, stepIndex: s }))
    fetch(`${API_URL}/live-learning/${lessonRef.current}/ops`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ ops: body }) }).catch(() => {})
  }, [])

  const handleToolCall = useCallback(async (item) => {
    const callId = item?.call_id
    const name = item?.name
    let args = {}
    try { args = item?.arguments ? JSON.parse(item.arguments) : {} } catch { args = {} }
    const step = pageRef.current
    setOwlState('writing')
    try {
      if (name === 'go_to_page') {
        const n = Number(args.page)
        if (!Number.isFinite(n) || n < 0 || n >= pagesRef.current.length) { replyTool(callId, { ok: false, error: `Pages run from 0 to ${pagesRef.current.length - 1}.` }); return }
        goPage(n, 'assistant')
        replyTool(callId, { ok: true, nowOnPage: `${n}: ${pagesRef.current[n].title}` })
      } else if (name === 'write_on_board') {
        const lines = (Array.isArray(args.lines) ? args.lines : [args.lines]).filter((l) => typeof l === 'string' && l.trim())
        if (!lines.length) { replyTool(callId, { ok: false, error: 'No lines were given.' }); return }
        const ops = [
          ...(args.heading ? [makeOp('write_heading', { text: args.heading }, { stepIndex: step })] : []),
          ...lines.map((text, i) => makeOp('write_text', { text }, { stepIndex: step, delay: i * 0.18 })),
        ]
        setExtraOps((prev) => [...prev, ...ops]); focusRef.current = ops[0].id; setFocusId(ops[0].id)
        replyTool(callId, { ok: true, note: 'Written at the bottom of the current page.' })
        tellVoice(`Now added to the bottom of page ${step}: ${[args.heading, ...lines].filter(Boolean).join('; ')}`)
        persistOps(ops)
      } else if (name === 'show_image') {
        const query = String(args.query || '').trim()
        const data = query ? await fetch(`${API_URL}/live-learning/image?query=${encodeURIComponent(query)}`, { headers: authHeaders() }).then((r) => r.json()).catch(() => null) : null
        if (!data?.data) { replyTool(callId, { ok: false, error: 'No suitable picture was found. Describe it in words instead.' }); return }
        const op = makeOp('show_image', data.data, { stepIndex: step })
        setExtraOps((prev) => [...prev, op]); focusRef.current = op.id; setFocusId(op.id)
        replyTool(callId, { ok: true, onBoardNow: `picture: ${data.data.caption}` })
        tellVoice(`Now on the board: a picture — ${data.data.caption}`)
        persistOps([op])
      } else {
        replyTool(callId, { ok: false, error: `There is no tool called ${name}.` })
      }
    } catch (err) {
      liveLog('tool failed', name, err)
      replyTool(callId, { ok: false, error: 'The board did not accept that. Keep teaching out loud.' })
    } finally { setOwlState('speaking') }
  }, [goPage, persistOps, replyTool, tellVoice])

  const onDelegationEvent = useCallback((msg) => {
    const inner = msg.event || {}
    if (inner.type === 'response.output_item.done' && inner.item?.type === 'function_call') {
      handleToolCall(inner.item)
    } else if (['response.completed', 'response.failed', 'response.incomplete', 'response.cancelled'].includes(inner.type)) {
      const h = handoffRef.current.get(msg.delegation_id)
      if (h) { clearTimeout(h.timer); handoffRef.current.delete(msg.delegation_id) }
    }
  }, [handleToolCall])

  // ── The end-of-lesson quiz ───────────────────────────────────────────
  // Taps are gathered for a moment and sent as ONE note (several quick
  // instructions in a row chopped her speech into fragments).
  const onQuizAnswer = useCallback((content, picked) => {
    const q = quizRef.current
    const key = content.quizIndex ?? 0
    const prev = q.answers[key]
    q.answers[key] = { index: key, picked: prev ? prev.picked : picked, attempts: (prev?.attempts || 0) + 1, last: picked, content }
    clearTimeout(q.timer)
    q.timer = setTimeout(async () => {
      const a = q.answers[key]
      const options = content.options || []
      const L = (i) => `${String.fromCharCode(65 + i)} ("${options[i]}")`
      const right = a.last === content.correctIndex
      const why = (content.explanations || [])[a.last]
      const total = pagesRef.current[quizIndex()]?.ops.length || 0
      const finished = Object.values(q.answers).filter((x) => x.last === x.content.correctIndex).length === total
      if (finished && !q.sent && lessonRef.current) {
        q.sent = true
        const res = await fetch(`${API_URL}/live-learning/${lessonRef.current}/quiz-result`, {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ answers: Object.values(q.answers).map(({ index, picked: p, attempts }) => ({ index, picked: p, attempts })) }),
        }).then((r) => r.json()).catch(() => null)
        const s = res?.data
        if (s) setQuizScore(s)
        tellVoice(`The student finished the quiz: ${s ? `${s.score} out of ${s.total} correct on the first try` : 'all questions answered'}. Congratulate them honestly, sum up the lesson in two sentences and say goodbye.`, 'instructions')
      } else {
        tellVoice(`Quiz question ${key + 1} ("${content.question}"): the student tapped ${L(a.last)}. ` + (right
          ? 'That is CORRECT. Confirm briefly why, then ask them to do the next question.'
          : `That is wrong (the answer is ${L(content.correctIndex)}). ${why ? `Their choice reflects: ${why}. ` : ''}Give one kind hint; they can tap again.`), 'instructions')
      }
      expectReplyRef.current = performance.now()
    }, 1200)
  }, [quizIndex, tellVoice])

  // ── Connecting the live teacher (only once the notes exist) ──────────
  const cleanupMedia = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    clearTimeout(outputTimerRef.current); clearTimeout(greetTimerRef.current); clearInterval(pollRef.current)
    handoffRef.current.forEach((h) => clearTimeout(h.timer)); handoffRef.current.clear()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    try { dcRef.current?.close(); pcRef.current?.close(); analyserRef.current?.context?.close() } catch { /* already closed */ }
    streamRef.current = null; dcRef.current = null; pcRef.current = null; analyserRef.current = null
  }, [])

  const connect = useCallback(async (id) => {
    setStatus('connecting'); setOwlState('thinking'); spokeRef.current = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      // the mic stays OFF until the teacher has actually started the class
      stream.getAudioTracks().forEach((track) => { track.enabled = false })
      streamRef.current = stream
      const pc = new RTCPeerConnection(); pcRef.current = pc
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))
      const remote = new MediaStream()
      pc.ontrack = (event) => { event.streams[0].getTracks().forEach((track) => remote.addTrack(track)); if (audioRef.current) audioRef.current.srcObject = remote }
      pc.onconnectionstatechange = () => {
        if (['disconnected', 'failed'].includes(pc.connectionState)) { setStatus('reconnecting'); setOwlState('reconnecting') }
      }
      const dc = pc.createDataChannel('oai-events'); dcRef.current = dc
      dc.onopen = () => liveLog('event channel open')
      dc.onmessage = (event) => {
        let msg; try { msg = JSON.parse(event.data) } catch { return }
        if (msg.type === 'session.started') {
          liveLog('session started', msg.session?.id)
          setStatus('teaching'); setOwlState('speaking')
          streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !muted })
          // GPT-Live never speaks first; commentary is content it SPEAKS.
          const name = (user?.username || '').split(' ')[0]
          const nb = pagesRef.current
          const kickoff = () => sendLive({
            type: 'session.commentary.append', event_id: `greet_${Date.now()}`, delegation_id: null,
            content: resumingRef.current
              ? `Welcome back${name ? `, ${name}` : ''}. We are on page ${pageRef.current}: ${nb[pageRef.current]?.title}. Let us carry on from there.`
              : `Hello${name ? ` ${name}` : ''}, welcome to today's lesson on ${form.topic}. Our notes are on the board. First, our objectives for this class, then we will turn to page 1.`,
          })
          kickoff()
          clearTimeout(greetTimerRef.current)
          greetTimerRef.current = setTimeout(function check(attempt = 1) {
            if (spokeRef.current || attempt > 3) return
            liveLog(`teacher silent after start; nudging again (${attempt})`)
            kickoff()
            greetTimerRef.current = setTimeout(() => check(attempt + 1), 4000)
          }, 4000)
        } else if (msg.type === 'session.input_transcript.delta') {
          inputBufferRef.current += msg.delta || ''
          lastHeardAtRef.current = performance.now()
          setOwlState('listening')
          // "go to page 3", "next page" — the board moves at once, for the student
          if (!studentCmdRef.current) {
            const target = pageCommand(inputBufferRef.current, pageRef.current, pagesRef.current.length, quizIndex())
            if (target !== null) { studentCmdRef.current = true; goPage(target, 'student') }
          }
        } else if (msg.type === 'session.output_transcript.delta') {
          spokeRef.current = true; lastSpokeAtRef.current = performance.now(); studentCmdRef.current = false
          if (inputBufferRef.current.trim()) {
            setTranscript((items) => [...items, { role: 'user', text: inputBufferRef.current.trim() }])
            inputBufferRef.current = ''
          }
          outputBufferRef.current += msg.delta || ''
          // sound tags ("[laugh]") are not for captions
          setTeacherCaption(outputBufferRef.current.replace(/\[[a-z ]{2,24}\]\s*/gi, '')); setOwlState('speaking')
          sentenceRef.current += msg.delta || ''
          if (/[.?!]["']?\s*$/.test(sentenceRef.current) || /[.?!]\s/.test(msg.delta || '')) {
            const sentence = sentenceRef.current.trim(); sentenceRef.current = ''
            const target = pageCommand(sentence, pageRef.current, pagesRef.current.length, quizIndex())
            if (target !== null) goPage(target, 'teacher')
            else followSpeech(sentence)
          }
          clearTimeout(outputTimerRef.current)
          outputTimerRef.current = setTimeout(() => {
            const text = outputBufferRef.current.replace(/\[[a-z ]{2,24}\]\s*/gi, '').trim()
            if (text) setTranscript((items) => [...items, { role: 'assistant', text }])
            outputBufferRef.current = ''; setTeacherCaption(''); setOwlState('idle')
          }, 1400)
        } else if (msg.type === 'response.event') {
          onDelegationEvent(msg)
        } else if (msg.type === 'session.delegation.created') {
          const did = msg.delegation?.id
          const timer = setTimeout(() => {
            if (!handoffRef.current.has(did)) return
            handoffRef.current.delete(did)
            tellVoice('The board assistant is taking too long. Do not wait for it — carry on teaching out loud.', 'instructions')
          }, 20000)
          handoffRef.current.set(did, { t: performance.now(), timer })
        } else if (msg.type === 'error') {
          liveLog('GPT-Live error', msg.error?.code, msg.error?.message, msg.error?.client_event_id)
        }
      }
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer); await waitForIce(pc)
      const response = await fetch(`${API_URL}/live-learning/session`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ sdp: pc.localDescription.sdp, lessonId: id }),
      })
      const data = await response.json()
      if (!response.ok || !data.success || !data.data?.sdp) throw new Error(data.detail || data.message || 'Could not start the live class.')
      resumingRef.current = Boolean(data.data.resumed && data.data.currentPage > 0)
      if (Number.isFinite(data.data.elapsedSeconds)) setElapsed(data.data.elapsedSeconds)
      setExtraOps(data.data.boardOperations || [])
      await pc.setRemoteDescription({ type: 'answer', sdp: data.data.sdp })
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(remote), analyser = audioContext.createAnalyser()
      analyser.fftSize = 256; source.connect(analyser); analyserRef.current = { analyser, context: audioContext }
      const values = new Uint8Array(analyser.frequencyBinCount)
      const meter = () => { analyser.getByteFrequencyData(values); const avg = values.reduce((a, b) => a + b, 0) / values.length / 255; setVolume(avg); if (avg > .025) setOwlState('speaking'); animationRef.current = requestAnimationFrame(meter) }
      meter()
    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Microphone permission is needed for a live class. Please allow it and try again.' : err.message)
      setStatus('error'); setScreen('setup'); startedRef.current = false; cleanupMedia()
    }
  }, [cleanupMedia, followSpeech, form.topic, goPage, muted, onDelegationEvent, quizIndex, sendLive, tellVoice, user])

  const openNotebook = useCallback((nb, startPage = 0) => {
    pagesRef.current = nb.pages || []; setPages(pagesRef.current)
    pageRef.current = Math.min(startPage, Math.max(pagesRef.current.length - 1, 0)); setPage(pageRef.current)
    const first = pagesRef.current[pageRef.current]?.ops.find((op) => op.action !== 'set_focus')
    focusRef.current = first?.id || null; setFocusId(focusRef.current)
    quizRef.current = { answers: {}, timer: null, sent: false }; setQuizScore(null)
  }, [])

  // ── Start: form -> notebook (preparing screen) -> live teacher ───────
  const beginClass = useCallback(async () => {
    if (startedRef.current) return
    startedRef.current = true
    setError(''); setTargetMinutes(form.durationMinutes); setElapsed(0); setTranscript([]); setExtraOps([])
    setPrep({ stage: 'Reading what you told us', done: 0, total: 1 }); setScreen('preparing')
    try {
      const res = await fetch(`${API_URL}/live-learning/prepare`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.detail?.[0]?.msg || data.detail || data.message || 'Could not prepare the lesson.')
      const id = data.data.lessonId
      lessonRef.current = id; setLessonId(id)
      const t0 = performance.now()
      clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        const nb = await fetch(`${API_URL}/live-learning/${id}/notebook`, { headers: authHeaders() }).then((r) => r.json()).catch(() => null)
        const d = nb?.data
        if (!d) return
        setPrep(d.progress || prep)
        if (d.status === 'ready') {
          clearInterval(pollRef.current)
          liveLog(`notes ready in ${Math.round(performance.now() - t0)}ms (${d.notebook.pages.length} pages)`)
          openNotebook(d.notebook, 0)
          setScreen('classroom')
          connect(id)
        } else if (d.status === 'failed') {
          clearInterval(pollRef.current)
          setError('We could not prepare this lesson. Please try again.'); setScreen('setup'); startedRef.current = false
        }
      }, 1200)
    } catch (err) {
      setError(err.message); setScreen('setup'); startedRef.current = false
    }
  }, [connect, form, openNotebook, prep])

  const resumeLesson = useCallback(async (lesson) => {
    if (startedRef.current) return
    startedRef.current = true
    setForm((f) => ({ ...f, subject: lesson.subject, topic: lesson.topic, details: lesson.details || '', startingLevel: lesson.startingLevel || 'new' }))
    setTargetMinutes(lesson.targetMinutes || 30)
    lessonRef.current = lesson.id; setLessonId(lesson.id)
    const nb = await fetch(`${API_URL}/live-learning/${lesson.id}/notebook`, { headers: authHeaders() }).then((r) => r.json()).catch(() => null)
    if (nb?.data?.status !== 'ready') { setError('That lesson cannot be continued. Please start a new one.'); startedRef.current = false; return }
    openNotebook(nb.data.notebook, nb.data.currentPage || 0)
    setScreen('classroom')
    connect(lesson.id)
  }, [connect, openNotebook])

  // After a note she must react to, she should speak; remind her once.
  useEffect(() => {
    if (screen !== 'classroom') return
    const id = setInterval(() => {
      const asked = expectReplyRef.current
      if (!asked || paused) return
      if (lastSpokeAtRef.current > asked || lastHeardAtRef.current > asked) { expectReplyRef.current = 0; return }
      if (performance.now() - asked > 7000) {
        expectReplyRef.current = 0
        liveLog('teacher silent after a note; reminding her')
        tellVoice('The student is waiting for you to respond. Speak to them now.', 'instructions')
      }
    }, 1000)
    return () => clearInterval(id)
  }, [screen, paused, tellVoice])

  useEffect(() => () => cleanupMedia(), [cleanupMedia])

  const endClass = useCallback(async () => {
    sendLive({ type: 'session.close', event_id: `close_${Date.now()}` })
    if (lessonRef.current) {
      try {
        const response = await fetch(`${API_URL}/live-learning/${lessonRef.current}/complete`, {
          method: 'POST', headers: authHeaders(), body: JSON.stringify({ elapsedSeconds: elapsed, transcript: transcriptRef.current }),
        })
        const data = await response.json(); setSummary(data.data?.summary || `Lesson on ${form.topic} completed.`)
      } catch { setSummary(`Lesson on ${form.topic} completed.`) }
    }
    cleanupMedia(); setScreen('complete'); setStatus('ended'); setOwlState('idle')
  }, [cleanupMedia, elapsed, form.topic, sendLive])

  const toggleMic = () => {
    if (status !== 'teaching') return
    const next = !muted; setMuted(next)
    streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !next })
    setOwlState(next ? 'idle' : 'listening')
  }
  // Pausing must stop the TEACHER, not just our speaker (GPT-Live talks in
  // real time): mute the mic at OpenAI's end and tell her to stop.
  const togglePause = () => {
    if (status !== 'teaching') return
    const next = !paused; setPaused(next)
    streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !next && !muted })
    if (audioRef.current) next ? audioRef.current.pause() : audioRef.current.play().catch(() => {})
    setOwlState(next ? 'idle' : 'listening')
    if (next) {
      sendLive({ type: 'session.input_audio.mute', event_id: `mute_${Date.now()}` })
      tellVoice('The student has paused the lesson. Stop talking immediately and stay silent until you are told they are back.', 'instructions')
      if (lessonRef.current) {
        fetch(`${API_URL}/live-learning/${lessonRef.current}/pause`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ elapsedSeconds: elapsed }) }).catch(() => {})
      }
    } else {
      if (!muted) sendLive({ type: 'session.input_audio.unmute', event_id: `unmute_${Date.now()}` })
      tellVoice(`The student is back from a pause. We are on page ${pageRef.current}. In one short sentence remind them where you were, then carry on.`, 'instructions')
      expectReplyRef.current = performance.now()
    }
  }
  const sendTyped = () => {
    if (!typed.trim() || status !== 'teaching') return
    const text = typed.trim(); setTyped(''); setShowType(false)
    setTranscript((items) => [...items, { role: 'user', text }])
    const target = pageCommand(text, pageRef.current, pagesRef.current.length, quizIndex())
    if (target !== null) goPage(target, 'student')
    else tellVoice(`The student typed this instead of speaking: "${text}". Respond to it now.`, 'instructions')
    expectReplyRef.current = performance.now()
  }
  const extend = async (minutes) => {
    if (!lessonId) return
    const response = await fetch(`${API_URL}/live-learning/${lessonId}/extend?minutes=${minutes}`, { method: 'POST', headers: authHeaders(false) })
    const data = await response.json(); if (data.success) setTargetMinutes(data.data.targetMinutes)
    setShowExtend(false); tellVoice(`The student extended the lesson by ${minutes} minutes. Continue from the current page.`)
  }
  const reset = () => {
    startedRef.current = false; setScreen('setup'); setLessonId(null); lessonRef.current = null
    setPages([]); pagesRef.current = []; setPage(0); setExtraOps([]); setTranscript([]); setElapsed(0); setSummary(''); setError(''); setStatus('idle')
  }

  // The board: the notebook pages (stepIndex = page) plus anything written live.
  const operations = useMemo(() => [
    ...pages.flatMap((p, n) => p.ops.map((op) => ({ ...op, stepIndex: n }))),
    ...extraOps,
  ], [pages, extraOps])
  const roadmap = useMemo(() => pages.map((p, n) => ({ title: n === 0 ? 'Objectives' : p.title, status: n < page ? 'done' : n === page ? 'active' : 'pending' })), [pages, page])

  const remaining = targetMinutes * 60 - elapsed
  const progress = Math.min(100, elapsed / Math.max(1, targetMinutes * 60) * 100)
  const ready = status === 'teaching'
  const statusText = screen === 'preparing' ? 'Preparing your lesson…' : { connecting: 'Starting your class…', teaching: owlState === 'listening' ? 'StudyMaster is listening' : owlState === 'writing' ? 'StudyMaster is writing' : 'Teaching live', reconnecting: 'Reconnecting…' }[status] || 'Live lesson'
  const prepPct = Math.round(100 * Math.min(1, (prep.done || 0) / Math.max(1, prep.total || 1)))

  if (screen === 'setup') return <Setup form={form} setForm={setForm} onStart={beginClass} loading={false} error={error} lessons={lessons} onResume={resumeLesson} />
  if (screen === 'complete') return (
    <div className="live-complete-page"><div className="live-complete-card"><OwlTeacher state="idle" compact /><span className="live-pill"><Check size={16} /> Lesson complete</span><h1>Good work, {user?.username?.split(' ')[0] || 'student'}.</h1><p>{summary}</p><div className="live-complete-stats"><div><b>{formatTime(elapsed)}</b><span>Learning time</span></div><div><b>{quizScore ? `${quizScore.score}/${quizScore.total}` : `${Math.max(0, pages.length - 2)}`}</b><span>{quizScore ? 'Quiz score' : 'Note pages'}</span></div><div><b>{form.subject}</b><span>Subject</span></div></div><button onClick={reset}><RotateCcw size={18} /> Start another lesson</button></div></div>
  )

  return (
    <div className="live-classroom-page">
      <audio ref={audioRef} autoPlay playsInline />
      <header className="live-classroom-header">
        <div className="live-brand"><img src="/logo.png" alt="" /><b>StudyMaster</b><span /> <p>{form.subject}</p></div>
        <div className="live-session-meta"><span className={`live-status live-status-${screen === 'preparing' ? 'connecting' : status}`}><i />{statusText}</span><div className="live-clock"><Clock3 size={16} /><b>{formatTime(remaining)}</b><small>{targetMinutes} min goal</small></div></div>
      </header>
      <div className="live-progress"><i style={{ width: `${screen === 'preparing' ? prepPct : progress}%` }} /></div>

      <main className="live-classroom-stage">
        <section className="live-lesson-intro"><span>Today&apos;s focus</span><h1>{form.topic}</h1><p>{form.details || `We'll build your understanding of ${form.topic} one clear step at a time.`}</p></section>
        {screen === 'preparing' ? (
          <div className="live-board" aria-live="polite">
            <div className="live-board-empty live-prep">
              <h2>{form.topic}</h2>
              <p>Your teacher is preparing today&apos;s notes…</p>
              <ol className="live-prep-steps">
                {[
                  ['Planning the lesson and objectives', prep.done > 0 || /Writing|page|Quiz|Ready|picture/i.test(prep.stage)],
                  [`Writing the notes${prep.total > 1 ? ` (${Math.min(prep.done, prep.total - 1)} of ${prep.total - 1} pages)` : ''}`, prep.total > 1 && prep.done >= prep.total - 1],
                  ['Finding and checking pictures', prep.total > 1 && prep.done >= prep.total - 1],
                  ['Preparing your end-of-lesson quiz', prep.stage === 'Ready' || (prep.total > 1 && prep.done >= prep.total)],
                ].map(([label, done]) => <li key={label} className={done ? 'is-done' : ''}><i>{done ? <Check size={12} /> : null}</i>{label}</li>)}
              </ol>
              <small>{prep.stage}</small>
              <div className="live-writing-dots" aria-hidden="true"><i /><i /><i /></div>
            </div>
          </div>
        ) : (
          <TeachingBoard operations={operations} topic={form.topic} preparing={false} connecting={false} stepIndex={page} roadmap={roadmap} onQuizAnswer={onQuizAnswer} focusId={focusId} trackLabel="Page" onPickStep={(n) => ready && goPage(n, 'student')} />
        )}
        <div className="live-teacher-zone">
          <OwlTeacher state={screen === 'preparing' ? 'thinking' : owlState} volume={volume} />
        </div>

        <AnimatePresence mode="wait">
          {captionsOn && teacherCaption && (
            <motion.div
              key="teacher"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="live-caption"
            >
              <small>StudyMaster</small>{teacherCaption}
            </motion.div>
          )}
        </AnimatePresence>

        <button type="button" className="live-caption-toggle" onClick={() => setCaptionsOn((on) => !on)} aria-pressed={captionsOn}>
          {captionsOn ? <EyeOff size={13} /> : <Eye size={13} />}
          {captionsOn ? 'Hide captions' : 'Show captions'}
        </button>
      </main>

      {/* Disabled until the class has really started, so nobody talks into a class that is not ready. */}
      <div className="live-controls" role="toolbar" aria-label="Live lesson controls">
        <button onClick={toggleMic} disabled={!ready} className={muted ? 'danger' : ''} aria-label={muted ? 'Turn microphone on' : 'Mute microphone'}>{muted || !ready ? <MicOff /> : <Mic />}<span>{!ready ? 'Mic off' : muted ? 'Unmute' : 'Mic'}</span></button>
        <button onClick={() => ready && setShowType(true)} disabled={!ready} aria-label="Type a question"><Keyboard /><span>Type</span></button>
        <button onClick={togglePause} disabled={!ready} aria-label={paused ? 'Resume lesson' : 'Pause lesson'}>{paused ? <Play /> : <Pause />}<span>{paused ? 'Resume' : 'Pause'}</span></button>
        <button onClick={() => ready && setShowExtend(true)} disabled={!ready} aria-label="Extend lesson"><Plus /><span>Extend</span></button>
        <button onClick={endClass} className="end" aria-label="End lesson"><PhoneOff /><span>End</span></button>
      </div>

      <AnimatePresence>{showType && <motion.div className="live-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="live-type-modal" initial={{ y: 30 }} animate={{ y: 0 }}><button className="close" onClick={() => setShowType(false)}><X /></button><span>Ask StudyMaster</span><h2>Type your question</h2><textarea autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTyped() } }} placeholder="Ask for another explanation, an example, or say “go to page 2”…" /><button className="send" onClick={sendTyped} disabled={!typed.trim()}>Send to StudyMaster <Send size={17} /></button></motion.div></motion.div>}</AnimatePresence>
      <AnimatePresence>{showExtend && <motion.div className="live-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="live-extend-modal" initial={{ scale: .96 }} animate={{ scale: 1 }}><OwlTeacher state="thinking" compact /><span>Keep learning?</span><h2>Your lesson time is almost up.</h2><p>Extend the class or end here. StudyMaster will continue from the current page.</p><div><button onClick={() => extend(15)}>+15 minutes</button><button onClick={() => extend(30)}>+30 minutes</button></div><button className="finish" onClick={endClass}>End and save lesson</button></motion.div></motion.div>}</AnimatePresence>
    </div>
  )
}
