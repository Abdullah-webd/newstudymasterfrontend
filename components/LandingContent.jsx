
'use client'

import { useState } from 'react'

export default function LandingContent({ className = '' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <main
      className={`landing-page text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden ${className}`}
    >
      {/* Ambient Background Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-gradient-to-b from-blue-50/80 to-transparent blur-[100px] -z-10 pointer-events-none" />
      <div className="fixed top-1/4 -right-1/4 w-[50vw] h-[50vw] bg-teal-50/40 blur-[120px] rounded-full -z-10 pointer-events-none" />

      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 glass-card border-b-0 border-slate-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/landing" className="font-heading font-semibold text-xl tracking-tighter text-slate-900 flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="StudyMaster"
                  className="w-7 h-7 rounded-md object-contain"
                />
                StudyMaster
              </a>
            </div>
            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8">
              <a href="#problem" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">The Problem</a>
              <a href="#research" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Research</a>
              <a href="#solution" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Solution</a>
              <a href="#results" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Results</a>
              <a href="/landing/community" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Community</a>
              <a href="#pricing" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Pricing</a>
            </nav>
            {/* CTA */}
            <div className="hidden md:flex items-center space-x-4">
              <a href="/auth/signin" className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors">Log in</a>
              <a href="/auth/signup" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-full hover:bg-blue-600 transition-all shadow-sm shadow-slate-900/10">Start Free</a>
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                className="text-slate-500 hover:text-slate-900"
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((prev) => !prev)}
              >
                <iconify-icon icon={mobileMenuOpen ? "solar:close-circle-linear" : "solar:hamburger-menu-linear"} width="24" height="24"></iconify-icon>
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen ? (
          <div className="md:hidden border-t border-slate-100/60 bg-white/95 backdrop-blur">
            <nav className="px-4 py-4 space-y-3 text-sm">
              <a href="#problem" className="block text-slate-600 hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>The Problem</a>
              <a href="#research" className="block text-slate-600 hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>Research</a>
              <a href="#solution" className="block text-slate-600 hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>Solution</a>
              <a href="#results" className="block text-slate-600 hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>Results</a>
              <a href="/landing/community" className="block text-slate-600 hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>Community</a>
              <a href="#pricing" className="block text-slate-600 hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <a href="/auth/signin" className="text-slate-700 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Log in</a>
                <a href="/auth/signup" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-full hover:bg-blue-600 transition-all" onClick={() => setMobileMenuOpen(false)}>Start Free</a>
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      {/* Hero Section (Story Opener) */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center animate-fade-up">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/50 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-xs font-medium text-blue-800 tracking-wide uppercase">Built for WAEC • NECO • JAMB success</span>
          </div>

          {/* Headline */}
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tighter text-slate-900 max-w-4xl mx-auto leading-[1.1]">
            Millions fail WAEC, NECO, and JAMB each year. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">We decided to fix that.</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            StudyMaster transforms how students prepare—personalized study plans, smart practice, and expert guidance designed specifically for Nigerian examinations.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/auth/signup" className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-slate-900 rounded-full hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/20 transition-all group">
              Get Started Free
              <iconify-icon icon="solar:arrow-right-linear" className="ml-2 group-hover:translate-x-1 transition-transform" width="18"></iconify-icon>
            </a>
            <a href="https://wa.me/2349115569024" target="_blank" rel="noreferrer" className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-full hover:border-green-400 hover:text-green-600 transition-colors shadow-sm">
              <iconify-icon icon="solar:chat-round-line-linear" className="mr-2" width="18"></iconify-icon>
              Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Futuristic Hero Visual (Mock Dashboard) */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 lg:mt-24 relative z-10">
          <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl shadow-2xl shadow-blue-900/5 overflow-hidden">
            {/* Dashboard Header */}
            <div className="h-12 border-b border-slate-100 flex items-center px-4 gap-2 bg-white/40">
              <div className="w-3 h-3 rounded-full bg-slate-200"></div>
              <div className="w-3 h-3 rounded-full bg-slate-200"></div>
              <div className="w-3 h-3 rounded-full bg-slate-200"></div>
              <div className="mx-auto text-xs font-medium text-slate-400 tracking-wider">STUDYMASTER // STUDENT DASHBOARD</div>
            </div>
            {/* Dashboard Content Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50/30">
              {/* Progress Arc Card */}
              <div className="lg:col-span-1 bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                <h3 className="text-xs font-medium text-slate-500 w-full text-left mb-4 uppercase tracking-wider">JAMB Readiness</h3>
                {/* CSS Mock Donut Chart */}
                <div
                  className="relative w-32 h-32 rounded-full flex items-center justify-center before:absolute before:inset-0 before:rounded-full before:border-8 before:border-slate-50"
                  style={{ background: 'conic-gradient(#2563eb 85%, transparent 0)' }}
                >
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center flex-col">
                    <span className="text-2xl font-semibold text-slate-900 tracking-tight">85%</span>
                    <span className="text-xs text-green-500 flex items-center">
                      <iconify-icon icon="solar:arrow-up-linear"></iconify-icon> 12%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center">On track for score 280+</p>
              </div>

              {/* Study Timeline Card */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Today's Study Plan</h3>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">Week 4 of 12</span>
                </div>
                <div className="space-y-4">
                  {/* Task 1 */}
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <iconify-icon icon="solar:check-read-linear" width="14"></iconify-icon>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-slate-900">Physics: Kinematics Quiz</h4>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                        <div className="bg-blue-600 h-1.5 rounded-full w-full"></div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">100%</span>
                  </div>
                  {/* Task 2 */}
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-slate-900">Chemistry: Organic Compounds</h4>
                      <p className="text-xs text-slate-500 mt-1">Read chapter 4 and take practice test.</p>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">In progress</span>
                  </div>
                  {/* Task 3 */}
                  <div className="flex items-start gap-4 opacity-50">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5"></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-slate-900">Math: Calculus Fundamentals</h4>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* The Problem (Story Detail) */}
      <section id="problem" className="py-24 bg-slate-50/50 border-y border-slate-100 relative">
        <div className="absolute inset-0 bg-grid opacity-50 z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Narrative */}
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mb-6">
                The hidden crisis in exam preparation
              </h2>
              <div className="space-y-6 text-base text-slate-600 leading-relaxed">
                <p>
                  Every year, millions of bright Nigerian students sit for WAEC, NECO, and JAMB. Yet, a staggering number fail to meet the cutoff marks required for university admission. This isn't a lack of intelligence; it's a systemic failure in preparation.
                </p>
                <p>
                  Students are overwhelmed by massive syllabuses without structure. They practice blindly using outdated past questions, receive no immediate feedback on their weak points, and lack access to expert guidance when they get stuck. They are studying hard, but not smart.
                </p>
              </div>
            </div>

            {/* Minimal Infographic Stat Block */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl blur-xl opacity-50 -z-10"></div>
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center min-h-[300px]">
                <div className="flex items-center gap-3 mb-4 text-red-500">
                  <iconify-icon icon="solar:danger-triangle-linear" width="24"></iconify-icon>
                  <span className="text-sm font-semibold tracking-wide uppercase">The Reality</span>
                </div>
                <h3 className="font-heading text-5xl font-semibold tracking-tighter text-slate-900 mb-2">Over 60%</h3>
                <p className="text-lg font-medium text-slate-700 mb-6">
                  of candidates fail to score above 200 in JAMB or clear 5 credits in WAEC on their first try.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-full bg-slate-100 h-2 rounded-full">
                      <div className="bg-red-400 h-2 rounded-full w-[60%]"></div>
                    </div>
                    <span className="text-xs text-slate-500 w-12 text-right">Failure</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-full bg-slate-100 h-2 rounded-full">
                      <div className="bg-emerald-400 h-2 rounded-full w-[40%]"></div>
                    </div>
                    <span className="text-xs text-slate-500 w-12 text-right">Success</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Research (Story Credibility) */}
      <section id="research" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mb-4">
              We studied why students fail
            </h2>
            <p className="text-base text-slate-500">
              We didn't just build an app; we conducted deep research into the study habits of thousands of candidates to pinpoint exactly where the system breaks down.
            </p>
          </div>

          {/* Lab-style Insight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Insight 1 */}
            <div className="group bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-blue-500 transition-colors"></div>
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 mb-4 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                <iconify-icon icon="solar:route-linear" width="24"></iconify-icon>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">No Clear Roadmap</h3>
              <p className="text-sm text-slate-500">
                Students jump between topics randomly, leading to syllabus gaps and incomplete coverage before exam day.
              </p>
            </div>

            {/* Insight 2 */}
            <div className="group bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-blue-500 transition-colors"></div>
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 mb-4 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                <iconify-icon icon="solar:target-line-linear" width="24"></iconify-icon>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Mismatched Practice</h3>
              <p className="text-sm text-slate-500">
                Practicing without simulating the actual exam environment (CBT for JAMB, written theory for WAEC) causes panic.
              </p>
            </div>

            {/* Insight 3 */}
            <div className="group bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-blue-500 transition-colors"></div>
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 mb-4 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                <iconify-icon icon="solar:graph-up-linear" width="24"></iconify-icon>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Zero Feedback Loop</h3>
              <p className="text-sm text-slate-500">
                Without analytics, students don't realize their weak subjects until the final results are released.
              </p>
            </div>

            {/* Insight 4 */}
            <div className="group bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-blue-500 transition-colors"></div>
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 mb-4 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                <iconify-icon icon="solar:users-group-rounded-linear" width="24"></iconify-icon>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Lack of Guidance</h3>
              <p className="text-sm text-slate-500">
                When a concept is difficult, having no access to tutors or mentors leads to giving up on crucial topics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution (Story Resolution) */}
      <section id="solution" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Tech background elements */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        ></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-16">
            <h2 className="font-heading text-3xl md:text-5xl font-semibold tracking-tight mb-6">
              StudyMaster: built to reverse failure
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
              We engineered a platform that directly targets the root causes of failure. StudyMaster provides the structure, the exact exam-aligned practice, and the human support needed to guarantee your success.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Feature */}
            <div className="flex gap-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
                <iconify-icon icon="solar:calendar-linear" width="24"></iconify-icon>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Personalized Study Plans</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Tell us your exam date and subject combination. We automatically generate a daily, bite-sized syllabus breakdown so you never feel overwhelmed.
                </p>
              </div>
            </div>

            {/* Feature */}
            <div className="flex gap-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400">
                <iconify-icon icon="solar:test-tube-linear" width="24"></iconify-icon>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Exam-Aligned Practice</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Experience JAMB CBT simulations identical to the real software. Practice WAEC theory questions with detailed marking guides and past solutions.
                </p>
              </div>
            </div>

            {/* Feature */}
            <div className="flex gap-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-purple-400">
                <iconify-icon icon="solar:pie-chart-2-linear" width="24"></iconify-icon>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Progress Tracking + Readiness Score</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Our smart engine analyzes your mock results to highlight weak areas. Watch your unique "Readiness Score" climb as exam day approaches.
                </p>
              </div>
            </div>

            {/* Feature */}
            <div className="flex gap-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-green-400">
                <iconify-icon icon="solar:headphones-round-sound-linear" width="24"></iconify-icon>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Expert Support & Admin Help</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Stuck on a tricky math equation? Connect instantly with our dedicated admins and subject experts via WhatsApp or in-app chat for explanations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-slate-900">How it works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-blue-100 via-slate-200 to-blue-100 z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-white border-8 border-slate-50 shadow-sm flex items-center justify-center text-2xl font-semibold text-slate-900 mb-6">
                01
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Choose your exam</h3>
              <p className="text-sm text-slate-500 px-4">Select WAEC, NECO, or JAMB and input your target subjects.</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-white border-8 border-blue-50 shadow-sm flex items-center justify-center text-2xl font-semibold text-blue-600 mb-6">
                02
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Get your daily plan</h3>
              <p className="text-sm text-slate-500 px-4">Receive a tailored syllabus breakdown with exact tasks for each day.</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-white border-8 border-teal-50 shadow-sm flex items-center justify-center text-2xl font-semibold text-teal-500 mb-6">
                03
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Practice & improve</h3>
              <p className="text-sm text-slate-500 px-4">Take CBT mocks, track your growth, and watch your readiness score rise.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Results / Success Stories */}
      <section id="results" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Big Outcome Metric */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 mb-16 text-center shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
            <h2 className="font-heading text-6xl md:text-7xl font-semibold tracking-tighter text-blue-600 mb-4 relative z-10">+28%</h2>
            <p className="text-lg font-medium text-slate-700 relative z-10">
              Average score improvement for consistent StudyMaster users within 3 months.
            </p>
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex text-yellow-400 mb-4 gap-1">
                <iconify-icon icon="solar:star-bold" width="16"></iconify-icon>
                <iconify-icon icon="solar:star-bold" width="16"></iconify-icon>
                <iconify-icon icon="solar:star-bold" width="16"></iconify-icon>
                <iconify-icon icon="solar:star-bold" width="16"></iconify-icon>
                <iconify-icon icon="solar:star-bold" width="16"></iconify-icon>
              </div>
              <p className="text-sm text-slate-600 mb-6 italic">
                "I wrote JAMB twice and scored below 180. The personalized plan on StudyMaster helped me focus on my weaknesses in Chemistry. I just checked my result and I got 275!"
              </p>
              <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">DO</div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">David O.</p>
                  <p className="text-xs text-slate-500">JAMB Score: 275</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex text-yellow-400 mb-4 gap-1">
                <iconify-icon icon="solar:star-bold" width="16"></iconify-icon>
                <iconify-icon icon="solar:star-bold" width="16"></iconify-icon>
                <iconify-icon icon="solar:star-bold" width="16"></iconify-icon>
                <iconify-icon icon="solar:star-bold" width="16"></iconify-icon>
                <iconify-icon icon="solar:star-bold" width="16"></iconify-icon>
              </div>
              <p className="text-sm text-slate-600 mb-6 italic">
                "WAEC theory questions used to scare me. The platform's marking guides showed me exactly what examiners look for. I cleared all my papers with 6 A's."
              </p>
              <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-xs font-semibold text-teal-700">CA</div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Chioma A.</p>
                  <p className="text-xs text-slate-500">WAEC: 6 Distinctions</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="hidden lg:block bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex text-yellow-400 mb-4 gap-1">
                <iconify-icon icon="solar:star-bold" width="16"></iconify-icon>
                <iconify-icon icon="solar:star-bold" width="16"></iconify-icon>
                <iconify-icon icon="solar:star-bold" width="16"></iconify-icon>
                <iconify-icon icon="solar:star-bold" width="16"></iconify-icon>
                <iconify-icon icon="solar:star-bold" width="16"></iconify-icon>
              </div>
              <p className="text-sm text-slate-600 mb-6 italic">
                "The mock interface is exactly like the real JAMB CBT. By the time I got to the exam hall, I had no fear because I had practiced it 20 times already."
              </p>
              <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-semibold text-purple-700">IM</div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Ibrahim M.</p>
                  <p className="text-xs text-slate-500">Admitted to UNILAG</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Exam Focus Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-slate-900 text-center mb-12">One platform, every major exam</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* WAEC */}
            <div className="group relative bg-slate-50 rounded-2xl p-8 border border-slate-100 overflow-hidden hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <h3 className="font-heading text-2xl font-semibold text-slate-900 mb-4 relative z-10">WAEC</h3>
              <p className="text-sm text-slate-600 mb-6 relative z-10">
                Master the SSCE syllabus. Get theory question marking guides, obj practice, and past paper analysis to secure your O'Level credits.
              </p>
              <a href="#" className="inline-flex items-center text-sm font-medium text-blue-600 relative z-10 group-hover:underline">
                Explore WAEC Prep <iconify-icon icon="solar:alt-arrow-right-linear" className="ml-1"></iconify-icon>
              </a>
            </div>

            {/* NECO */}
            <div className="group relative bg-slate-50 rounded-2xl p-8 border border-slate-100 overflow-hidden hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <h3 className="font-heading text-2xl font-semibold text-slate-900 mb-4 relative z-10">NECO</h3>
              <p className="text-sm text-slate-600 mb-6 relative z-10">
                Dedicated NECO curriculum alignment. Ensure a backup to your WAEC with specialized practice tests and structural breakdowns.
              </p>
              <a href="#" className="inline-flex items-center text-sm font-medium text-teal-600 relative z-10 group-hover:underline">
                Explore NECO Prep <iconify-icon icon="solar:alt-arrow-right-linear" className="ml-1"></iconify-icon>
              </a>
            </div>

            {/* JAMB */}
            <div className="group relative bg-slate-50 rounded-2xl p-8 border border-slate-100 overflow-hidden hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <h3 className="font-heading text-2xl font-semibold text-slate-900 mb-4 relative z-10">JAMB (UTME)</h3>
              <p className="text-sm text-slate-600 mb-6 relative z-10">
                Realistic CBT environment simulation. Time-management drills, speed reading techniques, and extensive past question database.
              </p>
              <a href="#" className="inline-flex items-center text-sm font-medium text-purple-600 relative z-10 group-hover:underline">
                Explore JAMB Prep <iconify-icon icon="solar:alt-arrow-right-linear" className="ml-1"></iconify-icon>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Contact Banner */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between border border-emerald-100 shadow-sm gap-6">
            <div>
              <h3 className="font-heading text-2xl font-semibold text-slate-900 mb-2">Need guidance? Chat with our admins.</h3>
              <p className="text-sm text-slate-600">Got questions about your subjects or how to subscribe? We are online to help.</p>
            </div>
            <a href="https://wa.me/2349115569024" target="_blank" rel="noreferrer" className="flex-shrink-0 inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-[#25D366] rounded-full hover:bg-[#1ebd5a] transition-all shadow-md shadow-green-500/20 w-full md:w-auto">
              <iconify-icon icon="solar:whatsapp-bold" className="mr-2" width="20"></iconify-icon>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-50 border-t border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-slate-900 mb-4">Invest in your success</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Choose a plan that fits your study needs. A fraction of the cost of a private tutor, with 10x the structured value.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
            {/* Basic Plan */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Basic Plan</h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold text-slate-900 tracking-tight">₦3,000</span>
                <span className="text-sm text-slate-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <iconify-icon icon="solar:check-circle-bold" className="text-blue-600 mt-0.5" width="18"></iconify-icon>
                  All current dashboard tabs (Dashboard, Notes, Past Questions, Exam, Timetable, Coach, Community)
                </li>
                <li className="flex items-start gap-3">
                  <iconify-icon icon="solar:check-circle-bold" className="text-blue-600 mt-0.5" width="18"></iconify-icon>
                  Personalized study timeline and practice
                </li>
                <li className="flex items-start gap-3">
                  <iconify-icon icon="solar:check-circle-bold" className="text-blue-600 mt-0.5" width="18"></iconify-icon>
                  Progress tracking and readiness score
                </li>
              </ul>
              <a href="/auth/signup" className="block w-full py-3 px-4 text-center text-sm font-medium text-white bg-slate-900 rounded-full hover:bg-blue-600 transition-colors shadow-sm">Get Basic</a>
            </div>

            {/* Pro Plan (Coming Soon) */}
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Coming Soon
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Pro Plan</h3>
              <div className="mb-6">
                <span className="text-3xl font-semibold text-slate-900 tracking-tight">Coming soon</span>
                <p className="text-xs text-slate-500 mt-1">Not available yet</p>
              </div>
              <ul className="space-y-4 mb-8 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <iconify-icon icon="solar:check-circle-linear" className="text-slate-400 mt-0.5" width="18"></iconify-icon>
                  Everything in Basic
                </li>
                <li className="flex items-start gap-3">
                  <iconify-icon icon="solar:check-circle-linear" className="text-slate-400 mt-0.5" width="18"></iconify-icon>
                  Image support
                </li>
                <li className="flex items-start gap-3">
                  <iconify-icon icon="solar:check-circle-linear" className="text-slate-400 mt-0.5" width="18"></iconify-icon>
                  Live tutor support
                </li>
                <li className="flex items-start gap-3">
                  <iconify-icon icon="solar:check-circle-linear" className="text-slate-400 mt-0.5" width="18"></iconify-icon>
                  Video generation for any topic
                </li>
              </ul>
              <button
                disabled
                className="block w-full py-3 px-4 text-center text-sm font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-full cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-slate-900 text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-4">
            {/* FAQ Item */}
            <details className="group bg-slate-50 rounded-lg border border-slate-200 cursor-pointer open:bg-white open:ring-1 open:ring-blue-100 transition-all">
              <summary className="flex justify-between items-center font-medium text-slate-900 p-6 select-none">
                Is StudyMaster updated for the latest JAMB/WAEC syllabus?
                <span className="transition group-open:rotate-180 text-slate-400">
                  <iconify-icon icon="solar:alt-arrow-down-linear" width="20"></iconify-icon>
                </span>
              </summary>
              <div className="text-sm text-slate-600 px-6 pb-6 pt-0 leading-relaxed">
                Yes, our content team reviews the platform annually to ensure all past questions, mock exams, and study plans align perfectly with the official syllabuses released by the examination boards.
              </div>
            </details>

            {/* FAQ Item */}
            <details className="group bg-slate-50 rounded-lg border border-slate-200 cursor-pointer open:bg-white open:ring-1 open:ring-blue-100 transition-all">
              <summary className="flex justify-between items-center font-medium text-slate-900 p-6 select-none">
                Can I use StudyMaster on my phone?
                <span className="transition group-open:rotate-180 text-slate-400">
                  <iconify-icon icon="solar:alt-arrow-down-linear" width="20"></iconify-icon>
                </span>
              </summary>
              <div className="text-sm text-slate-600 px-6 pb-6 pt-0 leading-relaxed">
                Absolutely. StudyMaster is fully responsive and works perfectly on mobile browsers. We designed it so you can study anywhere, anytime.
              </div>
            </details>

            {/* FAQ Item */}
            <details className="group bg-slate-50 rounded-lg border border-slate-200 cursor-pointer open:bg-white open:ring-1 open:ring-blue-100 transition-all">
              <summary className="flex justify-between items-center font-medium text-slate-900 p-6 select-none">
                How does the CBT mock exam work?
                <span className="transition group-open:rotate-180 text-slate-400">
                  <iconify-icon icon="solar:alt-arrow-down-linear" width="20"></iconify-icon>
                </span>
              </summary>
              <div className="text-sm text-slate-600 px-6 pb-6 pt-0 leading-relaxed">
                Our CBT interface mirrors the actual JAMB examination software. It features a countdown timer, standard navigation buttons, and a calculator, helping you build confidence and speed before the real exam.
              </div>
            </details>

            {/* FAQ Item */}
            <details className="group bg-slate-50 rounded-lg border border-slate-200 cursor-pointer open:bg-white open:ring-1 open:ring-blue-100 transition-all">
              <summary className="flex justify-between items-center font-medium text-slate-900 p-6 select-none">
                How do I pay for the Pro version?
                <span className="transition group-open:rotate-180 text-slate-400">
                  <iconify-icon icon="solar:alt-arrow-down-linear" width="20"></iconify-icon>
                </span>
              </summary>
              <div className="text-sm text-slate-600 px-6 pb-6 pt-0 leading-relaxed">
                We accept standard Nigerian payment methods securely via Paystack, including debit cards, USSD, and bank transfers.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA (Story Close) */}
      <section className="py-24 relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 to-teal-900/40 opacity-50"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="font-heading text-4xl md:text-6xl font-semibold tracking-tighter mb-6">
            Your exam story can end in success.
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            Stop relying on luck and start preparing with structure. Join thousands of students who have turned their academic trajectory around with StudyMaster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/auth/signup" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-sm font-medium text-slate-900 bg-white rounded-full hover:bg-slate-100 transition-colors shadow-lg shadow-white/10">
              Start Free
            </a>
            <a href="https://wa.me/2349115569024" target="_blank" rel="noreferrer" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-sm font-medium text-white border border-slate-700 bg-slate-800 rounded-full hover:border-green-500 hover:text-green-400 transition-colors">
              <iconify-icon icon="solar:chat-round-line-linear" className="mr-2" width="18"></iconify-icon>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="StudyMaster"
              className="w-7 h-7 rounded-md object-contain"
            />
            <span className="font-heading font-semibold text-lg tracking-tight text-slate-900">StudyMaster</span>
          </div>
          <p className="text-xs text-slate-500">© 2023 StudyMaster Prep. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/2349115569024"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg shadow-green-500/30 flex items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all z-50 group"
        aria-label="Chat on WhatsApp"
      >
        <iconify-icon icon="solar:call-chat-rounded-line-duotone" width="24" height="24"></iconify-icon>
        <span className="absolute right-full mr-4 bg-white text-slate-800 text-xs font-medium px-3 py-1.5 rounded shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Chat with us
        </span>
      </a>
    </main>
  )
}
