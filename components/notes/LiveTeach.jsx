'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mic, PhoneOff, Loader2, Radio } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// How much audio to buffer before the teacher starts speaking a turn. Absorbs
// network jitter (the WhatsApp-call trick): brief hiccups drain the buffer
// instead of stalling the voice.
const JITTER_SEC = 1.2
const MAX_RECONNECTS = 3
// Ask for the next segment when less than this much audio is left unplayed —
// enough to keep the voice seamless, small enough to stay genuinely live.
const CATCH_UP_SEC = 2.5

// Browsers only let audio start inside a USER GESTURE (autoplay policy). The
// context must therefore be created+resumed in the click handler itself — not
// in an effect, where activation sometimes has already expired (that was the
// "voice sometimes doesn't talk" bug). NoteCanvas calls this from the Live
// Teach button's onClick; the component then adopts this pre-unlocked context.
let sharedAudioCtx = null
export function primeLiveAudio() {
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 })
    }
    sharedAudioCtx.resume().catch(() => {})
  } catch (e) { sharedAudioCtx = null }
  return sharedAudioCtx
}

export default function LiveTeach({ noteId, onSegment, onEnd }) {
  const [status, setStatus] = useState('connecting') // connecting|teaching|listening|offline|error
  const [error, setError] = useState(null)
  const [holding, setHolding] = useState(false)
  // Browser blocked sound (autoplay policy) — show a tap-to-unmute chip.
  const [needsTap, setNeedsTap] = useState(false)

  const wsRef = useRef(null)
  const manualCloseRef = useRef(false)
  const reconnectsRef = useRef(0)
  const readyOnceRef = useRef(false)
  const onlineHandlerRef = useRef(null)
  const lastSegRef = useRef(-1)

  // --- playback ---
  const playCtxRef = useRef(null)
  const nextTimeRef = useRef(0)
  const sourcesRef = useRef(new Set())
  const segTimersRef = useRef(new Set())
  const nextPartTimerRef = useRef(null)
  const lessonDoneRef = useRef(false)
  // "Thinking…": we've asked the teacher for something and no voice is playing yet.
  const awaitingRef = useRef(false)
  const [thinking, setThinking] = useState(false)

  // --- mic ---
  const micCtxRef = useRef(null)
  const micStreamRef = useRef(null)
  const micNodeRef = useRef(null)
  const holdingRef = useRef(false)
  const dropAudioRef = useRef(false)
  const dropTimerRef = useRef(null)

  const decodeChunk = (b64) => {
    const raw = atob(b64)
    const n = raw.length / 2
    const f32 = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      let v = raw.charCodeAt(2 * i) | (raw.charCodeAt(2 * i + 1) << 8)
      if (v >= 0x8000) v -= 0x10000
      f32[i] = v / 0x8000
    }
    return f32
  }

  // Direct scheduling (the design that provably worked) + a one-line jitter
  // buffer: at the START of each speech burst, aim playback JITTER_SEC into the
  // future so ~1s of audio is always scheduled ahead of the playhead — network
  // hiccups drain that headroom instead of stalling the voice. If we ever run
  // dry, the next chunk re-primes the buffer automatically.
  const enqueueAudio = useCallback((b64) => {
    const ctx = playCtxRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
      setNeedsTap(true) // resume outside a gesture may be blocked — offer a tap
    } else if (ctx.state === 'running') {
      setNeedsTap(false)
    }
    const f32 = decodeChunk(b64)
    const buf = ctx.createBuffer(1, f32.length, 24000)
    buf.getChannelData(0).set(f32)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    const now = ctx.currentTime
    if (nextTimeRef.current < now + 0.15) {
      nextTimeRef.current = now + JITTER_SEC // burst start / underrun recovery: prime
    }
    src.start(nextTimeRef.current)
    nextTimeRef.current += buf.duration
    sourcesRef.current.add(src)
    src.onended = () => sourcesRef.current.delete(src)
    if (typeof window !== 'undefined') {
      window.__lt = window.__lt || { chunks: 0 }
      window.__lt.chunks += 1
      window.__lt.ctxState = ctx.state
      window.__lt.aheadSec = Math.max(0, nextTimeRef.current - ctx.currentTime).toFixed(2)
      window.__lt.active = sourcesRef.current.size
    }
  }, [])

  // Highlights must follow the EAR, not the wire: audio is buffered seconds ahead
  // of playback, so delay each highlight until that point is actually audible.
  const scheduleSegment = useCallback((index) => {
    const ctx = playCtxRef.current
    const lead = ctx ? nextTimeRef.current - ctx.currentTime : 0
    // A little earlier than the audio tail feels natural (teacher points, then speaks).
    const delayMs = Math.max(0, Math.min(lead - 0.4, 30)) * 1000
    if (delayMs < 60) { onSegment?.(index); return }
    const t = setTimeout(() => {
      segTimersRef.current.delete(t)
      onSegment?.(index)
    }, delayMs)
    segTimersRef.current.add(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSegment])

  // Pacing: ask for the next segment only once the student has nearly heard
  // everything we have, so generation stays in step with their ears (and a
  // barge-in never throws away a minute of unheard teaching).
  const scheduleNextPart = useCallback((ws) => {
    if (nextPartTimerRef.current) { clearTimeout(nextPartTimerRef.current); nextPartTimerRef.current = null }
    if (lessonDoneRef.current) return
    const tick = () => {
      nextPartTimerRef.current = null
      if (lessonDoneRef.current || manualCloseRef.current) return
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      if (holdingRef.current) { nextPartTimerRef.current = setTimeout(tick, 500); return }
      const ctx = playCtxRef.current
      const lead = ctx ? nextTimeRef.current - ctx.currentTime : 0
      if (lead > CATCH_UP_SEC) { nextPartTimerRef.current = setTimeout(tick, 400); return }
      try {
        awaitingRef.current = true
        ws.send(JSON.stringify({ type: 'continue' }))
      } catch (e) {}
    }
    nextPartTimerRef.current = setTimeout(tick, 200)
  }, [])

  const clearSegmentTimers = useCallback(() => {
    segTimersRef.current.forEach((t) => clearTimeout(t))
    segTimersRef.current.clear()
  }, [])

  // A real teacher pauses to think — say so instead of going quiet. True whenever
  // we're waiting on the model AND there's no voice left in the buffer to play.
  useEffect(() => {
    const id = setInterval(() => {
      const ctx = playCtxRef.current
      const lead = ctx ? nextTimeRef.current - ctx.currentTime : 0
      setThinking(awaitingRef.current && lead <= 0.12 && !holdingRef.current)
    }, 200)
    return () => clearInterval(id)
  }, [])

  const flushPlayback = useCallback(() => {
    sourcesRef.current.forEach((s) => { try { s.stop() } catch (e) {} })
    sourcesRef.current.clear()
    // Buffered audio is gone, so its pending highlights are meaningless.
    clearSegmentTimers()
    if (playCtxRef.current) nextTimeRef.current = playCtxRef.current.currentTime
  }, [clearSegmentTimers])

  // --- microphone (pre-warmed; hold to talk) ---
  const startMic = useCallback(async () => {
    if (micCtxRef.current) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const srcNode = ctx.createMediaStreamSource(stream)
    const proc = ctx.createScriptProcessor(4096, 1, 1)
    const inRate = ctx.sampleRate
    proc.onaudioprocess = (e) => {
      if (!holdingRef.current) return
      const input = e.inputBuffer.getChannelData(0)
      const ratio = inRate / 16000
      const outLen = Math.floor(input.length / ratio)
      const out = new Int16Array(outLen)
      for (let i = 0; i < outLen; i++) {
        const start = Math.floor(i * ratio)
        const end = Math.min(input.length, Math.floor((i + 1) * ratio))
        let sum = 0
        for (let j = start; j < end; j++) sum += input[j]
        const v = Math.max(-1, Math.min(1, sum / Math.max(1, end - start)))
        out[i] = v < 0 ? v * 0x8000 : v * 0x7fff
      }
      let bin = ''
      const bytes = new Uint8Array(out.buffer)
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
      wsRef.current?.readyState === 1 && wsRef.current.send(JSON.stringify({ type: 'audio', data: btoa(bin) }))
    }
    srcNode.connect(proc)
    proc.connect(ctx.destination)
    micCtxRef.current = ctx
    micStreamRef.current = stream
    micNodeRef.current = proc
  }, [])

  const holdStart = useCallback(async () => {
    try {
      // A press is a user gesture — use it to (re)unlock sound too.
      playCtxRef.current?.resume().then(() => setNeedsTap(false)).catch(() => {})
      await startMic()
      flushPlayback()
      dropAudioRef.current = true
      if (dropTimerRef.current) { clearTimeout(dropTimerRef.current); dropTimerRef.current = null }
      wsRef.current?.readyState === 1 && wsRef.current.send(JSON.stringify({ type: 'mic_start' }))
      holdingRef.current = true
      setHolding(true)
      setStatus('listening')
    } catch (e) { setError('Microphone not available') }
  }, [startMic, flushPlayback])

  const holdEnd = useCallback(() => {
    if (!holdingRef.current) return
    holdingRef.current = false
    setHolding(false)
    setStatus('teaching')
    // Question sent: the teacher is now thinking about the answer.
    awaitingRef.current = true
    wsRef.current?.readyState === 1 && wsRef.current.send(JSON.stringify({ type: 'mic_end' }))
    dropTimerRef.current = setTimeout(() => { dropAudioRef.current = false }, 1500)
  }, [])

  const stopAll = useCallback(() => {
    manualCloseRef.current = true
    if (nextPartTimerRef.current) { clearTimeout(nextPartTimerRef.current); nextPartTimerRef.current = null }
    try { wsRef.current?.close() } catch (e) {}
    flushPlayback()
    try { playCtxRef.current?.close() } catch (e) {}
    try { micNodeRef.current?.disconnect() } catch (e) {}
    try { micCtxRef.current?.close() } catch (e) {}
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    if (playCtxRef.current === sharedAudioCtx) sharedAudioCtx = null
    playCtxRef.current = null
    micCtxRef.current = null
  }, [flushPlayback])

  useEffect(() => {
    let alive = true
    manualCloseRef.current = false
    // Prefer the context created inside the Live Teach click (gesture-unlocked);
    // creating one here is only a fallback and may start muted by the browser.
    playCtxRef.current = (sharedAudioCtx && sharedAudioCtx.state !== 'closed')
      ? sharedAudioCtx
      : new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 })
    nextTimeRef.current = 0

    const token = localStorage.getItem('token')
    const wsUrl = API_URL.replace(/^http/, 'ws') + `/notes/${noteId}/live-teach?token=${token}`

    const connect = (isReconnect) => {
      if (!alive) return
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onmessage = (e) => {
        if (!alive) return
        let msg
        try { msg = JSON.parse(e.data) } catch (err) { return }
        if (msg.type === 'ready') {
          reconnectsRef.current = 0
          readyOnceRef.current = true
          setStatus('teaching')
          // The backend resumes the same Gemini session on its side (resumption
          // handles), so a plain "start" is always right — it converts it into a
          // silent continue when this is a rejoin.
          awaitingRef.current = true
          ws.send(JSON.stringify({ type: 'start' }))
          startMic().catch(() => {})
        } else if (msg.type === 'audio') {
          if (!dropAudioRef.current) {
            awaitingRef.current = false // the teacher is speaking again
            enqueueAudio(msg.data)
          }
        } else if (msg.type === 'segment') {
          lastSegRef.current = msg.index
          // The model generates speech FASTER than real time, so audio queues up
          // several seconds ahead. Highlight when the student actually HEARS this
          // part, not when the instruction arrives — otherwise it races ahead.
          scheduleSegment(msg.index)
        } else if (msg.type === 'interrupted') {
          flushPlayback()
        } else if (msg.type === 'turn_complete') {
          if (!holdingRef.current) {
            dropAudioRef.current = false
            if (dropTimerRef.current) { clearTimeout(dropTimerRef.current); dropTimerRef.current = null }
          }
          if (msg.final) lessonDoneRef.current = true
          scheduleNextPart(ws)
        } else if (msg.type === 'error') {
          setError(msg.message)
          setStatus('error')
        }
      }
      ws.onerror = () => { /* onclose decides */ }
      ws.onclose = () => {
        if (!alive || manualCloseRef.current) return
        // The student's own internet is down: say so, and reconnect the moment
        // it returns (the backend holds the lesson for a grace window).
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          setStatus('offline')
          const onBack = () => {
            window.removeEventListener('online', onBack)
            onlineHandlerRef.current = null
            if (!alive || manualCloseRef.current) return
            reconnectsRef.current = 0
            setStatus(readyOnceRef.current ? 'teaching' : 'connecting')
            connect(true)
          }
          onlineHandlerRef.current = onBack
          window.addEventListener('online', onBack)
          return
        }
        // A silent reconnect reads as "thinking" rather than dead air.
        awaitingRef.current = true
        // Server-side drop with the student's network fine: reconnect silently —
        // keep showing "teaching" so the lesson never appears to break.
        if (reconnectsRef.current < MAX_RECONNECTS) {
          reconnectsRef.current += 1
          if (!readyOnceRef.current) setStatus('connecting')
          setTimeout(() => connect(true), 400 * reconnectsRef.current)
        } else {
          setError('Connection lost — please try again')
          setStatus('error')
        }
      }
    }
    connect(false)

    return () => {
      alive = false
      if (onlineHandlerRef.current) {
        window.removeEventListener('online', onlineHandlerRef.current)
        onlineHandlerRef.current = null
      }
      const ws = wsRef.current
      if (ws) { ws.onmessage = null; ws.onerror = null; ws.onclose = null }
      stopAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId])

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white rounded-full pl-5 pr-2 py-2 shadow-2xl"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {status === 'connecting' && (<><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>)}
        {status === 'teaching' && thinking && (
          // The teacher is between thoughts — say so, don't just go silent.
          <>
            <span className="flex items-end gap-1 h-4">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-sky-400"
                  animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
            </span>
            <span className="text-sky-200">Thinking…</span>
          </>
        )}
        {status === 'teaching' && !thinking && (
          <>
            <motion.span animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
              <Radio className="w-4 h-4 text-emerald-400" />
            </motion.span>
            Teaching live — hold the mic to ask
          </>
        )}
        {status === 'listening' && (<><Mic className="w-4 h-4 text-red-400 animate-pulse" /> Listening… release when done</>)}
        {status === 'offline' && (<span className="text-amber-300">📶 Waiting for your internet connection…</span>)}
        {status === 'error' && (<span className="text-red-300">{error || 'Something went wrong'}</span>)}
      </div>

      {needsTap && (
        <button
          onClick={() => { playCtxRef.current?.resume().then(() => setNeedsTap(false)).catch(() => {}) }}
          className="px-3 py-1.5 rounded-full bg-amber-400 text-gray-900 text-xs font-bold animate-pulse"
        >
          🔇 Tap for sound
        </button>
      )}

      <button
        onMouseDown={holdStart} onMouseUp={holdEnd} onMouseLeave={() => holding && holdEnd()}
        onTouchStart={(e) => { e.preventDefault(); holdStart() }} onTouchEnd={(e) => { e.preventDefault(); holdEnd() }}
        disabled={status === 'connecting' || status === 'error' || status === 'offline'}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all select-none ${holding ? 'bg-red-500 scale-110' : 'bg-blue-600 hover:bg-blue-500'} disabled:opacity-40`}
        title="Hold to speak"
      >
        <Mic className="w-5 h-5" />
      </button>

      <button
        onClick={() => { stopAll(); onEnd?.() }}
        className="w-11 h-11 rounded-full bg-white/10 hover:bg-red-500/80 flex items-center justify-center transition-colors"
        title="End live lesson"
      >
        <PhoneOff className="w-5 h-5" />
      </button>
    </motion.div>
  )
}
