"use client"
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import ExamHeader from './ExamHeader';
import ExamFilterScreen from './ExamFilterScreen';
import ExamQuestionScreen from './ExamQuestionScreen';
import ExamResultsScreen from './ExamResultsScreen';
import ExamAIChat from './ExamAIChat';

export default function ExamPage() {
  const [screen, setScreen] = useState('filter'); // filter, questions, results, loading
  const [examId, setExamId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [filters, setFilters] = useState({
    subject: '',
    year: '',
    examType: '',
    questionType: ''
  });

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  const handleStartExam = async (params) => {
    try {
      setScreen('loading');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exams/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subject: params.subject,
          exam_name: params.examType,
          question_type: params.questionType,
          year: params.year,
          size: params.size
        })
      });

      const result = await response.json();
      if (result.success) {
        setExamId(result.data._id);
        const fetchedQuestions = result.data.questions.map(q => q.questionId);
        setQuestions(fetchedQuestions);
        setUserAnswers(new Array(fetchedQuestions.length).fill(null));
        setCurrentQuestionIndex(0);
        setTimeLeft(params.timeLimit * 60);
        setScreen('questions');
        startTimer();
      } else {
        toast.error(result.message || 'Failed to generate exam');
        setScreen('filter');
      }
    } catch (error) {
      console.error('Error starting exam:', error);
      toast.error('An error occurred. Please try again.');
      setScreen('filter');
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswer = (index, value) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitExam();
    }
  };

  const handleSubmitExam = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      setScreen('loading');
      const formattedAnswers = questions.map((q, i) => ({
        questionId: q._id,
        userAnswer: userAnswers[i]
      }));

      const endpoint = filters.questionType === 'obj' ? 'submit-objective' : 'submit-theory';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exams/${examId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ answers: formattedAnswers })
      });

      const result = await response.json();
      if (result.success) {
        setScreen('results');
      } else {
        toast.error(result.message || 'Failed to submit exam');
        setScreen('questions');
        startTimer();
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('An error occurred during submission.');
      setScreen('questions');
      startTimer();
    }
  };

  const handleExplainMore = (question) => {
    setSelectedQuestion(question);
    setAiChatOpen(true);
  };

  const handleReturnHome = () => {
    setScreen('filter');
    setQuestions([]);
    setUserAnswers([]);
    setExamId(null);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-900 antialiased overflow-x-hidden">
      <ExamHeader />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {screen === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-500 font-medium">Processing your session...</p>
          </div>
        )}

        {screen === 'filter' && (
          <ExamFilterScreen onStart={handleStartExam} filters={filters} setFilters={setFilters} />
        )}

        {screen === 'questions' && (
          <ExamQuestionScreen
            questions={questions}
            currentIndex={currentQuestionIndex}
            userAnswers={userAnswers}
            timeLeft={timeLeft}
            onNext={handleNext}
            onAnswer={handleAnswer}
            onPrevious={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          />
        )}

        {screen === 'results' && (
          <ExamResultsScreen
            questions={questions}
            userAnswers={userAnswers}
            subject={filters.subject}
            onExplainMore={handleExplainMore}
            onReturnHome={handleReturnHome}
          />
        )}
      </main>

      <ExamAIChat
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        question={selectedQuestion}
      />
    </div>
  );
}

