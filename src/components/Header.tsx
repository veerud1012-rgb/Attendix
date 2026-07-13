import React, { useState, useEffect } from "react";
import { Clock, Shield, Sun, Moon, Calendar, UserCheck } from "lucide-react";

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  userEmail: string;
}

export default function Header({ darkMode, setDarkMode, userEmail }: HeaderProps) {
  const [time, setTime] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false }));
      setDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className={`w-full py-4 px-6 border-b transition-all duration-300 ${
      darkMode 
        ? "bg-[#12192d]/55 border-white/8 backdrop-blur-[25px] shadow-[0_10px_35px_-15px_rgba(0,0,0,0.5)]" 
        : "bg-white/90 border-warm-border/80 backdrop-blur-md shadow-sm"
    } sticky top-0 z-40`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* App Branding */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-xl blur-md opacity-75 animate-pulse-slow"></div>
            <div className="relative rounded-xl border border-white/10 shadow-[0_0_18px_rgba(109,40,255,0.6)] overflow-hidden bg-white">
              <img id="header-logo-icon" src="/logo.png" alt="Logo" className="w-10 h-10 object-contain p-1" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 id="app-title" className={`text-2xl font-black tracking-tight leading-none ${
                darkMode ? "text-white font-sans" : "text-stone-950 font-sans"
              }`}>
                ATTENDIX
              </h1>
              <span className={`text-[9px] uppercase font-mono font-black px-2 py-1 rounded-full leading-none tracking-wider ${
                darkMode
                  ? "bg-gradient-to-r from-[#6d28ff] to-[#9b5dff] text-white shadow-[0_0_15px_rgba(139,92,246,0.45)]"
                  : "bg-indigo-50 text-indigo-600 border border-indigo-200"
              }`}>
                PRO ENGINE
              </span>
            </div>
            <p className={`text-xs mt-1 font-medium ${darkMode ? "text-[#8e97af]" : "text-stone-500"}`}>
              SaaS Attendance, Payroll & Overtime System
            </p>
          </div>
        </div>

        {/* Live Status and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Calendar capsule */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono transition-all duration-300 ${
            darkMode 
              ? "bg-[#12192d]/85 border-white/10 text-[#b9c2d9] shadow-[0_0_12px_rgba(255,255,255,0.04)] hover:border-white/20" 
              : "bg-stone-100 border-warm-border text-stone-700 shadow-sm"
          }`}>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{dateStr}</span>
          </div>

          {/* Time capsule with glowing cyan look */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono transition-all duration-300 ${
            darkMode 
              ? "bg-[#051322]/80 border-cyan-500/30 text-[#2bdfff] shadow-[0_0_18px_rgba(0,207,255,0.25)] hover:border-cyan-400/50" 
              : "bg-cyan-50 border-cyan-100 text-cyan-700 shadow-sm"
          }`}>
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-bold">{time}</span>
          </div>

          {/* User Profile / Admin Mode */}
          <div className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs transition-all duration-300 ${
            darkMode 
              ? "bg-[#090b1c]/80 border-indigo-500/30 text-[#b9c2d9] shadow-[0_0_18px_rgba(109,40,255,0.2)] hover:border-indigo-400/50" 
              : "bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm"
          }`}>
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono">{userEmail}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            id="theme-toggle-btn"
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-105 ${
              darkMode 
                ? "bg-[#0d091c]/80 border-purple-500/30 text-purple-400 shadow-[0_0_18px_rgba(139,92,246,0.2)] hover:text-purple-300 hover:border-purple-400/50 hover:shadow-[0_0_24px_rgba(139,92,246,0.45)]" 
                : "bg-stone-100 border-warm-border text-indigo-600 hover:bg-stone-200 shadow-sm"
            }`}
            title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
          >
            {darkMode ? (
              <Sun id="sun-icon" className="w-4.5 h-4.5" />
            ) : (
              <Moon id="moon-icon" className="w-4.5 h-4.5" />
            )}
          </button>

        </div>
      </div>
    </header>
  );
}
