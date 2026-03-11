import { Outfit, Plus_Jakarta_Sans } from 'next/font/google'
import LandingContent from '@/components/LandingContent'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })

export const metadata = {
  title: 'StudyMaster | Exam Success for WAEC, NECO & JAMB',
  description:
    'StudyMaster transforms how students prepare—personalized study plans, smart practice, and expert guidance designed specifically for Nigerian examinations.',
}

export default function LandingPage() {
  return <LandingContent className={`${outfit.variable} ${jakarta.variable}`} />
}
