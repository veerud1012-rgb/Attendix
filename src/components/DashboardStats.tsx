import React, { useState } from "react";
import { Users, UserCheck, UserX, Wallet, Hourglass, TrendingUp } from "lucide-react";
import { formatCurrency } from "../dbStore";

interface DashboardStatsProps {
  stats: {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    totalSalaryPaid: number;
    totalOvertimeAmount: number;
    todayDate: string;
  };
  darkMode: boolean;
}

export default function DashboardStats({ stats, darkMode }: DashboardStatsProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const cardData = [
    {
      id: "stat-total-employees",
      title: "Total Workforce",
      value: stats.totalEmployees.toString(),
      subtitle: "Active personnel profiles",
      icon: Users,
      color: "from-blue-600 to-indigo-500",
      textColor: "text-[#5aa6ff]",
      lightTextColor: "text-blue-600",
      glowColor: "#3b82f6",
      borderColor: "border-blue-500/35 hover:border-blue-400/60",
    },
    {
      id: "stat-present-today",
      title: "Present Today",
      value: stats.presentToday.toString(),
      subtitle: `On-duty for today`,
      icon: UserCheck,
      color: "from-emerald-500 to-teal-400",
      textColor: "text-[#3cffb6]",
      lightTextColor: "text-emerald-600",
      glowColor: "#00d48a",
      borderColor: "border-emerald-500/35 hover:border-emerald-400/60",
    },
    {
      id: "stat-absent-today",
      title: "Absent Today",
      value: stats.absentToday.toString(),
      subtitle: `Out-of-office today`,
      icon: UserX,
      color: "from-rose-500 to-pink-500",
      textColor: "text-[#ff4a7a]",
      lightTextColor: "text-rose-600",
      glowColor: "#ff2e63",
      borderColor: "border-rose-500/35 hover:border-rose-400/60",
    },
    {
      id: "stat-salary-paid",
      title: "Cumulative Salary",
      value: formatCurrency(stats.totalSalaryPaid),
      subtitle: "Total wages earned to date",
      icon: Wallet,
      color: "from-cyan-500 to-blue-400",
      textColor: "text-[#2bdfff]",
      lightTextColor: "text-cyan-600",
      glowColor: "#00cfff",
      borderColor: "border-cyan-500/35 hover:border-cyan-400/60",
    },
    {
      id: "stat-overtime-amount",
      title: "Overtime Disbursements",
      value: formatCurrency(stats.totalOvertimeAmount),
      subtitle: "Accumulated overtime pay",
      icon: Hourglass,
      color: "from-purple-600 to-pink-500",
      textColor: "text-[#c084fc]",
      lightTextColor: "text-purple-600",
      glowColor: "#8b5cf6",
      borderColor: "border-purple-500/35 hover:border-purple-400/60",
    },
  ];

  return (
    <section className="grid grid-cols-6 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-5 mb-8">
      {cardData.map((card, index) => {
        const Icon = card.icon;
        const isHovered = hoveredCard === card.id;
        const colSpanClass = index < 3 ? "col-span-2 sm:col-span-1" : "col-span-3 sm:col-span-1";

        const shadowStyle = darkMode
          ? isHovered
            ? `0 0 30px ${card.glowColor}60, 0 0 55px ${card.glowColor}30, 0 0 110px ${card.glowColor}15, 0 20px 50px rgba(0,0,0,0.6)`
            : `0 0 18px ${card.glowColor}35, 0 0 35px ${card.glowColor}18, 0 0 70px ${card.glowColor}08, 0 12px 35px rgba(0,0,0,0.5)`
          : isHovered
            ? `0 0 22px ${card.glowColor}40, 0 0 45px ${card.glowColor}20, 0 10px 25px rgba(0,0,0,0.08)`
            : `0 0 14px ${card.glowColor}20, 0 0 28px ${card.glowColor}10, 0 6px 18px rgba(0,0,0,0.04)`;

        return (
          <div
            key={card.id}
            id={card.id}
            onMouseEnter={() => setHoveredCard(card.id)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`relative rounded-xl sm:rounded-[22px] p-2.5 xs:p-3.5 sm:p-5 border transition-all duration-300 transform overflow-hidden ${
              isHovered ? "-translate-y-1.5" : ""
            } ${colSpanClass} ${
              darkMode
                ? `bg-[#0d1021]/20 ${card.borderColor} backdrop-blur-[25px]`
                : `bg-white/30 border-white/60 backdrop-blur-[25px] shadow-[inset_0_0_20px_rgba(255,255,255,0.5)]`
            }`}
            style={{ boxShadow: shadowStyle }}
          >
            {/* Always-on ambient visual glow element in the background */}
            <div
              className="absolute -inset-0.5 rounded-xl sm:rounded-[22px] transition-opacity duration-300 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${card.glowColor}25 0%, ${card.glowColor}05 60%, transparent 100%)`,
                opacity: isHovered ? 1.0 : 0.75,
              }}
            />

            <div className="flex justify-between items-start mb-1 sm:mb-4">
              <div className="min-w-0 flex-1 pr-1">
                <p className="text-[7.5px] xs:text-[9px] sm:text-[10px] font-bold sm:font-semibold uppercase tracking-wider sm:tracking-widest text-[#8e97af] truncate">
                  {card.title}
                </p>
                <h3 className="text-xs xs:text-sm sm:text-2xl font-black sm:font-extrabold mt-0.5 sm:mt-1 tracking-tight truncate">
                  <span className={
                    darkMode
                      ? "text-white"
                      : "text-slate-800"
                  }>
                    {card.value}
                  </span>
                </h3>
              </div>

              {/* Premium Icon Block with Inner/Outer Glow and Glass effect */}
              <div 
                className={`w-6.5 h-6.5 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg xs:rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                  darkMode 
                    ? "bg-white/5 border backdrop-blur-md" 
                    : `bg-gradient-to-br ${card.color} text-white shadow-md`
                }`}
                style={darkMode ? {
                  boxShadow: isHovered
                    ? `inset 0 0 15px ${card.glowColor}40, 0 0 20px ${card.glowColor}60`
                    : `inset 0 0 10px ${card.glowColor}20, 0 0 10px ${card.glowColor}30`,
                  borderColor: isHovered ? `${card.glowColor}70` : `${card.glowColor}40`
                } : undefined}
              >
                <Icon 
                  className={`w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${
                    darkMode ? card.textColor : "text-white"
                  } ${isHovered ? "rotate-12 scale-110" : ""}`} 
                  style={darkMode ? { filter: `drop-shadow(0 0 6px ${card.glowColor}aa)` } : undefined} 
                />
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 mt-2">
              <TrendingUp className={`w-3.5 h-3.5 ${darkMode ? card.textColor : card.lightTextColor}`} />
              <span className={`text-[11px] font-medium tracking-wide ${
                darkMode ? "text-[#b9c2d9]" : "text-gray-500"
              }`}>
                {card.subtitle}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
