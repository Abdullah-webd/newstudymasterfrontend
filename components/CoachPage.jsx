"use client";
import { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { toast } from 'sonner';

export default function CoachPage() {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatId, setChatId] = useState(null);
    const chatMessagesRef = useRef(null);

    useEffect(() => {
        initializeChat();
    }, []);

    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages]);

    const initializeChat = async () => {
        setIsLoading(true);
        try {
            // Try to fetch existing chats first
            const getResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const getResult = await getResponse.json();

            let currentChatId = null;
            if (getResult.success && getResult.data.length > 0) {
                // Find a coach chat or just use the first chat
                currentChatId = getResult.data[0]._id;

                // Fetch full chat details
                const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats/${currentChatId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const chatResult = await chatResponse.json();

                if (chatResult.success) {
                    setMessages(chatResult.data.messages);
                }
            } else {
                // Create new chat
                const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ title: 'Coach Chat' })
                });
                const createResult = await createResponse.json();
                if (createResult.success) {
                    currentChatId = createResult.data._id;
                    setMessages(createResult.data.messages || []);
                }
            }

            setChatId(currentChatId);

            if (messages.length === 0) {
                // Give a default welcome message if empty
                setMessages([
                    { role: 'assistant', content: "Hello! I'm your StudyMaster Coach. How can I help you structurally plan your studies, understand concepts better, or track your progress today?" }
                ]);
            }

        } catch (error) {
            console.error('Error initializing chat:', error);
            toast.error('Could not connect to Coach AI.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        let currentChatId = chatId;

        // If no chatId exists, try creating one right now
        if (!currentChatId) {
            setIsLoading(true);
            try {
                const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ title: 'Coach Chat' })
                });
                const createResult = await createResponse.json();
                if (createResult.success) {
                    currentChatId = createResult.data._id;
                    setChatId(currentChatId);
                } else {
                    console.error('Create chat failed:', createResult);
                    toast.error(`Could not initialize chat session: ${createResult.message || 'Unknown error'}`);
                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Network or other error:', error);
                toast.error('Failed to connect to Coach.');
                setIsLoading(false);
                return;
            }
        }

        const userMessage = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats/${currentChatId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ message: userMessage.content })
            });

            const result = await response.json();
            if (result.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: result.assistantResponse }]);
            } else {
                toast.error(result.message || 'Failed to send message');
                // REvert optimistic UI here if desired
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to communicate with Coach');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
            <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10 w-full shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <iconify-icon icon="solar:user-speak-rounded-bold" className="text-white text-xl"></iconify-icon>
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900 font-outfit">AI Coach</p>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online & Ready</p>
                        </div>
                    </div>
                </div>
            </header>

            <div
                ref={chatMessagesRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 bg-slate-50/30 font-outfit min-h-0"
            >
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-[10px] font-black border-2 transition-all ${msg.role === 'user' ? 'bg-indigo-600 border-indigo-200 text-white' : 'bg-white border-slate-100 text-slate-400'
                                }`}>
                                {msg.role === 'user' ? 'ME' : 'AI'}
                            </div>
                            <div className={`p-4 md:p-6 rounded-[2rem] shadow-sm text-sm leading-relaxed overflow-x-auto ${msg.role === 'user'
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

            <div className="p-4 md:p-6 bg-white border-t border-slate-100 shrink-0 pb-safe pb-padding mb-16 md:mb-0">
                <div className="max-w-4xl mx-auto flex gap-3">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask your coach anything..."
                        className="flex-1 bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-3 md:px-6 md:py-4 text-sm font-semibold focus:bg-white focus:border-indigo-500/10 outline-none transition-all"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputValue.trim()}
                        className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
                    >
                        <iconify-icon icon="solar:send-minimalistic-bold" className="text-xl md:text-2xl"></iconify-icon>
                    </button>
                </div>
            </div>
        </div>
    );
}
