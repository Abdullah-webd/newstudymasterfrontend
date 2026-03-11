import { useState, useEffect, useRef } from 'react';
import QuestionCard from './QuestionCard';
import { toast } from 'sonner';

export default function QuestionsListScreen({ filters, onBack, onAskAI }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [activityId, setActivityId] = useState(null);
  const [showAnswers, setShowAnswers] = useState({});
  const [generatingAnswer, setGeneratingAnswer] = useState({});

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          subject: filters.subject,
          year: filters.year,
          exam_name: filters.examType,
          question_type: filters.questionType
        });

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions?${params}`);
        const result = await response.json();

        if (result.success) {
          setQuestions(result.data);
          // Start activity tracking
          startTrackedActivity();
        } else {
          toast.error(result.message || 'Failed to load questions');
        }
      } catch (error) {
        toast.error('Error fetching questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [filters]);

  const startTrackedActivity = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: 'past_question_study',
          metadata: {
            subject: filters.subject,
            exam: filters.examType,
            year: filters.year
          }
        })
      });
      const result = await response.json();
      if (result.success) {
        setActivityId(result.data._id);
        setStartTime(Date.now());
      }
    } catch (e) { console.error('Activity track error:', e); }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleFinish = async () => {
    const score = questions.reduce((acc, q, idx) => {
      if (answers[idx] === q.correct_answer) return acc + 1;
      return acc;
    }, 0);

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    setIsFinished(true);

    // Save activity
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: 'past_question_study',
          metadata: {
            score,
            total: questions.length,
            timeSpent
          }
        })
      });
    } catch (e) { console.error('Activity stop error:', e); }
  };

  const handleShowAnswer = async (index) => {
    const question = questions[index];
    if (question.question_type === 'theory') {
      try {
        setGeneratingAnswer(prev => ({ ...prev, [index]: true }));
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/generate-answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ questionData: question })
        });
        const result = await response.json();
        if (result.success) {
          setShowAnswers(prev => ({ ...prev, [index]: result.answer }));
        } else {
          toast.error('Failed to generate AI answer');
        }
      } catch (error) {
        toast.error('Error generating AI answer');
      } finally {
        setGeneratingAnswer(prev => ({ ...prev, [index]: false }));
      }
    } else {
      setShowAnswers(prev => ({ ...prev, [index]: true }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-slate-500 font-medium">Crunching past questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">No questions found for this criteria.</p>
        <button onClick={onBack} className="text-indigo-600 font-bold hover:underline">Go Back</button>
      </div>
    );
  }

  if (isFinished) {
    const total = questions.length;
    const score = questions.reduce((acc, q, idx) => (answers[idx] === q.correct_answer ? acc + 1 : acc), 0);
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <iconify-icon icon="solar:check-read-linear" width="40" height="40" className="text-emerald-600"></iconify-icon>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Session Complete!</h2>
        <p className="text-slate-600">
          You spent <strong>{minutes}m {seconds}s</strong> on this session and did well!
        </p>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-400 uppercase tracking-wider font-bold mb-1">Your Score</p>
          <p className="text-4xl font-black text-indigo-600">{score} / {total}</p>
        </div>
        <button
          onClick={onBack}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all"
        >
          Practice More
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="w-full h-full p-4 sm:p-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
        >
          <iconify-icon
            icon="solar:arrow-left-linear"
            className="text-lg group-hover:-translate-x-1 transition-transform"
          ></iconify-icon>
          Filters
        </button>
        <div className="text-xs font-medium px-3 py-1 bg-gray-200/50 text-gray-600 rounded-full">
          {filters.subject} • {filters.year} • {filters.examType} ({currentIndex + 1}/{questions.length})
        </div>
      </div>

      <div className="space-y-6 max-w-2xl mx-auto">
        <QuestionCard
          key={currentQuestion._id}
          questionNumber={currentIndex + 1}
          questionText={currentQuestion.question_text}
          options={currentQuestion.options ? Object.entries(currentQuestion.options).map(([k, v]) => ({ value: k, text: v })) : []}
          onAskAI={() => onAskAI(currentQuestion)}
          selectedOption={answers[currentIndex]}
          onOptionChange={(val) => setAnswers(prev => ({ ...prev, [currentIndex]: val }))}
          showAnswer={showAnswers[currentIndex]}
          onShowAnswer={() => handleShowAnswer(currentIndex)}
          isGeneratingAnswer={generatingAnswer[currentIndex]}
          correctAnswer={currentQuestion.correct_answer}
          questionType={currentQuestion.question_type}
          images={currentQuestion.images}
        />

        <div className="flex justify-between items-center gap-4 pt-4">
          <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!answers[currentIndex]}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
            >
              Next Question
              <iconify-icon icon="solar:arrow-right-linear" width="18" height="18"></iconify-icon>
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-100"
            >
              Finish Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
