import ResultItem from './ResultItem';

export default function ExamResultsScreen({ questions, userAnswers, subject, onExplainMore, onReturnHome }) {
  let score = 0;
  questions.forEach((q, i) => {
    const isTheory = q.question_type === 'theory';
    // For theory, backend marks it, but frontend might just show "Submitted"
    // For objective, we can calculate locally if needed, but usually we'll get it from backend
    // Since we transition to this screen after backend success, we can assume answers are processed.
    // For now, let's just use the answers we have if it's objective.
    if (!isTheory && userAnswers[i] === q.correct_answer) score++;
  });

  const percentage = Math.round((score / questions.length) * 100);

  return (
    <section className="screen-transition pb-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-indigo-50 border-2 border-indigo-100/50 mb-6 shadow-xl shadow-indigo-50/50 animate-bounce-slow">
          <iconify-icon
            icon="solar:medal-star-bold-duotone"
            className="text-5xl text-indigo-600"
          ></iconify-icon>
        </div>
        <h2 className="text-5xl font-black tracking-tight text-slate-900 font-outfit">{percentage}%</h2>
        <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">{subject} Practice Complete</p>

        <div className="flex items-center justify-center gap-8 mt-8">
          <div className="text-center">
            <p className="text-2xl font-black text-slate-900">{score}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Correct</p>
          </div>
          <div className="w-px h-8 bg-slate-100"></div>
          <div className="text-center">
            <p className="text-2xl font-black text-slate-900">{questions.length - score}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Wrong</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-900 px-2 flex items-center gap-2">
          Detailed Review
          <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{questions.length} Questions</span>
        </h3>
        <div className="space-y-4">
          {questions.map((question, index) => (
            <ResultItem
              key={index}
              question={question}
              userAnswer={userAnswers[index]}
              isCorrect={question.question_type === 'obj' ? (userAnswers[index] === question.correct_answer) : true}
              onExplainMore={() => onExplainMore(question)}
            />
          ))}
        </div>
      </div>

      <button
        onClick={onReturnHome}
        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-base hover:bg-black transition-all mt-10 shadow-xl shadow-slate-100 active:scale-95 flex items-center justify-center gap-3"
      >
        <iconify-icon icon="solar:home-2-bold" className="text-xl"></iconify-icon>
        Return to Home
      </button>
    </section>
  );
}

