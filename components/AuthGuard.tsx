'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { isRouteAllowedWhenExpired, isSubscriptionExpired } from '@/lib/subscriptionGuard';

interface AuthGuardProps {
    children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const hasCompletedOnboarding = (candidate: typeof user) => {
        if (typeof candidate?.onboardingCompleted === 'boolean') {
            return candidate.onboardingCompleted;
        }
        const onboarding = candidate?.onboarding || {};
        return Object.values(onboarding).some((value) => {
            if (value === null || value === undefined) return false;
            if (typeof value === 'string') return value.trim().length > 0;
            return true;
        });
    };

    // A V1 student who has never completed the V2 flow. The V1 screens no longer
    // exist, so they must be sent through the new onboarding before anything
    // else — ahead of the expired-subscription redirect, which would otherwise
    // trap them on /settings (every legacy account is expired).
    const needsV2Onboarding = (candidate: any) =>
        !!candidate?.onboardingCompleted && candidate?.onboarding?.version !== 'v2';

    useEffect(() => {
        if (!loading) {
            const isAuthRoute = pathname.startsWith('/auth');
            const isOnboardingRoute = pathname === '/onboarding';
            const isAdminRoute = pathname.startsWith('/admin');
            const isLandingRoute = pathname === '/landing';
            const isLandingCommunityRoute = pathname.startsWith('/landing/community');
            const isHomeRoute = pathname === '/';
            const isVerifyRoute = pathname.startsWith('/auth/verify-otp');
            const isPublicRoute = isLandingRoute || isLandingCommunityRoute || isHomeRoute;

            // Admin has a separate login wall on /admin
            if (isAdminRoute) return;

            if (!user && !isAuthRoute && !isPublicRoute) {
                router.push('/landing');
            } else if (user) {
                const hasOnboarded = hasCompletedOnboarding(user);
                const mustMigrate = needsV2Onboarding(user);
                const subscriptionExpired = isSubscriptionExpired(user);

                if (isLandingRoute || isHomeRoute) {
                    router.push('/dashboard');
                } else if (isLandingCommunityRoute) {
                    router.push('/community');
                } else if (!user.isEmailVerified && !isVerifyRoute) {
                    router.push(`/auth/verify-otp?email=${encodeURIComponent(user.email)}`);
                } else if (!hasOnboarded && !isOnboardingRoute && !isAuthRoute && !isPublicRoute) {
                    router.push('/onboarding');
                } else if (mustMigrate && !isOnboardingRoute && !isAuthRoute && !isPublicRoute) {
                    // Migration outranks everything below, including expiry.
                    router.push('/onboarding');
                } else if (mustMigrate && isOnboardingRoute) {
                    // Let them stay and finish it.
                } else if (hasOnboarded && isOnboardingRoute) {
                    router.push('/dashboard');
                } else if (isAuthRoute) {
                    router.push('/dashboard');
                } else if (subscriptionExpired && !isRouteAllowedWhenExpired(pathname)) {
                    router.push('/settings');
                }
            }
        }
    }, [user, loading, pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                {/* @ts-ignore */}
                <iconify-icon icon="line-md:loading-twotone-loop" className="text-5xl text-blue-500"></iconify-icon>
            </div>
        );
    }

    const Redirecting = () => (
        <div className="min-h-screen bg-white flex items-center justify-center text-slate-500 text-sm">
            Redirecting...
        </div>
    );

    // Prevent flicker for unauthorized users
    const isAuthRoute = pathname.startsWith('/auth');
    const isOnboardingRoute = pathname === '/onboarding';
    const isAdminRoute = pathname.startsWith('/admin');
    const isLandingRoute = pathname === '/landing';
    const isLandingCommunityRoute = pathname.startsWith('/landing/community');
    const isHomeRoute = pathname === '/';
    const isVerifyRoute = pathname.startsWith('/auth/verify-otp');
    const isPublicRoute = isLandingRoute || isLandingCommunityRoute || isHomeRoute;

    if (isAdminRoute) return <>{children}</>;

    const hasOnboarded = hasCompletedOnboarding(user);
    const subscriptionExpired = isSubscriptionExpired(user);

    if (!user && !isAuthRoute && !isPublicRoute) return <Redirecting />;
    if (user && isAuthRoute && !isVerifyRoute) return <Redirecting />;
    if (user && !user.isEmailVerified && !isVerifyRoute) return <Redirecting />;
    if (user && !isOnboardingRoute && !isAuthRoute && !hasOnboarded) return <Redirecting />;
    if (user && subscriptionExpired && !isRouteAllowedWhenExpired(pathname) && !(isLandingRoute || isLandingCommunityRoute)) return <Redirecting />;
    if (user && (isLandingRoute || isLandingCommunityRoute || isHomeRoute)) return <Redirecting />;

    return <>{children}</>;
}
