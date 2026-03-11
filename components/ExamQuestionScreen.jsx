import MarkdownRenderer from './MarkdownRenderer';

export default function ExamQuestionScreen({
  questions,
  currentIndex,
  userAnswers,
  timeLeft,
  onNext,
  onAnswer,
  onPrevious
}) {
  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;

  if (!question) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTheory = question.question_type === 'theory';

  return (
    <section className="screen-transition pb-20">
      <div className="flex items-center justify-between mb-10 sticky top-0 bg-slate-50/80 backdrop-blur-md py-4 z-10 border-b border-slate-100 px-2 rounded-b-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-sm font-black text-indigo-600">
            {currentIndex + 1}
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{question.subject} • {question.exam_name}</p>
            <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-500 shadow-sm shadow-indigo-200"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 font-black text-sm transition-all ${timeLeft < 60 ? 'bg-red-50 border-red-100 text-red-600 animate-pulse' : 'bg-white border-slate-100 text-slate-900 shadow-sm'
            }`}>
            <iconify-icon icon="solar:clock-circle-bold" className={timeLeft < 60 ? 'text-red-500' : 'text-indigo-600'}></iconify-icon>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="min-h-[400px] bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-50">
        {question.images && question.images.length > 0 && (
          <div className="mb-8 space-y-4">
            {question.images.map((img, idx) => (
              <div key={idx} className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 group">
                <img
                  src={img}
                  alt={`Question visual ${idx + 1}`}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}
        <div className="prose prose-slate max-w-none mb-10">
          <MarkdownRenderer
            content={question.question_text}
            className="text-xl font-semibold text-slate-800 leading-relaxed font-outfit"
          />
        </div>

        {isTheory ? (
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Your Answer</label>
            <textarea
              value={userAnswers[currentIndex] || ''}
              onChange={(e) => onAnswer(currentIndex, e.target.value)}
              placeholder="Type your answer here..."
              className="w-full min-h-[200px] bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-500/10 rounded-2xl p-6 text-base font-medium transition-all outline-none resize-none"
            ></textarea>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(question.options || {}).map(([key, value]) => (
              <label
                key={key}
                onClick={() => onAnswer(currentIndex, key)}
                className={`flex items-center gap-5 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 group ${userAnswers[currentIndex] === key
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-1'
                  : 'bg-slate-50 border-transparent text-slate-700 hover:border-slate-200 hover:bg-white'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border-2 transition-all ${userAnswers[currentIndex] === key ? 'bg-white/20 border-white/40 text-white' : 'bg-white border-slate-100 text-slate-400 group-hover:border-indigo-100 group-hover:text-indigo-600'
                  }`}>
                  {key.toUpperCase()}
                </div>
                <div className="flex-1">
                  <MarkdownRenderer
                    content={String(value)}
                    className="text-base font-bold"
                  />
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center gap-4">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="flex-1 bg-white border-2 border-slate-100 text-slate-600 py-5 rounded-2xl font-bold text-sm hover:border-slate-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          className={`flex-[2] py-5 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${isLastQuestion
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
            : 'bg-slate-900 text-white hover:bg-black shadow-slate-100'
            }`}
        >
          {isLastQuestion ? 'Submit Exam' : 'Next Question'}
          <iconify-icon icon={isLastQuestion ? 'solar:check-circle-bold' : 'solar:arrow-right-bold'} className="text-xl"></iconify-icon>
        </button>
      </div>
    </section>
  );
}

