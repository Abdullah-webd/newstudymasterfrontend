'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import MarkdownRenderer from './MarkdownRenderer';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const WELCOME = {
    role: 'assistant',
    content: "Hey! I'm your StudyMaster Coach. Ask me anything — planning your studies, tricky concepts, or just how to stay on track. 💪",
};

// Downscale an image file to a compact JPEG data URL (max 1024px) so uploads
// are fast and never exceed request limits — this is what makes image chat reliable.
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
        const max = 1024;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = url;
});

export default function CoachPage() {
    const [chats, setChats] = useState([]);
    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [images, setImages] = useState([]); // data URLs (downscaled)
    const [isLoading, setIsLoading] = useState(false);
    const [recording, setRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true); // sessions sidebar (desktop)
    const [mobileOpen, setMobileOpen] = useState(false); // sessions drawer (mobile)

    const fileRef = useRef(null);
    const mediaRef = useRef(null);
    const chunksRef = useRef([]);
    const scrollRef = useRef(null);
    const taRef = useRef(null);

    const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

    // Give the coach room: collapse the main app sidebar while here, restore after.
    useEffect(() => {
        let prev = null;
        try { prev = localStorage.getItem('sm_sidebar_collapsed') } catch (e) {}
        window.dispatchEvent(new CustomEvent('sm-sidebar-collapse', { detail: true }));
        return () => {
            window.dispatchEvent(new CustomEvent('sm-sidebar-collapse', { detail: prev === '1' }));
        };
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        const ta = taRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }, [inputValue]);

    const refreshChats = useCallback(async () => {
        try {
            const r = await fetch(`${API_URL}/chats`, { headers: authHeaders() });
            const d = await r.json();
            if (d.success) { setChats(d.data); return d.data; }
        } catch (e) { /* */ }
        return [];
    }, []);

    const openChat = useCallback(async (id) => {
        setMobileOpen(false);
        try {
            const r = await fetch(`${API_URL}/chats/${id}`, { headers: authHeaders() });
            const d = await r.json();
            if (d.success) {
                setChatId(id);
                setMessages(d.data.messages?.length ? d.data.messages : [WELCOME]);
            }
        } catch (e) { /* */ }
    }, []);

    const newSession = useCallback(async () => {
        setMobileOpen(false);
        try {
            const r = await fetch(`${API_URL}/chats`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({}) });
            const d = await r.json();
            if (d.success) {
                setChatId(d.data._id);
                setMessages([WELCOME]);
                setChats((prev) => [d.data, ...prev]);
            }
        } catch (e) { toast.error('Could not start a new chat'); }
    }, []);

    const deleteSession = async (id, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm('Delete this chat? All its messages will be gone. Are you sure?')) return;
        try {
            await fetch(`${API_URL}/chats/${id}`, { method: 'DELETE', headers: authHeaders() });
            const remaining = chats.filter((c) => c._id !== id);
            setChats(remaining);
            if (chatId === id) {
                if (remaining.length) openChat(remaining[0]._id);
                else newSession();
            }
        } catch (e2) { toast.error('Could not delete chat'); }
    };

    // Initial load: latest session or a fresh one.
    useEffect(() => {
        (async () => {
            const list = await refreshChats();
            if (list.length) openChat(list[0]._id);
            else newSession();
        })();
    }, [refreshChats, openChat, newSession]);

    const pickImages = async (e) => {
        const files = Array.from(e.target.files || []).slice(0, 4);
        e.target.value = '';
        for (const f of files) {
            try {
                const dataUrl = await fileToDataUrl(f);
                setImages((prev) => [...prev, dataUrl].slice(0, 4));
            } catch (err) { toast.error('Could not read that image'); }
        }
    };

    const toggleMic = async () => {
        if (recording) { mediaRef.current?.stop(); return; }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream);
            chunksRef.current = [];
            mr.ondataavailable = (ev) => chunksRef.current.push(ev.data);
            mr.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop());
                setRecording(false);
                setTranscribing(true);
                try {
                    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                    const fd = new FormData();
                    fd.append('audio', blob, 'dictation.webm');
                    const res = await fetch(`${API_URL}/speech/transcribe`, {
                        method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: fd,
                    });
                    const data = await res.json();
                    if (data.success && data.data.text) setInputValue((t) => (t ? t + ' ' : '') + data.data.text);
                } finally { setTranscribing(false); }
            };
            mediaRef.current = mr;
            mr.start();
            setRecording(true);
        } catch (e) { toast.error('Microphone not available'); }
    };

    const send = async () => {
        const text = inputValue.trim();
        if ((!text && images.length === 0) || isLoading || !chatId) return;
        const outgoing = text || 'Please take a look at this image.';
        const imgs = images;

        setMessages((prev) => [...prev, { role: 'user', content: outgoing, images: imgs }]);
        setInputValue('');
        setImages([]);
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ message: outgoing, images: imgs.length ? imgs : undefined }),
            });
            const d = await res.json();
            if (d.success) {
                setMessages((prev) => [...prev, { role: 'assistant', content: d.assistantResponse }]);
                refreshChats();
            } else {
                toast.error(d.message || 'Failed to send');
            }
        } catch (e) {
            toast.error('Failed to send message');
        } finally { setIsLoading(false); }
    };

    const SessionList = () => (
        <>
            <button onClick={newSession}
                className="mx-3 mt-3 mb-2 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                <iconify-icon icon="solar:pen-new-square-linear" className="text-lg"></iconify-icon>
                New chat
            </button>
            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
                {chats.map((c) => (
                    <div key={c._id} onClick={() => openChat(c._id)}
                        className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors ${c._id === chatId ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <span className="truncate">{c.title || 'New Chat'}</span>
                        <button onClick={(e) => deleteSession(c._id, e)} title="Delete chat"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-300 hover:text-red-500 shrink-0 transition-all">
                            <iconify-icon icon="solar:trash-bin-trash-linear" className="text-base"></iconify-icon>
                        </button>
                    </div>
                ))}
            </div>
        </>
    );

    return (
        <div className="flex h-[calc(100vh-64px)] md:h-screen bg-white overflow-hidden">
            {/* Sessions sidebar — desktop */}
            <aside className={`hidden md:flex flex-col border-r border-slate-100 bg-slate-50/50 transition-all duration-300 shrink-0 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
                <SessionList />
            </aside>

            {/* Sessions drawer — mobile */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-40">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)}></div>
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">Your chats</span>
                            <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                                <iconify-icon icon="solar:close-linear" className="text-lg text-slate-500"></iconify-icon>
                            </button>
                        </div>
                        <SessionList />
                    </aside>
                </div>
            )}

            {/* Main chat column */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-14 border-b border-slate-100 flex items-center justify-between px-3 md:px-5 shrink-0 bg-white/90 backdrop-blur">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Chats">
                            <iconify-icon icon="solar:hamburger-menu-linear" className="text-xl"></iconify-icon>
                        </button>
                        <button onClick={() => setSidebarOpen((v) => !v)} className="hidden md:block p-2 rounded-lg hover:bg-slate-100 text-slate-400" title="Toggle chats">
                            <iconify-icon icon={sidebarOpen ? 'solar:siderbar-linear' : 'solar:siderbar-linear'} className="text-xl"></iconify-icon>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center">
                                <iconify-icon icon="solar:user-speak-rounded-bold" className="text-white text-sm"></iconify-icon>
                            </div>
                            <span className="text-sm font-bold text-slate-900">Coach</span>
                        </div>
                    </div>
                    <button onClick={newSession} className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="New chat">
                        <iconify-icon icon="solar:pen-new-square-linear" className="text-xl"></iconify-icon>
                    </button>
                </header>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                        {messages.map((msg, i) => (
                            msg.role === 'user' ? (
                                <div key={i} className="flex justify-end">
                                    <div className="max-w-[85%]">
                                        {msg.images?.length > 0 && (
                                            <div className="flex gap-2 justify-end mb-1.5 flex-wrap">
                                                {msg.images.map((u, j) => (
                                                    <img key={j} src={u} alt="" className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
                                                ))}
                                            </div>
                                        )}
                                        {msg.content && (
                                            <div className="bg-slate-100 text-slate-900 px-4 py-2.5 rounded-3xl rounded-br-lg text-[15px] leading-relaxed">
                                                {msg.content}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div key={i} className="text-[15px] text-slate-800 leading-relaxed">
                                    <MarkdownRenderer content={msg.content} />
                                </div>
                            )
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input */}
                <div className="shrink-0 px-4 pb-4 pt-1 mb-14 md:mb-0">
                    <div className="max-w-3xl mx-auto">
                        {images.length > 0 && (
                            <div className="flex gap-2 mb-2 flex-wrap">
                                {images.map((u, i) => (
                                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                                        <img src={u} alt="" className="w-full h-full object-cover" />
                                        <button onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                                            className="absolute top-0.5 right-0.5 bg-black/60 rounded-full w-4.5 h-4.5 w-5 h-5 flex items-center justify-center text-white text-[10px]">✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex items-end gap-1.5 bg-slate-50 border border-slate-200 rounded-[1.75rem] px-2 py-2 focus-within:border-indigo-300 focus-within:bg-white transition-colors shadow-sm">
                            <button onClick={() => fileRef.current?.click()} title="Add images"
                                className="p-2.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors shrink-0">
                                <iconify-icon icon="solar:add-circle-linear" className="text-xl block"></iconify-icon>
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={pickImages} />
                            <textarea
                                ref={taRef}
                                rows={1}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                placeholder={transcribing ? 'Transcribing your voice…' : 'Message your coach…'}
                                className="flex-1 bg-transparent outline-none resize-none text-[15px] py-2 max-h-40 placeholder:text-slate-400"
                            />
                            <button onClick={toggleMic} title={recording ? 'Stop recording' : 'Dictate'}
                                className={`p-2.5 rounded-full transition-colors shrink-0 ${recording ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}>
                                <iconify-icon icon={recording ? 'solar:stop-bold' : transcribing ? 'solar:refresh-linear' : 'solar:microphone-linear'} className={`text-xl block ${transcribing ? 'animate-spin' : ''}`}></iconify-icon>
                            </button>
                            <button onClick={send} disabled={isLoading || (!inputValue.trim() && images.length === 0)}
                                className="p-2.5 rounded-full bg-slate-900 text-white disabled:opacity-30 transition-opacity shrink-0" title="Send">
                                <iconify-icon icon="solar:arrow-up-linear" className="text-xl block"></iconify-icon>
                            </button>
                        </div>
                        {recording && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-red-500 font-semibold">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                Recording your voice… tap the square to stop
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
