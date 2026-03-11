'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const { forgotPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: '', message: '' });

        const result = await forgotPassword(email);

        if (result.success) {
            setStatus({ type: 'success', message: result.message });
        } else {
            setStatus({ type: 'error', message: result.message });
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden font-sans">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-gray-50 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-gray-50 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-white/70 backdrop-blur-xl border border-gray-100 rounded-3xl p-8 shadow-2xl shadow-blue-500/5">
                    <div className="mb-8 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 text-blue-600">
                            <iconify-icon icon="solar:lock-password-linear" className="text-3xl"></iconify-icon>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                        <p className="text-gray-500">No worries, we'll send you reset instructions.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <iconify-icon icon="solar:letter-linear"></iconify-icon>
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        {status.message && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                <iconify-icon icon={status.type === 'success' ? 'solar:check-circle-linear' : 'solar:danger-triangle-linear'} className="text-lg"></iconify-icon>
                                {status.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <iconify-icon icon="line-md:loading-twotone-loop"></iconify-icon> : (
                                <>
                                    <span>Send Reset Link</span>
                                    <iconify-icon icon="solar:arrow-right-linear"></iconify-icon>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/auth/signin" className="text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 font-medium">
                            <iconify-icon icon="solar:arrow-left-linear"></iconify-icon>
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
