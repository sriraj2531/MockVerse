import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ExamExplorer() {
  const navigate = useNavigate();
  // State to track the currently selected core CS topic for AI generation
  const [selectedTopic, setSelectedTopic] = useState('All CS Core');

  // Core CSE & DSE topics acting as AI prompt nodes (No counts required!)
  const topics = [
    'All CS Core',
    'Data Structures & Algos',
    'Design & Analysis of Algos',
    'Operating Systems',
    'Computer Networks',
    'DBMS',
    'Computer Architecture',
    'Theory of Computation',
    'Compiler Design',
    'Systems Programming',
    'Discrete Mathematics',
    'Introduction to AI',
    'Introduction to Data Science',
    'Introduction to Optimization',
    'Data Structures & Algos for DS',
    'Computer Systems for DS',
    'Data Analytics',
    'Machine Learning',
    'Deep Learning',
    'AI Ethics'
  ];

  // Infinite practice modules driven completely by AI generators
  const aiTestEngines = [
    { id: 1, title: 'AI Adaptive Mock Test • High-Yield Mix', description: 'Generates a custom diagnostic set that shifts difficulty live based on your inputs.' },
    { id: 2, title: 'AI Speed Blitz • Quick Assessment Matrix', description: 'Generates a rapid-fire session focused entirely on conceptual speed and runtime calculation.' },
    { id: 3, title: 'AI Target Matrix • Weakness Drill Configuration', description: 'Analyzes your past mistakes to auto-generate a targeted remedial test block.' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn select-none pt-4">
      
      {/* 1. Header Information Block */}
      <div className="space-y-3">
        <h1 className="text-4xl font-black text-brand-ash tracking-tight">
          Infinite AI Mock Tests for CSE Students
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-brand-ash/60">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-brand-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Infinite AI Practice Generations</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-brand-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>Instant Explanations on Every Single Question</span>
          </div>
        </div>
      </div>

      {/* 2. Core CSE AI Prompt Focus Selector Pills */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {topics.map((topic, index) => {
          const isActive = selectedTopic === topic;
          return (
            <button
              key={index}
              onClick={() => setSelectedTopic(topic)}
              className={`px-5 py-2.5 text-xs font-black rounded-full border transition-all cursor-pointer
                ${isActive
                  ? 'bg-brand-amber border-brand-amber text-brand-space shadow-md shadow-brand-amber/10'
                  : 'bg-brand-midnight border-brand-slate text-brand-ash/70 hover:border-brand-ash/30 hover:text-brand-ash'
                }`}
            >
              {topic}
            </button>
          );
        })}
      </div>

      {/* 3. Section Overview Title Header */}
      <div className="flex items-center justify-between pt-4 border-b border-brand-slate pb-3">
        <h3 className="text-lg font-black text-brand-ash tracking-tight">
          Active AI Prompt Node: <span className="text-brand-amber font-mono font-bold text-base ml-1">{selectedTopic}</span>
        </h3>
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-brand-space border border-brand-amber/30 text-brand-amber rounded-md">
          100% Free Engine
        </span>
      </div>

      {/* 4. Subheading Metrics Block */}
      <div className="text-xs text-brand-ash/40 font-bold -mt-4">
        Configure any dynamic engine option below. Questions are generated instantly by AI with adaptive parameter tracking.
      </div>

      {/* 5. Highlight "LAUNCH AI CONFIGURATOR" Box */}
      <div className="bg-brand-midnight border-2 border-brand-amber/30 rounded-2xl p-6 space-y-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 px-4 py-1.5 bg-brand-amber/15 border-b border-l border-brand-amber/20 rounded-bl-xl text-[10px] tracking-wider uppercase font-black text-brand-amber">
          Instant Engine Launcher
        </div>
        <div className="space-y-1">
          <h4 className="text-lg font-black text-brand-ash">
            Launch Dynamic {selectedTopic} Quiz
          </h4>
          <p className="text-xs font-medium text-brand-ash/50">
            Fires up the primary AI neural pipeline to cook a brand-new 15-question exam customized to your profile depth.
          </p>
        </div>
        <button 
          onClick={() => navigate('/instructions', { state: { topic: selectedTopic } })}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-brand-space bg-brand-amber hover:bg-[#e0951b] rounded-xl shadow-md transition-all group cursor-pointer"
        >
          Generate Live Session Now
          <span className="transform group-hover:translate-x-0.5 transition-transform">&rarr;</span>
        </button>
      </div>

      {/* 6. Dynamic Generative Sub-Suite Track Blocks */}
      <div className="bg-brand-midnight border border-brand-slate rounded-2xl divide-y divide-brand-slate/60 overflow-hidden shadow-2xl">
        {aiTestEngines.map((engine) => (
          <div 
            key={engine.id} 
            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-transparent hover:bg-brand-space/30 transition-colors group gap-4"
          >
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 flex items-center justify-center bg-brand-space border border-brand-slate/80 text-brand-amber font-mono font-black text-sm rounded-xl flex-shrink-0">
                &lambda;
              </span>
              <div className="space-y-0.5">
                <span className="text-sm font-black text-brand-ash/90 group-hover:text-brand-ash transition-colors block">
                  {engine.title}
                </span>
                <p className="text-xs font-medium text-brand-ash/40 leading-relaxed max-w-2xl">
                  {engine.description}
                </p>
              </div>
            </div>

            {/* Launch CTA Triggering dynamic calls to the instructions screen */}
            <div className="flex-shrink-0 self-end sm:self-center">
              <button 
                onClick={() => navigate('/instructions', { state: { topic: `${selectedTopic} (${engine.title})` } })}
                className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 bg-brand-space border border-brand-slate text-brand-ash/60 hover:text-brand-amber hover:border-brand-amber/40 rounded-xl transition-all cursor-pointer"
              >
                Launch &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}