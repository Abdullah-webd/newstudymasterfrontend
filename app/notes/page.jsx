'use client'

import MainLayout from '@/components/MainLayout'
import NotesWorkspace from '@/components/notes/NotesWorkspace'

export default function NotesGenerator() {
  return (
    <MainLayout isFullBleed={true}>
      <NotesWorkspace />
    </MainLayout>
  )
}
