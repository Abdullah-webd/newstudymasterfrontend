'use client';

import { useState, useEffect, useRef } from 'react';
import PastQuestionsHeader from './PastQuestionsHeader';
import FilterScreen from './FilterScreen';
import QuestionsListScreen from './QuestionsListScreen';
import AIOverlay from './AIOverlay';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const trackActivity = async (action, metadata = {}) => {
  try {
    await fetch(`${API_URL}/activity/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ type: 'past_question_study', metadata })
    });
  } catch (e) { /* Non-fatal */ }
};

export default function PastQuestionsPage() {
  const [currentView, setCurrentView] = useState('filter');
  const [filters, setFilters] = useState({
    subject: 'Mathematics',
    year: '2023',
    examType: 'JAMB',
    questionType: 'obj',
  });
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [messages, setMessages] = useState([]);
  const isTracking = useRef(false);

  const handleFilterSubmit = (filterData) => {
    setFilters(filterData);
    setCurrentView('list');
    if (!isTracking.current) {
      trackActivity('start', { subject: filterData.subject, examType: filterData.examType });
      isTracking.current = true;
    }
  };

  const handleBackToFilter = () => {
    setCurrentView('filter');
    setMessages([]);
    if (isTracking.current) {
      trackActivity('stop');
      isTracking.current = false;
    }
  };

  // Stop tracking on component unmount
  useEffect(() => {
    return () => {
      if (isTracking.current) {
        trackActivity('stop');
        isTracking.current = false;
      }
    };
  }, []);

  const handleAskAI = (question) => {
    setSelectedQuestion(question);
    setAiOpen(true);
  };

  const handleCloseAI = () => {
    setAiOpen(false);
  };

  return (
    <div className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col overflow-x-hidden">
      <PastQuestionsHeader />
      <main className="flex-1 relative max-w-4xl mx-auto w-full">
        {currentView === 'filter' ? (
          <FilterScreen onSubmit={handleFilterSubmit} />
        ) : (
          <QuestionsListScreen
            filters={filters}
            onBack={handleBackToFilter}
            onAskAI={handleAskAI}
          />
        )}
      </main>
      <AIOverlay
        isOpen={aiOpen}
        question={selectedQuestion}
        onClose={handleCloseAI}
        messages={messages}
        setMessages={setMessages}
      />
    </div>
  );
}

