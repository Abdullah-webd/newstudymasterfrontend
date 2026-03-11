'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AIExplainModal from './AIExplainModal'
import { toast } from 'sonner'

export default function QuizSection({ quizData, noteContent }) {
    const [currentStep, setCurrentStep] = useState('welcome') // welcome, quiz, results
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswers, setSelectedAnswers] = useState({})
    const [results, setResults] = useState(null)
    const [isExplaining, setIsExplaining] = useState(false)
    const [explainData, setExplainData] = useState(null)
    const [startTime, setStartTime] = useState(null)

    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        return null
    }

    const totalQuestions = quizData.questions.length
    const currentQuestion = quizData.questions[currentIndex]

    const startTrackedActivity = async () => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    type: 'quiz_study',
                    metadata: {
                        noteTitle: quizData.noteTitle
                    }
                })
            });
            setStartTime(Date.now());
        } catch (e) { console.error('Activity track error:', e); }
    };

    const handleAnswerSelect = (option) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [currentIndex]: option
        }))
    }

    const handleNext = () => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(currentIndex + 1)
        }
    }

    const handleSubmit = async () => {
        let score = 0
        const detailedResults = quizData.questions.map((q, idx) => {
            const isCorrect = selectedAnswers[idx] === q.correctAnswer
            if (isCorrect) score++
            return {
                ...q,
                userAnswer: selectedAnswers[idx],
                isCorrect
            }
        })

        const timeSpent = Math.floor((Date.now() - startTime) / 1000);

        setResults({
            score,
            total: totalQuestions,
            details: detailedResults,
            timeSpent
        })
        setCurrentStep('results')

        // Save score to backend and mark quiz as completed
        try {
            if (quizData._id) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quizzes/${quizData._id}/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        score,
                        totalQuestions,
                        timeSpent
                    })
                });
            } else {
                // Fallback: stop activity without quiz ID
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity/stop`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        type: 'quiz_study',
                        metadata: { score, total: totalQuestions, duration: timeSpent }
                    })
                });
            }
        } catch (e) { console.error('Quiz submit error:', e); }
    }

    const startAIExplain = (question, option) => {
        setExplainData({ question, option, noteContent })
        setIsExplaining(true)
    }

    const handlePrintQuiz = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            toast.error('Pop-up blocked. Please allow pop-ups.')
            return
        }

        const questionsHtml = quizData.questions.map((q, idx) => `
            <div style="margin-bottom: 30px; page-break-inside: avoid;">
                <p style="font-size: 16px; font-weight: bold; margin-bottom: 15px;">
                    ${idx + 1}. ${q.question}
                </p>
                <div style="display: grid; gap: 10px; margin-left: 20px;">
                    ${q.options.map((opt, optIdx) => `
                        <div style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                            <span style="font-weight: bold; min-width: 25px;">${String.fromCharCode(65 + optIdx)}</span>
                            <span>${opt}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Quiz: ${quizData.noteTitle || 'Study Notes'}</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
                        h1 { color: #0f172a; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
                        @media print { body { padding: 20px; } @page { margin: 1in; } }
                    </style>
                </head>
                <body>
                    <h1>Quiz: ${quizData.noteTitle || 'Study Notes'}</h1>
                    ${questionsHtml}
                    <script>
                        window.onload = () => {
                            window.print();
                            window.onafterprint = () => window.close();
                        }
                    </script>
                </body>
            </html>
        `)
        printWindow.document.close()
    }

    return (
        <div className="mt-12 border-t border-slate-100 pt-12 pb-20">
            <div className="max-w-2xl mx-auto px-4">
                <AnimatePresence mode="wait">
                    {currentStep === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-indigo-50 rounded-2xl p-8 text-center"
                        >
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <iconify-icon icon="solar:quiz-linear" width="32" height="32" className="text-indigo-600"></iconify-icon>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Knowledge Check</h3>
                            <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                                Test your understanding of the notes above with this quick {totalQuestions}-question quiz.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <button
                                    onClick={() => {
                                        startTrackedActivity();
                                        setCurrentStep('quiz');
                                    }}
                                    className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                >
                                    Start Quiz
                                </button>
                                <button
                                    onClick={handlePrintQuiz}
                                    className="w-full sm:w-auto bg-white text-slate-700 px-8 py-3 rounded-xl font-semibold border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <iconify-icon icon="solar:printer-linear" width="20" height="20"></iconify-icon>
                                    Print Quiz
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'quiz' && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-500">
                                        Question {currentIndex + 1} of {totalQuestions}
                                    </span>
                                    <div className="h-1.5 w-48 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 transition-all duration-300"
                                            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {currentQuestion.images && currentQuestion.images.length > 0 && (
                                    <div className="space-y-4">
                                        {currentQuestion.images.map((img, idx) => (
                                            <div key={idx} className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group">
                                                <img
                                                    src={img}
                                                    alt={`Quiz visual ${idx + 1}`}
                                                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <h4 className="text-lg font-semibold text-slate-800 leading-relaxed">
                                    {currentQuestion.question}
                                </h4>

                                <div className="grid gap-3">
                                    {currentQuestion.options.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswerSelect(option)}
                                            className={`
                                                group flex items-center p-4 rounded-xl border-2 transition-all text-left
                                                ${selectedAnswers[currentIndex] === option
                                                    ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-50'
                                                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}
                                            `}
                                        >
                                            <div className={`
                                                w-8 h-8 rounded-lg flex items-center justify-center mr-4 font-bold text-sm
                                                ${selectedAnswers[currentIndex] === option
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500'}
                                            `}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className={`text-sm font-medium ${selectedAnswers[currentIndex] === option ? 'text-indigo-900' : 'text-slate-600'}`}>
                                                {option}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                {currentIndex < totalQuestions - 1 ? (
                                    <button
                                        onClick={handleNext}
                                        disabled={!selectedAnswers[currentIndex]}
                                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                                    >
                                        Next Question
                                        <iconify-icon icon="solar:arrow-right-linear" width="18" height="18"></iconify-icon>
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!selectedAnswers[currentIndex]}
                                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                    >
                                        Submit Results
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'results' && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8"
                        >
                            <div className="text-center p-8 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                                <div className="text-5xl font-black text-indigo-600">
                                    {Math.round((results.score / results.total) * 100)}%
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-900">Great Job!</h3>
                                    <p className="text-slate-500">
                                        You spent <strong>{Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s</strong> on this session and did well!
                                    </p>
                                    <p className="text-xs text-slate-400">You scored {results.score} out of {results.total} questions correctly.</p>
                                </div>
                                <div className="flex justify-center gap-3 pt-4">
                                    <button
                                        onClick={() => {
                                            setCurrentIndex(0)
                                            setSelectedAnswers({})
                                            setCurrentStep('quiz')
                                        }}
                                        className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                                    >
                                        <iconify-icon icon="solar:restart-linear" width="14" height="14"></iconify-icon>
                                        Retake Quiz
                                    </button>
                                    <button
                                        onClick={handlePrintQuiz}
                                        className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                                    >
                                        <iconify-icon icon="solar:printer-linear" width="14" height="14"></iconify-icon>
                                        Print Results
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="font-bold text-slate-900 text-lg">Review Results</h4>
                                <div className="space-y-4">
                                    {results.details.map((q, idx) => (
                                        <div key={idx} className={`p-6 rounded-2xl border ${q.isCorrect ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                                            <div className="flex gap-4">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${q.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                    <iconify-icon icon={q.isCorrect ? "solar:check-circle-bold" : "solar:close-circle-bold"} width="20" height="20"></iconify-icon>
                                                </div>
                                                <div className="space-y-3 flex-1">
                                                    {q.images && q.images.length > 0 && (
                                                        <div className="space-y-3 mb-4">
                                                            {q.images.map((img, idx) => (
                                                                <div key={idx} className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100/50 border border-slate-200">
                                                                    <img
                                                                        src={img}
                                                                        alt={`Result visual ${idx + 1}`}
                                                                        className="w-full h-full object-contain"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <p className="text-sm font-semibold text-slate-800 leading-snug">{q.question}</p>
                                                    <div className="text-xs space-y-2">
                                                        <p><span className="text-slate-400 font-medium">Your Answer:</span> <span className={q.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>{q.userAnswer || 'Skipped'}</span></p>
                                                        {!q.isCorrect && (
                                                            <p><span className="text-slate-400 font-medium">Correct Answer:</span> <span className="text-emerald-700 font-bold">{q.correctAnswer}</span></p>
                                                        )}
                                                    </div>

                                                    <div className="mt-4 p-4 bg-white/80 rounded-xl border border-slate-100/50">
                                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Explanation</p>
                                                        <p className="text-xs text-slate-600 leading-relaxed italic">{q.explanation}</p>
                                                        {!q.isCorrect && (
                                                            <button
                                                                onClick={() => startAIExplain(q, q.userAnswer)}
                                                                className="mt-3 flex items-center gap-1.5 text-indigo-600 font-bold text-[10px] hover:text-indigo-700 transition-colors uppercase tracking-tight"
                                                            >
                                                                <iconify-icon icon="solar:magic-stick-3-linear" width="12" height="12"></iconify-icon>
                                                                Need AI Explanation?
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AIExplainModal
                isOpen={isExplaining}
                onClose={() => setIsExplaining(false)}
                data={explainData}
            />
        </div>
    )
}
