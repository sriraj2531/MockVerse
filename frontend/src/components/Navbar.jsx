import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo_icon_only_neural_emblem from '../assets/logo_icon_only_neural_emblem.svg';

export default function Navbar({ isLoggedIn, user, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown box automatically if user clicks outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="flex items-center justify-between w-full py-4 bg-transparent relative select-none">
      {/* Left Column: Brand Logo */}
      <Link to="/" className="flex items-center gap-3 cursor-pointer">
        <img
          src={logo_icon_only_neural_emblem}
          alt="MockTestZone Logo"
          className="w-10 h-10 object-contain rounded-full border border-brand-slate bg-brand-midnight p-0.5"
        />
        <div>
          <span className="text-xl font-black tracking-tight text-brand-ash block leading-tight">
            MockTestZone
          </span>
          <span className="text-[10px] text-brand-ash/60 block -mt-0.5 tracking-wide font-medium">
            One Platform for All Competitive Exams
          </span>
        </div>
      </Link>

      {/* Right Column Context State Management */}
      <div className="flex items-center gap-6">
        {!isLoggedIn ? (
          /* STATE A: Logged Out (Guest CTA Buttons Grid Links) */
          <>
            <Link to="/login" className="text-sm font-semibold text-brand-ash/80 hover:text-brand-amber transition-colors">
              Login
            </Link>
            <Link to="/login" className="px-5 py-2 text-sm font-bold text-brand-ash bg-brand-midnight border border-brand-slate rounded-lg hover:border-brand-ash/30 transition-all">
              Sign Up Free
            </Link>
            <Link to="/login" className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-brand-space bg-brand-amber hover:bg-[#e0951b] rounded-lg shadow-md transition-all group">
              Start Practicing &rarr;
            </Link>
          </>
        ) : (
          /* STATE B: Logged In (Profile Selector Badge Panel) */
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-brand-midnight border border-transparent hover:border-brand-slate transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-[#007A78] font-bold text-sm text-white flex items-center justify-center tracking-wide shadow-inner uppercase">
                {user?.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "US"}
              </div>
              <span className="text-sm font-bold text-brand-ash max-w-[130px] truncate hidden sm:block">
                {user?.name || "User"}
              </span>
              <svg 
                className={`w-4 h-4 text-brand-ash/40 transition-transform duration-200 group-hover:text-brand-ash ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Floating Dropdown Card Dialog Drawer */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-brand-midnight border border-brand-slate rounded-2xl shadow-2xl p-4 space-y-3.5 z-50 animate-fadeIn">
                
                {/* User Identity Details Segment */}
                <div className="pb-3 border-b border-brand-slate/50">
                  <h4 className="text-sm font-black text-brand-ash truncate">{user?.name}</h4>
                  <p className="text-xs font-semibold text-brand-ash/50 truncate mt-0.5">{user?.email}</p>
                </div>

                {/* AI Interactive Token Counter Line
                <div className="flex items-center gap-3 py-0.5 text-xs font-bold text-brand-ash/60">
                  <svg className="w-4 h-4 text-purple-400 animate-pulse flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>
                    <strong className="text-brand-ash font-black text-sm">{user?.aiCredits || 0}</strong>
                    <span className="text-brand-ash/40 font-semibold"> / {user?.maxCredits || 10} AI Credits</span>
                  </span>
                </div> */}

                {/* Navigation Links list items */}
                <div className="space-y-1 pt-1 border-t border-brand-slate/50">
                  <button 
                    onClick={() => { setDropdownOpen(false); navigate('/dashboard'); }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-brand-ash/80 hover:bg-brand-space hover:text-brand-ash transition-all group"
                  >
                    <svg className="w-4 h-4 text-brand-ash/30 group-hover:text-brand-amber transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Dashboard
                  </button>

                  <button 
                    onClick={() => { setDropdownOpen(false); navigate('/live-challenge'); }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-brand-ash/80 hover:bg-brand-space hover:text-brand-ash transition-all group"
                  >
                    <svg className="w-4 h-4 text-brand-ash/30 group-hover:text-brand-amber transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Live Challenge
                  </button>

                  <button
                    onClick={() => { setDropdownOpen(false); onLogout(); navigate('/'); }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-rose-400 hover:bg-rose-950/20 transition-all group"
                  >
                    <svg className="w-4 h-4 text-rose-400/50 group-hover:text-rose-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}