'use client'

import MainLayout from '@/components/MainLayout'
import GamingContent from '@/components/GamingContent'

export default function GamingPage() {
  return (
    <MainLayout>
      <div className="flex-1 w-full bg-[#FAFAFA] min-h-screen">
        <GamingContent />
      </div>
    </MainLayout>
  )
}
