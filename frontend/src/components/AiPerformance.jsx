import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

export default function AiPerformance() {
  const navigate = useNavigate();
  
  // State for dynamic user-specific performance history
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisCache, setAnalysisCache] = useState({});

  // Synchronize history list on user authentication status loaded
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const response = await fetch("http://localhost:8000/api/v1/test/history", {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("authToken") || (import.meta.env.PROD ? "" : "MOCK_SECURE_JWT_TOKEN_STRING")}`
            }
          });
          if (response.ok) {
            const history = await response.json();
            if (history && history.length > 0) {
              setPerformanceHistory(history);
              setSelectedExamId(history[0].id);
              return;
            }
            throw new Error("No remote history records found.");
          }
        } catch (err) {
          console.error("Backend history fetch failed: ", err);
        }
      }
      
      // Fallback if not authenticated or backend connection is offline
      const email = user?.email || "guest";
      const history = JSON.parse(localStorage.getItem(`completedExamsList_${email}`) || "[]");
      setPerformanceHistory(history);
      if (history.length > 0) {
        setSelectedExamId(history[0].id);
      } else {
        setSelectedExamId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Asynchronously fetch dynamic performance diagnosis from the Gemini AI companion
  useEffect(() => {
    if (!selectedExamId) return;
    const active = performanceHistory.find(e => e.id === selectedExamId);
    if (!active || analysisCache[selectedExamId]) return;

    const fetchAnalysisData = async () => {
      setLoadingAnalysis(true);
      const promptText = `Diagnose my exam performance on "${active.topic}". I scored ${active.score} with an accuracy of ${active.accuracy} in ${active.time || '10m'}.`;

      try {
        const response = await fetch("http://localhost:8000/api/v1/chat/diagnose", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("authToken") || (import.meta.env.PROD ? "" : "MOCK_SECURE_JWT_TOKEN_STRING")}`
          },
          body: JSON.stringify({
            user_message: promptText
          })
        });

        if (response.ok) {
          const data = await response.json();
          setAnalysisCache(prev => ({
            ...prev,
            [selectedExamId]: {
              strengths: data.strengths,
              weaknesses: data.weaknesses,
              tips: data.tips
            }
          }));
        }
      } catch (err) {
        console.error("AI Performance fetch failed: ", err);
      } finally {
        setLoadingAnalysis(false);
      }
    };

    fetchAnalysisData();
  }, [selectedExamId, analysisCache, performanceHistory]);

  if (performanceHistory.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] select-none text-center space-y-4 pt-2">
        <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xl shadow-lg shadow-purple-600/5">
          &psi;
        </div>
        <h3 className="text-base font-black text-brand-ash uppercase tracking-wider">No AI Performance Diagnostics Available</h3>
        <p className="text-xs text-brand-ash/40 font-semibold max-w-sm leading-relaxed">
          Start an adaptive practice exam and complete it to generate custom AI model reports here.
        </p>
        <button
          onClick={() => navigate('/explore-tests')}
          className="px-5 py-2.5 bg-brand-amber hover:bg-[#e0951b] text-brand-space font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
        >
          Go to Practice Lab &rarr;
        </button>
      </div>
    );
  }

  // Find active record parameters matching state
  const activeExam = performanceHistory.find(e => e.id === selectedExamId) || performanceHistory[0];

  const activeAnalysis = activeExam?.analysis || analysisCache[selectedExamId] || {
    strengths: loadingAnalysis ? "AI is reviewing your performance metrics..." : "No analysis cached for this exam node.",
    weaknesses: loadingAnalysis ? "AI is auditing accuracy logs..." : "No focus areas compiled.",
    tips: loadingAnalysis ? "AI is generating learning tracks..." : "No recommendations logged."
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none animate-fadeIn pt-2 text-left">
      
      {/* =========================================================================
          LEFT MATRIX SIDEBAR COLUMN: List of All Previous Tests Taken
          ========================================================================= */}
      <div className="lg:col-span-5 bg-brand-midnight border border-brand-slate rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="border-b border-brand-slate/40 pb-3">
          <h2 className="text-lg font-black text-brand-ash tracking-tight">Select Assessment Node</h2>
          <p className="text-[11px] font-semibold text-brand-ash/40">Click any past test module to inspect granular AI analytics logs.</p>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {performanceHistory.map((exam) => {
            const isSelected = selectedExamId === exam.id;
            return (
              <button
                key={exam.id}
                onClick={() => setSelectedExamId(exam.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer block group
                  ${isSelected
                    ? 'border-brand-amber bg-brand-space shadow-md shadow-brand-amber/5'
                    : 'border-brand-slate/60 hover:border-brand-ash/20 bg-brand-space/20'
                  }`}
              >
                <div className="space-y-1">
                  <h4 className={`text-xs font-black transition-colors leading-normal
                    ${isSelected ? 'text-brand-amber' : 'text-brand-ash/80 group-hover:text-brand-ash'}`}>
                    {exam.topic}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-brand-ash/40 pt-1">
                    <span>{exam.date}</span>
                    <span className={isSelected ? 'text-brand-amber font-black' : 'text-brand-ash/60'}>
                      Score: {exam.score}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          RIGHT MAIN ENGINE PANEL: Deep-Dive Dynamic AI Analysis Diagnostics Drawer
          ========================================================================= */}
      <div className="lg:col-span-7 bg-gradient-to-br from-purple-950/15 via-brand-midnight to-brand-midnight border border-purple-500/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        
        {/* Active Analysis Banner Info */}
        <div className="flex items-start gap-4 border-b border-brand-slate/40 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-brand-space flex items-center justify-center font-black text-xl shadow-lg shadow-purple-600/10 flex-shrink-0">
            &psi;
          </div>
          <div className="space-y-0.5 max-w-[80%]">
            <h2 className="text-base font-black text-brand-ash tracking-tight truncate">
              {activeExam.topic}
            </h2>
            <p className="text-xs font-semibold text-purple-400 font-mono">AI Performance Diagnostics Ledger</p>
          </div>
        </div>

        {/* Quick Statistical Context Data Blocks */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-brand-space/40 border border-brand-slate/60 rounded-xl p-3 text-center">
            <span className="text-[9px] font-black text-brand-ash/40 uppercase tracking-wider block">Metric Score</span>
            <span className="text-base font-mono font-black text-brand-amber">{activeExam.score}</span>
          </div>
          <div className="bg-brand-space/40 border border-brand-slate/60 rounded-xl p-3 text-center">
            <span className="text-[9px] font-black text-brand-ash/40 uppercase tracking-wider block">Accuracy</span>
            <span className="text-base font-mono font-black text-brand-ash">{activeExam.accuracy}</span>
          </div>
          <div className="bg-brand-space/40 border border-brand-slate/60 rounded-xl p-3 text-center">
            <span className="text-[9px] font-black text-brand-ash/40 uppercase tracking-wider block">Duration</span>
            <span className="text-base font-mono font-black text-brand-ash/60">{activeExam.time}</span>
          </div>
        </div>

        {/* 3-Part Modular AI Deep Dive Breakdowns */}
        <div className="space-y-4 pt-2">
          
          {/* Card Module 1: Strengths */}
          <div className={`p-4 bg-brand-space/30 border border-brand-slate rounded-xl space-y-1 transition-all ${loadingAnalysis ? 'animate-pulse' : ''}`}>
            <h4 className="text-xs font-black text-brand-ash flex items-center gap-1.5">
              <span className="text-emerald-400">✦</span> What You Did Well
            </h4>
            <p className="text-xs font-semibold text-brand-ash/70 leading-relaxed pl-4">
              {activeAnalysis.strengths}
            </p>
          </div>

          {/* Card Module 2: Deficiencies */}
          <div className={`p-4 bg-brand-space/30 border border-brand-slate rounded-xl space-y-1 transition-all ${loadingAnalysis ? 'animate-pulse' : ''}`}>
            <h4 className="text-xs font-black text-brand-ash flex items-center gap-1.5">
              <span className="text-purple-400">📖</span> Focus Areas
            </h4>
            <p className="text-xs font-semibold text-brand-ash/70 leading-relaxed pl-4">
              {activeAnalysis.weaknesses}
            </p>
          </div>

          {/* Card Module 3: Actionable Advice */}
          <div className={`p-4 bg-brand-space/30 border border-brand-slate rounded-xl space-y-1 transition-all ${loadingAnalysis ? 'animate-pulse' : ''}`}>
            <h4 className="text-xs font-black text-brand-amber flex items-center gap-1.5">
              <span className="text-brand-amber">📈</span> Study Tips
            </h4>
            <p className="text-xs font-semibold text-brand-ash/70 leading-relaxed pl-4">
              {activeAnalysis.tips}
            </p>
          </div>

        </div>

        {/* Exit controls */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-brand-space border border-brand-slate hover:border-brand-ash/30 text-brand-ash font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            &larr; Exit to Dashboard
          </button>
        </div>

      </div>

    </div>
  );
}