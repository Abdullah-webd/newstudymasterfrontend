import MainLayout from '@/components/MainLayout'
import CommunityContent from '@/components/CommunityContent'

export const metadata = {
  title: 'StudyMaster Community',
  description: 'Connect with other StudyMaster learners',
}

export default function CommunityPage() {
  return (
    <MainLayout isFullBleed={false}>
      <CommunityContent />
    </MainLayout>
  )
}
