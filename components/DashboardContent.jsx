'use client';

import { useState, useEffect } from 'react';
import WelcomeSection from '@/components/WelcomeSection';
import StatsGrid from '@/components/StatsGrid';
import StudyActivityChart from '@/components/StudyActivityChart';
import SubjectPerformance from '@/components/SubjectPerformance';
import RecentActivity from '@/components/RecentActivity';
import StudyStreak from '@/components/StudyStreak';
import TodaysPlan from '@/components/TodaysPlan';

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

                {/* Right Column: Streak & Plan */}
                <div className="space-y-6 lg:space-y-8">
                    <StudyStreak />
                    <TodaysPlan />
                </div>
            </div>
        </>
    );
}
