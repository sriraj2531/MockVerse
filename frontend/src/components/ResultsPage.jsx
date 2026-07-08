import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

// Define mock database questions to evaluate review rows
const questionsData = [
    { id: 1, text: "Which of the following data structures operates on a Last-In, First-Out (LIFO) access strategy?", options: ["Queue", "Stack", "Binary Tree", "Linked List"], correct: 1 },
    { id: 2, text: "What is the worst-case time complexity of inserting an element into a balanced AVL search tree?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], correct: 1 },
    { id: 3, text: "Which layer of the standard OSI model handles network packet routing, framing, and logical mapping protocols?", options: ["Transport Layer", "Data Link Layer", "Network Layer", "Physical Layer"], correct: 2 },
    { id: 4, text: "In a relational database platform system, which normal formal structure isolates partial dependency conditions?", options: ["1NF", "2NF", "3NF", "BCNF"], correct: 1 }
];

const colors = ["bg-[#007A78]", "bg-indigo-600", "bg-purple-600", "bg-rose-600", "bg-amber-600", "bg-emerald-600", "bg-blue-600", "bg-teal-600", "bg-fuchsia-600", "bg-slate-600"];
const getRandomAvatarBg = () => colors[Math.floor(Math.random() * colors.length)];

export default function ResultsPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Check if the page is being loaded from history list mode (no active test answers passed)
    const isViewingHistoryList = !location.state?.answers;

    // Extract metadata passed down from the completed test session
    const chosenTopic = location.state?.topic || "Computer Science Core Framework";
    const savedAnswers = location.state?.answers || [1, null, 0, 3]; // Fallback mock values
    const submittedResults = location.state?.submittedResults;
    const questions = location.state?.questions || questionsData;

    const totalQuestions = 18;

    // States to drive interactive drop drawers and loading flags
    const [showAiAnalysis, setShowAiAnalysis] = useState(false);
    const [loadingAi, setLoadingAi] = useState(false);
    const [showReviewList, setShowReviewList] = useState(false);
    const [aiAnalysisText, setAiAnalysisText] = useState(null);
    const [examHistory, setExamHistory] = useState([]);

    // Listen to Firebase Auth state to load user-specific exam history
    React.useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            const email = user?.email || "guest";
            const history = JSON.parse(localStorage.getItem(`completedExamsList_${email}`) || "[]");
            setExamHistory(history);
        });
        return () => unsubscribe();
    }, []);

    // Calculate metric values dynamically if active test is completed
    const totalQs = savedAnswers ? savedAnswers.length : totalQuestions;
    const countCorrect = submittedResults 
        ? submittedResults.filter(r => r && r.isCorrect).length 
        : 2;

    const countAttempted = savedAnswers 
        ? savedAnswers.filter(a => a !== null).length 
        : 5;

    const countWrong = savedAnswers 
        ? countAttempted - countCorrect 
        : 3;

    const countSkipped = savedAnswers 
        ? savedAnswers.filter(a => a === null).length 
        : 13;

    const scorePercentage = Math.round((countCorrect / totalQs) * 100);
    const completionTime = location.state?.timeTaken;
    const accuracyPercentage = countAttempted > 0 
        ? `${Math.round((countCorrect / countAttempted) * 100)}%` 
        : "0%";

    // Sync results metrics to localStorage for dashboard tracking
    React.useEffect(() => {
        if (!isViewingHistoryList) {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                const email = user?.email || "guest";
                const completedCount = parseInt(localStorage.getItem(`examsCompleted_${email}`) || "0", 10);
                const savedScores = JSON.parse(localStorage.getItem(`examScores_${email}`) || "[]");
                const scorePct = Math.round((countCorrect / totalQs) * 100);

                // Prevent duplicate records on simple page reload via session tokening
                const sessionKey = `saved_${chosenTopic}_${countCorrect}_${totalQs}_${email}`;
                if (!sessionStorage.getItem(sessionKey)) {
                    localStorage.setItem(`examsCompleted_${email}`, String(completedCount + 1));
                    savedScores.push(scorePct);
                    localStorage.setItem(`examScores_${email}`, JSON.stringify(savedScores));

                    // Save dynamic exam record
                    const existingHistory = JSON.parse(localStorage.getItem(`completedExamsList_${email}`) || "[]");
                    const currentDate = new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });
                    
                    const currentAttempt = {
                        id: Date.now(),
                        topic: chosenTopic,
                        date: currentDate,
                        score: `${countCorrect}/${totalQs}`,
                        accuracy: countAttempted > 0 ? `${Math.round((countCorrect / countAttempted) * 100)}%` : "0%",
                        time: completionTime || "10m 42s"
                    };
                    
                    localStorage.setItem(`completedExamsList_${email}`, JSON.stringify([currentAttempt, ...existingHistory]));

                    // Asynchronously save final exam results to Redis and Firestore
                    fetch("http://localhost:8000/api/v1/test/save-results", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${localStorage.getItem("authToken") || (import.meta.env.PROD ? "" : "MOCK_SECURE_JWT_TOKEN_STRING")}`
                        },
                        body: JSON.stringify({
                            topic: chosenTopic,
                            score: countCorrect,
                            total_questions: totalQs,
                            accuracy: countAttempted > 0 ? `${Math.round((countCorrect / countAttempted) * 100)}%` : "0%",
                            time_taken: completionTime || "10m 42s"
                        })
                    }).catch(err => console.error("Error syncing final exam results: ", err));

                    // Save dynamic leaderboard entry for this specific exam topic
                    const leaderboardKey = `leaderboard_${chosenTopic}`;
                    const existingLeaderboard = JSON.parse(localStorage.getItem(leaderboardKey) || "[]");
                    
                    const name = user?.displayName || user?.email?.split('@')[0] || "Student";
                    const initials = name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                        
                    const leaderboardAttempt = {
                        rank: 1,
                        name: name,
                        score: `${countCorrect}/${totalQs}`,
                        correctCount: countCorrect,
                        accuracy: countAttempted > 0 ? `${Math.round((countCorrect / countAttempted) * 100)}%` : "0%",
                        time: completionTime || "10m 42s",
                        timeSeconds: location.state?.elapsedSeconds || 642,
                        initials: initials,
                        avatarBg: getRandomAvatarBg()
                    };

                    // Only keep the best run of this specific user in the leaderboard
                    const userExistingIdx = existingLeaderboard.findIndex(item => item.name === name);
                    if (userExistingIdx > -1) {
                        const existingRec = existingLeaderboard[userExistingIdx];
                        if (
                            countCorrect > existingRec.correctCount ||
                            (countCorrect === existingRec.correctCount && (location.state?.elapsedSeconds || 642) < existingRec.timeSeconds)
                        ) {
                            existingLeaderboard[userExistingIdx] = leaderboardAttempt;
                        }
                    } else {
                        existingLeaderboard.push(leaderboardAttempt);
                    }

                    // Sort leaderboard ranking list
                    existingLeaderboard.sort((a, b) => {
                        if (b.correctCount !== a.correctCount) {
                            return b.correctCount - a.correctCount;
                        }
                        return (a.timeSeconds || 0) - (b.timeSeconds || 0);
                    });

                    // Assign ranks dynamically
                    existingLeaderboard.forEach((item, index) => {
                        item.rank = index + 1;
                    });

                    localStorage.setItem(leaderboardKey, JSON.stringify(existingLeaderboard));
                    sessionStorage.setItem(sessionKey, "true");
                }
            });
            return () => unsubscribe();
        }
    }, [isViewingHistoryList, countCorrect, totalQs, chosenTopic, countAttempted, completionTime, location.state?.elapsedSeconds]);

    // Handler to query backend AI chat for detailed diagnostic insight
    const handleTriggerAiAnalysis = async () => {
        setLoadingAi(true);
        
        const activeAnswers = savedAnswers;
        const promptText = `Please diagnose my performance on the "${chosenTopic}" exam. I answered ${countCorrect} questions correctly out of ${totalQs} total questions. Here is the question-by-question breakdown of my answers:
${questions.map((q, idx) => `Question ${idx+1}: "${q.text}" -> Option chosen: ${activeAnswers ? activeAnswers[idx] : 'None'} (Correct option is ${q.correct}). Evaluation: ${submittedResults && submittedResults[idx] ? (submittedResults[idx].isCorrect ? 'Correct' : 'Incorrect') : (activeAnswers && activeAnswers[idx] === q.correct ? 'Correct' : 'Incorrect')}`).join('\n')}

Please provide a detailed summary structured as follows:
- **Your Strengths**: (Highlight 2 areas of strength)
- **Identified Focus Areas**: (Highlight 2 concepts to review)
- **Actionable Tips**: (Provide 2 concrete study suggestions)`;

        try {
            const response = await fetch("http://localhost:8000/api/v1/chat/stream-converse", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("authToken") || "MOCK_SECURE_JWT_TOKEN_STRING"}`
                },
                body: JSON.stringify({
                    user_message: promptText
                })
            });

            if (response.ok) {
                const data = await response.json();
                setAiAnalysisText(data.bot_response);
                setShowAiAnalysis(true);
            } else {
                throw new Error("API responded with an error");
            }
        } catch (err) {
            console.error("AI Analysis failed: ", err);
            // Fallback content if backend fails
            setAiAnalysisText(`### Your Strengths:\n• Good initial performance on core concepts.\n• High execution rate on baseline arrays.\n\n### Identified Focus Areas:\n• Complexity errors on tree balancing routines.\n• Partial key functional dependency rules.\n\n### Actionable Tips:\n• Solve 3 targeted AVL runtime exercises.\n• Practice normal forms routing with hints.`);
            setShowAiAnalysis(true);
        } finally {
            setLoadingAi(false);
        }
    };

    // =========================================================================
    // CONDITION A: HISTORICAL EXAM RESULTS DASHBOARD (View Results Trigger)
    // =========================================================================
    if (isViewingHistoryList) {
        return (
            <div className="space-y-6 animate-fadeIn select-none pt-2 max-w-5xl mx-auto text-left">
                <div className="border-b border-brand-slate/40 pb-4">
                    <h1 className="text-3xl font-black text-brand-ash tracking-tight">Your Past Exam Results</h1>
                    <p className="text-xs font-semibold text-brand-ash/40">Review performance benchmarks and stats for all AI exams generated on your profile.</p>
                </div>

                <div className="bg-brand-midnight border border-brand-slate rounded-3xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-brand-space/50 border-b border-brand-slate/60 text-[10px] font-black uppercase tracking-widest text-brand-ash/40 font-mono">
                                    <th className="p-4">Exam Topic Node</th>
                                    <th className="p-4">Date Completed</th>
                                    <th className="p-4 text-center">Score</th>
                                    <th className="p-4 text-center">Accuracy</th>
                                    <th className="p-4 text-center">Time Taken</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-slate/40 text-xs font-semibold text-brand-ash/80">
                                {examHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-brand-ash/30 font-semibold italic">
                                            No exams completed yet. Start a new practice exam to record metrics!
                                        </td>
                                    </tr>
                                ) : (
                                    examHistory.map((exam) => (
                                        <tr key={exam.id} className="transition-colors hover:bg-brand-space/20">
                                            <td className="p-4 font-black text-brand-ash">{exam.topic}</td>
                                            <td className="p-4 text-brand-ash/60 font-mono">{exam.date}</td>
                                            <td className="p-4 text-center font-mono font-black text-brand-amber text-sm">{exam.score}</td>
                                            <td className="p-4 text-center font-mono text-brand-ash/60">{exam.accuracy}</td>
                                            <td className="p-4 text-center font-mono text-brand-ash/40">{exam.time}</td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => navigate('/leaderboard', { state: { topic: exam.topic } })}
                                                    className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 bg-brand-space border border-brand-slate rounded-lg text-brand-amber hover:border-brand-amber/40 hover:bg-brand-amber/5 transition-all cursor-pointer"
                                                >
                                                    Leaderboard
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-start pt-2">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="px-5 py-3 bg-brand-midnight border border-brand-slate hover:border-brand-ash/30 text-brand-ash font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                        &larr; Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================================
    // CONDITION B: SINGLE EXAM DEEP DIVE PERFORMANCE REPORT CARD
    // =========================================================================
    return (
        <div className="space-y-8 animate-fadeIn select-none pt-2">

            {/* =========================================================================
          SECTION 1: CORE RESULTS SCORECARD CONTAINER GRID (image_a15c85.png)
          ========================================================================= */}
            <div className="bg-brand-midnight border border-brand-slate rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">

                {/* Top Title Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-brand-slate/40 pb-4 gap-4">
                    <div className="space-y-1 text-left">
                        <h1 className="text-2xl font-black text-brand-ash tracking-tight">{chosenTopic}</h1>
                        <p className="text-xs font-semibold text-brand-ash/40">July 4, 2026 at 09:09 PM</p>
                    </div>
                    <div className="flex items-center gap-3 self-start sm:self-center">
                        <button
                            onClick={() => navigate('/leaderboard', { state: { topic: chosenTopic } })}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-brand-space border border-brand-amber/30 text-brand-amber hover:bg-brand-amber/5 rounded-lg transition-all cursor-pointer"
                        >
                            🏆 View Topic Leaderboard
                        </button>
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                            ✓ Completed
                        </span>
                    </div>
                </div>

                {/* What Went Well Context Card Box */}
                <div className="bg-brand-space/40 border border-brand-slate/40 rounded-2xl p-5 space-y-3 text-left">
                    <div className="flex items-center gap-2 text-xs font-black text-brand-ash uppercase tracking-wider">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        What Went Well
                    </div>
                    <ul className="space-y-2 text-xs font-bold text-brand-ash/70 pl-0.5">
                        <li className="flex items-center gap-2 text-emerald-400">✓ <span className="text-brand-ash/70">You got {countCorrect} questions correct</span></li>
                        <li className="flex items-center gap-2">✔ <span className="text-brand-ash/70">You completed the test – that takes dedication</span></li>
                        <li className="flex items-center gap-2">🔄 <span className="text-brand-ash/70">Practice builds mastery</span></li>
                    </ul>
                </div>

                {/* Aggregated Score Bar */}
                <div className="space-y-2 pt-2 text-left">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-brand-ash font-mono">{countCorrect}</span>
                        <span className="text-xl font-bold text-brand-ash/40">/{totalQuestions}</span>
                        <span className="text-sm font-extrabold text-brand-ash/60 ml-2">correct ({scorePercentage}%)</span>
                    </div>
                    {/* Progress track */}
                    <div className="w-full h-3 bg-brand-space rounded-full overflow-hidden border border-brand-slate/40">
                        <div className="h-full bg-brand-amber rounded-full" style={{ width: `${scorePercentage}%` }} />
                    </div>
                    <p className="text-xs font-semibold text-brand-ash/40">You answered {scorePercentage}% of questions correctly</p>
                </div>

                {/* 5-Column Grid Matrix Layout Row */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
                    {/* Card A: Correct */}
                    <div className="bg-emerald-950/10 border border-emerald-500/30 rounded-2xl p-4 space-y-1 text-left">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">✓ Correct</span>
                        <span className="text-2xl font-black text-brand-ash block font-mono">{countCorrect}</span>
                    </div>
                    {/* Card B: Wrong */}
                    <div className="bg-rose-950/10 border border-rose-500/30 rounded-2xl p-4 space-y-1 text-left">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block">✕ Wrong</span>
                        <span className="text-2xl font-black text-brand-ash block font-mono">{countWrong}</span>
                    </div>
                    {/* Card C: Skipped */}
                    <div className="bg-brand-space/60 border border-brand-slate/40 rounded-2xl p-4 space-y-1 text-left">
                        <span className="text-[10px] font-black text-brand-ash/40 uppercase tracking-wider block">⊖ Skipped</span>
                        <span className="text-2xl font-black text-brand-ash block font-mono">{countSkipped}</span>
                    </div>
                    {/* Card D: Attempted */}
                    <div className="bg-brand-space/60 border border-brand-slate/40 rounded-2xl p-4 space-y-1 text-left">
                        <span className="text-[10px] font-black text-brand-ash/40 uppercase tracking-wider block">◎ Attempted</span>
                        <span className="text-2xl font-black text-brand-ash block font-mono">{countAttempted}</span>
                    </div>
                    {/* Card E: Elapsed Duration */}
                    <div className="bg-brand-space/60 border border-brand-slate/40 rounded-2xl p-4 space-y-1 text-left">
                        <span className="text-[10px] font-black text-brand-ash/40 uppercase tracking-wider block">🕒 Time Elapsed</span>
                        <span className="text-xl font-black text-brand-ash block pt-0.5 truncate font-mono">{completionTime}</span>
                    </div>
                </div>

                {/* Bottom Accuracy Segment Footer */}
                <div className="text-xs font-bold text-brand-ash/50 pt-2 font-mono text-left">
                    Accuracy on attempted questions: <span className="text-brand-ash font-black">{accuracyPercentage}</span>
                </div>

            </div>

            {/* =========================================================================
          SECTION 2: AI STUDY ASSISTANT CONFIGURATOR MODULE (image_a15cc5.png)
          ========================================================================= */}
            <div className="bg-gradient-to-r from-purple-950/20 via-indigo-950/10 to-transparent border border-purple-500/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600 text-brand-space flex items-center justify-center font-black text-xl shadow-lg shadow-purple-600/10 flex-shrink-0">
                        &psi;
                    </div>
                    <div className="space-y-0.5 text-left">
                        <h2 className="text-lg font-black text-brand-ash tracking-tight flex items-center gap-1.5">
                            AI Study Assistant
                            <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/40 border border-purple-500/20 px-1.5 py-0.5 rounded">Personalized</span>
                        </h2>
                        <p className="text-xs font-semibold text-brand-ash/50">Get personalized study tips based on your performance matrix metrics.</p>
                    </div>
                </div>

                {/* Three Target Topic Sub-cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Subcard 1: Strengths */}
                    <div className="bg-brand-midnight/60 border border-brand-slate rounded-2xl p-4 space-y-1 text-left">
                        <h4 className="text-xs font-black text-brand-ash flex items-center gap-1.5">
                            <span className="text-purple-400">✦</span> What You Did Well
                        </h4>
                        <p className="text-[11px] font-semibold text-brand-ash/40">Discover your strengths and build on them seamlessly.</p>
                    </div>
                    {/* Subcard 2: Deficiencies */}
                    <div className="bg-brand-midnight/60 border border-brand-slate rounded-2xl p-4 space-y-1 text-left">
                        <h4 className="text-xs font-black text-brand-ash flex items-center gap-1.5">
                            <span className="text-purple-400">📖</span> Focus Areas
                        </h4>
                        <p className="text-[11px] font-semibold text-brand-ash/40">Isolate critical sub-topics to review for better exam results.</p>
                    </div>
                    {/* Subcard 3: Actionable Advice */}
                    <div className="bg-brand-midnight/60 border border-brand-slate rounded-2xl p-4 space-y-1 text-left">
                        <h4 className="text-xs font-black text-brand-ash flex items-center gap-1.5">
                            <span className="text-purple-400">📈</span> Study Tips
                        </h4>
                        <p className="text-[11px] font-semibold text-brand-ash/40">Receive personalized suggestions to improve recall speed and execution.</p>
                    </div>
                </div>

                {/* Live Trigger Action Button */}
                <div className="flex flex-col items-center justify-center pt-2 space-y-3">
                    <button
                        disabled={loadingAi}
                        onClick={handleTriggerAiAnalysis}
                        className="flex items-center gap-2 px-6 py-3 font-black text-xs uppercase tracking-wider text-brand-space bg-brand-amber hover:bg-[#e0951b] rounded-xl shadow-lg shadow-brand-amber/5 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {loadingAi ? "Analyzing Performance..." : "View AI Analysis →"}
                    </button>
                    <p className="text-[11px] font-bold text-brand-ash/30">Our AI analyzes your performance metrics to provide helpful study suggestions</p>
                </div>

                {/* Dynamic AI Generation Reveal Pane Panel */}
                {showAiAnalysis && (
                    <div className="mt-6 p-6 bg-brand-space/80 border border-purple-500/30 rounded-2xl space-y-4 animate-fadeIn text-left">
                        <h3 className="text-sm font-black text-purple-400 tracking-wider uppercase font-mono">&lambda; Live Model Diagnosis Logs:</h3>
                        <div className="text-xs leading-relaxed font-semibold text-brand-ash/80 whitespace-pre-line bg-brand-midnight/40 p-4 rounded-xl border border-brand-slate/40">
                            {aiAnalysisText}
                        </div>
                    </div>
                )}

            </div>

            {/* =========================================================================
          SECTION 3: INTERACTIVE EXPANDABLE REVIEW WORKSPACE DRAWER (image_a15cc5.png)
          ========================================================================= */}
            <div className="bg-brand-midnight border border-brand-slate rounded-3xl shadow-xl overflow-hidden">

                {/* Toggle Anchor Row */}
                <button
                    onClick={() => setShowReviewList(!showReviewList)}
                    className="w-full flex items-center justify-between p-5 bg-transparent hover:bg-brand-space/20 transition-colors text-left cursor-pointer group"
                >
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-brand-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        <div className="space-y-0.5">
                            <h3 className="text-sm font-black text-brand-ash group-hover:text-brand-amber transition-colors">Review Your Answers</h3>
                            <p className="text-[11px] font-semibold text-brand-ash/40 flex items-center gap-1.5">
                                See detailed solutions and explanations
                                <span className="text-[9px] font-mono text-purple-400 bg-purple-950/40 px-1 py-0.5 rounded border border-purple-500/20">AI Available</span>
                            </p>
                        </div>
                    </div>
                    <svg className={`w-5 h-5 text-brand-ash/40 group-hover:text-brand-ash transition-transform duration-200 ${showReviewList ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>

                {/* Expandable Questionnaire Mapping List Block */}
                {showReviewList && (
                    <div className="p-6 bg-brand-space/30 border-t border-brand-slate/40 space-y-6 max-h-[60vh] overflow-y-auto divide-y divide-brand-slate/40 animate-fadeIn">
                        {questions.map((q, qIdx) => {
                            const markedOptionIdx = savedAnswers[qIdx];
                            const isCorrect = submittedResults && submittedResults[qIdx] 
                                ? submittedResults[qIdx].isCorrect 
                                : markedOptionIdx === q.correct;

                            return (
                                <div key={q.id || qIdx} className="pt-5 first:pt-0 space-y-4 text-left">
                                    <div className="flex items-start gap-3">
                                        <span className="w-6 h-6 flex items-center justify-center bg-brand-midnight border border-brand-slate text-brand-ash/40 font-mono text-[11px] font-black rounded-lg flex-shrink-0 mt-0.5">
                                            {qIdx + 1}
                                        </span>
                                        <h4 className="text-sm font-bold text-brand-ash leading-relaxed">{q.text}</h4>
                                    </div>

                                    {/* Options Stack Row Viewers */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-9">
                                        {q.options.map((opt, oIdx) => {
                                            const alphabet = String.fromCharCode(65 + oIdx);
                                            const isUserSelection = markedOptionIdx === oIdx;
                                            const isCorrectChoice = q.correct === oIdx;

                                            let rowColors = "border-brand-slate/40 bg-brand-midnight/40 text-brand-ash/50";
                                            if (isCorrectChoice) rowColors = "border-emerald-500 bg-emerald-950/20 text-emerald-400 font-bold";
                                            else if (isUserSelection && !isCorrect) rowColors = "border-rose-500 bg-rose-950/20 text-rose-400 font-bold";

                                            return (
                                                <div key={oIdx} className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${rowColors}`}>
                                                    <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-black font-mono
                            ${isCorrectChoice ? 'bg-emerald-500 text-brand-space' : isUserSelection ? 'bg-rose-500 text-brand-space' : 'bg-brand-space text-brand-ash/30'}`}>
                                                        {alphabet}
                                                    </span>
                                                    <span>{opt}</span>
                                                    {isUserSelection && <span className="text-[9px] font-black uppercase tracking-wider font-sans ml-auto">Your Choice</span>}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Dynamic AI Explanation Card Box */}
                                    {((submittedResults && submittedResults[qIdx]?.aiExplanation) || q.explanation) && (
                                        <div className="mt-3.5 ml-9 p-4 bg-brand-space/80 border border-brand-amber/20 rounded-xl space-y-1.5 animate-fadeIn">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-brand-amber font-mono block">
                                                &lambda; AI Conceptual Explanation
                                            </span>
                                            <p className="text-xs font-semibold text-brand-ash/70 leading-relaxed">
                                                {submittedResults && submittedResults[qIdx]?.aiExplanation 
                                                    ? submittedResults[qIdx].aiExplanation 
                                                    : q.explanation}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>

            {/* Global Core Workspace Route Exit Buttons */}
            <div className="flex justify-end gap-3 pt-2">
                <button
                    onClick={() => navigate('/explore-tests')}
                    className="px-5 py-3 bg-brand-midnight border border-brand-slate hover:border-brand-ash/30 text-brand-ash font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                    Back to Practice Lab
                </button>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-5 py-3 bg-brand-space text-brand-amber font-extrabold text-xs rounded-xl hover:underline transition-all cursor-pointer"
                >
                    Return to Dashboard Console &rarr;
                </button>
            </div>

        </div>
    );
}