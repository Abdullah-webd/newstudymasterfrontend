'use client'

const FRAME = { idle: 0, listening: 1, thinking: 1, speaking: 2, writing: 3, reconnecting: 1 }

export default function OwlTeacher({ state = 'idle', volume = 0, compact = false }) {
  const frame = FRAME[state] ?? 0
  const speechLift = state === 'speaking' ? Math.min(1.04, 1 + volume * 0.05) : 1
  return (
    <div className={`nova-wrap nova-${state} ${compact ? 'nova-compact' : ''}`} aria-label={`StudyMaster is ${state}`}>
      <div className="nova-crop" style={{ transform: `scale(${speechLift})` }}>
        <img
          src="/live-learning/nova-owl-state-sheet-cutout.png"
          alt="The StudyMaster live teacher"
          className="nova-sheet"
          style={{ transform: `translateX(-${frame * 25}%)` }}
          draggable="false"
        />
      </div>
      <div className="nova-shadow" />
    </div>
  )
}
