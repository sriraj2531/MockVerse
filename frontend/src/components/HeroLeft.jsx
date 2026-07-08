import React from 'react';
import { Link } from 'react-router-dom';

export default function HeroLeft({ isLoggedIn }) {
  return (
    <div className="space-y-8 select-none animate-fadeIn">
      
      {/* 1. Simplified Double-Badge Header Row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-brand-ash/60">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-brand-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>100% Free Access</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-brand-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>AI-Powered Analysis</span>
        </div>
      </div>

      {/* 2. Headline Component */}
      <h1 className="text-5xl lg:text-[64px] font-black text-brand-ash tracking-tight leading-[1.08]">
        Mock Test Online <br />
        with <span className="bg-gradient-to-r from-brand-amber via-brand-ash to-brand-slate bg-clip-text text-transparent">AI Analysis</span>
      </h1>

      {/* 3. Shortened Copy Description */}
      <p className="text-sm font-medium text-brand-ash/60 max-w-xl leading-relaxed">
        Practice smarter with AI on your side — AI hints when you're stuck, AI
        explanations after every question, and AI-driven performance analysis across
        attempts.Start free ...
      </p>

      {/* 4. Balanced Two-Column Highlight Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 max-w-2xl pt-2">
        {/* Feature Component 1 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-brand-midnight border border-brand-slate flex items-center justify-center text-brand-amber shadow-md">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-brand-ash">AI Hints & Explanations</h3>
            <p className="text-xs font-semibold text-brand-ash/40 leading-normal">
              AI hints surface guidance during the exam; AI explanations break down every question after submission.
            </p>
          </div>
        </div>

        {/* Feature Component 2 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-brand-midnight border border-brand-slate flex items-center justify-center text-brand-amber shadow-md">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-brand-ash">Unlimited Mock Exams</h3>
            <p className="text-xs font-semibold text-brand-ash/40 leading-normal">
              Practice unlimited tests
            </p>
          </div>
        </div>
      </div>

      {/* 5. Dynamic Double-CTA Button Row based on Login Status */}
      <div className="flex flex-wrap items-center gap-4 pt-4">
        {/* If user is logged in, points straight to the CSE student explorer catalog */}
        <Link 
          to={isLoggedIn ? "/explore-tests" : "/login"}
          className="flex items-center justify-center gap-2 px-6 py-3.5 font-bold text-brand-space bg-brand-amber hover:bg-[#e0951b] rounded-xl shadow-md shadow-brand-amber/10 transition-all group"
        >
          Start Practicing Now
          <span className="transform group-hover:translate-x-0.5 transition-transform">&rarr;</span>
        </Link>
        
        <Link 
          to={isLoggedIn ? "/dashboard" : "/login"}
          className="px-6 py-3.5 font-bold text-brand-ash bg-brand-midnight border border-brand-slate rounded-xl shadow-sm hover:border-brand-ash/30 transition-all text-center min-w-[160px]"
        >
          {isLoggedIn ? "Visit Dashboard" : "Create Free Account"}
        </Link>
      </div>

    </div>
  );
}