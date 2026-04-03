'use client'

import { useState, useEffect, useRef } from 'react'

const ALL_SHAPES = [
  { id: 1, icon: 'ph:circle-fill', color: '#6366F1' },
  { id: 2, icon: 'ph:square-fill', color: '#EF4444' },
  { id: 3, icon: 'ph:triangle-fill', color: '#F59E0B' },
  { id: 4, icon: 'ph:pentagon-fill', color: '#8B5CF6' },
  { id: 5, icon: 'ph:hexagon-fill', color: '#F97316' },
  { id: 6, icon: 'ph:octagon-fill', color: '#10B981' },
  { id: 7, icon: 'ph:star-fill', color: '#22C55E' },
  { id: 8, icon: 'ph:heart-fill', color: '#EC4899' },
  { id: 9, icon: 'ph:diamond-fill', color: '#06B6D4' },
  { id: 10, icon: 'ph:cube-fill', color: '#3B82F6' },
]

export default function ShapeChallenge() {
  const [phase, setPhase] = useState('landing') // landing, memorize, arrange, result
  const [targetShapes, setTargetShapes] = useState([])
  const [userOrder, setUserOrder] = useState(Array(10).fill(null))
  const [scrambledShapes, setScrambledShapes] = useState([])
  const [timeLeft, setTimeLeft] = useState(20)
  const [resetKey, setResetKey] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [score, setScore] = useState(0)
  const [draggedIndex, setDraggedIndex] = useState(null)
  
  const timerRef = useRef(null)
  const stopwatchRef = useRef(null)

  // Initialize Game
  const startGame = () => {
    const shuffled = [...ALL_SHAPES].sort(() => Math.random() - 0.5)
    setTargetShapes(shuffled)
    setPhase('memorize')
    setTimeLeft(20)
    setTotalTime(0)
    setUserOrder(Array(10).fill(null))
  }

  // Memorize Timer
  useEffect(() => {
    if (phase === 'memorize') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            startArrangePhase()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [phase, resetKey])

  // Stopwatch for Arrange Phase
  useEffect(() => {
    if (phase === 'arrange') {
      stopwatchRef.current = setInterval(() => {
        setTotalTime((prev) => prev + 10) // increment by 10ms
      }, 10)
    }
    return () => clearInterval(stopwatchRef.current)
  }, [phase])

  const startArrangePhase = () => {
    setPhase('arrange')
    setScrambledShapes([...targetShapes].sort(() => Math.random() - 0.5))
  }

  const reshuffle = () => {
    const shuffled = [...ALL_SHAPES].sort(() => Math.random() - 0.5)
    setTargetShapes(shuffled)
    setTimeLeft(20)
    setResetKey(prev => prev + 1)
  }

  const handleDrop = (placeholderIndex) => {
    if (draggedIndex === null) return
    
    const shape = scrambledShapes[draggedIndex]
    if (!shape) return

    const newUserOrder = [...userOrder]
    // If there was already a shape there, put it back in scrambled
    const existingShape = newUserOrder[placeholderIndex]
    
    newUserOrder[placeholderIndex] = shape
    setUserOrder(newUserOrder)

    // Remove from scrambled
    const newScrambled = [...scrambledShapes]
    if (existingShape) {
        newScrambled[draggedIndex] = existingShape
    } else {
        newScrambled.splice(draggedIndex, 1)
    }
    setScrambledShapes(newScrambled)
    setDraggedIndex(null)

    // Check if finished
    if (newUserOrder.every(s => s !== null)) {
      finishGame(newUserOrder)
    }
  }

  const finishGame = async (finalOrder) => {
    clearInterval(stopwatchRef.current)
    
    let correct = 0
    finalOrder.forEach((shape, index) => {
      if (shape.id === targetShapes[index].id) correct++
    })
    
    setScore(correct)
    setPhase('result')

    // Save to backend
    const token = localStorage.getItem('token')
    if (token && correct === 10) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/game/attempt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            timeTaken: totalTime,
            correctCount: correct
          })
        })
      } catch (err) {
        console.error('Failed to save score', err)
      }
    }
  }

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const milliseconds = Math.floor((ms % 1000) / 10)
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`
  }

  if (phase === 'landing') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-[#EAEAEA] rounded-2xl shadow-sm text-center">
        <div className="w-20 h-20 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-6">
          <iconify-icon icon="solar:gamepad-bold-duotone" width="40" height="40" className="text-[#171717]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Ready for the Challenge?</h2>
        <p className="text-[#666666] max-w-sm mb-8">Memorize the 10 shapes in 20 seconds, then arrange them back in order as fast as you can!</p>
        <button 
          onClick={startGame}
          className="bg-[#171717] text-white px-8 py-3 rounded-full font-medium hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/5"
        >
          Start Game
        </button>
      </div>
    )
  }

  if (phase === 'memorize') {
    return (
      <div className="flex flex-col items-center gap-8 py-8 animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-2">
          <div className={`text-5xl font-bold ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-[#171717]'}`}>
            {timeLeft}
          </div>
          <span className="text-sm font-medium text-[#A3A3A3] uppercase tracking-wider">Memorize these!</span>
        </div>

        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {targetShapes.map((shape, idx) => (
            <div 
              key={idx}
              className="w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center shadow-md bg-white border border-[#EAEAEA] transition-all hover:scale-110"
              style={{ color: shape.color }}
            >
              <iconify-icon icon={shape.icon} width="32" height="32" />
            </div>
          ))}
        </div>

        <button 
          onClick={reshuffle}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#EAEAEA] bg-white text-[#666666] text-sm font-medium hover:bg-[#F5F5F5] transition-all"
        >
          <iconify-icon icon="solar:restart-linear" width="18" />
          Reshuffle
        </button>
      </div>
    )
  }

  if (phase === 'arrange') {
    return (
      <div className="flex flex-col items-center gap-8 py-8 animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-1">
          <div className="text-2xl font-mono font-bold text-[#171717]">
            {formatTime(totalTime)}
          </div>
          <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Arrange them back!</span>
        </div>

        {/* Placeholders */}
        <div className="flex flex-wrap justify-center gap-3 w-full">
           {userOrder.map((shape, idx) => (
             <div 
               key={idx}
               onDragOver={(e) => e.preventDefault()}
               onDrop={() => handleDrop(idx)}
               onClick={() => {
                   if (draggedIndex !== null) handleDrop(idx)
                   else if (shape) {
                       // Move back to scrambled
                       const newUserOrder = [...userOrder]
                       newUserOrder[idx] = null
                       setUserOrder(newUserOrder)
                       setScrambledShapes([...scrambledShapes, shape])
                   }
               }}
               className={`w-12 h-12 md:w-16 md:h-16 rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${
                 shape ? 'border-transparent bg-white shadow-sm' : 'border-[#EAEAEA] bg-[#FAFAFA] hover:border-[#A3A3A3] cursor-pointer'
               }`}
             >
               {shape && (
                 <iconify-icon icon={shape.icon} width="32" height="32" style={{ color: shape.color }} />
               )}
               {!shape && <span className="text-xs text-[#D0D0D0]">{idx + 1}</span>}
             </div>
           ))}
        </div>

        <div className="w-full h-px bg-[#EAEAEA] my-4" />

        {/* Scrambled Shapes */}
        <div className="flex flex-wrap justify-center gap-3">
          {scrambledShapes.map((shape, idx) => (
            <div 
              key={idx}
              draggable
              onDragStart={() => setDraggedIndex(idx)}
              onClick={() => setDraggedIndex(idx === draggedIndex ? null : idx)}
              className={`w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center cursor-move shadow-md bg-white border border-[#EAEAEA] hover:scale-110 active:scale-95 transition-all ${
                draggedIndex === idx ? 'ring-2 ring-[#171717] opacity-50 scale-105' : ''
              }`}
              style={{ color: shape.color }}
            >
              <iconify-icon icon={shape.icon} width="32" height="32" />
            </div>
          ))}
        </div>

        <p className="text-xs text-[#A3A3A3] mt-4">
            {window.innerWidth > 768 ? 'Drag and drop into positions or click to select/place' : 'Tap a shape then tap a position'}
        </p>
      </div>
    )
  }

  if (phase === 'result') {
    const isWin = score === 10
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-[#EAEAEA] rounded-2xl shadow-sm text-center animate-in zoom-in-95 duration-500">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isWin ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
          <iconify-icon icon={isWin ? "solar:ranking-bold-duotone" : "solar:sad-circle-bold-duotone"} width="48" height="48" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2">
            {isWin ? 'Amazing!' : 'Almost there!'}
        </h2>
        
        <div className="flex items-center gap-8 my-8">
            <div className="flex flex-col">
                <span className="text-[#A3A3A3] text-xs uppercase font-semibold">Correct</span>
                <span className="text-2xl font-bold">{score}/10</span>
            </div>
            <div className="w-px h-10 bg-[#EAEAEA]" />
            <div className="flex flex-col">
                <span className="text-[#A3A3A3] text-xs uppercase font-semibold">Time</span>
                <span className="text-2xl font-bold">{formatTime(totalTime)}</span>
            </div>
        </div>

        {!isWin && (
            <p className="text-sm text-[#666666] mb-8">You need to get all 10 correct to save your time to the leaderboard.</p>
        )}
        
        {isWin && (
             <p className="text-sm text-[#666666] mb-8">Your score has been saved to the leaderboard!</p>
        )}

        <div className="flex gap-4">
            <button 
                onClick={startGame}
                className="bg-[#171717] text-white px-8 py-2.5 rounded-full font-medium hover:bg-black transition-all"
            >
                Try Again
            </button>
            <button 
                onClick={() => window.location.reload()} // Quick way to go back to landing
                className="px-8 py-2.5 rounded-full font-medium border border-[#EAEAEA] hover:bg-[#F5F5F5] transition-all"
            >
                Home
            </button>
        </div>
      </div>
    )
  }

  return null
}
