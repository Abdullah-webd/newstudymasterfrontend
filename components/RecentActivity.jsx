'use client'

import ActivityItem from './ActivityItem'

export default function RecentActivity({ activityData = [] }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'note_creation': return 'solar:document-text-linear';
      case 'quiz_study': return 'solar:checklist-minimalistic-linear';
      case 'past_question_study': return 'solar:pen-new-square-linear';
      case 'ai_chat': return 'solar:chat-round-dots-linear';
      default: return 'solar:book-bookmark-linear';
    }
  };

  const formatActivityName = (type) => {
    const formatted = type.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const activities = activityData?.map((item) => ({
    icon: getActivityIcon(item.type),
    title: formatActivityName(item.type),
    subtitle: item.metadata?.subject || item.metadata?.exam_name || 'General Study',
    time: formatTime(item.createdAt)
  })) || [];

  if (activities.length === 0) {
    activities.push({
      icon: 'solar:book-bookmark-linear',
      title: 'No recent activity',
      subtitle: 'Start studying to see your history here!',
      time: ''
    });
  }

  return (
    <section className="bg-white border border-[#EAEAEA] rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-[#EAEAEA] flex items-center justify-between bg-white">
        <h2 className="text-sm font-medium text-[#171717]">Recent Activity</h2>
        <button className="text-xs text-[#666666] hover:text-[#171717] transition-colors">
          View all
        </button>
      </div>
      <div className="divide-y divide-[#FAFAFA]">
        {activities.map((activity, index) => (
          <ActivityItem key={index} {...activity} />
        ))}
      </div>
    </section>
  )
}
