'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Exam-first filtering: WAEC/JAMB is the platform's focus, so the student picks
// the exam FIRST, then only that exam's subjects/years/formats are offered.
export default function FilterScreen({ onSubmit }) {
  const [examType, setExamType] = useState('');
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [topic, setTopic] = useState(''); // optional: topic practice ("number bases")
  const [topicOptions, setTopicOptions] = useState([]); // real topics for this subject

  const [examNames, setExamNames] = useState(['WAEC', 'JAMB']);
  const [subjects, setSubjects] = useState([]);
  const [years, setYears] = useState([]);
  const [questionTypes, setQuestionTypes] = useState([]);

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingDependent, setLoadingDependent] = useState(false);

  // Confirm which exams actually have questions.
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/filters`)
      .then((r) => r.json())
      .then((res) => { if (res.success && res.data.examNames?.length) setExamNames(res.data.examNames) })
      .catch(() => {});
  }, []);

  // Exam picked -> load that exam's subjects.
  useEffect(() => {
    setSubject(''); setYear(''); setQuestionType('');
    setSubjects([]); setYears([]); setQuestionTypes([]);
    if (!examType) return;
    setLoadingSubjects(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/filters?exam_name=${encodeURIComponent(examType)}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setSubjects(res.data.subjects || []) })
      .catch(() => toast.error('Failed to load subjects'))
      .finally(() => setLoadingSubjects(false));
  }, [examType]);

  // Subject picked -> load years + formats for exam+subject.
  useEffect(() => {
    setYear(''); setQuestionType('');
    if (!examType || !subject) { setYears([]); setQuestionTypes([]); return }
    setLoadingDependent(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/filters?exam_name=${encodeURIComponent(examType)}&subject=${encodeURIComponent(subject)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setYears(res.data.years || []);
          setQuestionTypes(res.data.questionTypes || []);
          if (res.data.years?.length) setYear(res.data.years[0].toString());
          if (res.data.questionTypes?.length) setQuestionType(res.data.questionTypes[0]);
        }
      })
      .catch(() => toast.error('Failed to update filter options'))
      .finally(() => setLoadingDependent(false));
  }, [examType, subject]);

  // The topics that genuinely exist for this subject (AI-labelled bank), so the
  // student can pick one instead of guessing wording that may match nothing.
  useEffect(() => {
    setTopicOptions([]);
    if (!subject) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    let alive = true;
    const qs = new URLSearchParams({ subject, limit: '40' });
    if (examType) qs.set('exam_name', examType);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/topics?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => { if (alive && res.success) setTopicOptions(res.data || []); })
      .catch(() => {}); // suggestions are a nicety — never block the filter
    return () => { alive = false };
  }, [examType, subject]);

  const handleGetQuestions = () => {
    if (topic.trim()) {
      // Topic practice: only exam + subject + topic needed.
      if (!examType || !subject) {
        toast.error('Pick an exam and subject first');
        return;
      }
      onSubmit({ subject, examType, topic: topic.trim(), questionType: questionType || 'obj', year: '', count: 20 });
      return;
    }
    if (!examType || !subject || !year || !questionType) {
      toast.error('Please select all criteria');
      return;
    }
    onSubmit({ subject, year, examType, questionType });
  };

  const step2Enabled = !!examType && !loadingSubjects;
  const step3Enabled = !!subject && !loadingDependent;

  return (
    <div className="w-full max-w-lg mx-auto p-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-100 border border-gray-100 p-8 sm:p-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 transform transition-transform hover:scale-110">
            <iconify-icon icon="solar:filter-bold-duotone" className="text-4xl text-indigo-600"></iconify-icon>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight font-outfit">Question Filter</h1>
          <p className="text-gray-500 text-sm max-w-[280px] mx-auto leading-relaxed">
            Pick your exam first — everything else follows.
          </p>
        </div>

        <div className="space-y-10">
          {/* Step 1: Exam */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Exam</label>
            </div>
            <div className="flex flex-wrap gap-3">
              {examNames.map((type) => (
                <label key={type} className="flex-1 min-w-[90px] cursor-pointer group">
                  <input type="radio" name="exam_type" value={type} checked={examType === type}
                    onChange={(e) => setExamType(e.target.value)} className="peer sr-only" />
                  <div className="text-center text-sm font-black py-5 px-3 rounded-2xl border-2 border-gray-100 text-gray-400 transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600 peer-checked:text-white peer-checked:shadow-xl peer-checked:shadow-indigo-100 hover:border-gray-200 group-active:scale-95">
                    {type}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Step 2: Subject */}
          <div className={`space-y-4 transition-all duration-500 ${!step2Enabled ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Subject</label>
            </div>
            <div className="relative group">
              <select value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!step2Enabled}
                className="w-full appearance-none bg-gray-50/50 border-2 border-transparent text-gray-900 text-lg rounded-2xl px-6 py-4.5 outline-none focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-50/50 transition-all cursor-pointer capitalize font-semibold shadow-sm group-hover:bg-gray-50">
                <option value="" disabled>{loadingSubjects ? 'Loading subjects…' : 'Choose a subject...'}</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>{sub.replace(/-/g, ' ')}</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                <iconify-icon icon="solar:alt-arrow-down-linear" className="text-gray-400 group-focus-within:text-indigo-600 text-2xl transition-colors"></iconify-icon>
              </div>
            </div>
          </div>

          {/* Topic practice (optional) */}
          <div className={`space-y-3 transition-all duration-500 ${!subject ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">✦</span>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Practice a topic (optional)</label>
            </div>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && topic.trim() && handleGetQuestions()}
              placeholder='e.g. "number bases", "photosynthesis", "simple harmonic motion"'
              className="w-full bg-gray-50/50 border-2 border-transparent text-gray-900 text-base rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-50/50 transition-all font-semibold shadow-sm"
            />
            {/* Real topics from this subject's bank — students shouldn't have to
                guess what exists. Filtered live as they type. */}
            {subject && !!topicOptions.length && (
              <div className="flex flex-wrap gap-2 pt-1">
                {topicOptions
                  .filter((t) => !topic.trim() || t.topic.toLowerCase().includes(topic.trim().toLowerCase()))
                  .slice(0, 10)
                  .map((t) => (
                    <button
                      key={t.topic}
                      type="button"
                      onClick={() => setTopic(t.topic)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        topic.trim().toLowerCase() === t.topic.toLowerCase()
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-700'
                      }`}
                    >
                      {t.topic} <span className="opacity-50">{t.count}</span>
                    </button>
                  ))}
              </div>
            )}
            {topic.trim() && (
              <p className="text-[11px] text-emerald-600 font-medium pl-1">
                We'll find ~20 {topic.trim()} questions across all years — no need to pick a year below.
              </p>
            )}
          </div>

          {/* Steps 3-4 */}
          <div className={`space-y-10 transition-all duration-500 ${(!step3Enabled || topic.trim()) ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
            {/* Step 3: Year */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Year</label>
              </div>
              <div className="relative group">
                <select disabled={!step3Enabled} value={year} onChange={(e) => setYear(e.target.value)}
                  className="w-full appearance-none bg-gray-50/50 border-2 border-transparent text-gray-900 text-lg rounded-2xl px-6 py-4.5 outline-none focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-50/50 transition-all cursor-pointer font-semibold shadow-sm">
                  {loadingDependent ? <option>Loading years...</option> :
                    years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                  <iconify-icon icon="solar:calendar-minimalistic-linear" className="text-gray-400 group-focus-within:text-indigo-600 text-2xl transition-colors"></iconify-icon>
                </div>
              </div>
            </div>

            {/* Step 4: Format */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">4</span>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Format</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {questionTypes.map((type) => (
                  <label key={type} className="cursor-pointer group">
                    <input type="radio" name="q_type" value={type} checked={questionType === type}
                      onChange={(e) => setQuestionType(e.target.value)} className="peer sr-only" />
                    <div className="text-center text-sm font-black py-5 rounded-[1.5rem] border-2 border-gray-100 text-gray-400 transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600 peer-checked:text-white peer-checked:shadow-xl peer-checked:shadow-indigo-100 hover:border-gray-200 group-active:scale-95 capitalize">
                      {type === 'obj' ? 'Objective' : type === 'theory' ? 'Theory' : type}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGetQuestions}
            disabled={!examType || !subject || loadingDependent}
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
