'use client'

import MainLayout from '@/components/MainLayout'
import LiveLearningPage from '@/components/live-learning/LiveLearningPage'
import './live-learning.css'

export default function LiveLearningRoute() {
  return <MainLayout isFullBleed><LiveLearningPage /></MainLayout>
}
