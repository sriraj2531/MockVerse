import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function Login({ setIsLoggedIn }) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const isSignUp = window.location.pathname === '/signup';

  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg(null);
      await signInWithPopup(auth, googleProvider);
      setIsLoggedIn(true);
      navigate('/');
    } catch (err) {
      console.error("Google Sign-In failed:", err);
      setErrorMsg("Google authentication failed. Please check your credentials or try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setIsLoggedIn(true);
      navigate('/');
    } catch (err) {
      console.error("Email authentication failed:", err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMsg("This email is already in use. Please log in instead.");
      } else if (err.code === "auth/weak-password") {
        setErrorMsg("Password is too weak. Must be at least 6 characters.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setErrorMsg("Invalid email or password combination.");
      } else {
        setErrorMsg("Authentication failed. Please verify your credentials.");
      }
    }
  };

  return (
    <div className="w-full min-h-[80vh] grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-4 animate-fadeIn">
      
      {/* LEFT COLUMN: Feature Showcase Slider */}
      <div className="md:col-span-5 flex flex-col items-center text-center px-4 space-y-6">
        <div className="w-20 h-20 rounded-full border-2 border-brand-amber bg-brand-midnight flex items-center justify-center text-brand-amber shadow-lg">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
        </div>

        <div className="space-y-3 max-w-sm">
          <h3 className="text-xl font-black text-brand-ash tracking-tight">
            AI-Powered Performance Analytics
          </h3>
          <p className="text-sm font-medium text-brand-ash/60 leading-relaxed">
            Get detailed insights into your strengths and weaknesses to focus your study efforts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-amber" />
          <span className="w-2 h-2 rounded-full bg-brand-slate" />
          <span className="w-2 h-2 rounded-full bg-brand-slate" />
          <span className="w-2 h-2 rounded-full bg-brand-slate" />
        </div>
      </div>

      {/* RIGHT COLUMN: Floating Card Sign-In Box */}
      <div className="md:col-span-7 flex justify-center lg:justify-end px-2">
        <div className="w-full max-w-xl bg-brand-midnight rounded-3xl border border-brand-slate p-10 shadow-2xl relative">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-brand-ash tracking-tight">
              {isSignUp ? "Create Your Account" : "Welcome Back"}
            </h2>
            <p className="text-sm font-semibold text-brand-ash/50 mt-1.5">
              {isSignUp ? "Sign up to start your journey to success." : "Sign in to continue your journey to success."}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <button 
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white hover:bg-brand-ash text-brand-space font-bold text-sm rounded-xl transition-all duration-200 shadow-md cursor-pointer"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center justify-center my-6">
            <div className="flex-grow border-t border-brand-slate" />
            <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-widest text-brand-ash/30">OR</span>
            <div className="flex-grow border-t border-brand-slate" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-brand-ash/70 mb-2 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-ash/40">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john.doe@example.com" className="w-full pl-12 pr-4 py-3.5 bg-brand-space/60 border border-brand-slate rounded-xl text-sm font-semibold text-brand-ash placeholder-brand-ash/30 outline-none focus:border-brand-amber/50 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-ash/70 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-ash/40">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full pl-12 pr-12 py-3.5 bg-brand-space/60 border border-brand-slate rounded-xl text-sm font-semibold text-brand-ash placeholder-brand-ash/30 outline-none focus:border-brand-amber/50 transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-brand-ash/40 hover:text-brand-ash transition-colors">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-brand-ash/60 select-none">
                <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} className="w-4 h-4 rounded border-brand-slate text-brand-amber bg-brand-space accent-brand-amber outline-none cursor-pointer" />
                Remember me
              </label>
              <a href="#forgot" className="text-brand-amber hover:underline transition-all">Forgot password?</a>
            </div>

            <button type="submit" className="w-full mt-4 py-3.5 bg-brand-amber hover:bg-[#e0951b] text-brand-space font-black text-base rounded-xl shadow-lg transition-all cursor-pointer">
              {isSignUp ? "Sign Up with Email" : "Sign In with Email"}
            </button>
          </form>

          <div className="text-center text-xs text-brand-ash/50 font-bold mt-8">
            {isSignUp ? (
              <>
                Already have an account? <Link to="/login" className="text-brand-amber hover:underline transition-all ml-1">Sign in</Link>
              </>
            ) : (
              <>
                Don't have an account? <Link to="/signup" className="text-brand-amber hover:underline transition-all ml-1">Sign up for free</Link>
              </>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}