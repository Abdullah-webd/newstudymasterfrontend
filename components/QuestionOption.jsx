'use client';

export default function QuestionOption({ id, name, value, selected, onChange, text, isCorrect, isWrong }) {
  return (
    <label className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer
      ${isCorrect ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-100' :
        isWrong ? 'bg-red-50 border-red-500 ring-2 ring-red-100' :
          'border-gray-100 hover:bg-gray-50'}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onChange}
        className="peer sr-only"
      />
      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all 
        ${isCorrect ? 'border-emerald-600 bg-emerald-600' :
          isWrong ? 'border-red-600 bg-red-600' :
            'border-gray-300 group-hover:border-gray-400 peer-checked:!border-gray-900 peer-checked:border-[5px]'}`}
      >
        {(isCorrect || isWrong) && <iconify-icon icon={isCorrect ? "solar:check-read-linear" : "solar:close-circle-linear"} className="text-white text-xs"></iconify-icon>}
      </div>
      <span className={`text-sm transition-colors 
        ${isCorrect ? 'text-emerald-900 font-bold' :
          isWrong ? 'text-red-900 font-bold' :
            'text-gray-700 group-hover:text-gray-900'}`}
      >
        {text}
      </span>
    </label>
  );
}
