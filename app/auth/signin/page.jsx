'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SigninPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, googleLogin } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const result = await login(email, password);
        setIsLoading(false);

        if (result.success) {
            // router.push is handled in login function
        } else {
            if (result.needsVerification) {
                router.push(`/auth/verify-otp?email=${encodeURIComponent(result.email)}`);
            } else {
                setError(result.message);
            }
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
                document.getElementById('google-signin-btn'),
                { theme: 'outline', size: 'large', width: '100%', shape: 'pill' }
            );
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden font-sans">
            {/* Dynamic Background Elements - Using ultra-subtle gray blurs */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-gray-50 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-gray-50 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-white/70 backdrop-blur-xl border border-gray-100 rounded-3xl p-8 shadow-2xl shadow-blue-500/5">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
                            <iconify-icon icon="solar:lock-password-bold-duotone" className="text-3xl text-white"></iconify-icon>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                        <p className="text-gray-500 text-sm">Sign in to continue your study journey</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-11 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2 ml-1">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                                <Link href="#" className="text-xs font-bold text-blue-600 hover:underline">Forgot password?</Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <iconify-icon icon="solar:lock-keyhole-linear"></iconify-icon>
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-11 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-500 text-xs py-3.5 px-4 rounded-xl flex items-center gap-2 animate-shake">
                                <iconify-icon icon="solar:danger-triangle-linear"></iconify-icon>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isLoading ? <iconify-icon icon="line-md:loading-twotone-loop"></iconify-icon> : "Sign In"}
                        </button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-100"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-4 text-gray-400 font-medium">Or continue with</span>
                            </div>
                        </div>

                        <div id="google-signin-btn" className="w-full"></div>
                    </form>

                    <p className="text-center mt-8 text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link href="/auth/signup" className="text-blue-600 font-bold hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
