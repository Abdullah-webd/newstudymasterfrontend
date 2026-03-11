'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signup, googleLogin } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const result = await signup(username, email, password);
        setIsLoading(false);

        if (result.success) {
            router.push(`/auth/verify-otp?email=${encodeURIComponent(result.email)}`);
        } else {
            setError(result.message);
        }
    };

    const handleGoogleLogin = async (response) => {
        setIsLoading(true);
        const result = await googleLogin(response.credential);
        setIsLoading(false);
        if (!result.success) {
            setError(result.message);
        }
    };

    useEffect(() => {
        /* global google */
        if (typeof window !== 'undefined' && window.google) {
            window.google.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
                callback: handleGoogleLogin
            });

            window.google.accounts.id.renderButton(
                document.getElementById('google-signup-btn'),
                { theme: 'outline', size: 'large', width: '100%', shape: 'pill' }
            );
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden font-sans">
            {/* Dynamic Background Elements - Using ultra-subtle gray blurs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gray-50 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gray-50 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-white/70 backdrop-blur-xl border border-gray-100 rounded-3xl p-8 shadow-2xl shadow-blue-500/5">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
                            <iconify-icon icon="solar:user-plus-bold-duotone" className="text-3xl text-white"></iconify-icon>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                        <p className="text-gray-500 text-sm">Join StudyMaster and excel in your exams</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <iconify-icon icon="solar:user-linear"></iconify-icon>
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                                    placeholder="johndoe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <iconify-icon icon="solar:letter-linear"></iconify-icon>
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <iconify-icon icon="solar:lock-password-linear"></iconify-icon>
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-500 text-xs py-3 px-4 rounded-xl flex items-center gap-2 animate-shake">
                                <iconify-icon icon="solar:danger-triangle-linear"></iconify-icon>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group"
                        >
                            <span className="flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <iconify-icon icon="line-md:loading-twotone-loop" className="text-xl"></iconify-icon>
                                ) : (
                                    <>
                                        Sign Up
                                        <iconify-icon icon="solar:arrow-right-linear" className="group-hover:translate-x-1 transition-transform"></iconify-icon>
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="mt-8">
                        <div className="relative flex items-center justify-center mb-6">
                            <div className="border-t border-gray-100 w-full"></div>
                            <span className="bg-white px-4 text-xs font-medium text-gray-400 uppercase tracking-widest absolute">Or continue with</span>
                        </div>

                        <div id="google-signup-btn" className="w-full"></div>
                    </div>

                    <p className="text-center mt-8 text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link href="/auth/signin" className="text-blue-600 font-bold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
