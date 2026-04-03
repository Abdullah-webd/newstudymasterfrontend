'use client'

import { useState, useEffect } from 'react'

export default function Leaderboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/game/leaderboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const result = await res.json()
        if (result.success) {
          setData(result)
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  const formatTime = (ms) => {
    if (!ms) return '-'
    const seconds = Math.floor(ms / 1000)
    const milliseconds = Math.floor((ms % 1000) / 10)
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-8 animate-pulse">
        <div className="h-32 bg-gray-100 rounded-2xl w-full" />
        <div className="h-64 bg-gray-100 rounded-2xl w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 py-4 animate-in fade-in duration-700">
      {/* Daily Top Highlight */}
      {data?.dailyTop && (
        <div className="bg-gradient-to-br from-[#171717] to-gray-800 text-white p-6 rounded-2xl relative overflow-hidden shadow-xl shadow-black/5">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <iconify-icon icon="solar:crown-minimalistic-bold" width="20" className="text-yellow-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Daily Top Scorer</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center p-0.5 border border-white/20 shadow-inner">
                {data.dailyTop.userId.avatar ? (
                  <img src={data.dailyTop.userId.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <iconify-icon icon="solar:user-bold-duotone" width="32" className="text-gray-400" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold truncate max-w-[200px]">{data.dailyTop.userId.username}</span>
                <span className="text-2xl font-mono text-yellow-400 font-black">{formatTime(data.dailyTop.timeTaken)}</span>
              </div>
            </div>
          </div>
          
          <iconify-icon icon="solar:ranking-bold-duotone" width="160" height="160" className="absolute -right-10 -bottom-10 opacity-10 rotate-12" />
        </div>
      )}

      {/* Main Ranking Table */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#EAEAEA] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider">World Ranking</h3>
            <span className="text-[10px] text-[#A3A3A3] font-medium tracking-tight">Best times for 10/10 correct</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[#A3A3A3] text-xs font-semibold uppercase tracking-wider border-b border-[#F5F5F5]">
                <th className="px-6 py-4 font-medium">Rank</th>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium text-center">Attempts</th>
                <th className="px-6 py-4 font-medium text-right">Best Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAFAFA]">
              {data?.leaderboard.length > 0 ? (
                data.leaderboard.map((entry, index) => (
                  <tr key={index} className="hover:bg-[#FAFAFA] transition-colors group">
                    <td className="px-6 py-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        index === 0 ? 'bg-yellow-100 text-yellow-600 shadow-sm border border-yellow-200' : 
                        index === 1 ? 'bg-gray-100 text-gray-500 shadow-sm border border-gray-200' :
                        index === 2 ? 'bg-amber-100 text-amber-600 shadow-sm border border-amber-200' :
                        'text-[#666666]'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center overflow-hidden border border-[#EAEAEA]">
                          {entry.avatar ? (
                            <img src={entry.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <iconify-icon icon="solar:user-linear" width="16" />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-[#171717]">{entry.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className="text-xs font-medium text-[#666666] bg-[#F5F5F5] px-2 py-1 rounded-md">{entry.totalAttempts}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-mono font-bold text-[#171717]">{formatTime(entry.bestTime)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-[#A3A3A3] text-sm">
                    No results yet. Be the first to play!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Attempts */}
      {data?.userAttempts.length > 0 && (
         <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider px-2">Your Recent Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.userAttempts.map((attempt, index) => (
                    <div key={index} className="bg-white border border-[#EAEAEA] p-4 rounded-xl flex items-center justify-between shadow-sm transition-all hover:border-[#171717]/10">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-[#A3A3A3]">{new Date(attempt.createdAt).toLocaleDateString()} at {new Date(attempt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <div className="flex items-center gap-2">
                                <iconify-icon icon={attempt.correctCount === 10 ? "solar:check-circle-bold" : "solar:close-circle-bold"} className={attempt.correctCount === 10 ? "text-green-500" : "text-amber-500"} />
                                <span className="font-bold text-[#171717]">{attempt.correctCount}/10 Correct</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-mono font-bold text-[#171717]">{formatTime(attempt.timeTaken)}</span>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      )}
    </div>
  )
}
