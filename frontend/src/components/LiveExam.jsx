import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function LiveExam() {
    const location = useLocation();
    const navigate = useNavigate();

    // Generate unique session_id to group individual question events into one quiz session attempt
    const [sessionId] = useState(() => crypto.randomUUID());

    // Extract chosen topic or default to Computer Science Core
    const chosenTopic = location.state?.topic || "Computer Science Engineering Core";

    // Mock Question Database configured for Computer Science with custom AI hints
    const [questions, setQuestions] = useState([]);
    const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);

    const fetchQuestion = async (index, difficulty, prevQuestions = []) => {
        setIsLoadingQuestion(true);
        try {
            const response = await fetch("http://localhost:8000/api/v1/test/generate-question", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("authToken") || (import.meta.env.PROD ? "" : "MOCK_SECURE_JWT_TOKEN_STRING")}`
                },
                body: JSON.stringify({
                    topic: chosenTopic,
                    difficulty: difficulty,
                    previous_questions: prevQuestions
                })
            });
            if (response.ok) {
                const data = await response.json();
                const newQuestion = {
                    id: index + 1,
                    text: data.text,
                    options: data.options,
                    correct: data.correct_option_index,
                    hint: data.hint
                };
                setQuestions((prev) => {
                    const updated = [...prev];
                    updated[index] = newQuestion;
                    return updated;
                });
            } else {
                throw new Error("Failed to generate question");
            }
        } catch (err) {
            console.error("Error generating question:", err);
            // Fallback question
            const fallback = {
                id: index + 1,
                text: `Explain the core concepts of ${chosenTopic} under difficulty level ${difficulty}.`,
                options: ["Option A", "Option B", "Option C", "Option D"],
                correct: 0,
                hint: "Select Option A for fallback."
            };
            setQuestions((prev) => {
                const updated = [...prev];
                updated[index] = fallback;
                return updated;
            });
        } finally {
            setIsLoadingQuestion(false);
        }
    };

    const totalQuestions = 18;

    // App Core State Hooks
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(30 * 60);

    // Tracking statuses per question position: null = unvisited, 'answered', 'not-answered', 'marked'
    const [questionStatuses, setQuestionStatuses] = useState(Array(totalQuestions).fill(null));
    const [savedAnswers, setSavedAnswers] = useState(Array(totalQuestions).fill(null));

    // AI Hint State Tracking parameters (Unrestricted unlimited mode tracking)
    const [revealedHints, setRevealedHints] = useState(Array(totalQuestions).fill(false));

    // Adaptive testing and Backend connection states
    const [currentDifficulty, setCurrentDifficulty] = useState("EASY");
    const [submittedResults, setSubmittedResults] = useState(Array(totalQuestions).fill(null));
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch initial easy question on component mount
    useEffect(() => {
        fetchQuestion(0, "EASY");
    }, []);

    // Countdown Clock Effect Hook
    useEffect(() => {
        if (isLoadingQuestion) return; // Pause the clock while AI generates the question

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    alert("Time allocation expired. Auto-submitting session metrics.");
                    navigate('/dashboard');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [navigate, isLoadingQuestion]);

    // Format seconds to high-fidelity MM:SS string structure
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Action Handler: Activate Live AI Hint Panel seamlessly without cost checks
    const handleTriggerHint = () => {
        if (revealedHints[currentIdx]) return;

        const updatedHints = [...revealedHints];
        updatedHints[currentIdx] = true;
        setRevealedHints(updatedHints);
    };

    const handleClearAnswer = () => {
        setSelectedOption(null);
    };

    const handleMarkForReview = () => {
        const updatedStatuses = [...questionStatuses];
        updatedStatuses[currentIdx] = 'marked';
        setQuestionStatuses(updatedStatuses);
        advanceToNextQuestion();
    };

    const handleSaveAndNext = async () => {
        if (isSubmitting) return;

        const updatedStatuses = [...questionStatuses];
        const updatedAnswers = [...savedAnswers];
        const updatedResults = [...submittedResults];

        let markedOption = selectedOption;
        if (markedOption !== null) {
            updatedAnswers[currentIdx] = markedOption;
            updatedStatuses[currentIdx] = 'answered';
        } else {
            updatedStatuses[currentIdx] = 'not-answered';
        }

        setIsSubmitting(true);
        let nextDiff = currentDifficulty;
        try {
            const correctIndex = activeQuestion.correct !== undefined ? activeQuestion.correct : 0;
            
            const response = await fetch("http://localhost:8000/api/v1/test/process-submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("authToken") || (import.meta.env.PROD ? "" : "MOCK_SECURE_JWT_TOKEN_STRING")}`
                },
                body: JSON.stringify({
                    question_text: activeQuestion.text,
                    options: activeQuestion.options,
                    correct_option_index: correctIndex,
                    user_selected_index: markedOption,
                    current_difficulty: currentDifficulty,
                    topic: chosenTopic,
                    session_id: sessionId
                })
            });

            if (response.ok) {
                const data = await response.json();
                updatedResults[currentIdx] = {
                    isCorrect: data.is_correct,
                    aiExplanation: data.ai_explanation,
                    nextDifficulty: data.recommended_next_difficulty || currentDifficulty
                };
                
                if (data.recommended_next_difficulty) {
                    nextDiff = data.recommended_next_difficulty;
                    setCurrentDifficulty(nextDiff);
                }
            } else {
                console.error("Failed to submit answer context to backend.");
                updatedResults[currentIdx] = {
                    isCorrect: markedOption === correctIndex,
                    aiExplanation: "Local evaluation fallback (Backend returned error status).",
                    nextDifficulty: currentDifficulty
                };
            }
        } catch (err) {
            console.error("Backend connection error: ", err);
            updatedResults[currentIdx] = {
                isCorrect: markedOption === (activeQuestion.correct !== undefined ? activeQuestion.correct : 0),
                aiExplanation: "Local evaluation fallback (Connection refused).",
                nextDifficulty: currentDifficulty
            };
        } finally {
            setIsSubmitting(false);
            setQuestionStatuses(updatedStatuses);
            setSavedAnswers(updatedAnswers);
            setSubmittedResults(updatedResults);
            
            // Advance to next question dynamically
            if (currentIdx < totalQuestions - 1) {
                const nextIdx = currentIdx + 1;
                if (!questions[nextIdx]) {
                    const prevQuestions = questions.map(q => q ? q.text : "").filter(Boolean);
                    await fetchQuestion(nextIdx, nextDiff, prevQuestions);
                }
                setCurrentIdx(nextIdx);
                setSelectedOption(savedAnswers[nextIdx] !== undefined ? savedAnswers[nextIdx] : null);
            } else {
                alert("You have reached the end of the assessment matrix pipeline.");
            }
        }
    };

    const handleJumpToQuestion = async (index) => {
        if (isSubmitting || isLoadingQuestion) return;
        
        if (!questions[index]) {
            const prevQuestions = questions.map(q => q ? q.text : "").filter(Boolean);
            await fetchQuestion(index, currentDifficulty, prevQuestions);
        }
        setCurrentIdx(index);
        setSelectedOption(savedAnswers[index] !== undefined ? savedAnswers[index] : null);
    };

    const activeQuestion = questions[currentIdx];

    if (questions.length === 0 || !activeQuestion || isLoadingQuestion) {
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[60vh] select-none text-center space-y-5 animate-fadeIn">
                <div className="w-12 h-12 border-4 border-brand-amber border-t-transparent rounded-full animate-spin" />
                <h3 className="text-sm font-black text-brand-ash uppercase tracking-wider">Generating AI Adaptive Problem...</h3>
                <p className="text-[10px] text-brand-ash/40 font-mono font-bold tracking-widest uppercase">Applying model parameters for difficulty: {currentDifficulty}</p>
            </div>
        );
    }

    const countAnswered = questionStatuses.filter(s => s === 'answered').length;
    const countNotAnswered = questionStatuses.filter(s => s === 'not-answered').length;
    const countMarked = questionStatuses.filter(s => s === 'marked').length;

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none animate-fadeIn pt-2">

            {/* LEFT MAIN WORKSPACE COLUMN */}
            <div className="lg:col-span-9 bg-brand-midnight border border-brand-slate rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col justify-between min-h-[70vh]">

                <div>
                    {/* Top Row Context Meta Badges */}
                    <div className="flex items-center justify-between border-b border-brand-slate/40 pb-4 mb-6">
                        <div className="space-y-0.5">
                            <h2 className="text-sm font-black text-brand-ash truncate tracking-tight">{chosenTopic}</h2>
                            <span className="text-[10px] text-brand-ash/40 font-mono font-bold tracking-wider block">
                                QUESTION {currentIdx + 1} OF {totalQuestions}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black tracking-wider px-2 py-0.5 bg-brand-space text-brand-amber border border-brand-amber/30 rounded-md font-mono">MCQ</span>
                            <span className="text-[10px] font-mono font-black tracking-wide text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/20">+4 / -0</span>
                        </div>
                    </div>

                    {/* Core Question Headline Box */}
                    <div className="my-8">
                        <h3 className="text-lg font-extrabold text-brand-ash leading-relaxed">
                            {activeQuestion.text}
                        </h3>
                    </div>

                    {/* Options Interaction Radio Stack */}
                    <div className="space-y-3.5 my-8">
                        {activeQuestion.options.map((option, idx) => {
                            const alphabet = String.fromCharCode(65 + idx);
                            const isChosen = selectedOption === idx;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedOption(idx)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left font-semibold transition-all duration-150 group cursor-pointer
                    ${isChosen
                                            ? 'border-brand-amber bg-brand-space text-brand-amber shadow-md shadow-brand-amber/5'
                                            : 'border-brand-slate/60 hover:border-brand-ash/30 bg-brand-space/30 hover:bg-brand-space/60 text-brand-ash/70 hover:text-brand-ash'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-black font-sans transition-all
                    ${isChosen
                                            ? 'border-brand-amber bg-brand-amber text-brand-space'
                                            : 'border-brand-slate text-brand-ash/40 group-hover:border-brand-ash/60'
                                        }`}
                                    >
                                        {alphabet}
                                    </div>
                                    <span className="text-sm">{option}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Action Helper Assistance Bar Layout */}
                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-brand-slate/40">
                        <button className="flex items-center gap-2 px-4 py-2 bg-brand-space border border-brand-slate rounded-xl text-xs font-bold text-brand-ash/60 hover:text-brand-amber hover:border-brand-amber/30 transition-all cursor-not-allowed opacity-50">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Show Answer <span className="text-[9px] uppercase tracking-wider font-mono opacity-50 px-1 py-0.5 bg-brand-midnight rounded border border-brand-slate">FREE</span>
                        </button>

                        {/* CLEANED UP: Left fully open with a clear "UNLIMITED" badge indicator token */}
                        <button
                            onClick={handleTriggerHint}
                            className={`flex items-center gap-2 px-4 py-2 bg-brand-space border rounded-xl text-xs font-bold transition-all cursor-pointer
                ${revealedHints[currentIdx]
                                    ? 'border-brand-amber text-brand-amber bg-brand-amber/5'
                                    : 'border-brand-slate text-brand-ash/60 hover:text-brand-amber hover:border-brand-amber/30'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            {revealedHints[currentIdx] ? "Hint Unlocked" : "AI Hint"}
                            <span className="text-[9px] text-brand-amber bg-brand-amber/10 px-1 py-0.5 rounded border border-brand-amber/20 font-mono ml-0.5 uppercase tracking-wider">
                                UNLIMITED
                            </span>
                        </button>
                    </div>

                    {/* Dynamic AI Hint Expansion Container Element Panel */}
                    {revealedHints[currentIdx] && (
                        <div className="mt-5 p-4 bg-brand-space border border-brand-amber/30 rounded-xl animate-fadeIn text-left space-y-1.5">
                            <div className="flex items-center gap-2 text-brand-amber text-[10px] font-black uppercase tracking-wider font-mono">
                                <span className="px-1.5 py-0.5 rounded bg-brand-amber/20">&lambda; AI Engine Prompt Hint</span>
                            </div>
                            <p className="text-xs font-semibold text-brand-ash/70 leading-relaxed pl-0.5">
                                {activeQuestion.hint}
                            </p>
                        </div>
                    )}
                </div>

                {/* BOTTOM ACTION CONTROLS DOCK PANEL */}
                <div className="flex items-center justify-between pt-6 mt-8 border-t border-brand-slate/40 flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={handleMarkForReview} className="px-4 py-2.5 text-xs font-bold text-brand-ash/60 hover:text-brand-ash border border-transparent hover:border-brand-slate rounded-xl transition-all cursor-pointer">
                            Mark for review
                        </button>
                        <button onClick={handleClearAnswer} className="px-4 py-2.5 text-xs font-bold text-brand-ash/40 hover:text-rose-400 transition-colors cursor-pointer">
                            Clear answer
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button disabled={currentIdx === 0} onClick={() => handleJumpToQuestion(currentIdx - 1)} className="px-5 py-2.5 bg-brand-space/40 text-brand-ash/50 border border-brand-slate/50 hover:text-brand-ash rounded-xl text-xs font-bold disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer">
                            &larr; Previous
                        </button>
                        <button 
                            disabled={isSubmitting} 
                            onClick={handleSaveAndNext} 
                            className="px-6 py-2.5 bg-brand-amber hover:bg-[#e0951b] text-brand-space rounded-xl text-xs font-black shadow-md shadow-brand-amber/5 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isSubmitting ? "Evaluating..." : "Save & Next \u2192"}
                        </button>
                    </div>
                </div>

            </div>

            {/* RIGHT COLUMN SIDEBAR PANEL */}
            <div className="lg:col-span-3 space-y-6">

                {/* Container Node Box 1: Timer & Live Aggregates */}
                <div className="bg-brand-midnight border border-brand-slate rounded-3xl p-6 shadow-2xl space-y-4 text-center">
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-black tracking-widest text-brand-ash/30 block">Time Remaining</span>
                        <div className="text-4xl font-mono font-black text-brand-amber tracking-tight drop-shadow-sm">
                            {formatTime(timeRemaining)}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-brand-slate/40 flex items-center justify-between text-[11px] font-bold text-brand-ash/40 font-mono">
                        <span>ANSWERED: {countAnswered} / {totalQuestions}</span>
                        <span>ACCURACY: 100%</span>
                    </div>
                </div>

                {/* Container Node Box 2: Visual Structural Status Palette Grid Panel */}
                <div className="bg-brand-midnight border border-brand-slate rounded-3xl p-6 shadow-2xl space-y-5">

                    <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-brand-ash/50 border-b border-brand-slate/40 pb-4">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-emerald-500 flex-shrink-0" />
                            <span>Answered ({countAnswered})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-rose-500 flex-shrink-0" />
                            <span>Not Answered ({countNotAnswered})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-purple-500 flex-shrink-0" />
                            <span>Marked ({countMarked})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded border border-brand-slate bg-brand-space/40 flex-shrink-0" />
                            <span>Not Visited</span>
                        </div>
                    </div>

                    {/* Dynamic 18-Block Core Numeric Navigator Pad Matrix */}
                    <div className="space-y-2">
                        <span className="text-[10px] uppercase font-black tracking-wider text-brand-ash/40 block mb-1">Question Palette Navigator:</span>
                        <div className="grid grid-cols-5 gap-2.5">
                            {Array.from({ length: totalQuestions }).map((_, idx) => {
                                const status = questionStatuses[idx];
                                const isCurrentActive = currentIdx === idx;

                                let customBackground = "bg-brand-space/40 border border-brand-slate/60 text-brand-ash/50";
                                if (status === 'answered') customBackground = "bg-emerald-600 border-emerald-500 text-brand-space font-black";
                                if (status === 'not-answered') customBackground = "bg-rose-600 border-rose-500 text-brand-space font-black";
                                if (status === 'marked') customBackground = "bg-purple-600 border-purple-500 text-brand-space font-black";

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleJumpToQuestion(idx)}
                                        className={`h-9 flex items-center justify-center text-xs font-mono font-bold rounded-xl transition-all shadow-sm cursor-pointer
                      ${customBackground}
                      ${isCurrentActive ? 'ring-2 ring-brand-amber ring-offset-2 ring-offset-brand-space' : ''}
                    `}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Primary Submit Final Session Action */}
                    <div className="pt-2">
                        <button
                            onClick={() => {
                                if (window.confirm("Commit state tokens? This locks metric entries back into your AI profile pipeline.")) {
                                    const actualQuestionsList = Array.from({ length: totalQuestions }).map((_, idx) => {
                                        return questions[idx] || {
                                            id: idx + 1,
                                            text: `[AI Dynamic Node Generator Workspace] This is an instantly cooked, custom evaluation problem testing system logic parameters for index position ${idx + 1}.`,
                                            options: ["Option Alpha Configuration", "Option Beta Framework", "Option Gamma Deployment", "Option Delta Optimization Engine"],
                                            correct: 0
                                        };
                                    });

                                    // Compute dynamic elapsed time
                                    const elapsed = (30 * 60) - timeRemaining;
                                    const mins = Math.floor(elapsed / 60);
                                    const secs = elapsed % 60;
                                    const elapsedStr = `${mins}m ${secs}s`;

                                    navigate('/results', { 
                                        state: { 
                                            topic: chosenTopic, 
                                            answers: savedAnswers,
                                            submittedResults: submittedResults,
                                            questions: actualQuestionsList,
                                            timeTaken: elapsedStr,
                                            elapsedSeconds: elapsed
                                        } 
                                    });
                                }
                            }}
                            className="w-full py-3 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-brand-space font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer text-center block"
                        >
                            Submit Active Exam
                        </button>
                    </div>

                </div>

            </div>

        </div>
    );
}