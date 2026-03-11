importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js')
importScripts('/firebase-config.js')

if (self.__FIREBASE_CONFIG && !firebase.apps.length) {
    firebase.initializeApp(self.__FIREBASE_CONFIG)
}

const messaging = firebase.apps.length ? firebase.messaging() : null

if (messaging) {
    messaging.onBackgroundMessage((payload) => {
        const notification = payload?.notification || {}
        const data = payload?.data || {}
        const title = notification.title || data.title || 'Timetable Reminder'
        const options = {
            body: notification.body || data.body || 'You have a timetable reminder.',
            data
        }

        self.registration.showNotification(title, options)
    })
}

self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    const fallbackUrl = '/timetable'
    const targetUrl = event.notification?.data?.link || fallbackUrl

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    client.navigate(targetUrl)
                    return client.focus()
                }
            }
            return self.clients.openWindow(targetUrl)
        })
    )
})
