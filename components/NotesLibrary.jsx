'use client'

import { useState, useEffect } from 'react'
import NoteCard from './NoteCard'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import QuizSection from './QuizSection'

export default function NotesLibrary({ onOpenNote }) {
  const { token } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNote, setSelectedNote] = useState(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setNotes(data.data)
      }
    } catch (error) {
      console.error("Error fetching notes:", error)
      toast.error("Failed to load notes.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this note?")) return
    try {
      const response = await fetch(`${API_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setNotes(notes.filter(n => n._id !== id))
        toast.success("Note deleted successfully.")
      }
    } catch (error) {
      toast.error("Failed to delete note.")
    }
  }

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tag?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDownload = async () => {
    if (!selectedNote) return;
    toast.info('Preparing PDF download...');
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.createElement('div');
      element.innerHTML = selectedNote.content;
      element.className = 'sm-notes-container bg-white text-slate-900';
      element.style.padding = '40px';
      element.style.width = '800px';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.top = '0';

      document.body.appendChild(element);

      const opt = {
        margin: 0.5,
        filename: `${selectedNote.title || 'StudyMaster_Notes'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      try {
        await html2pdf().set(opt).from(element).save();
        toast.success('PDF downloaded successfully!');
      } catch (err) {
        console.error('PDF Error:', err);
        toast.error('Failed to generate PDF.');
      } finally {
        if (document.body.contains(element)) {
          document.body.removeChild(element);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load PDF generator.');
    }
  }

  return (
    <div className="flex-1 flex-col bg-slate-50/30 overflow-y-auto p-4 md:p-10 relative">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        {/* Header and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Study Library</h1>
            <p className="text-sm text-slate-500">Access all your AI-generated study materials.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:flex-none">
              <iconify-icon
                icon="solar:magnifer-linear"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                width="18"
                height="18"
              ></iconify-icon>
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Note Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white border border-slate-100 rounded-2xl"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note._id}
                subject={note.tag || 'Study Material'}
                subjectColor={note.tag === 'Biology' ? 'biology' : 'physics'}
                title={note.title}
                description={note.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...'}
                date={note.createdAt}
                onOpen={() => {
                  if (onOpenNote) {
                    onOpenNote(note);
                  } else {
                    setSelectedNote(note);
                  }
                }}
                onDelete={() => handleDelete(note._id)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-300">
              <iconify-icon icon="solar:notebook-linear" width="32" height="32"></iconify-icon>
            </div>
            <div>
              <p className="text-base font-medium text-slate-900">No notes found</p>
              <p className="text-sm text-slate-500 max-w-[240px]">
                Try adjusting your search or generate new notes in the Study Room.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Note Details View Overlay */}
      {selectedNote && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center lg:py-10 animate-in slide-in-from-bottom duration-500 overflow-hidden">
          <div className="w-full max-w-5xl h-full flex flex-col bg-white overflow-hidden shadow-2xl lg:rounded-3xl border border-slate-100 relative">
            {/* Header / Actions */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-4 min-w-0">
                <button
                  onClick={() => setSelectedNote(null)}
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
                >
                  <iconify-icon icon="solar:arrow-left-linear" width="20" height="20"></iconify-icon>
                </button>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 truncate">{selectedNote.title}</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{new Date(selectedNote.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                >
                  <iconify-icon icon="solar:download-linear" width="16" height="16"></iconify-icon>
                  <span className="hidden sm:inline">Download</span>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              {/* Note Content */}
              <div className="flex-[2] p-6 md:p-10 lg:p-16">
                <div
                  className="sm-notes-container"
                  dangerouslySetInnerHTML={{ __html: selectedNote.content }}
                />

                {/* Quiz Section */}
                <QuizSection
                  quizData={selectedNote.quizId}
                  noteContent={selectedNote.content}
                />
              </div>

              {/* Chat History Panel */}
              <div className="flex-1 bg-slate-50/50 p-6 md:p-8 space-y-6">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <iconify-icon icon="solar:chat-round-line-linear" className="text-indigo-600"></iconify-icon>
                  Chat History
                </h3>
                <div className="space-y-4">
                  {selectedNote.chatHistory && selectedNote.chatHistory.length > 0 ? (
                    selectedNote.chatHistory.map((chat, idx) => (
                      <div key={idx} className={`p-4 rounded-2xl text-xs leading-relaxed ${chat.role === 'user' ? 'bg-indigo-600 text-white ml-4' : 'bg-white text-slate-700 border border-slate-100 mr-4'}`}>
                        <p className="font-bold mb-1 uppercase text-[9px] opacity-70">
                          {chat.role === 'user' ? 'User Request' : 'StudyMaster'}
                        </p>
                        {chat.message}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No linked chat history for this note.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
