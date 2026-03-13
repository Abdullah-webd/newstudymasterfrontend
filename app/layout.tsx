import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/context/AuthContext'
import AuthGuard from '@/components/AuthGuard'
import { Toaster } from 'sonner'
import Script from 'next/script'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'StudyMaster Dashboard',
  description: 'Your personal study companion dashboard',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
      },
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>
        <meta name="google-site-verification" content="3JB2vSuSgLapJN34HN-66iOGMQW-nw9WHpZzOcV4F8E" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${_geist.className} antialiased`}>
        <AuthProvider>
          <AuthGuard>
            {children}
            <Toaster position="top-center" expand={true} richColors />
            <Analytics />
          </AuthGuard>
        </AuthProvider>
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </body>
    </html>
  )
}
