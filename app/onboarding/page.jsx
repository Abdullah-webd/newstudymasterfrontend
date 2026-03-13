'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        class: '',
        schoolName: '',
        phoneNumber: '',
        goal: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user, updateOnboarding, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
        }
    }, [user, loading, router]);

    const handleNext = () => {
        if (step === 1 && !formData.class) {
            setError('Please select your class');
            return;
        }
        if (step === 2 && !formData.schoolName) {
            setError('Please enter your school name');
            return;
        }
        if (step === 3 && !formData.phoneNumber) {
            setError('Please enter your phone number');
            return;
        }
        setError('');
        setStep(step + 1);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!formData.goal) {
            setError('Please tell us your goal');
            return;
        }
        setIsLoading(true);
        const result = await updateOnboarding(formData);
        setIsLoading(false);
        if (!result.success) {
            setError(result.message);
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans overflow-hidden relative">
            {/* Dynamic Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-gray-50 rounded-full blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-gray-50 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <header className="p-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                        <iconify-icon icon="solar:star-fall-bold-duotone" className="text-xl text-white"></iconify-icon>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-900">StudyMaster</span>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-lg">
                    <div className="mb-12">
                        <div className="flex gap-2 mb-6">
                            {[1, 2, 3, 4].map((s) => (
                                <div
                                    key={s}
                                    className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${s <= step ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.2)]' : 'bg-gray-100'}`}
                                ></div>
                            ))}
                        </div>
                        <h1 className="text-4xl font-bold mb-3 text-gray-900">
                            {step === 1 ? 'Which class are you in?' :
                                step === 2 ? 'Where do you study?' :
                                    step === 3 ? 'What is your phone number?' :
                                        'What is your study goal?'}
                        </h1>
                        <p className="text-gray-500">Help us personalize your experience to better serve you</p>
                    </div>

                    <div className="bg-white/70 backdrop-blur-xl border border-gray-100 rounded-[32px] p-8 shadow-2xl shadow-blue-500/5 relative overflow-hidden">
                        {/* Step 1: Class Selection */}
                        {step === 1 && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'].map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => {
                                            setFormData({ ...formData, class: c });
                                            setStep(2);
                                            setError('');
                                        }}
                                        className={`p-6 rounded-2xl border transition-all text-left group/btn ${formData.class === c
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-gray-50 border-gray-100 hover:border-gray-200 hover:bg-white'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors ${formData.class === c ? 'bg-blue-500' : 'bg-white shadow-sm'
                                            }`}>
                                            <iconify-icon icon="solar:book-linear" className={formData.class === c ? 'text-white' : 'text-blue-500'}></iconify-icon>
                                        </div>
                                        <span className={`font-bold block ${formData.class === c ? 'text-blue-700' : 'text-gray-700'}`}>{c}</span>
                                        <span className="text-xs text-gray-400">Secondary School</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Step 2: School Name */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <iconify-icon icon="solar:home-smile-linear"></iconify-icon>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        value={formData.schoolName}
                                        onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 pl-12 pr-4 text-xl font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                                        placeholder="Enter your school name"
                                    />
                                </div>
                                <button
                                    onClick={handleNext}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 py-5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 group shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                                >
                                    Continue
                                    <iconify-icon icon="solar:arrow-right-linear" className="group-hover:translate-x-1 transition-transform"></iconify-icon>
                                </button>
                            </div>
                        )}

                        {/* Step 3: Phone Number */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <iconify-icon icon="solar:phone-linear"></iconify-icon>
                                    </div>
                                    <input
                                        type="tel"
                                        required
                                        autoFocus
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 pl-12 pr-4 text-xl font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                                <button
                                    onClick={handleNext}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 py-5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 group shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                                >
                                    Continue
                                    <iconify-icon icon="solar:arrow-right-linear" className="group-hover:translate-x-1 transition-transform"></iconify-icon>
                                </button>
                            </div>
                        )}

                        {/* Step 4: Study Goal */}
                        {step === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="relative">
                                    <iconify-icon icon="solar:pen-new-square-linear" className="absolute top-5 left-4 text-gray-400"></iconify-icon>
                                    <textarea
                                        required
                                        autoFocus
                                        value={formData.goal}
                                        onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 pl-12 h-48 text-lg font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 resize-none"
                                        placeholder="E.g. I want to clear my WAEC exams with straight A's and gain admission to study medicine."
                                    ></textarea>
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 py-5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 group shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <iconify-icon icon="line-md:loading-twotone-loop" className="text-xl"></iconify-icon>
                                    ) : (
                                        <>
                                            Complete Setup
                                            <iconify-icon icon="solar:check-read-linear" className="group-hover:scale-110 transition-transform"></iconify-icon>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-500 text-sm flex items-center gap-2 animate-shake">
                                <iconify-icon icon="solar:danger-triangle-linear"></iconify-icon>
                                {error}
                            </div>
                        )}
                    </div>

                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="mt-8 text-gray-500 hover:text-blue-600 transition-colors font-medium flex items-center gap-2 group/back mx-auto"
                            disabled={isLoading}
                        >
                            <iconify-icon icon="solar:arrow-left-linear" className="group-hover/back:-translate-x-1 transition-transform"></iconify-icon>
                            Go back to previous step
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
