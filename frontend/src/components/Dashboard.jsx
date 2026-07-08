import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import the router navigation hook
import { auth } from '../firebase';

export default function Dashboard() {
  const navigate = useNavigate(); // 2. Initialize the navigation executor

  // Dynamically load stats from localStorage based on active user
  const [examsCompleted, setExamsCompleted] = useState("0");
  const [averageScore, setAverageScore] = useState("0%");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      const email = user?.email || "guest";
      const completed = localStorage.getItem(`examsCompleted_${email}`) || "0";
      const scores = JSON.parse(localStorage.getItem(`examScores_${email}`) || "[]");
      const avg = scores.length > 0
        ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%`
        : "0%";
      
      setExamsCompleted(completed);
      setAverageScore(avg);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-10 animate-fadeIn select-none pt-4">

      {/* Page Header Intro */}
      <div className="space-y-1.5">
        <h2 className="text-3xl font-black text-brand-ash tracking-tight flex items-center gap-2">
          Welcome back! <span className="animate-bounce">👋</span>
        </h2>
        <p className="text-sm font-medium text-brand-ash/60">
          Let's start your learning journey today
        </p>
      </div>

      {/* 4-CARD GRID STATS & TIPS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Stat Card 1: Exams Completed */}
        <div className="bg-brand-midnight border border-brand-slate rounded-2xl p-6 flex flex-col justify-between shadow-xl min-h-[150px]">
          <div className="w-10 h-10 rounded-xl bg-brand-space/80 border border-brand-slate/40 flex items-center justify-center text-indigo-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="mt-4 space-y-0.5">
            <span className="text-xs font-bold text-brand-ash/50 block tracking-wide">Exams Completed</span>
            <span className="text-3xl font-black text-brand-ash block tracking-tight">{examsCompleted}</span>
          </div>
        </div>

        {/* Stat Card 2: Average Score */}
        <div className="bg-brand-midnight border border-brand-slate rounded-2xl p-6 flex flex-col justify-between shadow-xl min-h-[150px]">
          <div className="w-10 h-10 rounded-xl bg-brand-space/80 border border-brand-slate/40 flex items-center justify-center text-emerald-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="mt-4 space-y-0.5">
            <span className="text-xs font-bold text-brand-ash/50 block tracking-wide">Average Score</span>
            <span className="text-3xl font-black text-brand-ash block tracking-tight">{averageScore}</span>
          </div>
        </div>

        {/* Tips Card 3: Split Study Tips Segment A */}
        <div className="bg-brand-midnight border border-brand-slate rounded-2xl p-6 flex flex-col justify-between shadow-xl min-h-[150px]">
          <div className="w-10 h-10 rounded-xl bg-brand-space/80 border border-brand-slate/40 flex items-center justify-center text-brand-amber">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="mt-4 space-y-1.5 text-left">
            <span className="text-xs font-black text-brand-amber block tracking-wide uppercase">Study Tips • A</span>
            <ul className="space-y-1 text-xs font-bold text-brand-ash/60">
              <li className="flex items-center gap-1.5 truncate">
                <span className="w-1 h-1 rounded-full bg-brand-amber flex-shrink-0" />
                Take regular breaks
              </li>
              <li className="flex items-center gap-1.5 truncate">
                <span className="w-1 h-1 rounded-full bg-brand-amber flex-shrink-0" />
                Review mistakes closely
              </li>
            </ul>
          </div>
        </div>

        {/* Tips Card 4: Split Study Tips Segment B */}
        <div className="bg-brand-midnight border border-brand-slate rounded-2xl p-6 flex flex-col justify-between shadow-xl min-h-[150px]">
          <div className="w-10 h-10 rounded-xl bg-brand-space/80 border border-brand-slate/40 flex items-center justify-center text-brand-amber">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="mt-4 space-y-1.5 text-left">
            <span className="text-xs font-black text-brand-amber block tracking-wide uppercase">Study Tips • B</span>
            <ul className="space-y-1 text-xs font-bold text-brand-ash/60">
              <li className="flex items-center gap-1.5 truncate">
                <span className="w-1 h-1 rounded-full bg-brand-amber flex-shrink-0" />
                Use AI insights
              </li>
              <li className="flex items-center gap-1.5 truncate">
                <span className="w-1 h-1 rounded-full bg-brand-amber flex-shrink-0" />
                Maintain practice sets
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* LOWER NAVIGATION ACTION TILES BLOCK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Tile A: Start New Exam -> FIXED: Added onClick handler to navigate to explore-tests */}
        <button
          onClick={() => navigate('/explore-tests')}
          className="bg-brand-amber text-brand-space rounded-2xl p-6 flex flex-col justify-between items-start text-left shadow-lg shadow-brand-amber/5 min-h-[140px] group transition-all cursor-pointer"
        >
          <div className="w-full flex justify-between items-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="transform group-hover:translate-x-1 transition-transform font-bold text-lg">&rarr;</span>
          </div>
          <div className="mt-4">
            <h4 className="text-base font-black tracking-tight">Start New Exam</h4>
            <p className="text-xs font-semibold opacity-80 mt-0.5">Begin your practice session</p>
          </div>
        </button>


        {/* Tile-B To results Page */}
        <button
          onClick={() => navigate('/results')}
          className="bg-brand-midnight border border-brand-slate text-brand-ash rounded-2xl p-6 flex flex-col justify-between items-start text-left shadow-xl min-h-[140px] group hover:border-brand-ash/30 transition-all cursor-pointer"
        >
          <div className="w-full flex justify-between items-center text-brand-amber">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span className="transform group-hover:translate-x-1 transition-transform text-brand-ash/40 group-hover:text-brand-ash font-bold text-lg">&rarr;</span>
          </div>
          <div className="mt-4">
            <h4 className="text-base font-black tracking-tight">View Results</h4>
            <p className="text-xs font-semibold text-brand-ash/50 mt-0.5">Check your performance</p>
          </div>
        </button>

        {/* Replace Tile C inside your Dashboard.jsx layout */}
        <button
          onClick={() => navigate('/ai-performance')}
          className="bg-gradient-to-br from-purple-600 to-indigo-700 text-brand-ash rounded-2xl p-6 flex flex-col justify-between items-start text-left shadow-xl min-h-[140px] group relative overflow-hidden cursor-pointer w-full"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="w-full flex justify-between items-center text-brand-amber">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="transform group-hover:translate-x-1 transition-transform text-white/60 group-hover:text-white font-bold text-lg">&rarr;</span>
          </div>
          <div className="mt-4">
            <h4 className="text-base font-black tracking-tight">AI Performance</h4>
            <p className="text-xs font-semibold text-white/70 mt-0.5">AI-powered insights</p>
          </div>
        </button>

        {/* Tile D: Live Group Challenge */}
        <button
          onClick={() => navigate('/live-challenge')}
          className="bg-gradient-to-br from-emerald-600 to-teal-700 text-brand-ash rounded-2xl p-6 flex flex-col justify-between items-start text-left shadow-xl min-h-[140px] group relative overflow-hidden cursor-pointer w-full"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="w-full flex justify-between items-center text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="transform group-hover:translate-x-1 transition-transform text-white/60 group-hover:text-white font-bold text-lg">&rarr;</span>
          </div>
          <div className="mt-4">
            <h4 className="text-base font-black tracking-tight">Live Challenge</h4>
            <p className="text-xs font-semibold text-white/70 mt-0.5">Blitz challenge room</p>
          </div>
        </button>

      </div>

    </div>
  );
}