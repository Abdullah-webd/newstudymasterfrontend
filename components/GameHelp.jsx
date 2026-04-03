'use client'

export default function GameHelp({ onClose }) {
  const instructions = [
    { 
      title: 'Memorize phase', 
      desc: 'You have 20 seconds to memorize the order of 10 shapes.',
      icon: 'solar:clock-circle-linear'
    },
    { 
      title: 'Arrange phase', 
      desc: 'Drag shapes from the bottom and drop them into the correct blank slots.',
      icon: 'solar:hand-shake-linear'
    },
    { 
      title: 'Reshuffle', 
      desc: "Forgot the order? Use 'Reshuffle' to see the shapes again for 20 more seconds.",
      icon: 'solar:restart-linear'
    },
    { 
      title: 'Scoring', 
      desc: 'Your time is only saved to the leaderboard if you get all 10 shapes correct!',
      icon: 'solar:ranking-linear'
    }
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-[#171717]/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="px-6 py-6 border-b border-[#F5F5F5] flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#171717]">How to Play</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F5F5F5] transition-colors"
          >
            <iconify-icon icon="solar:close-circle-linear" width="24" height="24" className="text-[#A3A3A3]" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {instructions.map((item, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0">
                <iconify-icon icon={item.icon} width="20" height="20" className="text-[#171717]" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#171717]">{item.title}</span>
                <span className="text-sm text-[#666666] leading-relaxed mt-1">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-6 bg-[#FAFAFA] flex flex-col gap-3">
          <button 
            onClick={onClose}
            className="w-full bg-[#171717] text-white py-3 rounded-2xl font-bold hover:bg-black transition-all active:scale-95"
          >
            I'm Ready!
          </button>
          <span className="text-[10px] text-center text-[#A3A3A3] font-medium uppercase tracking-widest">Powered by StudyMaster</span>
        </div>
      </div>
    </div>
  )
}
