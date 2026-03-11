'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from 'recharts';
import { clearAdminSession, getAdminSession, setAdminSession } from '@/lib/adminSession';

const toShortDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
};

export default function AdminPage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter();

    const [ready, setReady] = useState(false);
    const [token, setToken] = useState('');
    const [authed, setAuthed] = useState(false);

    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    const [dashboard, setDashboard] = useState(null);
    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [dashboardError, setDashboardError] = useState('');

    useEffect(() => {
        const session = getAdminSession();
        if (session?.token) {
            setToken(session.token);
            setAuthed(true);
        }
        setReady(true);
    }, []);

    const loadDashboard = async (adminToken) => {
        setLoadingDashboard(true);
        setDashboardError('');
        try {
            const response = await fetch(`${API_URL}/admin/dashboard`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminToken}`,
                },
            });
            const data = await response.json();

            if (!response.ok || !data?.success) {
                throw new Error(data?.message || 'Failed to load admin dashboard.');
            }

            setDashboard(data.data);
        } catch (error) {
            if (String(error?.message || '').toLowerCase().includes('token')) {
                clearAdminSession();
                setAuthed(false);
                setToken('');
            }
            setDashboardError(error?.message || 'Failed to load admin dashboard.');
        } finally {
            setLoadingDashboard(false);
        }
    };

    useEffect(() => {
        if (authed && token) {
            loadDashboard(token);
        }
    }, [authed, token]);

    const handleLogin = async (event) => {
        event.preventDefault();
        setLoginLoading(true);
        setLoginError('');

        try {
            const response = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();
            if (!response.ok || !data?.success || !data?.token) {
                throw new Error(data?.message || 'Invalid admin password.');
            }

            setAdminSession(data.token);
            setToken(data.token);
            setAuthed(true);
            setPassword('');
        } catch (error) {
            setLoginError(error?.message || 'Admin login failed.');
        } finally {
            setLoginLoading(false);
        }
    };

    const logout = () => {
        clearAdminSession();
        setAuthed(false);
        setToken('');
        router.push('/admin');
    };

    if (!ready) {
        return <div className="min-h-screen bg-[#f6f7fb]" />;
    }

    if (!authed) {
        return (
            <div className="min-h-screen bg-[#f6f7fb] flex items-center justify-center p-6">
                <form onSubmit={handleLogin} className="w-full max-w-md bg-white border border-[#e7e7e7] rounded-2xl p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-[#171717]">Admin Access</h1>
                    <p className="text-sm text-[#666] mt-1">Server-side password verification is enabled.</p>
                    <div className="mt-5">
                        <label className="block text-xs font-medium text-[#666] mb-2">Admin Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-[#e5e5e5] px-3 py-2.5 text-sm outline-none focus:border-[#171717]"
                            placeholder="Enter password"
                            autoComplete="current-password"
                            required
                        />
                    </div>
                    {loginError && <p className="text-sm text-red-600 mt-3">{loginError}</p>}
                    <button
                        type="submit"
                        disabled={loginLoading}
                        className="mt-5 w-full rounded-xl bg-[#171717] text-white py-2.5 text-sm font-medium disabled:opacity-60"
                    >
                        {loginLoading ? 'Checking...' : 'Login to Admin'}
                    </button>
                </form>
            </div>
        );
    }

    const summary = dashboard?.summary || {};
    const users = Array.isArray(dashboard?.users) ? dashboard.users : [];
    const userGrowth = Array.isArray(dashboard?.userGrowth) ? dashboard.userGrowth : [];
    const topTabs = Array.isArray(dashboard?.topTabs) ? dashboard.topTabs : [];

    return (
        <div className="min-h-screen bg-[#f6f7fb]">
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
                <header className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#171717]">Admin Dashboard</h1>
                        <p className="text-sm text-[#666]">Live platform data and activity analytics.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/admin/users" className="text-sm border border-[#ddd] px-3 py-2 rounded-lg bg-white hover:bg-[#f8f8f8]">
                            Manage Users
                        </Link>
                        <button onClick={logout} className="text-sm border border-[#ddd] px-3 py-2 rounded-lg bg-white hover:bg-[#f8f8f8]">
                            Logout
                        </button>
                    </div>
                </header>

                {dashboardError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                        {dashboardError}
                    </div>
                )}

                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard label="Total Users" value={summary.totalUsers ?? 0} />
                    <KpiCard label="Active Subscriptions" value={summary.activeSubscriptions ?? 0} />
                    <KpiCard label="Users on 1-Day Trial" value={summary.trialUsers ?? 0} />
                    <KpiCard label="Most Used Tab" value={summary.mostUsedTab || '-'} />
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="bg-white border border-[#e8e8e8] rounded-xl p-4">
                        <h2 className="text-sm font-semibold text-[#171717] mb-3">User Growth</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={userGrowth}>
                                    <CartesianGrid stroke="#f0f0f0" />
                                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="newUsers" stroke="#111827" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white border border-[#e8e8e8] rounded-xl p-4">
                        <h2 className="text-sm font-semibold text-[#171717] mb-3">Top Tabs by Time Spent</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topTabs}>
                                    <CartesianGrid stroke="#f0f0f0" />
                                    <XAxis dataKey="tab" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="minutes">
                                        {topTabs.map((_, index) => (
                                            <Cell key={index} fill={index === 0 ? '#171717' : '#9ca3af'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>

                <section className="bg-white border border-[#e8e8e8] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-[#171717]">Recent Users</h2>
                        <Link href="/admin/users" className="text-xs text-[#171717] underline">View all users</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[#666] border-b border-[#efefef]">
                                    <th className="py-2 pr-2">Name</th>
                                    <th className="py-2 pr-2">Email</th>
                                    <th className="py-2 pr-2">User ID</th>
                                    <th className="py-2 pr-2">Plan</th>
                                    <th className="py-2 pr-2">Expires</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.slice(0, 8).map((user) => (
                                    <tr key={user?._id || user?.userId} className="border-b border-[#f3f3f3]">
                                        <td className="py-2 pr-2">{user?.username || '-'}</td>
                                        <td className="py-2 pr-2">{user?.email || '-'}</td>
                                        <td className="py-2 pr-2 font-mono">{user?.userId || '-'}</td>
                                        <td className="py-2 pr-2">{user?.subscription?.plan || 'free'}</td>
                                        <td className="py-2 pr-2">{toShortDate(user?.subscription?.expirationDate)}</td>
                                    </tr>
                                ))}
                                {!users.length && !loadingDashboard && (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-[#777]">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}

function KpiCard({ label, value }) {
    return (
        <div className="bg-white border border-[#e8e8e8] rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-[#777]">{label}</p>
            <p className="text-2xl font-semibold text-[#171717] mt-1">{value}</p>
        </div>
    );
}
