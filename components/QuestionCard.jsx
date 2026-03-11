import MarkdownRenderer from './MarkdownRenderer';
import QuestionOption from './QuestionOption';
import { InlineMath, BlockMath } from 'react-katex';


export default function QuestionCard({
  questionNumber,
  questionText,
  options,
  onAskAI,
  selectedOption,
  onOptionChange,
  showAnswer,
  onShowAnswer,
  isGeneratingAnswer,
  correctAnswer,
  questionType,
  images = []
}) {
  const renderText = (text) => {
    if (!text) return null;

    // Simple regex to detect LaTeX-like content
    const hasMath = text.includes('\\(') || text.includes('\\[');

    if (hasMath) {
      const parts = text.split(/(\\\(.*?\\\)|\\\[.*?\\\])/g);
      return parts.map((part, i) => {
        if (part && part.startsWith('\\(')) {
          return <InlineMath key={i} math={part.slice(2, -2)} />;
        }
        if (part && part.startsWith('\\[')) {
          return <BlockMath key={i} math={part.slice(2, -2)} />;
        }
        return <span key={i}>{part}</span>;
      });
    }
    return text;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
      {images && images.length > 0 && (
        <div className="mb-6 space-y-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group">
              <img
                src={img}
                alt={`Visual for question ${questionNumber}`}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-between items-start mb-6">
        <div className="text-xl sm:text-2xl font-bold leading-relaxed text-gray-900 flex-1 font-outfit">
          <span className="text-indigo-600 mr-3">{questionNumber}.</span>
          {renderText(questionText)}
        </div>
      </div>

      {questionType === 'obj' ? (
        <div className="space-y-3 mb-8">
          {options.map((option, index) => (
            <QuestionOption
              key={index}
              id={`q${questionNumber}_option${index}`}
              name={`q${questionNumber}`}
              value={option.value}
              selected={selectedOption === option.value}
              onChange={() => onOptionChange(option.value)}
              text={renderText(option.text)}
              isCorrect={showAnswer === true && option.value === correctAnswer}
              isWrong={showAnswer === true && selectedOption === option.value && selectedOption !== correctAnswer}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">My Practice Answer</label>
          <textarea
            className="w-full h-40 p-6 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all resize-none text-lg font-outfit shadow-inner"
            placeholder="Draft your answer here to compare with AI..."
            value={selectedOption || ''}
            onChange={(e) => onOptionChange(e.target.value)}
          ></textarea>
        </div>
      )}

      {showAnswer && typeof showAnswer === 'string' && (
        <div className="mb-8 p-6 sm:p-8 bg-indigo-50/30 border border-indigo-100 rounded-[2rem] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
              <iconify-icon icon="solar:star-bold-duotone" className="text-xl"></iconify-icon>
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] leading-none mb-1">Expert Solution</p>
              <h4 className="text-sm font-bold text-gray-900">AI Suggested Answer</h4>
            </div>
          </div>
          <div className="text-gray-800 leading-relaxed font-outfit">
            <MarkdownRenderer content={showAnswer} />
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-4 justify-between items-center">
        <button
          onClick={onShowAnswer}
          disabled={isGeneratingAnswer}
          className={`flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl transition-all ${showAnswer
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 active:scale-95'
            }`}
        >
          {isGeneratingAnswer ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <iconify-icon icon="solar:eye-linear" className="text-lg"></iconify-icon>
          )}
          {isGeneratingAnswer ? 'Generating...' : 'Show Answer'}
        </button>

        <button
          onClick={onAskAI}
          className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 hover:bg-indigo-100 px-6 py-3 rounded-xl"
        >
          <iconify-icon icon="solar:magic-stick-3-linear" className="text-lg"></iconify-icon>
          AI Explain
        </button>
      </div>
    </div>
  );
}
