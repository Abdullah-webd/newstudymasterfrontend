export const ADMIN_SESSION_KEY = 'admin-auth';

export const getAdminSession = () => {
    if (typeof window === 'undefined') return null;

    try {
        const raw = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.token) return null;
        return parsed;
    } catch {
        return null;
    }
};

export const setAdminSession = (token) => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ token, authed: true }));
};

export const clearAdminSession = () => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
};
