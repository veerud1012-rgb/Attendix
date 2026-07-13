import React, { useState, useMemo } from "react";
import { TrendingUp, BarChart2, PieChart, Activity, DollarSign, Clock } from "lucide-react";
import { AttendanceWithEmployee, Employee } from "../types";
import { formatCurrency } from "../dbStore";

interface AnalyticsChartsProps {
  processedAttendance: AttendanceWithEmployee[];
  employees: Employee[];
  darkMode: boolean;
}

export default function AnalyticsCharts({ processedAttendance, employees, darkMode }: AnalyticsChartsProps) {
  const [hoveredNode, setHoveredNode] = useState<{
    chartId: string;
    label: string;
    value: string | number;
    x: number;
    y: number;
  } | null>(null);

  // Parse chronological daily statistics
  const dailyStats = useMemo(() => {
    // Group records by date
    const groups: { [key: string]: { date: string; present: number; absent: number; overtime: number } } = {};
    
    // Get last 7 active dates in database
    const sortedDates = Array.from(new Set(processedAttendance.map((a) => a.date))).sort();
    const last7Dates = sortedDates.slice(-7);

    last7Dates.forEach((d) => {
      groups[d] = { date: d, present: 0, absent: 0, overtime: 0 };
    });

    processedAttendance.forEach((att) => {
      if (groups[att.date]) {
        if (att.status === "Present") {
          groups[att.date].present += 1;
        } else {
          groups[att.date].absent += 1;
        }
        groups[att.date].overtime += att.overtime_hours;
      }
    });

    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  }, [processedAttendance]);

  // Overall Attendance Ratio
  const ratioStats = useMemo(() => {
    let totalPresent = 0;
    let totalAbsent = 0;

    processedAttendance.forEach((att) => {
      if (att.status === "Present") totalPresent++;
      else totalAbsent++;
    });

    const total = totalPresent + totalAbsent || 1;
    return {
      present: totalPresent,
      absent: totalAbsent,
      presentPercent: Math.round((totalPresent / total) * 100),
      absentPercent: Math.round((totalAbsent / total) * 100),
    };
  }, [processedAttendance]);

  // Salary Distributions
  const employeeSalaryStats = useMemo(() => {
    return employees.map((emp) => {
      // Find latest attendance record for total earned
      const empAtts = processedAttendance.filter((a) => a.employee_id === emp.employee_id);
      const earned = empAtts.length > 0 
        ? Math.round(empAtts[empAtts.length - 1].cumulative_salary) 
        : 0;

      return {
        name: emp.employee_name,
        monthly: emp.monthly_salary,
        earned: earned,
      };
    }).slice(0, 5); // top 5
  }, [employees, processedAttendance]);

  // Circular progress stroke helper
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ratioStats.presentPercent / 100) * circumference;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      
      {/* 1. Attendance Trend Line Chart (SVG Handcrafted) */}
      <div className={`col-span-1 lg:col-span-6 rounded-[22px] p-5 border ${
        darkMode ? "bg-[#12192d]/55 border-white/12 backdrop-blur-[25px] shadow-lg" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#9b5dff]" />
            <h4 className={`font-extrabold font-display leading-none tracking-tight ${darkMode ? "text-white" : "text-slate-800"}`}>
              Workforce Presence Trend
            </h4>
          </div>
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#6d28ff]/15 text-[#9b5dff] border border-[#6d28ff]/25 uppercase tracking-wider">
            Last 7 Sessions
          </span>
        </div>

        <div className="relative h-64 w-full">
          {dailyStats.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-[#8e97af]">
              No trend data available. Add attendance to populate charts.
            </div>
          ) : (
            <svg viewBox="0 0 500 220" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6d28ff" stopOpacity="0.35"/>
                  <stop offset="100%" stopColor="#6d28ff" stopOpacity="0.0"/>
                </linearGradient>
                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#6d28ff" floodOpacity="0.6"/>
                </filter>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke={darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"} strokeDasharray="3,3" />
              <line x1="40" y1="70" x2="480" y2="70" stroke={darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"} strokeDasharray="3,3" />
              <line x1="40" y1="120" x2="480" y2="120" stroke={darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"} strokeDasharray="3,3" />
              <line x1="40" y1="170" x2="480" y2="170" stroke={darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"} strokeDasharray="3,3" />

              {/* Axis */}
              <line x1="40" y1="170" x2="480" y2="170" stroke={darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"} />

              {/* Chart Plot */}
              {(() => {
                const stepX = dailyStats.length > 1 ? 440 / (dailyStats.length - 1) : 440;
                const points = dailyStats.map((d, i) => {
                  const maxVal = Math.max(...dailyStats.map(s => s.present + s.absent), 1);
                  const y = 170 - (d.present / maxVal) * 130;
                  const x = 40 + i * stepX;
                  return { x, y, ...d };
                });

                const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const areaD = points.length > 0 
                  ? `${pathD} L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z`
                  : '';

                return (
                  <>
                    {/* Area under curve */}
                    {areaD && <path d={areaD} fill="url(#presentGrad)" />}

                    {/* Line path */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#9b5dff"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter={darkMode ? "url(#glowFilter)" : undefined}
                    />

                    {/* Data Points */}
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="6"
                          fill={darkMode ? "#0c0f1d" : "#ffffff"}
                          stroke="#9b5dff"
                          strokeWidth="3"
                          className="cursor-pointer hover:scale-125 transition-transform duration-200"
                          onMouseEnter={(e) => {
                            setHoveredNode({
                              chartId: "attendance",
                              label: p.date,
                              value: `${p.present} Present / ${p.absent} Absent`,
                              x: p.x,
                              y: p.y - 15,
                            });
                          }}
                          onMouseLeave={() => setHoveredNode(null)}
                        />
                        {/* Date Label */}
                        <text
                          x={p.x}
                          y="192"
                          textAnchor="middle"
                          fill={darkMode ? "#8e97af" : "#64748b"}
                          className="text-[9px] font-mono font-bold"
                        >
                          {p.date.slice(5)} {/* MM-DD */}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          )}

          {/* Interactive Tooltip */}
          {hoveredNode && hoveredNode.chartId === "attendance" && (
            <div
              className="absolute pointer-events-none bg-[#12192d]/95 border border-white/15 text-white rounded-xl px-3 py-2 text-xs shadow-xl backdrop-blur-md z-30 flex flex-col font-mono"
              style={{
                left: `${(hoveredNode.x / 500) * 100}%`,
                top: `${(hoveredNode.y / 220) * 100}%`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <span className="text-[10px] text-[#9b5dff] font-extrabold">{hoveredNode.label}</span>
              <span className="font-sans text-white text-[11px] mt-0.5 font-bold">{hoveredNode.value}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Present vs Absent Ratio (Radial Donut) */}
      <div className={`col-span-1 lg:col-span-6 xl:col-span-3 rounded-[22px] p-5 border flex flex-col justify-between ${
        darkMode ? "bg-[#12192d]/55 border-white/12 backdrop-blur-[25px] shadow-lg" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-[#2bdfff]" />
            <h4 className={`font-extrabold font-display leading-none tracking-tight ${darkMode ? "text-white" : "text-slate-800"}`}>
              Presence Breakdown
            </h4>
          </div>

          <div className="relative flex items-center justify-center my-4 h-40">
            <svg viewBox="0 0 120 120" className="w-36 h-36 transform -rotate-90">
              {/* Back track circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={darkMode ? "rgba(255,255,255,0.05)" : "#f1f5f9"}
                strokeWidth="10"
              />
              {/* Dynamic status circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="url(#blueIndigoGrad)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              
              <defs>
                <linearGradient id="blueIndigoGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00cfff" />
                  <stop offset="100%" stopColor="#6d28ff" />
                </linearGradient>
              </defs>
            </svg>

            {/* Absolute stats inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black font-mono tracking-tight text-[#2bdfff] leading-none drop-shadow-[0_0_8px_rgba(43,223,255,0.35)]">
                {ratioStats.presentPercent}%
              </span>
              <span className={`text-[9px] uppercase tracking-wider font-extrabold mt-1 ${
                darkMode ? "text-[#8e97af]" : "text-gray-500"
              }`}>
                Present Rate
              </span>
            </div>
          </div>
        </div>

        {/* Legend Grid */}
        <div className="grid grid-cols-2 gap-3 mt-2 border-t border-white/8 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00cfff]" />
            <div>
              <p className={`text-[10px] font-bold ${darkMode ? "text-[#8e97af]" : "text-gray-500"}`}>Present Days</p>
              <p className={`text-sm font-black font-mono ${darkMode ? "text-white" : "text-slate-800"}`}>
                {ratioStats.present}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff4a7a]" />
            <div>
              <p className={`text-[10px] font-bold ${darkMode ? "text-[#8e97af]" : "text-gray-500"}`}>Absent Days</p>
              <p className={`text-sm font-black font-mono ${darkMode ? "text-white" : "text-slate-800"}`}>
                {ratioStats.absent}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Overtime hours trend (Area Chart SVG) */}
      <div className={`col-span-1 lg:col-span-6 xl:col-span-3 rounded-[22px] p-5 border flex flex-col justify-between ${
        darkMode ? "bg-[#12192d]/55 border-white/12 backdrop-blur-[25px] shadow-lg" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#c084fc]" />
            <h4 className={`font-extrabold font-display leading-none tracking-tight ${darkMode ? "text-white" : "text-slate-800"}`}>
              Overtime Velocity
            </h4>
          </div>

          <div className="relative h-40 w-full mt-4">
            {dailyStats.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-[#8e97af]">
                No overtime data.
              </div>
            ) : (
              <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9b5dff" stopOpacity="0.45"/>
                    <stop offset="100%" stopColor="#9b5dff" stopOpacity="0"/>
                  </linearGradient>
                  <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#9b5dff" floodOpacity="0.5"/>
                  </filter>
                </defs>

                {/* Plot Area */}
                {(() => {
                  const stepX = dailyStats.length > 1 ? 160 / (dailyStats.length - 1) : 160;
                  const points = dailyStats.map((d, i) => {
                    const maxVal = Math.max(...dailyStats.map(s => s.overtime), 1);
                    const y = 100 - (d.overtime / maxVal) * 70;
                    const x = 20 + i * stepX;
                    return { x, y, ...d };
                  });

                  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  const areaD = points.length > 0 
                    ? `${pathD} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`
                    : '';

                  return (
                    <>
                      {areaD && <path d={areaD} fill="url(#purpleGrad)" />}
                      <path 
                        d={pathD} 
                        fill="none" 
                        stroke="#9b5dff" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        filter={darkMode ? "url(#purpleGlow)" : undefined}
                      />
                      {points.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          fill={darkMode ? "#0c0f1d" : "#ffffff"}
                          stroke="#9b5dff"
                          strokeWidth="2"
                          className="cursor-pointer hover:scale-125 transition-transform"
                          onMouseEnter={() => {
                            setHoveredNode({
                              chartId: "overtime",
                              label: p.date,
                              value: `${p.overtime} Hrs logged`,
                              x: p.x,
                              y: p.y - 10,
                            });
                          }}
                          onMouseLeave={() => setHoveredNode(null)}
                        />
                      ))}
                    </>
                  );
                })()}
              </svg>
            )}

            {hoveredNode && hoveredNode.chartId === "overtime" && (
              <div
                className="absolute pointer-events-none bg-[#12192d]/95 border border-white/15 text-white rounded-xl px-2.5 py-1.5 text-[10px] shadow-lg backdrop-blur-md z-30 flex flex-col font-mono"
                style={{
                  left: `${(hoveredNode.x / 200) * 100}%`,
                  top: `${(hoveredNode.y / 120) * 100}%`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <span className="font-extrabold text-[#c084fc]">{hoveredNode.label.slice(5)}</span>
                <span className="font-bold">{hoveredNode.value}</span>
              </div>
            )}
          </div>
        </div>

        <div className={`mt-2 py-2.5 px-3.5 rounded-xl flex justify-between text-xs font-mono border ${
          darkMode ? "bg-[#060816]/55 border-white/8 text-white" : "bg-slate-50 border border-slate-100"
        }`}>
          <span className={darkMode ? "text-[#8e97af]" : "text-gray-500"}>Cumulative Hrs:</span>
          <span className="font-black text-[#c084fc] drop-shadow-[0_0_4px_rgba(168,85,247,0.3)]">
            {dailyStats.reduce((acc, d) => acc + d.overtime, 0)} Hrs
          </span>
        </div>
      </div>

      {/* 4. Salary & Earnings Distribution (Bar Matrix) */}
      <div className={`col-span-1 lg:col-span-12 rounded-[22px] p-5 border ${
        darkMode ? "bg-[#12192d]/55 border-white/12 backdrop-blur-[25px] shadow-lg" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-1.5 bg-[#6d28ff]/10 rounded-lg">
            <BarChart2 className="w-4 h-4 text-[#9b5dff]" />
          </div>
          <h4 className={`font-extrabold font-display leading-none tracking-tight ${darkMode ? "text-white" : "text-slate-800"}`}>
            Base Salary Plan vs Cumulative Earnings
          </h4>
        </div>

        {employeeSalaryStats.length === 0 ? (
          <p className="text-xs font-mono text-[#8e97af] text-center py-6">No personnel metrics found.</p>
        ) : (
          <div className="space-y-4">
            {employeeSalaryStats.map((item, index) => {
              // Calculate percent fill
              const maxEarned = Math.max(...employeeSalaryStats.map(s => s.monthly), 10000);
              const baseWidthPercent = Math.min((item.monthly / maxEarned) * 100, 100);
              const earnedWidthPercent = Math.min((item.earned / maxEarned) * 100, 100);

              return (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center border-b border-white/5 pb-3 last:border-none last:pb-0">
                  {/* Name column */}
                  <div className="md:col-span-3">
                    <p className={`text-xs font-extrabold leading-none ${darkMode ? "text-white" : "text-slate-800"}`}>
                      {item.name}
                    </p>
                    <span className={`text-[10px] font-mono font-medium ${darkMode ? "text-[#8e97af]" : "text-gray-500"}`}>
                      Base: {formatCurrency(item.monthly)}/mo
                    </span>
                  </div>

                  {/* Graph bars column */}
                  <div className="md:col-span-7 space-y-1.5">
                    {/* Monthly Base bar */}
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6d28ff]/60 to-[#9b5dff] rounded-full"
                        style={{ width: `${baseWidthPercent}%` }}
                      />
                    </div>
                    {/* Cumulative Earned bar */}
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00cfff] to-[#2bdfff] rounded-full shadow-[0_0_8px_rgba(43,223,255,0.4)]"
                        style={{ width: `${earnedWidthPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Value display column */}
                  <div className="md:col-span-2 text-right">
                    <p className="text-xs font-black text-[#2bdfff] font-mono leading-none drop-shadow-[0_0_6px_rgba(43,223,255,0.25)]">
                      {formatCurrency(item.earned)}
                    </p>
                    <span className="text-[8px] uppercase font-bold tracking-wider text-[#8e97af]">
                      Earned to Date
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </section>
  );
}
