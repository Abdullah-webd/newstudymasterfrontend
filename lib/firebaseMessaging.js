import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, isSupported, deleteToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean)

const getFirebaseApp = () => {
    if (!hasFirebaseConfig) return null
    if (getApps().length > 0) return getApps()[0]
    return initializeApp(firebaseConfig)
}

export const isFirebaseMessagingConfigured = () => {
    return hasFirebaseConfig && Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY)
}

export const getBrowserFcmToken = async ({ promptPermission = false } = {}) => {
    if (typeof window === 'undefined') {
        return { token: null, error: 'Push is only available in the browser' }
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        return { token: null, error: 'Push requires HTTPS' }
    }

    if (!isFirebaseMessagingConfigured()) {
        return { token: null, error: 'Missing Firebase config or VAPID key' }
    }

    if (!('Notification' in window)) {
        return { token: null, error: 'Notifications are not supported by this browser' }
    }

    if (!('serviceWorker' in navigator)) {
        return { token: null, error: 'Service worker is not supported by this browser' }
    }

    const supported = await isSupported().catch(() => false)
    if (!supported) {
        return { token: null, error: 'Firebase messaging is not supported on this browser' }
    }

    let permission = Notification.permission
    if (permission !== 'granted' && promptPermission) {
        permission = await Notification.requestPermission()
    }
    if (permission !== 'granted') {
        return { token: null, error: 'Notification permission was not granted' }
    }

    const app = getFirebaseApp()
    if (!app) {
        return { token: null, error: 'Firebase app is not configured' }
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const messaging = getMessaging(app)

    const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
    })

    if (!token) {
        return { token: null, error: 'Unable to generate device token' }
    }

    return { token, error: null }
}

export const deleteBrowserFcmToken = async () => {
    if (typeof window === 'undefined') {
        return { success: false, error: 'Push is only available in the browser' }
    }
    const supported = await isSupported().catch(() => false)
    if (!supported) {
        return { success: false, error: 'Firebase messaging is not supported on this browser' }
    }
    const app = getFirebaseApp()
    if (!app) {
        return { success: false, error: 'Firebase app is not configured' }
    }
    try {
        const messaging = getMessaging(app)
        const deleted = await deleteToken(messaging)
        return { success: deleted, error: null }
    } catch (err) {
        return { success: false, error: err.message || 'Failed to delete token' }
    }
}

export const listenForForegroundMessages = async (handler) => {
    if (typeof window === 'undefined') {
        return () => {}
    }
    const supported = await isSupported().catch(() => false)
    if (!supported) {
        return () => {}
    }
    const app = getFirebaseApp()
    if (!app) {
        return () => {}
    }
    const messaging = getMessaging(app)
    return onMessage(messaging, handler)
}
