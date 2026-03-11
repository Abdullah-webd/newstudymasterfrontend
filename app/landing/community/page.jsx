import CommunityContent from '@/components/CommunityContent'

export const metadata = {
  title: 'StudyMaster Community | Public Feed',
  description: 'Explore the StudyMaster community feed.',
}

export default function PublicCommunityPage() {
  return (
    <div className="min-h-screen bg-white landing-page">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <a href="/landing" className="font-heading font-semibold text-lg tracking-tight text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center text-xs">S</span>
            StudyMaster
          </a>
          <div className="flex items-center gap-3">
            <a href="/auth/signin" className="text-sm font-medium text-slate-600 hover:text-slate-900">Log in</a>
            <a href="/auth/signup" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-full hover:bg-blue-600 transition-colors">Start Free</a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CommunityContent isPublic={true} loginRedirectTo="/community" />
      </div>
    </div>
  )
}
