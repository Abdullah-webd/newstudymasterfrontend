'use client';

export default function SelectToggle({ options, selected, onChange, label }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onChange(index)}
            className={`p-4 rounded-xl text-left transition-all ${
              selected === index
                ? 'border-2 border-slate-900 bg-white'
                : 'border border-slate-100 bg-slate-50'
            }`}
          >
            <p className="text-sm font-medium">{option.title}</p>
            <p className="text-xs text-slate-500">{option.subtitle}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
