'use client'

import { useEffect } from 'react'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'
import MobileBottomNav from './MobileBottomNav'

const trackAppSession = async (action) => {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type: 'app_session', metadata: {} })
    });
  } catch (e) { /* Non-fatal */ }
};

export default function MainLayout({ children, isFullBleed = false }) {
  useEffect(() => {
    trackAppSession('start');
    return () => {
      trackAppSession('stop');
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen antialiased selection:bg-gray-200">
      <Sidebar />

      {/* Main Content Area */}
      <main className={`flex-1 w-full pb-24 md:pb-0 flex flex-col ${isFullBleed ? 'h-screen overflow-hidden' : 'max-w-7xl mx-auto p-4 md:p-8 gap-6 lg:gap-8'}`}>
        {!isFullBleed && <MobileHeader />}
        {children}
      </main>

      <MobileBottomNav />
    </div>
  )
}

