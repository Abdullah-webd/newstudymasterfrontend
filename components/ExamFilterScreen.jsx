"use client"
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function ExamFilterScreen({ onStart, filters, setFilters }) {
  const [subjects, setSubjects] = useState([]);
  const [dependentOptions, setDependentOptions] = useState({
    years: [],
    examNames: [],
    questionTypes: []
  });
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingDependent, setLoadingDependent] = useState(false);

  // Default session parameters
  const [sessionParams, setSessionParams] = useState({
    numQuestions: 50,
    timeLimit: 60
  });

  const [examNames, setExamNames] = useState(['WAEC', 'JAMB']);

  // Exam-first: confirm available exams, then load subjects only for the chosen exam.
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/filters`)
      .then((r) => r.json())
      .then((res) => { if (res.success && res.data.examNames?.length) setExamNames(res.data.examNames) })
      .catch(() => {});
    setLoadingSubjects(false);
  }, []);

  useEffect(() => {
    setSubjects([]);
    setFilters(prev => ({ ...prev, subject: '', year: '', questionType: '' }));
    if (!filters.examType) return;
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/filters?exam_name=${encodeURIComponent(filters.examType)}`);
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
  }, [filters.examType]);

  useEffect(() => {
    if (!filters.subject || !filters.examType) {
      setDependentOptions({ years: [], examNames: [], questionTypes: [] });
      return;
    }

    const fetchDependent = async () => {
      try {
        setLoadingDependent(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/filters?exam_name=${encodeURIComponent(filters.examType)}&subject=${encodeURIComponent(filters.subject)}`);
        const result = await response.json();
        if (result.success) {
          setDependentOptions(result.data);
          setFilters(prev => ({
            ...prev,
            year: result.data.years.length > 0 ? result.data.years[0].toString() : '',
            questionType: result.data.questionTypes.length > 0 ? result.data.questionTypes[0] : '',
          }));
        }
      } catch (error) {
        console.error('Error fetching filters:', error);
        toast.error('Failed to update filter options');
      } finally {
        setLoadingDependent(false);
      }
    };
    fetchDependent();
  }, [filters.subject, filters.examType]);

  const handleStart = () => {
    if (!filters.subject || !filters.year || !filters.examType || !filters.questionType) {
      toast.error('Please select all criteria');
      return;
    }
    onStart({
      ...filters,
      size: sessionParams.numQuestions,
      timeLimit: sessionParams.timeLimit
    });
  };

  const isStep2Enabled = filters.subject && !loadingDependent;

  return (
    <section className="screen-transition pb-20">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2 font-outfit">Exam Preparation</h1>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">Customize your exam session and test your knowledge under pressure.</p>
      </div>

      <div className="space-y-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-50">
        {/* Exam first — the platform's focus */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Exam</label>
          <div className="flex flex-wrap gap-2">
            {examNames.map(type => (
              <button
                key={type}
                onClick={() => setFilters({ ...filters, examType: type })}
                className={`flex-1 py-4 px-4 rounded-xl text-sm font-bold transition-all border-2 ${filters.examType === type
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Subject and Year Row */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${!filters.examType ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Subject</label>
            <div className="relative">
              <select
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                className="w-full bg-slate-50/50 border-2 border-transparent rounded-2xl px-5 py-4 text-base font-semibold focus:outline-none focus:bg-white focus:border-indigo-500/10 transition-all appearance-none capitalize cursor-pointer"
              >
                <option value="" disabled>{loadingSubjects ? 'Loading subjects…' : 'Select Subject'}</option>
                {subjects.map(sub => <option key={sub} value={sub}>{sub.replace(/-/g, ' ')}</option>)}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <iconify-icon icon="solar:alt-arrow-down-linear" className="text-slate-400"></iconify-icon>
              </div>
            </div>
          </div>

          <div className={`space-y-3 transition-opacity ${!isStep2Enabled ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Year</label>
            <div className="relative">
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full bg-slate-50/50 border-2 border-transparent rounded-2xl px-5 py-4 text-base font-semibold focus:outline-none focus:bg-white focus:border-indigo-500/10 transition-all appearance-none cursor-pointer"
              >
                {loadingDependent ? <option>Loading...</option> :
                  dependentOptions.years.map(y => <option key={y} value={y}>{y}</option>)
                }
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <iconify-icon icon="solar:calendar-linear" className="text-slate-400"></iconify-icon>
              </div>
            </div>
          </div>
        </div>

        {/* Question Type Row */}
        <div className={`grid grid-cols-1 gap-6 transition-opacity ${!isStep2Enabled ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Question Type</label>
            <div className="flex flex-wrap gap-2">
              {dependentOptions.questionTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setFilters({ ...filters, questionType: type })}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all border-2 ${filters.questionType === type
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                      : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'
                    }`}
                >
                  {type === 'obj' ? 'Objective' : 'Theory'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Session Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
          <div className="space-y-3">
            <div className="flex justify-between items-center pr-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Questions Count</label>
              <span className="text-xs font-black text-indigo-600">{sessionParams.numQuestions} Qs</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                value={sessionParams.numQuestions}
                onChange={(e) => setSessionParams({ ...sessionParams, numQuestions: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-base font-black focus:outline-none focus:bg-white focus:border-indigo-500/10 transition-all font-outfit"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <iconify-icon icon="solar:document-text-linear" className="text-slate-400"></iconify-icon>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center pr-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Time Limit (Mins)</label>
              <span className="text-xs font-black text-indigo-600">{sessionParams.timeLimit} Min</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="300"
                value={sessionParams.timeLimit}
                onChange={(e) => setSessionParams({ ...sessionParams, timeLimit: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-base font-black focus:outline-none focus:bg-white focus:border-indigo-500/10 transition-all font-outfit"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <iconify-icon icon="solar:clock-circle-linear" className="text-slate-400"></iconify-icon>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!filters.examType || !filters.subject || loadingDependent}
          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-base hover:bg-black transition-all flex items-center justify-center gap-3 mt-4 active:scale-95 shadow-xl shadow-slate-100 disabled:opacity-50 disabled:active:scale-100 group"
        >
          Start Exam Session
          <iconify-icon icon="solar:play-bold" className="text-xl group-hover:translate-x-1 transition-transform"></iconify-icon>
        </button>
      </div>
    </section>
  );
}

