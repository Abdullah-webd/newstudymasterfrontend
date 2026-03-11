'use client'

import { useRef, useState } from 'react'

export default function AIChat({ onSendMessage, isGenerating, logs, onMobileNotesOpen }) {
  const textareaRef = useRef(null)
  const [inputValue, setInputValue] = useState('')

  const handleSendMessage = () => {
    if (!inputValue.trim() || isGenerating) return

    onSendMessage(inputValue)
    setInputValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <aside className="w-full md:w-[35%] border-r border-slate-100 flex flex-col bg-slate-50/30 h-full overflow-hidden relative">
      {/* Mobile Only Header */}
      <div className="md:hidden p-4 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <iconify-icon icon="solar:magic-stick-linear" width="20"></iconify-icon>
          </div>
          <span className="text-sm font-semibold text-slate-900">AI Tutor</span>
        </div>
        <button
          onClick={onMobileNotesOpen}
          className="text-xs bg-slate-900 text-white px-4 py-2 rounded-full font-medium shadow-sm active:scale-95 transition-transform"
        >
          View Notes
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar pb-24" id="chat-container">
        {/* AI Initial Bubble */}
        <div className="flex gap-2 max-w-[85%] animate-in fade-in slide-in-from-left duration-300">
          <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm relative border border-slate-100">
            <p className="text-[13px] leading-relaxed text-slate-800">
              Hello! I'm your StudyMaster AI. What topic would you like to explore today? I can generate structured notes, summaries, or explain complex concepts.
            </p>
          </div>
        </div>

        {/* Render Logs/Messages if any (passed from parent) */}
        {logs && logs.map((log, index) => (
          <div key={index} className={`flex gap-2 max-w-[85%] ${log.role === 'user' ? 'ml-auto flex-row-reverse' : ''} animate-in fade-in duration-300`}>
            <div className={`${log.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : log.role === 'system' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-medium px-4 py-1 rounded-full mx-auto italic' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'} p-3 rounded-2xl shadow-sm relative`}>
              <p className="text-[13px] leading-relaxed">{log.message}</p>
            </div>
          </div>
        ))}

        {/* AI Loading Animation */}
        {isGenerating && (
          <div className="flex gap-2 max-w-[85%] animate-in fade-in duration-300" id="ai-generating">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
              <div className="flex gap-1 py-1 px-2">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/80 backdrop-blur-md border-t border-slate-100 flex items-end gap-2 z-10">
        <div className="flex-1 relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1">
          <textarea
            ref={textareaRef}
            rows="1"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isGenerating}
            onKeyDown={handleKeyDown}
            placeholder={isGenerating ? "Generating notes..." : "Ask anything..."}
            className="flex-1 bg-transparent px-2 py-2.5 text-[14px] text-slate-900 focus:outline-none resize-none hide-scrollbar max-h-32 disabled:opacity-50"
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          ></textarea>
        </div>
        <button
          onClick={handleSendMessage}
          disabled={isGenerating || !inputValue.trim()}
          className="w-11 h-11 shrink-0 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform disabled:bg-slate-300 disabled:scale-100"
        >
          <iconify-icon icon="solar:paper-plane-bold" width="22" height="22"></iconify-icon>
        </button>
      </div>
    </aside>
  )
}
