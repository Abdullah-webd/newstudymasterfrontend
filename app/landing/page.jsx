import { Outfit, Plus_Jakarta_Sans } from 'next/font/google'
import Script from 'next/script'
import LandingContent from '@/components/LandingContent'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata = {
  title: 'StudyMaster | WAEC, NECO & JAMB Prep for Nigerian Students',
  description:
    'StudyMaster helps Nigerian students pass WAEC, NECO, and JAMB with personalized study plans, smart practice, AI notes, and progress tracking.',
  keywords: [
    'WAEC',
    'NECO',
    'JAMB',
    'UTME',
    'Nigeria',
    'study app',
    'exam preparation',
    'past questions',
    'CBT practice',
    'AI notes',
    'study planner',
    'StudyMaster'
  ],
  alternates: {
    canonical: `${siteUrl}/landing`
  },
  openGraph: {
    type: 'website',
    url: `${siteUrl}/landing`,
    title: 'StudyMaster | WAEC, NECO & JAMB Prep for Nigerian Students',
    description:
      'Personalized study plans, smart practice, AI notes, and progress tracking for WAEC, NECO, and JAMB.',
    siteName: 'StudyMaster',
    images: [
      {
        url: `${siteUrl}/icon-light-32x32.png`,
        width: 32,
        height: 32,
        alt: 'StudyMaster'
      }
    ]
  },
  twitter: {
    card: 'summary',
    title: 'StudyMaster | WAEC, NECO & JAMB Prep for Nigerian Students',
    description:
      'Personalized study plans, smart practice, AI notes, and progress tracking for WAEC, NECO, and JAMB.'
  },
  robots: {
    index: true,
    follow: true
  }
}

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'StudyMaster',
    url: `${siteUrl}/landing`,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/landing?query={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <>
      <Script
        id="study-master-website-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingContent className={`${outfit.variable} ${jakarta.variable}`} />
    </>
  )
}
