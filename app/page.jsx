'use client'

import { useAuth } from '@/context/AuthContext'
import MainLayout from '@/components/MainLayout'
import DashboardContent from '@/components/DashboardContent'
import LandingContent from '@/components/LandingContent'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <iconify-icon icon="line-md:loading-twotone-loop" width="32"></iconify-icon>
      </div>
    )
  }

  if (!user) {
    return <LandingContent />
  }

  return (
    <MainLayout>
      <DashboardContent />
    </MainLayout>
  )
}
