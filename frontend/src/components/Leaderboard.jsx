import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

export default function Leaderboard() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract metadata passed down from the route parameters
  const chosenTopic = location.state?.topic || "Computer Science Core Framework";

  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/test/leaderboard/rankings/${encodeURIComponent(chosenTopic)}`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("authToken") || (import.meta.env.PROD ? "" : "MOCK_SECURE_JWT_TOKEN_STRING")}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const mappedRankings = data.rankings.map((item, index) => {
            const initials = item.uid
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return {
              rank: index + 1,
              name: item.uid,
              score: `${item.score}`,
              accuracy: "85%",
              time: "8m 15s",
              initials: initials,
              avatarBg: "bg-indigo-600"
            };
          });
          setRankings(mappedRankings);
        } else {
          throw new Error("Failed to load rankings");
        }
      } catch (err) {
        console.error("Backend leaderboard fetch failed, falling back: ", err);
        const localData = JSON.parse(localStorage.getItem(`leaderboard_${chosenTopic}`) || "[]");
        setRankings(localData);
      }
    };
    fetchRankings();
  }, [chosenTopic]);

  const currentUserName = auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "Student";

  // Separate Top 3 for the Podium Spotlight display view configuration
  const podium = [];
  if (rankings.length > 0) {
    const gold = rankings.find(r => r.rank === 1) || rankings[0];
    podium.push({ ...gold, label: "1st" });
  }
  if (rankings.length > 1) {
    const silver = rankings.find(r => r.rank === 2) || rankings[1];
    podium.push({ ...silver, label: "2nd" });
  }
  if (rankings.length > 2) {
    const bronze = rankings.find(r => r.rank === 3) || rankings[2];
    podium.push({ ...bronze, label: "3rd" });
  }

  // Visual layout sorting order for the podium (2nd, 1st, 3rd)
  const podiumVisual = [];
  if (podium.length > 1) podiumVisual.push(podium.find(p => p.label === "2nd") || podium[1]);
  if (podium.length > 0) podiumVisual.push(podium.find(p => p.label === "1st") || podium[0]);
  if (podium.length > 2) podiumVisual.push(podium.find(p => p.label === "3rd") || podium[2]);

  return (
    <div className="space-y-8 animate-fadeIn select-none pt-2 max-w-4xl mx-auto">
      
      {/* 1. Header Information Section */}
      <div className="text-center space-y-2 border-b border-brand-slate/40 pb-6">
        <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 bg-brand-space text-brand-amber border border-brand-amber/30 rounded-md font-mono">
          GLOBAL RANKINGS
        </span>
        <h1 className="text-4xl font-black text-brand-ash tracking-tight pt-1">
          Top 10 Live Leaderboard
        </h1>
        <p className="text-sm font-semibold text-brand-ash/50 font-mono">
          Topic: <span className="text-brand-amber font-sans font-bold">{chosenTopic}</span>
        </p>
      </div>

      {/* =========================================================================
          SECTION 2: TOP 3 VISUAL PODIUM SPOTLIGHT BLOCKS
          ========================================================================= */}
      {podiumVisual.length > 0 && (
        <div className="grid grid-cols-3 gap-4 items-end justify-center max-w-2xl mx-auto pt-6 pb-2">
          {podiumVisual.map((user) => {
            const isGold = user.label === "1st";
            const isSilver = user.label === "2nd";
            
            return (
              <div 
                key={user.rank} 
                className={`flex flex-col items-center space-y-3 text-center transition-transform hover:scale-[1.02]
                  ${isGold ? 'order-2 z-10' : isSilver ? 'order-1 pb-4' : 'order-3 pb-6'}`}
              >
                {/* Profile Monogram Pin Badge */}
                <div className="relative">
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${user.avatarBg} font-black text-base md:text-lg text-white flex items-center justify-center shadow-2xl border-2 
                    ${isGold ? 'border-brand-amber ring-4 ring-brand-amber/20 w-18 h-18 md:w-20 md:h-20 text-xl' : isSilver ? 'border-slate-400' : 'border-amber-700'}`}>
                    {user.initials}
                  </div>
                  {/* Crown/Rank Indicator Floater Icon Tag */}
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md text-brand-space
                    ${isGold ? 'bg-brand-amber text-xs -top-4 font-black px-2.5' : isSilver ? 'bg-slate-400' : 'bg-amber-700 text-white'}`}>
                    {user.label}
                  </span>
                </div>

                {/* Podium Block Base Elevation Structure */}
                <div className={`w-full bg-brand-midnight border border-brand-slate/60 rounded-2xl p-4 shadow-xl space-y-1
                  ${isGold ? 'h-36 bg-gradient-to-t from-brand-midnight to-brand-amber/5 border-brand-amber/30' : 'h-28'}`}>
                  <h3 className="text-xs md:text-sm font-black text-brand-ash truncate max-w-[100px] sm:max-w-none mx-auto">{user.name}</h3>
                  <div className="text-sm font-black text-brand-amber font-mono pt-1">{user.score}</div>
                  <div className="text-[10px] text-brand-ash/40 font-mono font-bold">Time: {user.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          SECTION 3: TOP 10 SCANSTABLE LEADERBOARD GRID ARRAY
          ========================================================================= */}
      <div className="bg-brand-midnight border border-brand-slate rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-space/50 border-b border-brand-slate/60 text-[10px] font-black uppercase tracking-widest text-brand-ash/40 font-mono">
                <th className="p-4 text-center w-16">Rank</th>
                <th className="p-4">User Profile</th>
                <th className="p-4 text-center">Score</th>
                <th className="p-4 text-center">Accuracy</th>
                <th className="p-4 text-center">Time Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate/40 text-xs font-semibold text-brand-ash/80">
              {rankings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-brand-ash/30 font-semibold italic">
                    No leaderboard entries recorded for this topic yet. Complete a practice exam to place your rank!
                  </td>
                </tr>
              ) : (
                rankings.map((user) => (
                  <tr 
                    key={user.rank} 
                    className={`transition-colors hover:bg-brand-space/20
                      ${user.name === currentUserName ? 'bg-brand-amber/5 border-l-4 border-l-brand-amber' : ''}`}
                  >
                    {/* Rank Position Identification Block */}
                    <td className="p-4 text-center font-mono font-black text-sm">
                      {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : user.rank === 3 ? "🥉" : user.rank}
                    </td>

                    {/* Profile Initials Avatar + Full Name Label */}
                    <td className="p-4 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${user.avatarBg} font-bold text-[11px] text-white flex items-center justify-center tracking-wide shadow-inner flex-shrink-0`}>
                        {user.initials}
                      </div>
                      <span className="font-black text-brand-ash">{user.name}</span>
                      {user.name === currentUserName && (
                        <span className="text-[9px] font-mono font-black uppercase tracking-wider text-brand-amber bg-brand-amber/10 border border-brand-amber/20 px-1.5 py-0.5 rounded ml-1">
                          You
                        </span>
                      )}
                    </td>

                    {/* Absolute Scoring Record */}
                    <td className="p-4 text-center font-mono font-black text-brand-amber text-sm">
                      {user.score}
                    </td>

                    {/* Precision Performance Metrics Percent */}
                    <td className="p-4 text-center font-mono font-bold text-brand-ash/60">
                      {user.accuracy}
                    </td>

                    {/* Completion Duration Tracking Clock */}
                    <td className="p-4 text-center font-mono font-bold text-brand-ash/40">
                      {user.time}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Navigation Back Links Control Node Dock */}
      <div className="flex justify-between items-center pt-2">
        <button 
          onClick={() => navigate('/explore-tests')}
          className="px-5 py-3 bg-brand-midnight border border-brand-slate hover:border-brand-ash/30 text-brand-ash font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          &larr; Back to Practice Lab
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