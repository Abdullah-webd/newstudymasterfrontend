'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Mic, Send, Loader2, BookOpen, MessageSquarePlus, Trash2, X, Square,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function ChatPanel({
  tab, setTab, messages, onSend, generating, library, libLoading, onOpenNote, onDeleteNote,
  onNewNote, activeNoteId,
}) {
  const [text, setText] = useState('')
  const [images, setImages] = useState([]) // {dataUrl, name}
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const fileRef = useRef(null)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const scrollRef = useRef(null)

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight) }, [messages, generating])

  const pickImages = (e) => {
    const files = Array.from(e.target.files || [])
    files.slice(0, 4).forEach((f) => {
      const reader = new FileReader()
      reader.onload = () => setImages((prev) => [...prev, { dataUrl: reader.result, name: f.name }].slice(0, 4))
      reader.readAsDataURL(f)
    })
    e.target.value = ''
  }

  const send = () => {
    if (!text.trim() || generating) return
    onSend(text.trim(), images.map((i) => i.dataUrl))
    setText(''); setImages([])
  }

  const toggleMic = async () => {
    if (recording) {
      mediaRef.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setRecording(false)
        setTranscribing(true)
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const fd = new FormData()
          fd.append('audio', blob, 'dictation.webm')
          const token = localStorage.getItem('token')
          const res = await fetch(`${API_URL}/speech/transcribe`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
          })
          const data = await res.json()
          if (data.success && data.data.text) setText((t) => (t ? t + ' ' : '') + data.data.text)
        } finally { setTranscribing(false) }
      }
      mediaRef.current = mr
      mr.start()
      setRecording(true)
    } catch (e) { /* mic denied */ }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/60 border-r border-gray-100">
      {/* tabs */}
      <div className="flex items-center gap-1 p-3 border-b border-gray-100 bg-white">
        <button onClick={() => setTab('chat')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${tab === 'chat' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
          Assistant
        </button>
        <button onClick={() => setTab('library')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${tab === 'library' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
          My Notes
        </button>
      </div>

      {tab === 'chat' ? (
        <>
          <div className="p-3 border-b border-gray-100 bg-white">
            <button onClick={onNewNote}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              <MessageSquarePlus className="w-4 h-4" /> New note
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-gray-400 text-center mt-8 px-4">
                Ask me to create a note — e.g. <span className="text-gray-600">"Explain photosynthesis for SS2"</span>
                {' '}or <span className="text-gray-600">"Notes on quadratic equations with examples"</span>.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-700'}`}>
                  {m.message}
                </div>
              </div>
            ))}
            {generating && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2.5 rounded-2xl bg-white border border-gray-100 text-gray-500 text-sm flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Working on it…
                </div>
              </div>
            )}
          </div>

          {/* input */}
          <div className="p-3 border-t border-gray-100 bg-white">
            {images.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200">
                    <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                      className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 p-2">
              <button onClick={() => fileRef.current?.click()} className="p-2 text-gray-400 hover:text-blue-600 shrink-0" title="Attach image">
                <Plus className="w-5 h-5" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={pickImages} />
              <textarea
                value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                rows={1} placeholder={transcribing ? 'Transcribing…' : 'Ask for a note…'}
                className="flex-1 bg-transparent resize-none outline-none text-sm py-2 max-h-28"
              />
              <button onClick={toggleMic}
                className={`p-2 shrink-0 rounded-lg ${recording ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-blue-600'}`}
                title={recording ? 'Stop' : 'Dictate'}>
                {recording ? <Square className="w-5 h-5 fill-red-500" /> : transcribing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
              </button>
              <button onClick={send} disabled={!text.trim() || generating}
                className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 disabled:opacity-40">
                <Send className="w-4 h-4" />
              </button>
            </div>
            {recording && (
              <div className="flex items-center gap-2 mt-2 text-xs text-red-500">
                <motion.span className="w-2 h-2 rounded-full bg-red-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                Recording… tap the square to stop
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {libLoading && (
            <div className="flex items-center justify-center gap-1.5 mt-10">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
            </div>
          )}
          {!libLoading && library.length === 0 && <div className="text-sm text-gray-400 text-center mt-8">No notes yet.</div>}
          {library.map((n) => (
            <div key={n.id}
              className={`group p-3 rounded-2xl border cursor-pointer transition-all ${activeNoteId === n.id ? 'border-blue-300 bg-blue-50/50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
              onClick={() => onOpenNote(n.id)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">{n.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {(n.subject || n.tag || 'General').replace(/-/g, ' ')}
                    {n.hasQuiz && ' · quiz'}{n.imageCount ? ` · ${n.imageCount} img` : ''}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDeleteNote(n.id) }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
