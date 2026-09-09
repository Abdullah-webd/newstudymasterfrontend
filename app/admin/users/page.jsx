'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearAdminSession, getAdminSession } from '@/lib/adminSession';

const toShortDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
};

const getPhoneNumber = (user) => {
    return user?.phoneNumber || user?.phone || user?.onboarding?.phoneNumber || '-';
};

// Returns 'expired' | 'trial' | 'active'
const getSubStatus = (subscription) => {
    if (!subscription?.expirationDate) return 'expired';
    const expired = new Date(subscription.expirationDate) < new Date();
    if (expired) return 'expired';
    if (subscription.plan === '1-day-free-trial') return 'trial';
    return 'active';
};

const SubBadge = ({ subscription }) => {
    const status = getSubStatus(subscription);
    const styles = {
        expired: 'bg-red-50 text-red-600 border border-red-200',
        trial:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
        active:  'bg-green-50 text-green-700 border border-green-200',
    };
    const labels = { expired: 'Expired', trial: 'Trial', active: 'Active' };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles[status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
                status === 'expired' ? 'bg-red-500' : status === 'trial' ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
            {labels[status]}
        </span>
    );
};

export default function AdminUsersPage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter();

    const [ready, setReady] = useState(false);
    const [token, setToken] = useState('');

    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(25);

    const [users, setUsers] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [selectedUserId, setSelectedUserId] = useState('');
    const [renewMsg, setRenewMsg] = useState('');
    const [renewLoading, setRenewLoading] = useState(false);
    const [contactedMap, setContactedMap] = useState({});
    // Success advisors: which human is checking in on each student.
    const [advisorMap, setAdvisorMap] = useState({});
    const [advisorSaving, setAdvisorSaving] = useState({});

    const saveAdvisor = async (userId) => {
        const advisor = advisorMap[userId] ?? '';
        setAdvisorSaving((p) => ({ ...p, [userId]: true }));
        try {
            await fetch(`${API_URL}/admin/users/${userId}/advisor`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ advisor }),
            });
        } catch (e) { /* keep local value */ }
        setAdvisorSaving((p) => ({ ...p, [userId]: false }));
    };
    const [contactingSaving, setContactingSaving] = useState({});

    useEffect(() => {
        const session = getAdminSession();
        if (!session?.token) {
            router.push('/admin');
            return;
        }
        setToken(session.token);
        setReady(true);
    }, [router]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchUsers = async () => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
            });
            if (search) params.set('search', search);

            const response = await fetch(`${API_URL}/admin/users?${params.toString()}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (!response.ok || !data?.success) {
                throw new Error(data?.message || 'Failed to fetch users.');
            }

            setUsers(Array.isArray(data.data) ? data.data : []);
            setTotalPages(data.totalPages || 1);
            setTotalCount(data.count || 0);
            // Sync advisor assignments from server
            {
                const amap = {};
                (Array.isArray(data.data) ? data.data : []).forEach((u) => { amap[u.userId] = u.successAdvisor || ''; });
                setAdvisorMap(amap);
            }
            // Sync contacted state from server
            const map = {};
            (Array.isArray(data.data) ? data.data : []).forEach((u) => {
                map[u.userId] = u.contactedByAdmin || false;
            });
            setContactedMap(map);
        } catch (err) {
            if (String(err?.message || '').toLowerCase().includes('token')) {
                clearAdminSession();
                router.push('/admin');
                return;
            }
            setError(err?.message || 'Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token, page, search]);

    const renewSubscription = async () => {
        setRenewMsg('');
        const userId = selectedUserId.trim();
        if (!userId) {
            setRenewMsg('Enter or select a user ID.');
            return;
        }

        setRenewLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/subscription/extend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId, months: 1, plan: 'basic' }),
            });
            const data = await response.json();
            if (!response.ok || !data?.success) {
                throw new Error(data?.message || 'Failed to renew subscription.');
            }

            setRenewMsg(`Subscription renewed for ${userId}.`);
            fetchUsers();
        } catch (err) {
            setRenewMsg(err?.message || 'Failed to renew subscription.');
        } finally {
            setRenewLoading(false);
        }
    };

    const toggleContacted = async (userId, newValue) => {
        setContactedMap((prev) => ({ ...prev, [userId]: newValue }));
        setContactingSaving((prev) => ({ ...prev, [userId]: true }));
        try {
            await fetch(`${API_URL}/admin/users/${userId}/contacted`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ contacted: newValue }),
            });
        } catch (_) {
            // Revert on failure
            setContactedMap((prev) => ({ ...prev, [userId]: !newValue }));
        } finally {
            setContactingSaving((prev) => ({ ...prev, [userId]: false }));
        }
    };

    if (!ready) return <div className="min-h-screen bg-[#f6f7fb]" />;

    return (
        <div className="min-h-screen bg-[#f6f7fb]">
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
                <header className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#171717]">User Management</h1>
                        <p className="text-sm text-[#666]">Search users and renew subscriptions fast.</p>
                    </div>
                    <Link href="/admin" className="text-sm border border-[#ddd] px-3 py-2 rounded-lg bg-white hover:bg-[#f8f8f8]">
                        Back to Dashboard
                    </Link>
                </header>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-white border border-[#e8e8e8] rounded-xl p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                            <h2 className="text-sm font-semibold text-[#171717]">All Users ({totalCount})</h2>
                            <input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by name, email, or user ID"
                                className="w-full md:w-80 border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm"
                            />
                        </div>

                        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[#666] border-b border-[#efefef]">
                                        <th className="py-2 pr-2">Name</th>
                                        <th className="py-2 pr-2">Email</th>
                                        <th className="py-2 pr-2">User ID</th>
                                        <th className="py-2 pr-2">WhatsApp</th>
                                        <th className="py-2 pr-2">Status</th>
                                        <th className="py-2 pr-2">Plan</th>
                                        <th className="py-2 pr-2">Expires</th>
                                        <th className="py-2 pr-2">Contacted</th>
                                        <th className="py-2 pr-2">Success Advisor</th>
                                        <th className="py-2 pr-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user?._id || user?.userId} className={`border-b border-[#f3f3f3] hover:bg-[#fafafa] ${
                                            getSubStatus(user?.subscription) === 'expired' ? 'bg-red-50/40' : ''
                                        }`}>
                                            <td className="py-2 pr-2">{user?.username || '-'}</td>
                                            <td className="py-2 pr-2">{user?.email || '-'}</td>
                                            <td className="py-2 pr-2 font-mono">{user?.userId || '-'}</td>
                                            <td className="py-2 pr-2">{getPhoneNumber(user)}</td>
                                            <td className="py-2 pr-2"><SubBadge subscription={user?.subscription} /></td>
                                            <td className="py-2 pr-2">{user?.subscription?.plan || 'free'}</td>
                                            <td className="py-2 pr-2">{toShortDate(user?.subscription?.expirationDate)}</td>
                                            <td className="py-2 pr-2">
                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={contactedMap[user?.userId] || false}
                                                        disabled={contactingSaving[user?.userId]}
                                                        onChange={(e) => toggleContacted(user?.userId, e.target.checked)}
                                                        className="w-4 h-4 accent-[#171717] cursor-pointer"
                                                    />
                                                    <span className={`text-xs font-medium ${contactedMap[user?.userId] ? 'text-green-600' : 'text-[#999]'}`}>
                                                        {contactingSaving[user?.userId] ? 'Saving…' : contactedMap[user?.userId] ? 'Yes' : 'No'}
                                                    </span>
                                                </label>
                                            </td>
                                            <td className="py-2 pr-2">
                                                <input
                                                    type="text"
                                                    value={advisorMap[user?.userId] ?? ''}
                                                    placeholder="Assign advisor…"
                                                    onChange={(e) => setAdvisorMap((p) => ({ ...p, [user?.userId]: e.target.value }))}
                                                    onBlur={() => saveAdvisor(user?.userId)}
                                                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                                                    className={`w-32 text-xs border rounded px-2 py-1 bg-white ${advisorSaving[user?.userId] ? 'border-amber-300' : 'border-[#ddd]'}`}
                                                />
                                            </td>
                                            <td className="py-2 pr-2">
                                                <button
                                                    onClick={() => setSelectedUserId(user?.userId || '')}
                                                    className="text-xs border border-[#ddd] px-2 py-1 rounded bg-white hover:bg-[#f8f8f8]"
                                                >
                                                    Select
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!users.length && !loading && (
                                        <tr>
                                            <td colSpan={10} className="py-6 text-center text-[#777]">No users found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="text-xs border border-[#ddd] px-3 py-1.5 rounded bg-white disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-xs text-[#666]">Page {page} of {Math.max(totalPages, 1)}</span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
                                disabled={page >= totalPages}
                                className="text-xs border border-[#ddd] px-3 py-1.5 rounded bg-white disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-[#e8e8e8] rounded-xl p-4 h-fit">
                        <h2 className="text-sm font-semibold text-[#171717]">Renew Subscription</h2>
                        <p className="text-xs text-[#666] mt-1">Adds 1 month to selected user.</p>
                        <div className="mt-3 space-y-3">
                            <input
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm font-mono"
                                placeholder="Enter user ID (e.g. U-xxxxxx)"
                            />
                            <button
                                onClick={renewSubscription}
                                disabled={renewLoading}
                                className="w-full rounded-lg bg-[#171717] text-white py-2 text-sm font-medium disabled:opacity-60"
                            >
                                {renewLoading ? 'Updating...' : 'Add 1 Month'}
                            </button>
                            {renewMsg && <p className="text-xs text-[#555]">{renewMsg}</p>}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
