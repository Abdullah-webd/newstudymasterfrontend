'use client'

import { useState, useEffect, useCallback } from 'react'
import { PanelLeftClose, PanelLeftOpen, FileText, MessagesSquare } from 'lucide-react'
import ChatPanel from './ChatPanel'
import NoteCanvas from './NoteCanvas'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Parse an SSE stream from a fetch Response, invoking onEvent(obj) per event.
// Robust to CRLF vs LF line endings (sse-starlette uses \r\n) and multi-line data.
async function readSSE(res, onEvent) {
  if (!res.body) throw new Error('No response stream')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    buffer = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    let idx
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      const dataLines = rawEvent
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).replace(/^ /, ''))
      if (!dataLines.length) continue
      try { onEvent(JSON.parse(dataLines.join('\n'))) } catch (e) { /* ignore */ }
    }
  }
}

export default function NotesWorkspace() {
  const [tab, setTab] = useState('chat')
  const [messages, setMessages] = useState([])
  const [note, setNote] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [steps, setSteps] = useState([])
  const [library, setLibrary] = useState([])
  const [mobilePane, setMobilePane] = useState('chat') // 'chat' | 'canvas' (mobile)
  const [chatOpen, setChatOpen] = useState(true) // desktop collapse

  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` })

  const [libLoading, setLibLoading] = useState(true)
  // True while a specific note is being fetched (open from library / URL restore).
  const [noteLoading, setNoteLoading] = useState(false)
  const loadLibrary = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/notes`, { headers: authHeaders() })
      const data = await res.json()
      if (data.success) setLibrary(data.data)
    } catch (e) { /* */ }
    finally { setLibLoading(false) }
  }, [])

  useEffect(() => { loadLibrary() }, [loadLibrary])

  // Keep the open note in the URL so a refresh restores it.
  const setNoteUrl = (id) => {
    if (typeof window === 'undefined') return
    window.history.replaceState(null, '', id ? `/notes?note=${id}` : '/notes')
  }

  // Silent background activity tracking (feeds readiness): the system sees what
  // the student studies and for how long, without showing anything.
  const track = (action, type, metadata) => {
    try {
      fetch(`${API_URL}/activity/${action}`, {
        method: 'POST', headers: authHeaders(), keepalive: true,
        body: JSON.stringify({ type, metadata }),
      }).catch(() => {})
    } catch (e) { /* never disturb the student */ }
  }
  // Close any open note-study session when the student leaves the tab entirely.
  useEffect(() => () => track('stop', 'note_study'), []) // eslint-disable-line react-hooks/exhaustive-deps

  // Honour deep links:
  //  /notes?view=library            — open the library tab
  //  /notes?note=<id>               — restore the open note after refresh
  //  /notes?autoprompt=<text>       — roadmap handoff: auto-send this to the assistant
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('view') === 'library') setTab('library')
    const auto = params.get('autoprompt')
    if (auto && auto.trim()) {
      // Strip it from the URL first so a refresh doesn't re-send it.
      window.history.replaceState(null, '', '/notes')
      onSend(auto.trim(), undefined)
      return
    }
    const noteParam = params.get('note')
    if (noteParam) openNote(noteParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Send everything through the smart /assist endpoint — the agent decides
  // whether to generate a new note, edit the open one, or answer a question.
  const onSend = async (prompt, images) => {
    setMessages((m) => [...m, { role: 'user', message: prompt }])
    setGenerating(true)
    setSteps([])
    setMobilePane('canvas')
    let handledByComplete = false
    let currentIntent = null
    try {
      const res = await fetch(`${API_URL}/notes/assist`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ prompt, images, noteId: note?.id || note?.noteId || null }),
      })
      await readSSE(res, (ev) => {
        if (ev.type === 'intent') {
          currentIntent = ev.intent
          if (ev.intent === 'generate') setNote(null) // new note replaces the canvas
        } else if (ev.type === 'progress') {
          setSteps((s) => [...s, ev.message])
        } else if (ev.type === 'complete') {
          handledByComplete = true
          setNote(ev.note)
          setNoteUrl(ev.note.id || ev.note.noteId)
          if (Array.isArray(ev.note.chatHistory)) setMessages(ev.note.chatHistory)
          loadLibrary()
        } else if (ev.type === 'assistant_message') {
          if (!handledByComplete) setMessages((m) => [...m, { role: 'assistant', message: ev.message }])
        } else if (ev.type === 'error') {
          setMessages((m) => [...m, { role: 'assistant', message: `Sorry — ${ev.message}` }])
        }
      })
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', message: 'Something went wrong. Please try again.' }])
    } finally {
      setGenerating(false)
      loadLibrary()
    }
  }

  const openNote = async (id) => {
    setTab('chat'); setMobilePane('canvas')
    // Clear the canvas and show a loader immediately — never leave the previous
    // note (or the empty "create a note" screen) visible while fetching.
    setNote(null)
    setNoteLoading(true)
    try {
      const res = await fetch(`${API_URL}/notes/${id}`, { headers: authHeaders() })
      const data = await res.json()
      if (data.success) {
        setNote(data.data)
        setNoteUrl(id)
        // Each note carries its own chat thread.
        setMessages(Array.isArray(data.data.chatHistory) ? data.data.chatHistory : [])
        // Background: a note-study session starts (the backend auto-closes any previous one).
        track('start', 'note_study', { noteId: id, title: data.data.title })
      }
    } catch (e) { /* */ }
    finally { setNoteLoading(false) }
  }

  const deleteNote = async (id) => {
    await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE', headers: authHeaders() })
    if ((note?.id || note?.noteId) === id) { setNote(null); setMessages([]); setNoteUrl(null); track('stop', 'note_study') }
    loadLibrary()
  }

  const newNote = () => {
    if (note) track('stop', 'note_study')
    setNote(null); setMessages([]); setSteps([]); setTab('chat'); setMobilePane('chat'); setNoteUrl(null)
  }

  // Single ChatPanel + single NoteCanvas (no duplicate mounts). Responsive
  // classes place them side-by-side on desktop and one-at-a-time on mobile.
  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Chat panel — one instance */}
      <div className={`${mobilePane === 'chat' ? 'flex' : 'hidden'} md:flex flex-col shrink-0 transition-all duration-300 w-full ${chatOpen ? 'md:w-[380px]' : 'md:w-0 md:overflow-hidden'}`}>
        <ChatPanel
          tab={tab} setTab={setTab} messages={messages} onSend={onSend} generating={generating}
          library={library} libLoading={libLoading} onOpenNote={openNote} onDeleteNote={deleteNote}
          onNewNote={newNote} activeNoteId={note?.id || note?.noteId}
        />
      </div>

      {/* Canvas — one instance */}
      <div className={`${mobilePane === 'canvas' ? 'flex' : 'hidden'} md:flex flex-1 min-w-0 relative`}>
        <button onClick={() => setChatOpen((v) => !v)}
          className="hidden md:flex absolute top-4 left-3 z-20 p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-blue-600 shadow-sm"
          title={chatOpen ? 'Hide panel' : 'Show panel'}>
          {chatOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0 pb-14 md:pb-0">
          <NoteCanvas note={note} generating={generating} steps={steps} noteLoading={noteLoading} />
        </div>
      </div>

      {/* Mobile pane switch */}
      <div className="md:hidden fixed bottom-0 inset-x-0 flex border-t border-gray-100 bg-white z-30">
        <button onClick={() => setMobilePane('chat')} className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm ${mobilePane === 'chat' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
          <MessagesSquare className="w-4 h-4" /> Assistant
        </button>
        <button onClick={() => setMobilePane('canvas')} className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm ${mobilePane === 'canvas' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
          <FileText className="w-4 h-4" /> Note
        </button>
      </div>
    </div>
  )
}
