'use client'

import { useState } from 'react'
import ShapeChallenge from './ShapeChallenge'
import Leaderboard from './Leaderboard'
import GameHelp from './GameHelp'

export default function GamingContent() {
  const [activeTab, setActiveTab] = useState('challenge')
  const [showHelp, setShowHelp] = useState(false)

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
