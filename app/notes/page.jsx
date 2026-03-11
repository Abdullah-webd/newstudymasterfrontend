'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import NotesHeader from '@/components/NotesHeader'
import StudyRoom from '@/components/StudyRoom'
import NotesLibrary from '@/components/NotesLibrary'
import MainLayout from '@/components/MainLayout'

function NotesContent() {
  const searchParams = useSearchParams()
  const viewParam = searchParams.get('view')
  const [currentView, setCurrentView] = useState('study')
  const [loadedNote, setLoadedNote] = useState(null)

  useEffect(() => {
    if (viewParam === 'library') {
      setCurrentView('library')
    } else {
      setCurrentView('study')
    }
  }, [viewParam])

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white">
      <NotesHeader
        onSwitchView={(view) => {
          if (view === 'study') setLoadedNote(null) // Clear note when explicitly clicking 'Study Room' tab
          setCurrentView(view)
        }}
        currentView={currentView}
      />
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {currentView === 'study' ? (
          <StudyRoom initialNote={loadedNote} />
        ) : (
          <NotesLibrary
            onOpenNote={(note) => {
              setLoadedNote(note)
              setCurrentView('study')
            }}
          />
        )}
      </div>
    </div>
  )
}

export default function NotesGenerator() {
  return (
    <MainLayout isFullBleed={true}>
      <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
        <NotesContent />
      </Suspense>
    </MainLayout>
  )
}
