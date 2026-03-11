'use client'

import { useState, useEffect, useRef } from 'react'
import AIChat from './AIChat'
import NotesDisplay from './NotesDisplay'
import MobileNotesOverlay from './MobileNotesOverlay'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export default function StudyRoom({ initialNote }) {
  const { token, user } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [generatedNote, setGeneratedNote] = useState(null)
  const eventSourceRef = useRef(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (initialNote) {
      setGeneratedNote(initialNote)
      setMessages(initialNote.chatHistory || [])
      if (window.innerWidth < 768) {
        setMobileNotesOpen(true)
      }
    } else {
      setGeneratedNote(null)
      setMessages([])
    }
  }, [initialNote])

  const handleSendMessage = async (text) => {
    // Add user message to chat
    const userMessage = { role: 'user', message: text }
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages)
    setIsGenerating(true)

    try {
      const response = await fetch(`${API_URL}/notes/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: updatedMessages,
          onboardingData: user?.onboarding || {}
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Error communicating with AI')
      }

      if (result.intent === 'generate_notes') {
        // User wants to generate notes and provided the topic
        startNoteGeneration(result.topic)
      } else {
        // Normal chat response
        setMessages(prev => [...prev, {
          role: 'assistant',
          message: result.message
        }])
        setIsGenerating(false)
      }
    } catch (error) {
      console.error("Chat error:", error)
      toast.error(error.message)
      setIsGenerating(false)
    }
  }

  const startNoteGeneration = async (topic) => {
    setIsGenerating(true)
    setMessages(prev => [...prev, { role: 'system', message: 'Initializing note generation...' }])

    try {
      // 1. Establish SSE Connection for logs
      const sseUrl = `${API_URL}/notes/stream?token=${token}` // Passing token in query for EventSource
      eventSourceRef.current = new EventSource(sseUrl)

      eventSourceRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.message) {
          setMessages(prev => [...prev, { role: 'system', message: data.message }])
        }
      }

      eventSourceRef.current.onerror = (err) => {
        console.error("SSE Error:", err)
        eventSourceRef.current.close()
      }

      // 2. Trigger Generation
      const response = await fetch(`${API_URL}/notes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userRequest: topic,
          onboardingData: user?.onboarding || {},
          currentHtml: generatedNote?.content,
          noteId: generatedNote?._id || generatedNote?.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to start generation')
      }

      // Note: The Inngest job is async. We wait for logs via SSE.
      // But we also need to know when it's DONE to fetch the actual note.
      // In a real app, SSE might send a 'completed' event with the note content.
      // For now, let's assume the Inngest workflow finishes and we can poll or wait.
      // Optimistically, we can update the createNote.js to return the note via SSE.

    } catch (error) {
      console.error("Generation error:", error)
      toast.error(error.message)
      setIsGenerating(false)
      if (eventSourceRef.current) eventSourceRef.current.close()
    }
  }

  // Effect to listen for special 'ready' log or similar to stop generation
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'system' && lastMessage.message.includes('ready')) {
      setIsGenerating(false)
      if (eventSourceRef.current) eventSourceRef.current.close()

      // Fetch the latest note for the user
      fetchLatestNote()
    }
  }, [messages])

  const fetchLatestNote = async () => {
    try {
      const response = await fetch(`${API_URL}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success && data.data.length > 0) {
        setGeneratedNote(data.data[0])
        toast.success("Notes generated successfully!")
        if (window.innerWidth < 768) {
          setMobileNotesOpen(true)
        }
      }
    } catch (error) {
      console.error("Error fetching note:", error)
    }
  }

  const handleMobileNotesOpen = () => {
    setMobileNotesOpen(true)
  }

  const handleMobileNotesClose = () => {
    setMobileNotesOpen(false)
  }

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <AIChat
        onSendMessage={handleSendMessage}
        isGenerating={isGenerating}
        logs={messages}
        onMobileNotesOpen={handleMobileNotesOpen}
      />
      <NotesDisplay noteData={generatedNote} />
      <MobileNotesOverlay
        isOpen={mobileNotesOpen}
        onClose={handleMobileNotesClose}
        noteData={generatedNote}
      />
    </div>
  )
}
