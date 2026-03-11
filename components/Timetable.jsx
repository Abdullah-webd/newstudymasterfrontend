'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getBrowserFcmToken, isFirebaseMessagingConfigured, deleteBrowserFcmToken, listenForForegroundMessages } from '@/lib/firebaseMessaging'

const Timetable = () => {
    const { token } = useAuth()
    const containerRef = useRef(null)
    const saveTimersRef = useRef(new Map())
    const metaByKeyRef = useRef({})
    const [entriesByKey, setEntriesByKey] = useState({})
    const [metaByKey, setMetaByKey] = useState({})
    const [loading, setLoading] = useState(true)
    const [saveState, setSaveState] = useState('Loading timetable...')
    const [pushState, setPushState] = useState('Push not enabled')
    const [debugToken, setDebugToken] = useState('')
    const [debugError, setDebugError] = useState('')
    const [swStatus, setSwStatus] = useState('Checking service worker...')
    const [testStatus, setTestStatus] = useState('')
    const [localStatus, setLocalStatus] = useState('')
    const [resetStatus, setResetStatus] = useState('')
    const [showDebug, setShowDebug] = useState(false)

    useEffect(() => {
        if (containerRef.current) {
            const now = new Date()
            const hours = now.getHours()
            const minutes = now.getMinutes()
            const totalHours = hours + minutes / 60
            const scrollToY = 56 + (totalHours * 64) - (containerRef.current.clientHeight / 2)

            containerRef.current.scrollTo({ top: Math.max(0, scrollToY), behavior: 'smooth' })
        }
    }, [])

    const days = [
        { full: 'Monday', short: 'Mon' },
        { full: 'Tuesday', short: 'Tue' },
        { full: 'Wednesday', short: 'Wed' },
        { full: 'Thursday', short: 'Thu' },
        { full: 'Friday', short: 'Fri' },
        { full: 'Saturday', short: 'Sat' },
        { full: 'Sunday', short: 'Sun' }
    ]

    const now = new Date()
    const activeDay = days[now.getDay() === 0 ? 6 : now.getDay() - 1].full
    const activeDate = now.getDate()
    const currentTimeTop = `calc(56px + (64px * ${now.getHours()}) + ${(now.getMinutes() / 60) * 64}px)`

    const toLabelHour = (hour24) => {
        const period = hour24 < 12 ? 'AM' : 'PM'
        const displayHour = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
        return `${displayHour} ${period}`
    }

    const toHHmm = (hour24) => `${String(hour24).padStart(2, '0')}:00`
    const toEndHHmm = (hour24) => `${String((hour24 + 1) % 24).padStart(2, '0')}:00`
    const keyFor = (day, hour24) => `${day}|${toHHmm(hour24)}`

    useEffect(() => {
        metaByKeyRef.current = metaByKey
    }, [metaByKey])

    const withAuth = (method, path, body) => {
        return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: body ? JSON.stringify(body) : undefined
        })
    }

    useEffect(() => {
        const loadTimetable = async () => {
            if (!token) return

            try {
                setLoading(true)
                const response = await withAuth('GET', '/timetable')
                const data = await response.json()
                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'Failed to load timetable')
                }

                const nextEntries = {}
                const nextMeta = {}
                for (const entry of data.entries || []) {
                    const key = `${entry.day}|${entry.startTime}`
                    nextEntries[key] = entry.activity || ''
                    nextMeta[key] = {
                        id: entry._id,
                        day: entry.day,
                        startTime: entry.startTime,
                        endTime: entry.endTime
                    }
                }

                setEntriesByKey(nextEntries)
                setMetaByKey(nextMeta)
                setSaveState('Auto-save enabled')
            } catch (err) {
                setSaveState(err.message || 'Failed to load timetable')
            } finally {
                setLoading(false)
            }
        }

        loadTimetable()
    }, [token])

    const saveCell = async (day, hour24, rawValue) => {
        if (!token) return

        const trimmed = rawValue.trim()
        const cellKey = keyFor(day, hour24)
        const existing = metaByKeyRef.current[cellKey]

        try {
            setSaveState('Saving...')

            if (!trimmed) {
                if (!existing?.id) {
                    setSaveState('Saved')
                    return
                }

                const response = await withAuth('DELETE', `/timetable/${existing.id}`)
                const data = await response.json()
                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'Failed to delete entry')
                }

                setMetaByKey((prev) => {
                    const next = { ...prev }
                    delete next[cellKey]
                    return next
                })
                setSaveState('Saved')
                return
            }

            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
            const payload = {
                id: existing?.id,
                day,
                startTime: toHHmm(hour24),
                endTime: toEndHHmm(hour24),
                activity: trimmed,
                timezone,
                notificationsEnabled: true,
                notificationOffsetMinutes: 0
            }

            const response = await withAuth('PUT', '/timetable/entry', payload)
            const data = await response.json()
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to save entry')
            }

            setMetaByKey((prev) => ({
                ...prev,
                [cellKey]: {
                    id: data.data._id,
                    day: data.data.day,
                    startTime: data.data.startTime,
                    endTime: data.data.endTime
                }
            }))
            setSaveState('Saved')
        } catch (err) {
            setSaveState(err.message || 'Save failed')
        }
    }

    const queueSave = (day, hour24, value) => {
        const cellKey = keyFor(day, hour24)
        const currentTimer = saveTimersRef.current.get(cellKey)
        if (currentTimer) clearTimeout(currentTimer)

        const timer = setTimeout(() => {
            saveCell(day, hour24, value)
            saveTimersRef.current.delete(cellKey)
        }, 800)

        saveTimersRef.current.set(cellKey, timer)
    }

    const flushSave = (day, hour24, value) => {
        const cellKey = keyFor(day, hour24)
        const timer = saveTimersRef.current.get(cellKey)
        if (timer) clearTimeout(timer)
        saveTimersRef.current.delete(cellKey)
        saveCell(day, hour24, value)
    }

    useEffect(() => {
        return () => {
            for (const timer of saveTimersRef.current.values()) {
                clearTimeout(timer)
            }
        }
    }, [])

    const registerPushToken = async (promptPermission = false) => {
        if (!token) return
        if (!isFirebaseMessagingConfigured()) {
            setPushState('Missing Firebase env vars in .env.local')
            return
        }

        setPushState('Enabling push...')
        const { token: fcmToken, error } = await getBrowserFcmToken({ promptPermission })
        if (!fcmToken) {
            setPushState(error || 'Push was not enabled')
            return
        }

        try {
            const response = await withAuth('POST', '/timetable/device-token', {
                token: fcmToken,
                platform: 'web',
                deviceName: navigator.userAgent.slice(0, 120)
            })
            const data = await response.json()
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to register device token')
            }
            setPushState('Push enabled on this device')
        } catch (err) {
            setPushState(err.message || 'Failed to register push token')
        }
    }

    useEffect(() => {
        if (!token || typeof Notification === 'undefined') return
        if (Notification.permission === 'granted') {
            registerPushToken(false)
        }
    }, [token])

    useEffect(() => {
        let unsubscribe = null
        const attach = async () => {
            unsubscribe = await listenForForegroundMessages((payload) => {
                const title = payload?.notification?.title || payload?.data?.title || 'Timetable Reminder'
                const body = payload?.notification?.body || payload?.data?.body || 'You have a timetable reminder.'
                if (Notification.permission === 'granted') {
                    new Notification(title, { body })
                } else {
                    setTestStatus('Foreground message received (notification blocked)')
                }
            })
        }
        attach()
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe()
            }
        }
    }, [])

    useEffect(() => {
        const checkServiceWorker = async () => {
            if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
                setSwStatus('Service worker not supported')
                return
            }
            try {
                const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
                setSwStatus(registration ? 'Service worker registered' : 'Service worker not registered')
            } catch (err) {
                setSwStatus('Service worker check failed')
            }
        }
        checkServiceWorker()
    }, [])

    const refreshToken = async () => {
        setDebugError('')
        const { token: fcmToken, error } = await getBrowserFcmToken({ promptPermission: false })
        if (!fcmToken) {
            setDebugToken('')
            setDebugError(error || 'Failed to get token')
            return
        }
        setDebugToken(fcmToken)
    }

    const sendFrontendTest = async () => {
        setTestStatus('Sending test...')
        setDebugError('')
        try {
            const { token: activeToken, error } = await getBrowserFcmToken({ promptPermission: false })
            if (activeToken) {
                setDebugToken(activeToken)
            } else if (error) {
                setDebugError(error)
            }

            const response = await withAuth('POST', '/timetable/test-notification', {
                title: 'Test',
                body: 'Hello from StudyMaster',
                token: activeToken || debugToken || undefined
            })
            const data = await response.json()
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Test push failed')
            }
            setTestStatus(`Sent: ${data.successCount || 0} ok, ${data.failureCount || 0} failed`)
        } catch (err) {
            setTestStatus('Test failed')
            setDebugError(err.message || 'Test failed')
        }
    }

    const sendLocalNotification = () => {
        setLocalStatus('')
        if (typeof Notification === 'undefined') {
            setLocalStatus('Notifications API not supported')
            return
        }
        if (Notification.permission !== 'granted') {
            setLocalStatus('Notification permission not granted')
            return
        }
        new Notification('Local Test', {
            body: 'This is a direct browser notification (no FCM).'
        })
        setLocalStatus('Local notification sent')
    }

    const resetTokens = async () => {
        setResetStatus('Clearing tokens...')
        setDebugError('')
        try {
            await deleteBrowserFcmToken()
            const response = await withAuth('POST', '/timetable/clear-tokens')
            const data = await response.json()
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to clear tokens')
            }
            setDebugToken('')
            setResetStatus('Tokens cleared. Click Enable Push again.')
        } catch (err) {
            setResetStatus('Failed to clear tokens')
            setDebugError(err.message || 'Failed to clear tokens')
        }
    }

    return (
        <div className="flex-1 bg-white overflow-hidden flex flex-col relative h-full">
            <header className="flex-none h-14 border-b border-zinc-200 bg-white px-4 md:px-6 flex items-center justify-between z-40 relative">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-zinc-900 rounded-lg text-white">
                        <span className="font-medium tracking-tighter text-sm">TT</span>
                    </div>
                    <div className="h-4 w-[1px] bg-zinc-200 hidden sm:block"></div>
                    <h1 className="text-xl font-medium tracking-tight hidden sm:block">Weekly Schedule</h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => registerPushToken(true)}
                        className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 bg-white border border-zinc-200 text-zinc-700 shadow-sm hover:bg-zinc-50 h-8 px-3 gap-1.5 font-inter"
                    >
                        <iconify-icon icon="solar:calendar-linear" width="16" height="16" stroke-width="1.5"></iconify-icon>
                        <span className="hidden sm:inline">Enable Push</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowDebug((prev) => !prev)}
                        className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 bg-white border border-zinc-200 text-zinc-700 shadow-sm hover:bg-zinc-50 h-8 px-3 gap-1.5 font-inter"
                    >
                        <iconify-icon icon="solar:bug-linear" width="16" height="16" stroke-width="1.5"></iconify-icon>
                        <span className="hidden sm:inline">{showDebug ? 'Hide Debug' : 'Show Debug'}</span>
                    </button>
                </div>
            </header>

            {showDebug ? (
                <div className="border-b border-zinc-200 bg-zinc-50 px-4 md:px-6 py-3 flex flex-col gap-2 text-xs text-zinc-700">
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">Push Debug</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={refreshToken}
                                className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium hover:bg-zinc-100"
                            >
                                Refresh Token
                            </button>
                            <button
                                type="button"
                                onClick={sendFrontendTest}
                                className="inline-flex items-center justify-center rounded-md border border-zinc-900 bg-zinc-900 text-white px-2 py-1 text-xs font-medium hover:bg-zinc-800"
                            >
                                Send Test
                            </button>
                            <button
                                type="button"
                                onClick={resetTokens}
                                className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium hover:bg-zinc-100"
                            >
                                Reset Tokens
                            </button>
                            <button
                                type="button"
                                onClick={sendLocalNotification}
                                className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium hover:bg-zinc-100"
                            >
                                Local Test
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500">Service worker:</span>
                        <span>{swStatus}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500">FCM token:</span>
                        <span className="truncate max-w-[70%]">{debugToken || 'Not loaded'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500">Test status:</span>
                        <span>{testStatus || 'Idle'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500">Local status:</span>
                        <span>{localStatus || 'Idle'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500">Reset status:</span>
                        <span>{resetStatus || 'Idle'}</span>
                    </div>
                    {debugError ? <div className="text-red-600">{debugError}</div> : null}
                </div>
            ) : null}

            {/* Scrollable Grid Container */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto custom-scrollbar relative bg-zinc-50"
                id="timetable-container"
            >
                {/* Inner Grid */}
                <div className="grid min-w-[960px] w-full bg-white relative" style={{ gridTemplateColumns: '80px repeat(7, minmax(125px, 1fr))' }}>

                    {/* ================= ROW 0: HEADERS ================= */}

                    {/* Top Left Corner */}
                    <div className="sticky top-0 left-0 z-30 bg-zinc-50 border-b border-r border-zinc-200 h-14 flex items-end justify-end p-2">
                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">EST</span>
                    </div>

                    {/* Day Headers */}
                    {days.map((day, i) => (
                        <div
                            key={i}
                            className={`sticky top-0 z-20 border-b border-r border-zinc-200 h-14 flex flex-col items-center justify-center gap-0.5 ${day.full === activeDay
                                ? 'bg-white border-b-2 border-b-zinc-900 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]'
                                : 'bg-zinc-50/95 backdrop-blur-sm'
                                }`}
                        >
                            <span className={`text-xs font-medium uppercase tracking-wider ${day.full === activeDay ? 'text-zinc-900' : 'text-zinc-500'}`}>
                                {day.short}
                            </span>
                            <span className={`text-sm font-medium ${day.full === activeDay
                                ? 'text-white bg-zinc-900 w-6 h-6 rounded-full flex items-center justify-center mt-0.5'
                                : 'text-zinc-700'
                                }`}>
                                {day.full === activeDay ? activeDate : ''}
                            </span>
                        </div>
                    ))}

                    {/* ================= CURRENT TIME INDICATOR ================= */}
                    <div className="absolute w-full z-20 pointer-events-none flex items-center" style={{ top: currentTimeTop }}>
                        <div className="w-[80px] flex justify-end pr-2">
                            <span className="text-xs font-medium text-red-500 bg-white px-1 relative -top-0.5 leading-none">{`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`}</span>
                        </div>
                        <div className="flex-1 h-[1px] bg-red-500 relative">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></div>
                        </div>
                    </div>

                    {/* ================= ROWS 1-24: TIME SLOTS ================= */}
                    {Array.from({ length: 24 }).map((_, hourIndex) => (
                        <React.Fragment key={hourIndex}>
                            {/* Time Label Column */}
                            <div className="sticky left-0 z-10 bg-white border-b border-r border-zinc-200 h-16 flex items-start justify-end pr-2 group">
                                <span className={`text-xs font-medium relative -top-2.5 bg-white px-1 leading-none transition-colors ${hourIndex === now.getHours() ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-600'
                                    }`}>
                                    {toLabelHour(hourIndex)}
                                </span>
                            </div>

                            {/* Day Columns */}
                            {days.map((day, dayIndex) => {
                                const cellKey = keyFor(day.full, hourIndex)
                                const value = entriesByKey[cellKey] || ''
                                const isActiveDay = day.full === activeDay
                                const isSelectedCol = isActiveDay ? 'bg-zinc-50/20' : 'bg-white'
                                const hoverClass = isActiveDay ? 'hover:bg-zinc-50/50' : 'hover:bg-zinc-50/30'

                                return (
                                    <div
                                        key={dayIndex}
                                        className={`border-b border-r border-zinc-100 ${isSelectedCol} h-16 relative group ${hoverClass} transition-colors`}
                                    >
                                        <textarea
                                            value={value}
                                            onChange={(event) => {
                                                const next = event.target.value
                                                setEntriesByKey((prev) => ({ ...prev, [cellKey]: next }))
                                                queueSave(day.full, hourIndex, next)
                                            }}
                                            onBlur={(event) => flushSave(day.full, hourIndex, event.target.value)}
                                            placeholder="Add event..."
                                            className="absolute inset-0 p-2 text-xs text-zinc-800 outline-none focus:bg-zinc-50 focus:ring-1 focus:ring-inset focus:ring-zinc-300 transition-all resize-none overflow-y-auto leading-relaxed"
                                        />
                                    </div>
                                )
                            })}
                        </React.Fragment>
                    ))}

                    {/* Status row */}
                    <div className="sticky bottom-0 left-0 z-30 bg-white/95 backdrop-blur border-t border-r border-zinc-200 h-10 px-3 flex items-center">
                        <span className="text-[11px] text-zinc-500 uppercase tracking-wide">Status</span>
                    </div>
                    <div className="sticky bottom-0 z-20 col-span-7 bg-white/95 backdrop-blur border-t border-zinc-200 h-10 px-3 flex items-center justify-between">
                        <span className="text-xs text-zinc-600">{loading ? 'Loading...' : saveState}</span>
                        <span className="text-xs text-zinc-600">{pushState}</span>
                    </div>
                </div>
            </div>

            {/* Optional bottom shadow/gradient for scroll indication */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-zinc-200/20 to-transparent pointer-events-none"></div>
        </div>
    )
}

export default Timetable
