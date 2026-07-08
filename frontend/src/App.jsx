import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroLeft from './components/HeroLeft';
import QuizCard from './components/QuizCard';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ExamExplorer from './components/ExamExplorer';
import InstructionPage from './components/InstructionPage';
import LiveExam from './components/LiveExam';
import ResultsPage from './components/ResultsPage';
import Leaderboard from './components/Leaderboard';
import AiChatBot from './components/AiChatBot';
import AiPerformance from './components/AiPerformance';
import LiveGroupChallenge from './components/LiveGroupChallenge';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function App() {
  // Global authentication state management
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Dynamic user data object that updates the header layout components
  const [user, setUser] = useState(null);

  // Sync with Firebase Auth session state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsLoggedIn(true);
        setUser({
          name: firebaseUser.displayName || "Student",
          email: firebaseUser.email || "",
          aiCredits: 10,
          maxCredits: 10
        });
        const token = await firebaseUser.getIdToken();
        localStorage.setItem("authToken", token);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem("authToken");
      }
    });
    return () => unsubscribe();
  }, []);

  // Handler to smoothly drop session states back to guest view configurations
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase Signout Error: ", err);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-brand-space text-brand-ash font-sans antialiased selection:bg-brand-amber/30 selection:text-brand-amber">
        
        {/* Global Navigation Header Wrapper */}
        <header className="max-w-7xl mx-auto px-6 border-b border-brand-slate/40">
          <Navbar isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />
        </header>

        {/* Global Application View Port */}
        <main className="max-w-7xl mx-auto px-6 pt-12 pb-20">
          <Routes>
            
            {/* 1. Core Home Page Split Landing Presentation View */}
            <Route path="/" element={
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[70vh]">
                <section className="lg:col-span-7">
                  {/* Passing auth state parameter down to hero area controls */}
                  <HeroLeft isLoggedIn={isLoggedIn} />
                </section>
                <section className="lg:col-span-5 flex justify-center lg:justify-end">
                  <QuizCard />
                </section>
              </div>
            } />

            {/* 2. Onboarding Channels: Login Sub-page Route */}
            <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
            
            {/* 3. Onboarding Channels: Shared Context Signup Sub-page Route */}
            <Route path="/signup" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
            
            {/* 4. Complete Metrics & Study Tips User Dashboard Route */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* 5. Complete CSE Student Exam Explorer Test Series Catalog Route */}
            <Route path="/explore-tests" element={<ExamExplorer />} />
            
            {/* 6. Pre-Exam Briefing Instructions Route */}
            <Route path="/instructions" element={<InstructionPage />} />

            {/* 7. Fully Operational Live Testing Engine Interface Route */}
            <Route path="/live-exam" element={<LiveExam />} />

            {/* 8. Newly Registered Assessment Analytics Results Route */}
            <Route path="/results" element={<ResultsPage />} />

            {/* 9. Registered Global Top 10 Live Leaderboard Route */}
            <Route path="/leaderboard" element={<Leaderboard />} />

            {/* 10. Route to AI performance analysis Page */}
            <Route path="/ai-performance" element={<AiPerformance />} />

            {/* 11. Route to Live group challenge page */}
            <Route path="/live-challenge" element={<LiveGroupChallenge />} />

            


          </Routes>
        </main>

        {/* 2. Global Persistent AI Floating Widget Placement */}
        <AiChatBot />
        
      </div>
    </Router>
  );
}