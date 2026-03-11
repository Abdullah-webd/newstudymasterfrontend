"use client";
import { useRef, useEffect, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { toast } from 'sonner';

export default function ExamAIChat({ isOpen, onClose, question }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatMessagesRef = useRef(null);

  // Reset and fetch when question changes or chat opens
  useEffect(() => {
    if (isOpen && question) {
      setMessages([]);
      fetchExplanation();
    }
  }, [isOpen, question?._id]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchExplanation = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          questionData: question,
          onboardingData: { userClass: 'student' } // Fallback or get from context if available
        })
      });

      const result = await response.json();
      if (result.success) {
        setMessages([
          { role: 'assistant', content: result.explanation }
        ]);
      } else {
        toast.error(result.message || 'Failed to get explanation');
      }
    } catch (error) {
      console.error('Error fetching explanation:', error);
      toast.error('AI is currently unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/follow-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: inputValue,
          history: messages,
          questionData: question
        })
      });

      const result = await response.json();
      if (result.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
      } else {
        toast.error(result.message || 'Follow-up failed');
      }
    } catch (error) {
      console.error('Error in follow-up:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-white z-[100] transform transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
    >
      <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
            <iconify-icon icon="solar:magic-stick-3-bold" className="text-white text-xl"></iconify-icon>
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 font-outfit">AI Academic Tutor</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active Insight</p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
        >
          <iconify-icon icon="solar:close-circle-bold" className="text-xl text-slate-400"></iconify-icon>
        </button>
      </header>

      <div
        ref={chatMessagesRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30 font-outfit"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
            <iconify-icon icon="solar:ghost-bold" className="text-8xl"></iconify-icon>
            <p className="text-sm font-bold mt-4 uppercase tracking-[0.2em]">No insights yet</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-[10px] font-black border-2 transition-all ${msg.role === 'user' ? 'bg-indigo-600 border-indigo-200 text-white' : 'bg-white border-slate-100 text-slate-400'
                }`}>
                {msg.role === 'user' ? 'ME' : 'AI'}
              </div>
              <div className={`p-6 rounded-[2rem] shadow-sm text-sm leading-relaxed overflow-x-auto ${msg.role === 'user'
                ? 'bg-slate-900 text-white rounded-tr-none'
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                <MarkdownRenderer content={msg.content} />
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-xl bg-white border-2 border-slate-100 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-slate-400">
                AI
              </div>
              <div className="bg-white border border-slate-100 p-6 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-100 pb-10">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Clarify something further..."
            className="flex-1 bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-semibold focus:bg-white focus:border-indigo-500/10 outline-none transition-all"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all shadow-xl shadow-slate-100 active:scale-95 disabled:opacity-50"
          >
            <iconify-icon icon="solar:send-minimalistic-bold" className="text-2xl"></iconify-icon>
          </button>
        </div>
      </div>
    </div>
  );
}

