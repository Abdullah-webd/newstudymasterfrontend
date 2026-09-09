'use client';

import { useState, useEffect } from 'react';
import WelcomeSection from '@/components/WelcomeSection';
import StatsGrid from '@/components/StatsGrid';
import StudyActivityChart from '@/components/StudyActivityChart';
import SubjectPerformance from '@/components/SubjectPerformance';
import RecentActivity from '@/components/RecentActivity';
import StudyStreak from '@/components/StudyStreak';
import ReadinessCard from '@/components/readiness/ReadinessCard';
import Link from 'next/link';

// Today's focus — driven by the roadmap (the "teacher" tells you what's next).
function TodaysFocus({ tasks }) {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Today's focus</h3>
                <Link href="/roadmap" className="text-xs font-semibold text-indigo-600 hover:underline">View roadmap →</Link>
            </div>
            {(!tasks || tasks.length === 0) ? (
                <p className="text-sm text-gray-400">No plan yet — open your roadmap to get started.</p>
            ) : (
                <div className="space-y-3">
                    {tasks.map((t, i) => (
                        <Link key={t.id || i} href="/roadmap"
                            className="block p-3 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-colors">
                            <div className="text-sm font-semibold text-gray-900">{t.title}</div>
                            <div className="text-[11px] text-gray-400 capitalize mt-0.5">
                                {t.type}{t.subject ? ` · ${(t.subject || '').replace(/-/g, ' ')}` : ''}{t.estMinutes ? ` · ~${t.estMinutes} min` : ''}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function DashboardContent() {
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const result = await response.json();
                if (result.success) {
                    setDashboardData(result.data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                </div>
            </div>
        );
    }

    return (
        <>
            <WelcomeSection
                user={dashboardData?.user}
                motivation={dashboardData?.motivation}
            />
            <StatsGrid statsData={dashboardData?.overallStats} />

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-6 lg:mt-8">
                {/* Left Column: Charts & Recent Activity */}
                <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        <StudyActivityChart studyTrend={dashboardData?.studyTrend} />
                        <SubjectPerformance performance={dashboardData?.performance} />
                    </div>

                    {/* Recent Activity */}
                    <RecentActivity activityData={dashboardData?.recentActivity} />
                </div>

                {/* Right Column: Readiness, Today's focus, Streak */}
                <div className="space-y-6 lg:space-y-8">
                    <ReadinessCard />
                    <TodaysFocus tasks={dashboardData?.todaysTasks} />
                    <StudyStreak />
                </div>
            </div>
        </>
    );
}
