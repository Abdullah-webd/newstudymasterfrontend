'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

function OTPContent() {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const { verifyOTP, resendOTP } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    useEffect(() => {
        if (!email) {
            router.push('/auth/signup');
            return;
        }

        const timer = setInterval(() => {
            setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [email, router]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Auto-focus move
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`).focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length < 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        const result = await verifyOTP(email, otpString);
        setIsLoading(false);

        if (result.success) {
            setMessage('Email verified! Redirecting to sign in...');
            setTimeout(() => router.push('/auth/signin'), 2000);
        } else {
            setError(result.message);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;

        setIsLoading(true);
        const result = await resendOTP(email);
        setIsLoading(false);

        if (result.success) {
            setMessage('New OTP sent to your email');
            setResendTimer(60);
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden font-sans">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gray-50 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gray-50 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-white/70 backdrop-blur-xl border border-gray-100 rounded-3xl p-8 shadow-2xl shadow-blue-500/5">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
                            <iconify-icon icon="solar:shield-check-bold-duotone" className="text-3xl text-white"></iconify-icon>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Email</h1>
                        <p className="text-gray-500 text-sm">Enter the 6-digit code sent to <br /><span className="text-blue-600 font-medium">{email}</span></p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="flex justify-between gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 bg-gray-50 border border-gray-100 rounded-xl text-center text-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-500 text-xs py-3 px-4 rounded-xl flex items-center gap-2">
                                <iconify-icon icon="solar:danger-triangle-linear"></iconify-icon>
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="bg-green-50 border border-green-100 text-green-500 text-xs py-3 px-4 rounded-xl flex items-center gap-2">
                                <iconify-icon icon="solar:check-circle-linear"></iconify-icon>
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 group"
                        >
                            <span className="flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <iconify-icon icon="line-md:loading-twotone-loop" className="text-xl"></iconify-icon>
                                ) : (
                                    <>
                                        Verify & Continue
                                        <iconify-icon icon="solar:arrow-right-linear" className="group-hover:translate-x-1 transition-transform"></iconify-icon>
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="text-center mt-8">
                        <p className="text-sm text-gray-400 mb-2">Didn't receive the code?</p>
                        <button
                            onClick={handleResend}
                            disabled={resendTimer > 0 || isLoading}
                            className="text-blue-600 font-bold hover:underline disabled:opacity-50 disabled:no-underline"
                        >
                            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><iconify-icon icon="line-md:loading-twotone-loop" className="text-4xl text-blue-500"></iconify-icon></div>}>
            <OTPContent />
        </Suspense>
    );
}
