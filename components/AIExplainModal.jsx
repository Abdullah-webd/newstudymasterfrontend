'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'

export default function AIExplainModal({ isOpen, onClose, data }) {
    const { token } = useAuth()
    const [explanation, setExplanation] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [chatHistory, setChatHistory] = useState([])
    const [userInput, setUserInput] = useState('')
    const bottomRef = useRef(null)

    const API_URL = process.env.NEXT_PUBLIC_API_URL

    useEffect(() => {
        if (isOpen && data) {
            handleInitialExplain()
        } else {
            setExplanation('')
            setChatHistory([])
            setUserInput('')
        }
    }, [isOpen, data])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatHistory, isLoading])

    const handleInitialExplain = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`${API_URL}/quizzes/explain`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    question: data.question,
                    option: data.option,
                    noteContent: data.noteContent
                })
            })

            const result = await response.json()
            if (result.success) {
                setChatHistory([{
                    role: 'assistant',
                    message: result.explanation
                }])
            }
        } catch (error) {
            console.error('Explanation error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!userInput.trim() || isLoading) return

        const userMsg = { role: 'user', message: userInput }
        setChatHistory(prev => [...prev, userMsg])
        setUserInput('')
        setIsLoading(true)

        try {
            // Reusing the note chat logic but with specific context
            const response = await fetch(`${API_URL}/notes/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messages: [...chatHistory, userMsg].map(m => ({
                        role: m.role,
                        message: m.role === 'user'
                            ? `Regarding the quiz question "${data.question.question}", I asked: ${m.message}`
                            : m.message
                    })),
                    onboardingData: {} // Or fetch from context if needed
                })
            })

            const result = await response.json()
            if (result.success) {
                setChatHistory(prev => [...prev, {
                    role: 'assistant',
                    message: result.message
                }])
            }
        } catch (error) {
            console.error('Chat error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[101] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                    <iconify-icon icon="solar:magic-stick-3-bold-duotone" width="24" height="24" className="text-indigo-600"></iconify-icon>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">AI Tutor Explanation</h3>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Active Session</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <iconify-icon icon="solar:close-circle-linear" width="24" height="24"></iconify-icon>
                            </button>
                        </div>

                        {/* Chat Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                            {chatHistory.map((chat, idx) => (
                                <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                                        max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed
                                        ${chat.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100'
                                            : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'}
                                    `}>
                                        {chat.message}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-slate-100 bg-white">
                            <form onSubmit={handleSendMessage} className="relative">
                                <input
                                    type="text"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    placeholder="Ask a follow-up question..."
                                    className="w-full bg-slate-50 border-none rounded-2xl pl-5 pr-12 py-4 text-sm focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!userInput.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
                                >
                                    <iconify-icon icon="solar:send-bold" width="18" height="18"></iconify-icon>
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
