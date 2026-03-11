'use client'

import StatCard from './StatCard'

export default function StatsGrid({ statsData }) {
  const stats = [
    {
      icon: 'solar:clock-circle-linear',
      value: `${statsData?.studyHours || '0'} hrs`,
      label: 'Study Hours'
    },
    {
      icon: 'solar:document-add-linear',
      value: statsData?.notesGenerated || '0',
      label: 'AI Notes Generated',
      href: '/notes'
    },
    {
      icon: 'solar:diploma-linear',
      value: statsData?.examsCompleted || '0',
      label: 'Exams Completed',
      href: '/exam'
    },
    {
      icon: 'solar:widget-linear',
      value: statsData?.quizzesCompleted || '0',
      label: 'Quizzes Taken',
      href: '/notes'
    },
    {
      icon: 'solar:checklist-minimalistic-linear',
      value: statsData?.pastQuestionsPracticed || '0',
      label: 'Past Qs Practiced',
      href: '/pastquestions'
    },
    {
      icon: 'solar:pen-new-square-linear',
      value: statsData?.totalQuestionsPracticed || '0',
      label: 'Questions Answered',
      href: '/exam'
    }
  ]

  return (
    <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </section>
  )
}
