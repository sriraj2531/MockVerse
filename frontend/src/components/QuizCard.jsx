import React, { useState } from 'react';

export default function QuizCard() {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const options = [
    { id: 'A', text: 'O(1)' },
    { id: 'B', text: 'O(log n)' }, // Correct
    { id: 'C', text: 'O(n)' },
    { id: 'D', text: 'O(n log n)' },
  ];

  const handleSelect = (optionId) => {
    setSelectedOption(optionId);
    setShowExplanation(true);
  };

  return (
    <div className="w-full max-w-md bg-brand-midnight rounded-3xl shadow-2xl border border-brand-slate p-8 relative overflow-hidden animate-fadeIn">
      
      {/* Top Tag Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-amber animate-pulse" />
          <span className="text-xs font-bold text-brand-ash">Try one now</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 bg-brand-space text-brand-amber border border-brand-amber/30 rounded-md">
          GATE CS - AI-explained
        </span>
      </div>

      {/* Context Tagline */}
      <p className="text-xs text-brand-ash/50 font-medium mb-4">
        A real CS Fundamentals question — solve it, then see the AI explanation you get after every question.
      </p>

      {/* Question Headline */}
      <h2 className="text-base font-extrabold text-brand-ash leading-snug mb-6">
        What is the worst-case time complexity of searching for an element in a balanced Binary Search Tree (BST) containing <span className="text-brand-amber font-mono">n</span> elements?
      </h2>

      {/* Interactive Options Stack */}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedOption === option.id;
          const isCorrectAnswer = option.id === 'B';
          
          let optionStyles = "border-brand-slate bg-brand-space/40 text-brand-ash/70 hover:border-brand-ash/30 hover:bg-brand-space/80";
          let badgeStyles = "bg-brand-midnight border border-brand-slate text-brand-ash/60";

          if (selectedOption) {
            if (isSelected) {
              if (isCorrectAnswer) {
                optionStyles = "border-emerald-500 bg-emerald-950/20 text-emerald-400";
                badgeStyles = "bg-emerald-500 text-brand-space";
              } else {
                optionStyles = "border-rose-500 bg-rose-950/20 text-rose-400";
                badgeStyles = "bg-rose-500 text-brand-space";
              }
            } else if (isCorrectAnswer) {
              optionStyles = "border-emerald-500/50 bg-emerald-950/10 text-emerald-500";
              badgeStyles = "bg-emerald-500/20 border border-emerald-500 text-emerald-400";
            }
          }

          return (
            <button
              key={option.id}
              disabled={selectedOption !== null}
              onClick={() => handleSelect(option.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left font-mono font-bold transition-all duration-200 group ${optionStyles}`}
            >
              <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-sans font-bold transition-all ${badgeStyles}`}>
                {option.id}
              </span>
              <span className="text-sm">{option.text}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Simulation AI Explanation Card Drawer */}
      {showExplanation && (
        <div className="mt-6 p-5 bg-brand-space rounded-2xl border border-brand-slate text-left space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-brand-amber/20 text-brand-amber text-[10px] uppercase font-mono font-bold">AI</span>
            <h4 className={`text-sm font-bold ${selectedOption === 'B' ? 'text-emerald-400' : 'text-brand-amber'}`}>
              {selectedOption === 'B' ? "Correct — brilliant job!" : "Not quite — here's why:"}
            </h4>
          </div>
          <p className="text-xs font-medium text-brand-ash/70 leading-relaxed">
            A balanced Binary Search Tree (like an AVL or Red-Black Tree) maintains a height proportional to log₂(n). 
            Since each comparison stage discards half of the remaining lookup tree nodes, operations scale precisely to O(log n).
          </p>
        </div>
      )}

      {/* Card Dynamic Footer Text Context */}
      {!showExplanation && (
        <div className="mt-6 text-center">
          <p className="text-[11px] font-bold text-brand-ash/40 flex items-center justify-center gap-1.5 font-sans">
            <svg className="w-3.5 h-3.5 text-brand-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Pick an answer to reveal the AI explanation
          </p>
        </div>
      )}

    </div>
  );
}