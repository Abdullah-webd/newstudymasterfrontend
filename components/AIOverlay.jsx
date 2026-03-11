'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';

export default function AIOverlay({ isOpen, question, onClose, messages, setMessages }) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-explain question when opened with a new question
  useEffect(() => {
    if (isOpen && question) {
      // Check if this question was already explained in this chat
      const alreadyExplained = messages.some(m =>
        m.type === 'context' && m.content.includes(question.question_text)
      );

      if (!alreadyExplained) {
        handleExplainQuestion();
      }
    }
  }, [isOpen, question?._id]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleExplainQuestion = async () => {
    try {
      setIsLoading(true);
      // Add context message immediately
      setMessages(prev => [...prev, {
        type: 'context',
        content: `Question: ${question.question_text}`
      }]);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          questionData: question
        })
      });

      const result = await response.json();
      if (result.success) {
        setMessages(prev => [...prev, {
          type: 'ai',
          content: result.explanation
        }]);
      }
    } catch (error) {
      toast.error('Failed to get AI explanation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMsg }]);
    setInputValue('');

    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/follow-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(-6).map(m => ({
            role: m.type === 'ai' ? 'assistant' : (m.type === 'context' ? 'system' : 'user'),
            content: m.content
          })),
          questionData: question
        })
      });

      const result = await response.json();
      if (result.success) {
        setMessages(prev => [...prev, {
          type: 'ai',
          content: result.response
        }]);
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px';
      textareaRef.current.style.overflowY = scrollHeight > 120 ? 'auto' : 'hidden';
    }
  }, [inputValue]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${isOpen ? 'bg-black/20 backdrop-blur-[2px] pointer-events-auto' : 'bg-black/0 backdrop-blur-none pointer-events-none'
        }`}
    >
      {/* Background Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        ></div>
      )}

      {/* AI Panel */}
      <div
        className={`absolute bottom-0 left-0 right-0 sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-2xl h-[85vh] sm:h-[80vh] bg-white rounded-t-3xl sm:rounded-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.08)] sm:shadow-2xl border border-gray-200 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen
          ? 'translate-y-0 sm:scale-100 sm:opacity-100 pointer-events-auto'
          : 'translate-y-full sm:scale-95 sm:opacity-0 pointer-events-none'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <iconify-icon icon="solar:magic-stick-3-linear" className="text-lg"></iconify-icon>
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-gray-900">StudyMaster AI</h2>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Active Learning Session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
          >
            <iconify-icon icon="solar:close-linear" className="text-xl"></iconify-icon>
          </button>
        </div>

        {/* Chat Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
          {messages.map((message, index) => (
            <ChatMessage key={index} type={message.type} content={message.content} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-white sm:rounded-b-2xl pb-8 sm:pb-5">
          <div className="relative flex items-end gap-2">
            <textarea
              ref={textareaRef}
              placeholder="Ask a follow-up question..."
              rows="1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-4 pr-12 text-sm text-gray-900 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all resize-none overflow-hidden shadow-inner"
              style={{ minHeight: '48px' }}
            ></textarea>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-2 bottom-2 w-9 h-9 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <iconify-icon icon="solar:arrow-up-linear" width="20" height="20" className="font-bold"></iconify-icon>
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">AI can make mistakes. Verify important info.</p>
        </div>
      </div>
    </div>
  );
}
