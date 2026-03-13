'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
    _id: string;
    userId: string;
    username: string;
    email: string;
    subscriptionId: string;
    role: string;
    isEmailVerified: boolean;
    onboardingCompleted?: boolean;
    onboarding?: {
        class?: string;
        schoolName?: string;
        goal?: string;
        [key: string]: any;
    };
    subscription?: any;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<any>;
    signup: (username: string, email: string, password: string) => Promise<any>;
    verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
    resendOTP: (email: string) => Promise<{ success: boolean; message: string }>;
    forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
    resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>;
    googleLogin: (idToken: string, options?: { redirectTo?: string }) => Promise<{ success: boolean; message: string }>;
    logout: () => void;
    updateOnboarding: (onboardingData: any) => Promise<{ success: boolean; message: string }>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
    refreshUser: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const hasCompletedOnboarding = (user: User | null) => {
        if (typeof user?.onboardingCompleted === 'boolean') {
            return user.onboardingCompleted;
        }
        const onboarding = user?.onboarding || {};
        return Object.values(onboarding).some((value) => {
            if (value === null || value === undefined) return false;
            if (typeof value === 'string') return value.trim().length > 0;
            return true;
        });
    };

    useEffect(() => {
        // Initial load - check for existing session
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                setToken(data.token);
                setUser(data.user);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect based on status
                if (!data.user.isEmailVerified) {
                    router.push(`/auth/verify-otp?email=${encodeURIComponent(data.user.email)}`);
                } else if (!hasCompletedOnboarding(data.user)) {
                    router.push('/onboarding');
                } else {
                    router.push('/dashboard');
                }
                return { success: true };
            } else {
                if (data.needsVerification) {
                    return { success: false, needsVerification: true, email: data.email };
                }
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'An error occurred during login.' };
        }
    };

    const signup = async (username: string, email: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    trialDays: 1,
                }),
            });

            const data = await response.json();

            if (data.success) {
                return { success: true, email: data.data.email };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: 'An error occurred during signup.' };
        }
    };

    const verifyOTP = async (email: string, otp: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json();
            if (data.success) {
                if (data.token && data.user) {
                    setToken(data.token);
                    setUser(data.user);
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                return { success: true, message: data.message || 'Email verified successfully' };
            } else {
                return { success: false, message: data.message || 'Verification failed' };
            }
        } catch (error) {
            console.error('Verify error:', error);
            return { success: false, message: 'An error occurred during verification.' };
        }
    };

    const resendOTP = async (email: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (data.success) {
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message || 'Failed to resend OTP' };
            }
        } catch (error) {
            console.error('Resend error:', error);
            return { success: false, message: 'An error occurred while resending OTP.' };
        }
    };

    const forgotPassword = async (email: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (data.success) {
                return { success: true, message: data.message || 'Reset link sent to your email' };
            } else {
                return { success: false, message: data.message || 'Failed to request password reset' };
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            return { success: false, message: 'An error occurred during password reset request.' };
        }
    };

    const resetPassword = async (token: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await response.json();
            if (data.success) {
                setToken(data.token);
                setUser(data.user);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/onboarding'); // Next step after reset
                return { success: true, message: 'Password reset successfully' };
            } else {
                return { success: false, message: data.message || 'Failed to reset password' };
            }
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, message: 'An error occurred during password reset.' };
        }
    };

    const googleLogin = async (idToken: string, options?: { redirectTo?: string }) => {
        try {
            console.log(process.env.NEXT_PUBLIC_API_URL)
            const response = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });
            const data = await response.json();
            if (data.success) {
                setToken(data.token);
                setUser(data.user);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                if (!data.user.isEmailVerified) {
                    router.push(`/auth/verify-otp?email=${encodeURIComponent(data.user.email)}`);
                } else if (!hasCompletedOnboarding(data.user)) {
                    router.push('/onboarding');
                } else if (options?.redirectTo) {
                    router.push(options.redirectTo);
                } else {
                    router.push('/dashboard');
                }
                return { success: true, message: 'Logged in with Google' };
            } else {
                return { success: false, message: data.message || 'Google login failed' };
            }
        } catch (error) {
            console.error('Google login error:', error);
            return { success: false, message: 'An error occurred during Google login.' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/landing');
    };

    const updateOnboarding = async (onboardingData: any) => {
        try {
            const response = await fetch(`${API_URL}/user/onboarding`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(onboardingData),
            });

            const data = await response.json();

            if (data.success) {
                const updatedUser = {
                    ...user!,
                    onboarding: data.data.onboarding,
                    onboardingCompleted: data.data.onboardingCompleted ?? true
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                router.push('/dashboard');
                return { success: true, message: 'Onboarding updated successfully' };
            } else {
                return { success: false, message: data.message || 'Failed to update onboarding' };
            }
        } catch (error) {
            console.error('Onboarding update error:', error);
            return { success: false, message: 'An error occurred during onboarding.' };
        }
    };

    const changePassword = async (currentPassword: string, newPassword: string) => {
        try {
            const response = await fetch(`${API_URL}/settings/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await response.json();
            if (data.success) {
                return { success: true, message: data.message || 'Password changed successfully' };
            } else {
                return { success: false, message: data.message || 'Failed to change password' };
            }
        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, message: 'An error occurred while changing password.' };
        }
    };

    const refreshUser = async () => {
        try {
            const currentToken = token || localStorage.getItem('token');
            if (!currentToken) {
                return { success: false, message: 'No active session found.' };
            }

            const response = await fetch(`${API_URL}/user/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            const data = await response.json();
            if (!response.ok || !data?.success) {
                return { success: false, message: data?.message || 'Failed to refresh account status.' };
            }

            const refreshedUser = data?.data;
            if (refreshedUser) {
                setUser(refreshedUser);
                localStorage.setItem('user', JSON.stringify(refreshedUser));
            }

            return { success: true, message: 'Account status refreshed.' };
        } catch (error) {
            console.error('Refresh user error:', error);
            return { success: false, message: 'An error occurred while refreshing account status.' };
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            signup,
            verifyOTP,
            resendOTP,
            forgotPassword,
            resetPassword,
            googleLogin,
            logout,
            updateOnboarding,
            changePassword,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
