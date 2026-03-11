'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function FilterScreen({ onSubmit }) {
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('');
  const [examType, setExamType] = useState('');
  const [questionType, setQuestionType] = useState('');

  const [subjects, setSubjects] = useState([]);
  const [dependentOptions, setDependentOptions] = useState({
    years: [],
    examNames: [],
    questionTypes: []
  });

  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingDependent, setLoadingDependent] = useState(false);

  // Initial fetch: Subjects only
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/filters`);
        const result = await response.json();
        if (result.success) {
          setSubjects(result.data.subjects);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast.error('Failed to load subjects');
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch dependent options when subject changes
  useEffect(() => {
    if (!subject) {
      setDependentOptions({ years: [], examNames: [], questionTypes: [] });
      setYear('');
      setExamType('');
      setQuestionType('');
      return;
    }

    const fetchDependent = async () => {
      try {
        setLoadingDependent(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/filters?subject=${encodeURIComponent(subject)}`);
        const result = await response.json();
        if (result.success) {
          setDependentOptions(result.data);

          // Reset selections but auto-pick first if available
          if (result.data.years.length > 0) setYear(result.data.years[0].toString());
          if (result.data.examNames.length > 0) setExamType(result.data.examNames[0]);
          if (result.data.questionTypes.length > 0) setQuestionType(result.data.questionTypes[0]);
        }
      } catch (error) {
        console.error('Error fetching filters:', error);
        toast.error('Failed to update filter options');
      } finally {
        setLoadingDependent(false);
      }
    };
    fetchDependent();
  }, [subject]);

  const handleGetQuestions = () => {
    if (!subject || !year || !examType || !questionType) {
      toast.error('Please select all criteria');
      return;
    }
    onSubmit({ subject, year, examType, questionType });
  };

  if (loadingSubjects) {
    return (
      <div className="w-full h-full flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-gray-500 font-medium font-outfit">Loading subjects...</p>
        </div>
      </div>
    );
  }

  const isStep2Enabled = subject && !loadingDependent;

  return (
    <div className="w-full max-w-lg mx-auto p-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-100 border border-gray-100 p-8 sm:p-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 transform transition-transform hover:scale-110">
            <iconify-icon icon="solar:filter-bold-duotone" className="text-4xl text-indigo-600"></iconify-icon>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight font-outfit">Question Filter</h1>
          <p className="text-gray-500 text-sm max-w-[280px] mx-auto leading-relaxed">
            Customize your search across 20,000+ past questions.
          </p>
        </div>

        <div className="space-y-10">
          {/* Step 1: Subject */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Subject</label>
            </div>
            <div className="relative group">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full appearance-none bg-gray-50/50 border-2 border-transparent text-gray-900 text-lg rounded-2xl px-6 py-4.5 outline-none focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-50/50 transition-all cursor-pointer capitalize font-semibold shadow-sm group-hover:bg-gray-50"
              >
                <option value="" disabled>Choose a subject...</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                <iconify-icon
                  icon="solar:alt-arrow-down-linear"
                  className="text-gray-400 group-focus-within:text-indigo-600 text-2xl transition-colors"
                ></iconify-icon>
              </div>
            </div>
          </div>

          {/* Conditional Content */}
          <div className={`space-y-10 transition-all duration-500 ${!isStep2Enabled ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>

            {/* Step 2: Year */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Year</label>
              </div>
              <div className="relative group">
                <select
                  disabled={!isStep2Enabled}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full appearance-none bg-gray-50/50 border-2 border-transparent text-gray-900 text-lg rounded-2xl px-6 py-4.5 outline-none focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-50/50 transition-all cursor-pointer font-semibold shadow-sm"
                >
                  {loadingDependent ? <option>Loading years...</option> :
                    dependentOptions.years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))
                  }
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                  <iconify-icon
                    icon="solar:calendar-minimalistic-linear"
                    className="text-gray-400 group-focus-within:text-indigo-600 text-2xl transition-colors"
                  ></iconify-icon>
                </div>
              </div>
            </div>

            {/* Step 3: Exam Type */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Exam Type</label>
              </div>
              <div className="flex flex-wrap gap-3">
                {dependentOptions.examNames.map((type) => (
                  <label key={type} className="flex-1 min-w-[90px] cursor-pointer group">
                    <input
                      type="radio"
                      name="exam_type"
                      value={type}
                      checked={examType === type}
                      onChange={(e) => setExamType(e.target.value)}
                      className="peer sr-only"
                    />
                    <div className="text-center text-xs font-black py-4 px-3 rounded-2xl border-2 border-gray-100 text-gray-400 transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600 peer-checked:text-white peer-checked:shadow-xl peer-checked:shadow-indigo-100 hover:border-gray-200 group-active:scale-95">
                      {type}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 4: Q Type */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">4</span>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Format</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {dependentOptions.questionTypes.map((type) => (
                  <label key={type} className="cursor-pointer group">
                    <input
                      type="radio"
                      name="q_type"
                      value={type}
                      checked={questionType === type}
                      onChange={(e) => setQuestionType(e.target.value)}
                      className="peer sr-only"
                    />
                    <div className="text-center text-sm font-black py-5 rounded-[1.5rem] border-2 border-gray-100 text-gray-400 transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600 peer-checked:text-white peer-checked:shadow-xl peer-checked:shadow-indigo-100 hover:border-gray-200 group-active:scale-95 capitalize">
                      {type === 'obj' ? 'Objective' : 'Theory'}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGetQuestions}
            disabled={!subject || loadingDependent}
            className="w-full mt-6 bg-gray-900 hover:bg-black text-white text-lg font-bold py-5.5 rounded-[2rem] transition-all shadow-2xl shadow-gray-200 active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <iconify-icon icon="solar:magnifer-linear" className="text-2xl group-hover:rotate-12 transition-transform"></iconify-icon>
            Fetch Questions
          </button>
        </div>
      </div>
    </div>
  );
}
