'use client'

import { useState, useEffect } from 'react'
import ShapeChallenge from './ShapeChallenge'
import Leaderboard from './Leaderboard'
import GameHelp from './GameHelp'
import Loading from './Loading'

export default function GamingContent() {
  const [activeTab, setActiveTab] = useState('challenge')
  const [showHelp, setShowHelp] = useState(false)
  // Admin-controlled availability: which games are live right now.
  const [availability, setAvailability] = useState(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/game/available`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((r) => r.json())
      .then((d) => setAvailability(d.success ? d.data : { gamingEnabled: true, games: [{ key: 'shape-challenge' }] }))
      .catch(() => setAvailability({ gamingEnabled: true, games: [{ key: 'shape-challenge' }] }))
  }, [])

  if (availability === null) return <Loading label="Loading games…" />

  const shapeOn = availability.gamingEnabled &&
    availability.games.some((g) => g.key === 'shape-challenge')

  if (!availability.gamingEnabled || !shapeOn) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-[#F5F5F5] flex items-center justify-center mb-5">
          <iconify-icon icon="solar:gamepad-linear" width="30" height="30" className="text-[#A3A3A3]" />
        </div>
        <h2 className="text-xl font-semibold text-[#171717] mb-2">Games are resting 😴</h2>
        <p className="text-sm text-[#666666]">
          New brain games drop on Fridays — check back soon and battle for the leaderboard!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#171717]">Shape Memory Challenge</h1>
          <p className="text-sm text-[#666666] mt-1">Train your brain and climb the leaderboard!</p>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-full hover:bg-[#F5F5F5] transition-colors text-[#666666]"
            title="How to play"
          >
            <iconify-icon icon="solar:help-circle-linear" width="24" height="24" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#EAEAEA]">
        <button
          onClick={() => setActiveTab('challenge')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'challenge' ? 'text-[#171717]' : 'text-[#A3A3A3] hover:text-[#666666]'
          }`}
        >
          Challenge
          {activeTab === 'challenge' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#171717] rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'leaderboard' ? 'text-[#171717]' : 'text-[#A3A3A3] hover:text-[#666666]'
          }`}
        >
          Leaderboard
          {activeTab === 'leaderboard' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#171717] rounded-full" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="mt-2">
        {activeTab === 'challenge' ? <ShapeChallenge /> : <Leaderboard />}
      </div>

      {/* Help Modal */}
      {showHelp && <GameHelp onClose={() => setShowHelp(false)} />}
    </div>
  )
}
