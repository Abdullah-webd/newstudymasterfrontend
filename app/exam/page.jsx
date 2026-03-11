import ExamPage from '@/components/ExamPage';

export const metadata = {
  title: 'Exam Preparation - StudyMaster',
  description: 'Practice exam preparation with StudyMaster'
};

import MainLayout from '@/components/MainLayout'

export default function Page() {
  return (
    <MainLayout>
      <ExamPage />
    </MainLayout>
  )
}
