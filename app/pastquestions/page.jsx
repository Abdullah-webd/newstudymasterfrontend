import PastQuestionsPage from '@/components/PastQuestionsPage';

export const metadata = {
  title: 'Past Questions - StudyMaster',
  description: 'Find and practice with past exam questions',
};

import MainLayout from '@/components/MainLayout'

export default function PastQuestionsRoute() {
  return (
    <MainLayout isFullBleed={true}>
      <PastQuestionsPage />
    </MainLayout>
  )
}
