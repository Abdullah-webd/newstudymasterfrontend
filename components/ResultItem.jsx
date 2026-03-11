import MarkdownRenderer from './MarkdownRenderer';

export default function ResultItem({ question, userAnswer, isCorrect, onExplainMore }) {
  const isTheory = question.question_type === 'theory';

  return (
    <div
      className={`p-6 border-2 rounded-[2rem] transition-all ${isCorrect
        ? 'border-emerald-100 bg-emerald-50/20'
        : 'border-rose-100 bg-rose-50/20'
        }`}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 overflow-x-auto">
          {question.images && question.images.length > 0 && (
            <div className="mb-4 space-y-3">
              {question.images.map((img, idx) => (
                <div key={idx} className="relative w-full aspect-video rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm">
                  <img
                    src={img}
                    alt={`Result visual ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
          )}
          <MarkdownRenderer
            content={question.question_text}
            className="text-sm font-bold text-slate-800 leading-relaxed font-outfit"
          />
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform hover:rotate-12 ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}>
          <iconify-icon
            icon={isCorrect ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
            width="24"
          ></iconify-icon>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Your Answer</p>
          <div className="p-4 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-600 shadow-sm overflow-x-auto">
            {!isTheory ? (
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center text-[10px] uppercase">{userAnswer}</span>
                <MarkdownRenderer content={String(question.options[userAnswer] || 'No answer')} />
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{userAnswer || 'No response'}</p>
            )}
          </div>
        </div>

        {!isCorrect && !isTheory && (
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest pl-1">Correct Answer</p>
            <div className="p-4 bg-white border border-emerald-100 rounded-xl text-sm font-bold text-emerald-600 shadow-sm overflow-x-auto flex items-center gap-3">
              <span className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] uppercase">{question.correct_answer}</span>
              <MarkdownRenderer content={String(question.options[question.correct_answer])} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100/50">
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
          ID: {question._id?.toString().slice(-6)}
        </div>
        <button
          onClick={onExplainMore}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-indigo-100"
        >
          Explain with AI
          <iconify-icon icon="solar:magic-stick-3-bold" className="text-sm"></iconify-icon>
        </button>
      </div>
    </div>
  );
}

