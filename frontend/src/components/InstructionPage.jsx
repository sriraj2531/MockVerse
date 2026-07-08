import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function InstructionPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Safeguard to read the chosen theme topic passed via route state parameters
  const chosenTopic = location.state?.topic || "Computer Science Core Framework";

  const standardInstructions = [
    "This assessment is dynamically cooked and tracked by your personalized AI model profile.",
    "The exam contains exactly 15 high-yield multiple-choice questions.",
    "You have a total allocation of 30 minutes to complete all sections. The timer cannot be paused.",
    "Each question holds a uniform weight. There is no negative marking applied to this session.",
    "AI surface hints will be accessible if you get stuck on a problem for longer than 60 seconds.",
    "Do not refresh the page or navigate away from the active tab, or your state token will expire."
  ];

  return (
    <div className="max-w-3xl mx-auto bg-brand-midnight border border-brand-slate rounded-3xl p-8 md:p-10 shadow-2xl animate-fadeIn select-none mt-4 relative overflow-hidden">
      
      {/* Premium Ambient Background Flair */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-brand-amber/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header Information Section */}
      <div className="border-b border-brand-slate/60 pb-6 space-y-2">
        <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 bg-brand-space text-brand-amber border border-brand-amber/30 rounded-md">
          PRE-EXAM BRIEFING
        </span>
        <h1 className="text-3xl font-black text-brand-ash tracking-tight pt-1">
          Exam Configuration & Rules
        </h1>
        <p className="text-xs font-semibold text-brand-ash/40">
          Please read the technical constraints below thoroughly before initializing the neural testing pipeline.
        </p>
      </div>

      {/* 2. Key Metrics Metadata Grid (Chosen Topic, Questions, Time) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
        {/* Metric Card A: Target Focus Topic */}
        <div className="bg-brand-space/50 border border-brand-slate/40 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-brand-ash/40 uppercase tracking-wider block">Chosen Topic</span>
          <span className="text-sm font-black text-brand-amber block truncate font-mono">
            {chosenTopic}
          </span>
        </div>

        {/* Metric Card B: Quantities Count */}
        <div className="bg-brand-space/50 border border-brand-slate/40 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-brand-ash/40 uppercase tracking-wider block">Question Volume</span>
          <span className="text-sm font-black text-brand-ash block font-mono">
            15 MCQs
          </span>
        </div>

        {/* Metric Card C: Time Budget */}
        <div className="bg-brand-space/50 border border-brand-slate/40 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-brand-ash/40 uppercase tracking-wider block">Time Allocation</span>
          <span className="text-sm font-black text-brand-ash block font-mono">
            30 Minutes
          </span>
        </div>
      </div>

      {/* 3. Formal System Rules Bullet List */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-brand-ash uppercase tracking-widest text-brand-ash/80">
          Standard Instructions:
        </h3>
        <ul className="space-y-3.5 pl-1">
          {standardInstructions.map((instruction, index) => (
            <li key={index} className="flex items-start gap-3 text-xs font-semibold text-brand-ash/60 leading-relaxed">
              <span className="w-5 h-5 flex items-center justify-center bg-brand-space border border-brand-slate/60 text-brand-amber rounded-lg font-mono text-[10px] font-black flex-shrink-0 mt-0.5">
                {index + 1}
              </span>
              <span className="pt-0.5">{instruction}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. Action Initialization Buttons Row */}
      <div className="flex flex-wrap items-center justify-end gap-4 pt-8 mt-8 border-t border-brand-slate/60">
        <button 
          onClick={() => navigate('/explore-tests')}
          className="px-5 py-3 text-xs font-bold text-brand-ash/60 hover:text-brand-ash transition-colors cursor-pointer"
        >
          Cancel & Return
        </button>
        
        {/* Triggers route change straight into the live exam interface platform */}
        <button 
          onClick={() => navigate('/live-exam', { state: { topic: chosenTopic } })}
          className="flex items-center gap-2 px-6 py-3 text-sm font-black text-brand-space bg-brand-amber hover:bg-[#e0951b] rounded-xl shadow-lg shadow-brand-amber/10 transition-all group cursor-pointer"
        >
          Initialize Live Assessment
          <span className="transform group-hover:translate-x-0.5 transition-transform">&rarr;</span>
        </button>
      </div>

    </div>
  );
}