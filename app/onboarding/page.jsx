'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, ArrowRight, ArrowLeft, Loader2, Check, Search,
  Sparkles, BookOpen, Target, Trophy, AlertCircle, Phone, School,
} from 'lucide-react';
import MathText from '@/components/onboarding/MathText';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const EXAM_OPTIONS = [
  { id: 'WAEC', name: 'WAEC', desc: 'West African Senior School Certificate' },
  { id: 'JAMB', name: 'JAMB', desc: 'Unified Tertiary Matriculation (UTME)' },
];

const STEP_ORDER = ['exams', 'profile', 'career', 'subjects', 'diagnostic', 'done'];

export default function OnboardingPage() {
  const { user, token, loading, refreshUser } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState('exams');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // collected data
  const [migrating, setMigrating] = useState(false);
  const [exams, setExams] = useState([]);
  const [phone, setPhone] = useState('');
  const [school, setSchool] = useState('');
  const [career, setCareer] = useState('');
  const [research, setResearch] = useState(null); // {summary, requirements, targetScores, sources}
  const [selected, setSelected] = useState([]); // subject slugs

  // diagnostic
  const [sessionId, setSessionId] = useState(null);
  const [items, setItems] = useState([]);
  const [answers, setAnswers] = useState({}); // index -> answer key
  const [qIndex, setQIndex] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/signin');
  }, [user, loading, router]);

  // Returning V1 students: greet them differently and pre-fill the details we
  // already hold, so migration doesn't feel like starting from zero.
  useEffect(() => {
    if (!token) return;
    let alive = true;
    fetch(`${API_URL}/onboarding/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (!alive || !res?.success) return;
        const d = res.data || {};
        setMigrating(!!d.isMigrating);
        if (d.prefill?.phoneNumber) setPhone(d.prefill.phoneNumber);
        if (d.prefill?.schoolName) setSchool(d.prefill.schoolName);
        if (Array.isArray(d.exams) && d.exams.length) setExams(d.exams);
      })
      .catch(() => {});
    return () => { alive = false };
  }, [token]);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const progressPct =
    ((STEP_ORDER.indexOf(step) + 1) / STEP_ORDER.length) * 100;

  // ---- Step 1: exams ----
  const toggleExam = (id) =>
    setExams((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));

  const submitExams = async () => {
    if (exams.length === 0) return setError('Please pick at least one exam.');
    setError('');
    setBusy(true);
    try {
      await fetch(`${API_URL}/onboarding/exams`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ exams }),
      });
      setStep('profile');
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // ---- Step 2: phone + school ----
  const submitProfile = async () => {
    const p = phone.trim();
    const s = school.trim();
    if (!/^[0-9+][0-9\s-]{6,19}$/.test(p)) return setError('Please enter a valid phone number.');
    if (s.length < 2) return setError('Please enter the name of your school.');
    setError('');
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/onboarding/profile`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ phoneNumber: p, schoolName: s }),
      });
      if (!res.ok) throw new Error();
      setStep('career');
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // ---- Step 2: career -> research ----
  const submitCareer = async () => {
    if (career.trim().length < 2) return setError('Please tell us what you want to study.');
    setError('');
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/onboarding/research-career`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ career: career.trim(), exams }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Research failed');
      setResearch(data);
      // preselect available compulsory subjects
      setSelected(
        data.requirements
          .filter((r) => r.available && r.kind === 'compulsory')
          .map((r) => r.subject)
      );
      setStep('subjects');
    } catch (e) {
      setError(e.message || 'Could not research that course. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const toggleSubject = (slug) =>
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );

  // ---- Step 3: subjects -> diagnostic start ----
  const submitSubjects = async () => {
    if (selected.length === 0) return setError('Select at least one subject to study.');
    setError('');
    setBusy(true);
    try {
      await fetch(`${API_URL}/onboarding/subjects`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          exams,
          career: career.trim(),
          selectedSubjects: selected,
          requiredSubjects: research?.requirements?.filter((r) => r.kind === 'compulsory').map((r) => r.subject) || [],
          targetScores: research?.targetScores || {},
          researchContext: { summary: research?.summary, sources: research?.sources },
        }),
      });
      const res = await fetch(`${API_URL}/onboarding/diagnostic/start`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ subjects: selected, exams, count: 10 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not start the diagnostic');
      setSessionId(data.data.sessionId);
      setItems(data.data.items);
      setQIndex(0);
      setAnswers({});
      setStep('diagnostic');
    } catch (e) {
      setError(e.message || 'Could not start your baseline test.');
    } finally {
      setBusy(false);
    }
  };

  // ---- Step 4: diagnostic answering ----
  const chooseAnswer = (key) => setAnswers((prev) => ({ ...prev, [qIndex]: key }));

  const submitDiagnostic = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/onboarding/diagnostic/submit`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          sessionId,
          answers: Object.entries(answers).map(([index, answer]) => ({
            index: Number(index),
            answer,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Submit failed');
      setResult(data.data);
      setStep('done');
      await refreshUser();
    } catch (e) {
      setError(e.message || 'Could not submit your answers.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans relative overflow-hidden">
      {/* ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[55%] h-[55%] bg-blue-50 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[55%] h-[55%] bg-indigo-50 rounded-full blur-[150px]" />
      </div>

      <header className="p-6 sm:p-8 relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight">StudyMaster</span>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-2xl">
          {/* progress */}
          <div className="h-1.5 w-full bg-gray-100 rounded-full mb-8 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              {step === 'exams' && (
                <StepExams exams={exams} toggleExam={toggleExam} onNext={submitExams} busy={busy} migrating={migrating} />
              )}
              {step === 'profile' && (
                <StepProfile
                  phone={phone}
                  setPhone={setPhone}
                  school={school}
                  setSchool={setSchool}
                  onNext={submitProfile}
                  onBack={() => setStep('exams')}
                  busy={busy}
                />
              )}
              {step === 'career' && (
                <StepCareer
                  career={career}
                  setCareer={setCareer}
                  onNext={submitCareer}
                  onBack={() => setStep('profile')}
                  busy={busy}
                />
              )}
              {step === 'subjects' && research && (
                <StepSubjects
                  research={research}
                  selected={selected}
                  toggleSubject={toggleSubject}
                  onNext={submitSubjects}
                  onBack={() => setStep('career')}
                  busy={busy}
                />
              )}
              {step === 'diagnostic' && (
                <StepDiagnostic
                  items={items}
                  qIndex={qIndex}
                  setQIndex={setQIndex}
                  answers={answers}
                  chooseAnswer={chooseAnswer}
                  onSubmit={submitDiagnostic}
                  busy={busy}
                />
              )}
              {step === 'done' && (
                <StepDone result={result} onContinue={() => router.push('/dashboard')} />
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ---------------- Step components ---------------- */

function Heading({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-2">{title}</h1>
      <p className="text-gray-500">{subtitle}</p>
    </div>
  );
}

function PrimaryButton({ children, onClick, busy, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={busy || disabled}
      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
    >
      {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
  );
}

function StepExams({ exams, toggleExam, onNext, busy, migrating }) {
  return (
    <div>
      {migrating && (
        <div className="mb-6 rounded-2xl bg-blue-50 border border-blue-100 p-4">
          <p className="text-sm font-semibold text-blue-900 mb-1">Welcome back 👋</p>
          <p className="text-xs text-blue-800/80 leading-relaxed">
            StudyMaster has been rebuilt around your goal. Set up your new profile once and
            we'll build your roadmap. Your notes and study history are still saved.
          </p>
        </div>
      )}
      <Heading title="Which exams are you preparing for?" subtitle="Pick one or both. We'll tailor everything to them." />
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {EXAM_OPTIONS.map((ex) => {
          const active = exams.includes(ex.id);
          return (
            <button
              key={ex.id}
              onClick={() => toggleExam(ex.id)}
              className={`p-6 rounded-3xl border-2 text-left transition-all ${
                active ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${active ? 'bg-blue-500' : 'bg-white shadow-sm'}`}>
                  <BookOpen className={`w-5 h-5 ${active ? 'text-white' : 'text-blue-500'}`} />
                </div>
                {active && <Check className="w-5 h-5 text-blue-600" />}
              </div>
              <div className="font-bold text-lg">{ex.name}</div>
              <div className="text-sm text-gray-500">{ex.desc}</div>
            </button>
          );
        })}
      </div>
      <PrimaryButton onClick={onNext} busy={busy}>
        Continue <ArrowRight className="w-4 h-4" />
      </PrimaryButton>
    </div>
  );
}

function StepProfile({ phone, setPhone, school, setSchool, onNext, onBack, busy }) {
  return (
    <div>
      <Heading
        title="A little about you"
        subtitle="So your success advisor can reach you and we can track your school's progress."
      />
      <div className="space-y-4 mb-3">
        <div className="relative">
          <Phone className="w-5 h-5 absolute top-1/2 -translate-y-1/2 left-4 text-blue-400" />
          <input
            autoFocus
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number — e.g. 0803 123 4567"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 pl-12 pr-4 text-lg font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
          />
        </div>
        <div className="relative">
          <School className="w-5 h-5 absolute top-1/2 -translate-y-1/2 left-4 text-blue-400" />
          <input
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onNext()}
            placeholder="School you attend — e.g. Command Secondary School"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 pl-12 pr-4 text-lg font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-8">We'll never share your details. They're only used to support you.</p>
      <div className="flex gap-3">
        <button onClick={onBack} className="px-5 py-4 rounded-2xl font-semibold text-gray-500 hover:text-blue-600 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1">
          <PrimaryButton onClick={onNext} busy={busy}>
            Continue <ArrowRight className="w-4 h-4" />
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function StepCareer({ career, setCareer, onNext, onBack, busy }) {
  return (
    <div>
      <Heading
        title="What do you want to become?"
        subtitle="Type the course or career you're aiming for — we'll find exactly what you need."
      />
      <div className="relative mb-3">
        <Sparkles className="w-5 h-5 absolute top-1/2 -translate-y-1/2 left-4 text-blue-400" />
        <input
          autoFocus
          value={career}
          onChange={(e) => setCareer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onNext()}
          placeholder="e.g. Software Engineering, Medicine, Law, Accounting"
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 pl-12 pr-4 text-lg font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
        />
      </div>
      <p className="text-xs text-gray-400 mb-8 flex items-center gap-1.5">
        <Search className="w-3.5 h-3.5" /> We'll search live for the real Nigerian subject requirements for this course.
      </p>
      <div className="flex gap-3">
        <button onClick={onBack} className="px-5 py-4 rounded-2xl font-semibold text-gray-500 hover:text-blue-600 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1">
          <PrimaryButton onClick={onNext} busy={busy}>
            {busy ? 'Researching…' : (<>Find my subjects <ArrowRight className="w-4 h-4" /></>)}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function StepSubjects({ research, selected, toggleSubject, onNext, onBack, busy }) {
  const reqs = research.requirements || [];
  return (
    <div>
      <Heading title="Here's what your course needs" subtitle="Confirm the subjects you'll study. We pre-selected the compulsory ones." />

      {research.summary && (
        <div className="mb-6 p-4 bg-blue-50/60 border border-blue-100 rounded-2xl text-sm text-gray-700 flex gap-3">
          <Target className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <MathText>{research.summary}</MathText>
            {research.targetScores && Object.keys(research.targetScores).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(research.targetScores).map(([k, v]) => (
                  <span key={k} className="text-xs font-semibold bg-white border border-blue-100 rounded-full px-3 py-1 text-blue-700">
                    {k}: {String(v)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 mb-8 max-h-[42vh] overflow-y-auto pr-1">
        {reqs.map((r) => {
          const active = selected.includes(r.subject);
          return (
            <button
              key={r.subject}
              disabled={!r.available}
              onClick={() => toggleSubject(r.subject)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                !r.available
                  ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                  : active
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.displayName || r.subject}</span>
                {active && r.available && <Check className="w-4 h-4 text-blue-600" />}
              </div>
              <div className="text-xs text-gray-400 mt-1 capitalize">
                {r.kind}{!r.available && ' · no questions yet'}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-5 py-4 rounded-2xl font-semibold text-gray-500 hover:text-blue-600 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1">
          <PrimaryButton onClick={onNext} busy={busy} disabled={selected.length === 0}>
            Start my baseline test <ArrowRight className="w-4 h-4" />
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function StepDiagnostic({ items, qIndex, setQIndex, answers, chooseAnswer, onSubmit, busy }) {
  const q = items[qIndex];
  const total = items.length;
  const answeredCount = Object.keys(answers).length;
  const isLast = qIndex === total - 1;
  const options = q?.options || {};

  return (
    <div>
      <Heading
        title="Quick baseline check"
        subtitle="Just so we know where you're starting from — this isn't a pass/fail. Answer as best you can."
      />

      <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
        <span>Question {qIndex + 1} of {total}</span>
        <span>{answeredCount}/{total} answered</span>
      </div>

      <div className="p-5 sm:p-6 rounded-3xl border border-gray-100 bg-white shadow-sm mb-6">
        <div className="text-xs font-semibold text-blue-600 uppercase mb-3">
          {q?.subject?.replace(/-/g, ' ')} · {q?.exam_name}
        </div>
        <div className="text-lg font-medium mb-5 leading-relaxed">
          <MathText>{q?.question_text}</MathText>
        </div>
        <div className="space-y-3">
          {Object.entries(options).map(([key, val]) => {
            const active = answers[qIndex] === key;
            return (
              <button
                key={key}
                onClick={() => chooseAnswer(key)}
                className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                  active ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-sm ${active ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                  {key}
                </span>
                <span className="pt-0.5"><MathText>{String(val)}</MathText></span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setQIndex(Math.max(0, qIndex - 1))}
          disabled={qIndex === 0}
          className="px-5 py-4 rounded-2xl font-semibold text-gray-500 hover:text-blue-600 disabled:opacity-40 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Prev
        </button>
        <div className="flex-1">
          {isLast ? (
            <PrimaryButton onClick={onSubmit} busy={busy} disabled={answeredCount === 0}>
              Finish & see my plan <Check className="w-4 h-4" />
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={() => setQIndex(Math.min(total - 1, qIndex + 1))}>
              Next question <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDone({ result, onContinue }) {
  const score = result?.score ?? 0;
  const total = result?.total ?? 0;
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-xl"
      >
        <Trophy className="w-9 h-9 text-white" />
      </motion.div>
      <h1 className="text-3xl font-bold mb-2">You're all set! 🎉</h1>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        We've captured your starting point{total ? ` (${score}/${total} on the baseline)` : ''}. This is just
        where you begin — from here, StudyMaster builds a plan to get you to your goal.
      </p>

      {result?.subjectBreakdown && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 text-left">
          {Object.entries(result.subjectBreakdown).map(([subj, b]) => (
            <div key={subj} className="p-3 rounded-2xl border border-gray-100 bg-gray-50">
              <div className="text-xs text-gray-500 capitalize">{subj.replace(/-/g, ' ')}</div>
              <div className="font-bold">{b.correct}/{b.total}</div>
            </div>
          ))}
        </div>
      )}

      <PrimaryButton onClick={onContinue}>
        Go to my dashboard <ArrowRight className="w-4 h-4" />
      </PrimaryButton>
    </div>
  );
}
