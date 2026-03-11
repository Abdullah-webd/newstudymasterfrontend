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

    useEffect(() => {
        if (!loading) {
            const isAuthRoute = pathname.startsWith('/auth');
            const isOnboardingRoute = pathname === '/onboarding';
            const isAdminRoute = pathname.startsWith('/admin');
            const isLandingRoute = pathname === '/landing';
            const isLandingCommunityRoute = pathname.startsWith('/landing/community');
            const isHomeRoute = pathname === '/';
            const isPublicRoute = isLandingRoute || isLandingCommunityRoute || isHomeRoute;

            // Admin has a separate login wall on /admin
            if (isAdminRoute) return;

            if (!user && !isAuthRoute && !isPublicRoute) {
                router.push('/landing');
            } else if (user) {
                const hasOnboarded = user.onboarding && Object.keys(user.onboarding).length > 0;
                const subscriptionExpired = isSubscriptionExpired(user);

                if (isLandingRoute) {
                    router.push('/');
                } else if (isLandingCommunityRoute) {
                    router.push('/community');
                } else if (!hasOnboarded && !isOnboardingRoute && !isAuthRoute && !isPublicRoute) {
                    router.push('/onboarding');
                } else if (hasOnboarded && isOnboardingRoute) {
                    router.push('/');
                } else if (isAuthRoute) {
                    router.push('/');
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

    // Prevent flicker for unauthorized users
    const isAuthRoute = pathname.startsWith('/auth');
    const isOnboardingRoute = pathname === '/onboarding';
    const isAdminRoute = pathname.startsWith('/admin');
    const isLandingRoute = pathname === '/landing';
    const isLandingCommunityRoute = pathname.startsWith('/landing/community');
    const isHomeRoute = pathname === '/';
    const isPublicRoute = isLandingRoute || isLandingCommunityRoute || isHomeRoute;

    if (isAdminRoute) return <>{children}</>;

    const hasOnboarded = user?.onboarding && Object.keys(user.onboarding).length > 0;
    const subscriptionExpired = isSubscriptionExpired(user);

    if (!user && !isAuthRoute && !isPublicRoute) return null;
    if (user && isAuthRoute) return null;
    if (user && !isOnboardingRoute && !isAuthRoute && !hasOnboarded) return null;
    if (user && subscriptionExpired && !isRouteAllowedWhenExpired(pathname) && !(isLandingRoute || isLandingCommunityRoute)) return null;
    if (user && (isLandingRoute || isLandingCommunityRoute)) return null;

    return <>{children}</>;
}
