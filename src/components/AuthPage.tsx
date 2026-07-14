import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Mail, Lock, User as UserIcon, LogIn, UserPlus, Chrome, AlertCircle, CheckCircle, 
  ArrowRight, ShieldCheck, Activity, Users, FileCheck, ArrowLeft
} from "lucide-react";
import { auth, googleProvider } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from "firebase/auth";

interface AuthPageProps {
  darkMode: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AuthPage({ darkMode, onSuccess, onCancel }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setError(null);
    setSuccess(null);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          throw new Error("Please enter your name.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
        setSuccess("Account created successfully! Welcome to Attendix.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Welcome back! Loading your secure session...");
      }
      setTimeout(() => {
        onSuccess();
        resetForm();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      let friendlyMessage = err.message;
      if (err.code === "auth/invalid-credential") {
        friendlyMessage = "Incorrect email or password. Please try again.";
      } else if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "This email is already registered. Try signing in instead.";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "Password should be at least 6 characters long.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setSuccess("Logged in with Google successfully!");
      setTimeout(() => {
        onSuccess();
        resetForm();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <div className={`rounded-[32px] border overflow-hidden transition-all duration-300 shadow-2xl ${
        darkMode 
          ? "bg-[#0f1422]/95 border-white/10 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]" 
          : "bg-white border-slate-200 text-slate-900 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.1)]"
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          
          {/* Left Panel: Decorative & Dynamic Features Presentation (visible on large screen) */}
          <div className={`hidden lg:flex lg:col-span-5 relative overflow-hidden flex-col justify-between p-10 ${
            darkMode 
              ? "bg-gradient-to-br from-[#161a2b] via-[#0f1122] to-[#131024] border-r border-white/5" 
              : "bg-gradient-to-br from-indigo-50/50 via-slate-50 to-purple-50/30 border-r border-slate-100"
          }`}>
            {/* Glowing orbs background for premium visual */}
            {darkMode && (
              <>
                <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-indigo-500/10 blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-cyan-500/10 blur-3xl"></div>
              </>
            )}

            {/* Top Logo / Name */}
            <div className="flex items-center gap-2.5 relative z-10">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight font-sans">
                Attendix <span className="text-xs font-semibold text-indigo-500 px-1.5 py-0.5 rounded-md bg-indigo-500/10 ml-1 font-mono">SECURE</span>
              </span>
            </div>

            {/* Core Perks Animation / Features List */}
            <div className="space-y-8 my-auto relative z-10 pr-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight leading-tight">
                  The Intelligent Attendance & Payroll Engine.
                </h3>
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"} leading-relaxed`}>
                  Synchronize administrative workflows, calculate real-time overtime wages, and maintain immutable employee ledgers.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${darkMode ? "bg-slate-900/80 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Dynamic Overtime Formulas</h4>
                    <p className={`text-[11px] mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Hourly calculations, special allowances, and real-time ledger updates.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${darkMode ? "bg-slate-900/80 text-indigo-400" : "bg-indigo-100 text-indigo-700"}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Comprehensive Personnel Roster</h4>
                    <p className={`text-[11px] mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Individual profile dashboards, contact records, and custom profile sheets.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${darkMode ? "bg-slate-900/80 text-cyan-400" : "bg-cyan-100 text-cyan-700"}`}>
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Firebase Cloud Storage Sync</h4>
                    <p className={`text-[11px] mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Store and retrieve configuration data securely with modern Firestore database rules.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom watermark / feedback */}
            <div className={`text-[10px] uppercase tracking-wider font-semibold font-mono relative z-10 ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}>
              Powered by Cloud Firestore
            </div>
          </div>

          {/* Right Panel: Clean Form Section */}
          <div className="lg:col-span-7 flex flex-col justify-center p-8 sm:p-12 relative">
            
            {/* Cancel Button in upper corner */}
            <button
              onClick={onCancel}
              className={`absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                darkMode 
                  ? "border-white/10 hover:bg-white/5 text-slate-300 hover:text-white" 
                  : "border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800"
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </button>

            <div className="max-w-md w-full mx-auto">
              
              {/* Header Title */}
              <div className="mb-8">
                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  darkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-700"
                }`}>
                  {isSignUp ? "Registration Portal" : "Secure Portal Login"}
                </span>
                <h1 className="text-2xl font-black tracking-tight mt-3">
                  {isSignUp ? "Create Admin Credentials" : "Sign In to Attendix"}
                </h1>
                <p className={`text-xs mt-1.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {isSignUp 
                    ? "Establish your administrative account to manage team attendance records." 
                    : "Access your cloud database, manage personnel profiles, and compile logs."
                  }
                </p>
              </div>

              {/* Status Notifications */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs mb-6 font-semibold"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs mb-6 font-semibold"
                  >
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Interactive Form */}
              <form onSubmit={handleEmailAuth} className="space-y-5">
                
                {isSignUp && (
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                      darkMode ? "text-slate-400" : "text-slate-600"
                    }`}>
                      Administrative Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Director Veer"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                          darkMode 
                            ? "bg-slate-900/50 border-white/10 text-white placeholder-slate-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                        }`}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                    darkMode ? "text-slate-400" : "text-slate-600"
                  }`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="admin@attendix.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        darkMode 
                          ? "bg-slate-900/50 border-white/10 text-white placeholder-slate-500" 
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                    darkMode ? "text-slate-400" : "text-slate-600"
                  }`}>
                    Security Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        darkMode 
                          ? "bg-slate-900/50 border-white/10 text-white placeholder-slate-500" 
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/25 disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {isSignUp ? "Register Account" : "Access Console"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Single Sign On Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${darkMode ? "border-white/10" : "border-slate-200"}`}></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className={`px-3 font-semibold font-sans ${darkMode ? "bg-[#0f1422] text-slate-400" : "bg-white text-slate-500"}`}>
                    Or SSO Sign In
                  </span>
                </div>
              </div>

              {/* Google Sign-in Trigger */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 ${
                  darkMode 
                    ? "bg-slate-900 hover:bg-slate-800 text-white border-white/10" 
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm"
                }`}
              >
                <Chrome className="w-4.5 h-4.5 text-rose-500" />
                <span>Sign in with Google Workspace</span>
              </button>

              {/* Toggle signup/login state */}
              <div className="text-center mt-8">
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {isSignUp ? "Already have an account?" : "No administrative credentials?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-indigo-500 hover:text-indigo-400 font-bold transition-colors underline cursor-pointer bg-transparent border-none p-0 ml-1"
                  >
                    {isSignUp ? "Sign In Here" : "Sign Up Here"}
                  </button>
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
