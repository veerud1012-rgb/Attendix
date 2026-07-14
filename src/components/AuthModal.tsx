import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Mail, Lock, User, LogIn, UserPlus, Chrome, AlertCircle, CheckCircle, ArrowRight
} from "lucide-react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export default function AuthModal({ isOpen, onClose, darkMode }: AuthModalProps) {
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
        setSuccess("Account created successfully! Logging you in...");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Logged in successfully!");
      }
      setTimeout(() => {
        onClose();
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
        onClose();
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className={`relative w-full max-w-md rounded-3xl overflow-hidden border shadow-2xl transition-all duration-300 ${
              darkMode 
                ? "bg-[#111625]/95 border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)]" 
                : "bg-white border-slate-200 text-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.15)]"
            }`}
          >
            {/* Top decorative gradient line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500"></div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 p-1.5 rounded-full border transition-all hover:scale-105 cursor-pointer ${
                darkMode 
                  ? "border-white/10 hover:bg-white/10 text-slate-400 hover:text-white" 
                  : "border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800"
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Form Content */}
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 mb-3">
                  {isSignUp ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  {isSignUp ? "Create your Account" : "Welcome Back"}
                </h3>
                <p className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {isSignUp 
                    ? "Register to synchronize your system configuration" 
                    : "Sign in to access your attendance database"
                  }
                </p>
              </div>

              {/* Status messages */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs mb-4 font-semibold"
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
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs mb-4 font-semibold"
                  >
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                      darkMode ? "text-slate-400" : "text-slate-600"
                    }`}>
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                          darkMode 
                            ? "bg-slate-900/50 border-white/10 text-white placeholder-slate-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                        }`}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
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
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        darkMode 
                          ? "bg-slate-900/50 border-white/10 text-white placeholder-slate-500" 
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                    darkMode ? "text-slate-400" : "text-slate-600"
                  }`}>
                    Password
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
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        darkMode 
                          ? "bg-slate-900/50 border-white/10 text-white placeholder-slate-500" 
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {isSignUp ? "Create Account" : "Sign In"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${darkMode ? "border-white/10" : "border-slate-200"}`}></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className={`px-3 ${darkMode ? "bg-[#111625] text-slate-400" : "bg-white text-slate-500"}`}>
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google login */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 ${
                  darkMode 
                    ? "bg-slate-900 hover:bg-slate-800 text-white border-white/10" 
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm"
                }`}
              >
                <Chrome className="w-4.5 h-4.5 text-rose-500" />
                <span>Google Account</span>
              </button>

              {/* Footer text */}
              <div className="text-center mt-6">
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-indigo-500 hover:text-indigo-400 font-bold transition-colors underline cursor-pointer bg-transparent border-none p-0 ml-1"
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </button>
                </p>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
